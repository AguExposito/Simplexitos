import readline from 'readline';
import inventarioModel from "../models/inventario.mjs";
import proveedorProductoModel from "../models/proveedorproducto.mjs";
import productoModel from "../models/producto.mjs";
import { pool } from '../db/db.mjs';

// Obtener todo el inventario
export const getAllInventario = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT i.*, p.nombreproducto 
            FROM inventario i
            LEFT JOIN producto p ON i.idproducto = p.idproducto
            ORDER BY i.idinventario
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener el inventario:', error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener inventario por ID
export const getInventario = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                i.*, 
                p.nombreproducto,
                p.demanda,
                p.costoalmacenamiento,
                p.modeloproducto,
                pp.preciounitario,
                pp.costopedido
            FROM inventario i
            LEFT JOIN producto p ON i.idproducto = p.idproducto
            LEFT JOIN (
                SELECT DISTINCT ON (idproducto) 
                    idproducto, 
                    preciounitario, 
                    costopedido,
                    proveedor_predeterminado
                FROM proveedor_producto 
                WHERE proveedor_predeterminado = TRUE
                UNION ALL
                SELECT DISTINCT ON (idproducto) 
                    idproducto, 
                    preciounitario, 
                    costopedido,
                    proveedor_predeterminado
                FROM proveedor_producto pp1
                WHERE NOT EXISTS (
                    SELECT 1 FROM proveedor_producto pp2 
                    WHERE pp2.idproducto = pp1.idproducto 
                    AND pp2.proveedor_predeterminado = TRUE
                )
                ORDER BY idproducto, preciounitario ASC
            ) pp ON i.idproducto = pp.idproducto
            ORDER BY i.idinventario
        `);
        
        // Calcular frecuencia de reabastecimiento para productos PERIODO_FIJO
        const inventarioConFrecuencia = result.rows.map(item => {
            if (item.modeloproducto === 'PERIODO_FIJO' && item.demanda && item.costopedido && item.costoalmacenamiento) {
                // Calcular tiempo óptimo: T* = sqrt((2 * S) / (D * H))
                const tiempoOptimo = Math.sqrt((2 * item.costopedido) / (item.demanda * item.costoalmacenamiento));
                // Calcular frecuencia de reabastecimiento: 1 / tiempo óptimo
                const frecuenciaReabastecimiento = 1 / tiempoOptimo;
                
                return {
                    ...item,
                    frecuenciaReabastecimiento: frecuenciaReabastecimiento.toFixed(2)
                };
            }
            return {
                ...item,
                frecuenciaReabastecimiento: '0.00' // No aplica para LOTE_FIJO
            };
        });
        
        res.json(inventarioConFrecuencia);
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({ error: 'Error al obtener inventario: ' + error.message });
    }
};

export const getInventarioById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                i.*,
                p.nombreproducto,
                p.demanda,
                p.costoalmacenamiento,
                pp.preciounitario,
                pp.costopedido
            FROM inventario i
            LEFT JOIN producto p ON i.idproducto = p.idproducto
            LEFT JOIN proveedor_producto pp ON i.idproducto = pp.idproducto
            WHERE i.idinventario = $1
            ORDER BY pp.preciounitario ASC
            LIMIT 1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inventario no encontrado' });
        }

        const item = result.rows[0];
        
        // Calcular la frecuencia de pedidos histórica
        const frecuenciaHistorica = await calcularFrecuenciaPedidosHistorica(item.idproducto);
        item.frecuenciaHistorica = frecuenciaHistorica;
        
        // Obtener las últimas órdenes de compra
        const ultimasOrdenes = await obtenerUltimasOrdenes(item.idproducto, 5);
        item.ultimasOrdenes = ultimasOrdenes;
        
        // Calcular los costos si tenemos todos los datos necesarios
        if (item.demanda && item.preciounitario && item.costopedido && item.costoalmacenamiento) {
            try {
                const costos = await calcularCostoTotal(item.idproducto, item.loteoptimo || 1);
                item.costocompra = costos.costoCompra;
                item.costopedido = costos.costoPedido;
                item.costoalmacenamiento = costos.costoAlmacenamiento;
                item.cgi = costos.costoTotal;

                console.log('Costos calculados para el item:', {
                    idproducto: item.idproducto,
                    costos
                });
            } catch (error) {
                console.error('Error al calcular costos:', error);
                // Inicializar costos en 0 si hay error
                item.costocompra = 0;
                item.costopedido = 0;
                item.costoalmacenamiento = 0;
                item.cgi = 0;
            }
        } else {
            console.log('Faltan datos para calcular costos:', {
                demanda: item.demanda,
                preciounitario: item.preciounitario,
                costopedido: item.costopedido,
                costoalmacenamiento: item.costoalmacenamiento
            });
            // Inicializar costos en 0 si faltan datos
            item.costocompra = 0;
            item.costopedido = 0;
            item.costoalmacenamiento = 0;
            item.cgi = 0;
        }
        
        res.json(item);
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({ error: 'Error al obtener inventario: ' + error.message });
    }
};

//Funcion para solicitar el idinventario
const solicitaridinventario = () => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Ingrese el idinventario: ', (idinventario) => {
            resolve(parseInt(idinventario));
            rl.close();
        });
    });
};
// Función para solicitar el idproducto
const solicitarIdproducto = () => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Ingrese el idproducto: ', (idproducto) => {
            resolve(parseInt(idproducto));
            rl.close();
        });
    });
};

// Función para solicitar el modelo de inventario
const solicitarmodeloinventario = () => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Ingrese el modelo de inventario ("Lote Fijo" o "Pedido Fijo"): ', (modelo) => {
            resolve(modelo);
            rl.close();
        });
    });
};

// Función para solicitar el idproveedor
const solicitaridproveedor = () => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Ingrese el idproveedor: ', (idproveedor) => {
            resolve(parseInt(idproveedor));
            rl.close();
        });
    });
};

//Funcion de confirmacion para actualizar en la base de datos
const solicitarConfirmacion = () => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('¿Desea actualizar el inventario en la base de datos? (Si/No): ', (respuesta) => {
            resolve(respuesta.trim().toLowerCase() === 'si');
            rl.close();
        });
    });
};

// Función para calcular el Lote Óptimo (EOQ)
async function calcularloteoptimo(idproducto) {
    try {
        const result = await pool.query(`
            SELECT 
                i.*,
                p.demanda,
                p.costoalmacenamiento,
                pp.costopedido,
                pp.preciounitario
            FROM inventario i
            JOIN producto p ON i.idproducto = p.idproducto
            LEFT JOIN proveedor_producto pp ON i.idproducto = pp.idproducto
            WHERE i.idproducto = $1
            ORDER BY pp.preciounitario ASC
            LIMIT 1
        `, [idproducto]);

        if (result.rows.length === 0) {
            console.error('No se encontró información del producto:', idproducto);
            throw new Error('No se encontró información del producto');
        }

        const { demanda, costopedido, costoalmacenamiento } = result.rows[0];
        
        if (!demanda || !costopedido || !costoalmacenamiento) {
            console.error('Faltan datos necesarios para el cálculo:', {
                idproducto,
                demanda,
                costopedido,
                costoalmacenamiento
            });
            throw new Error('Faltan datos necesarios para el cálculo del lote óptimo');
        }

        // FÓRMULA EOQ (Economic Order Quantity) - Lote Óptimo:
        // Q* = sqrt((2 * D * S) / H)
        // Donde:
        // Q* = Lote óptimo (cantidad a pedir)
        // D = Demanda anual
        // S = Costo de pedido (costo fijo por pedido)
        // H = Costo de almacenamiento por unidad por año
        const loteoptimo = Math.sqrt((2 * demanda * costopedido) / costoalmacenamiento);

        return { loteoptimo, demanda };
    } catch (error) {
        console.error('Error en calcularloteoptimo:', error);
        throw new Error(`Error al calcular el Lote Óptimo: ${error.message}`);
    }
}

// Función para calcular el costo total según la fórmula
async function calcularCostoTotal(idproducto, cantidadPedir) {
    try {
        const result = await pool.query(`
            SELECT 
                i.*,
                pp.preciounitario,
                pp.costopedido,
                p.costoalmacenamiento,
                p.demanda
            FROM inventario i
            JOIN producto p ON i.idproducto = p.idproducto
            LEFT JOIN proveedor_producto pp ON i.idproducto = pp.idproducto
            WHERE i.idproducto = $1
            ORDER BY pp.preciounitario ASC
            LIMIT 1
        `, [idproducto]);

        if (result.rows.length === 0) {
            console.log('No se encontró información del producto:', idproducto);
            return {
                costoTotal: 0,
                costoCompra: 0,
                costoPedido: 0,
                costoAlmacenamiento: 0
            };
        }

        const { demanda, preciounitario, costopedido, costoalmacenamiento } = result.rows[0];

        // Asegurarse de que todos los valores sean números
        const demandaNum = Number(demanda) || 0;
        const preciounitarioNum = Number(preciounitario) || 0;
        const costopedidoNum = Number(costopedido) || 0;
        const costoalmacenamientoNum = Number(costoalmacenamiento) || 0;
        const cantidadPedirNum = Number(cantidadPedir) || 1;

        // FÓRMULAS DEL COSTO TOTAL DE INVENTARIO:
        // CT = (D * Cu) + (D/Q * S) + (Q/2 * H)
        // Donde:
        // CT = Costo total anual
        // D = Demanda anual
        // Cu = Costo unitario (precio por unidad)
        // Q = Cantidad a pedir (lote óptimo)
        // S = Costo de pedido (costo fijo por pedido)
        // H = Costo de almacenamiento por unidad por año
        
        // 1. Costo de compra = Demanda anual * Precio unitario
        const costoCompra = demandaNum * preciounitarioNum;
        
        // 2. Costo de pedido = (Demanda anual / Cantidad a pedir) * Costo de pedido
        const costoPedido = (demandaNum / cantidadPedirNum) * costopedidoNum;
        
        // 3. Costo de almacenamiento = (Cantidad a pedir / 2) * Costo de almacenamiento
        const costoAlmacenamiento = (cantidadPedirNum / 2) * costoalmacenamientoNum;
        
        // 4. Costo total = Costo de compra + Costo de pedido + Costo de almacenamiento
        const costoTotal = costoCompra + costoPedido + costoAlmacenamiento;

        console.log('Cálculos de costos:', {
            demanda: demandaNum,
            preciounitario: preciounitarioNum,
            costopedido: costopedidoNum,
            costoalmacenamiento: costoalmacenamientoNum,
            cantidadPedir: cantidadPedirNum,
            costoCompra,
            costoPedido,
            costoAlmacenamiento,
            costoTotal
        });

        return {
            costoTotal,
            costoCompra,
            costoPedido,
            costoAlmacenamiento
        };
    } catch (error) {
        console.error('Error en calcularCostoTotal:', error);
        return {
            costoTotal: 0,
            costoCompra: 0,
            costoPedido: 0,
            costoAlmacenamiento: 0
        };
    }
}

// Función para calcular el modelo de Periodo Fijo
async function calcularPeriodoFijo(idproducto) {
    try {
        const result = await pool.query(`
            SELECT 
                i.*,
                p.demanda,
                pp.costopedido,
                pp.costoalmacenamiento,
                pp.preciounitario
            FROM inventario i
            JOIN producto p ON i.idproducto = p.idproducto
            LEFT JOIN proveedor_producto pp ON i.idproducto = pp.idproducto
            WHERE i.idproducto = $1
            ORDER BY pp.preciounitario ASC
            LIMIT 1
        `, [idproducto]);

        if (result.rows.length === 0) {
            console.error('No se encontró información del producto:', idproducto);
            throw new Error('No se encontró información del producto');
        }

        const { demanda, costopedido, costoalmacenamiento } = result.rows[0];

        if (!demanda || !costopedido || !costoalmacenamiento) {
            console.error('Faltan datos necesarios para el cálculo:', {
                idproducto,
                demanda,
                costopedido,
                costoalmacenamiento
            });
            throw new Error('Faltan datos necesarios para el cálculo del periodo fijo');
        }

        // Calcular el tiempo óptimo entre pedidos (T*)
        // T* = sqrt((2 * S) / (D * H))
        const tiempoOptimo = Math.sqrt((2 * costopedido) / (demanda * costoalmacenamiento));

        // Calcular la cantidad a pedir para el periodo
        const cantidadPedir = demanda * tiempoOptimo;

        return {
            tiempoOptimo,
            cantidadPedir,
            frecuenciaPedidos: 1 / tiempoOptimo // Número de pedidos por año
        };
    } catch (error) {
        console.error('Error en calcularPeriodoFijo:', error);
        throw new Error(`Error al calcular el modelo de Periodo Fijo: ${error.message}`);
    }
}

// Función para calcular el costo de compra
async function calcularcostocompra(idproducto, idproveedor, loteoptimo) {
    try {
        const proveedorproducto = await proveedorProductoModel.findOne({
            where: { idproducto: idproducto, idproveedor: idproveedor }
        });

        if (!proveedorproducto) {
            throw new Error('No se encontró proveedor para el artículo especificado');
        }

        const preciounitario = proveedorproducto.preciounitario;
        const costocompra = preciounitario * loteoptimo;

        return costocompra;
    } catch (error) {
        throw new Error(`Error al calcular el costo de compra: ${error.message}`);
    }
}

//Funcion para calcular costo de almacenamiento 

async function calcularcostoalmacenamiento(idproducto, idproveedor, loteoptimo){
    try {
        const producto = await productoModel.findByPk(idproducto);
        if (!producto) {
            throw new Error('No se encontró el producto especificado');
        }

        const costalm1 = producto.costoalmacenamiento || 0;
        const costoalmacenamiento = costalm1 * (loteoptimo/2)
        
        return costoalmacenamiento;
    } catch (error) {
        throw new Error(`Error al calcular el costo de almacenamiento: ${error.message}`);
    }
}

//Funcion para calcular el costo de pedido

async function calcularcostopedido(idproducto, idproveedor, loteoptimo, demanda){
    try {

        const inventarioItem = await inventarioModel.findOne({
            where: { idinventario: idinventario }
        });
        const proveedorItem = await proveedorProductoModel.findOne({
            where: {idproducto: idproducto, idproveedor: idproveedor}
        });

        const demanda = inventarioItem.demanda;

        if (!proveedorItem) {
            throw new Error('No se encontró proveedor para el artículo especificado');
        }
        
        const costopedido = proveedorItem.costopedido * (demanda / loteoptimo);
        return costopedido;
    } catch (error) {
        throw new Error(`Error al calcular el costo de almacenamiento: ${error.message}`);
    }
}

//Funcion para calcular CGI

async function calcularcgi(costocompra, costoalmacenamiento, costopedido) {
    try {
        // Sumar los costos obtenidos
        const cgi = costocompra + costoalmacenamiento + costopedido;

        return cgi;
    } catch (error) {
        throw new Error(`Error al calcular el costo general de inventario (CGI): ${error.message}`);
    }
}

//Funcion para calcular punto de pedido

async function calcularROP(idproducto, idproveedor) {

    try {

        const diasLaborables = 90;

        const inventarioItem = await inventarioModel.findOne({
            where: { idinventario: idinventario }
        });

        const demanda = inventarioItem.demanda;

        const proveedorproducto = await proveedorProductoModel.findOne({
            where: { idproducto: idproducto, idproveedor: idproveedor }
        });
        
        if (!proveedorproducto) {
            throw new Error('No se encontró proveedor para el artículo y proveedor especificados');
        }

        const tiempoEntregaProveedor = proveedorproducto.tiempoenvio; // Tiempo de entrega del proveedor
        const desviacionDemanda = 3; // Desviación estándar de la demanda

        // Calcular promedio de demanda diaria (d)
        const demandaDiaria = demanda / diasLaborables;

        // Calcular desviación del tiempo de entrega (desviacion L)
        const desviacionL = desviacionDemanda * Math.sqrt(tiempoEntregaProveedor);

        // Nivel de seguridad de servicio (z)
        const z = 1.64; // Valor fijo para cubrir aproximadamente el 95% de la demanda

        // Calcular el Punto de Pedido (ROP)
        const ROP = demandaDiaria * tiempoEntregaProveedor + z * desviacionL;

        return ROP;
    } catch (error) {
        throw new Error(`Error al calcular el Punto de Pedido (ROP): ${error.message}`);
    }
}

// Función para calcular el Stock de Seguridad (SS)
async function calcularstockseguridad(idproducto, idproveedor) {
    try {
        const proveedorproducto = await proveedorProductoModel.findOne({
            where: { idproducto: idproducto, idproveedor: idproveedor }
        });
        
        if (!proveedorproducto) {
            throw new Error('No se encontró proveedor para el artículo y proveedor especificados');
        }

        const tiempoEntregaProveedor = proveedorproducto.tiempoenvio; // Tiempo de entrega del proveedor
        const desviacionDemanda = 3; // Desviación estándar de la demanda
        const z = 1.64; // Nivel de seguridad de servicio

        // Calcular la desviación del tiempo de entrega (desviacion L)
        const desviacionL = desviacionDemanda * Math.sqrt(tiempoEntregaProveedor);

        // Calcular el Stock de Seguridad (SS)
        const stockseguridad = z * desviacionL;

        return stockseguridad;
    } catch (error) {
        throw new Error(`Error al calcular el Stock de Seguridad (SS): ${error.message}`);
    }
}

//Funcion para Inventario en el Front 
export const inventarioFuncion = async (idinventario, idproducto, modeloinventario, idproveedor) => {
    try {
        // Obtener el inventario actual
        const inventarioActual = await inventarioModel.findOne({
            where: { idinventario: idinventario }
        });

        if (!inventarioActual) {
            throw new Error('No se encontró el inventario especificado');
        }

        // Calcular el lote óptimo
        const { loteoptimo, demanda } = await calcularloteoptimo(idproducto);

        // Calcular los costos
        const costocompra = await calcularcostocompra(idproducto, idproveedor, loteoptimo);
        const costoalmacenamiento = await calcularcostoalmacenamiento(idproducto, idproveedor, loteoptimo);
        const costopedido = await calcularcostopedido(idproducto, idproveedor, loteoptimo, demanda);

        // Calcular CGI
        const cgi = await calcularcgi(costocompra, costoalmacenamiento, costopedido);

        // Actualizar el inventario
        await inventarioActual.update({
            modeloinventario: modeloinventario,
            loteoptimo: loteoptimo,
            costocompra: costocompra,
            costoalmacenamiento: costoalmacenamiento,
            costopedido: costopedido,
            cgi: cgi
        });

        return {
            message: 'Inventario actualizado correctamente',
            data: {
                loteoptimo,
                costocompra,
                costoalmacenamiento,
                costopedido,
                cgi
            }
        };
    } catch (error) {
        throw new Error(`Error en la función de inventario: ${error.message}`);
    }
};

// Crear nuevo inventario
export const createInventario = async (req, res) => {
    try {
        const { idproducto, stock = 0, puntopedido = 0, stockseguridad = 0, loteoptimo = 1 } = req.body;
        
        // Verificar si el producto existe
        const productoCheck = await pool.query(
            'SELECT * FROM producto WHERE idproducto = $1',
            [idproducto]
        );
        
        if (productoCheck.rows.length === 0) {
            return res.status(404).json({ error: 'El producto no existe' });
        }
        
        // Verificar si ya existe un inventario para este producto
        const inventarioCheck = await pool.query(
            'SELECT * FROM inventario WHERE idproducto = $1',
            [idproducto]
        );
        
        if (inventarioCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe un inventario para este producto' });
        }
        
        const result = await pool.query(`
            INSERT INTO inventario 
            (idproducto, stock, puntopedido, stockseguridad, loteoptimo) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *
        `, [idproducto, stock, puntopedido, stockseguridad, loteoptimo]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear inventario:', error);
        res.status(500).json({ error: 'Error al crear inventario: ' + error.message });
    }
};

// Modificar la función de actualización de inventario para incluir los cálculos
export const updateInventario = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { stock, puntopedido, stockseguridad, modeloinventario } = req.body;
        
        // Validate modeloinventario
        if (modeloinventario && !['LOTE_FIJO', 'PERIODO_FIJO'].includes(modeloinventario)) {
            return res.status(400).json({ 
                error: 'Modelo de inventario inválido',
                details: 'El modelo debe ser LOTE_FIJO o PERIODO_FIJO'
            });
        }

        console.log('Actualizando inventario:', { id, stock, puntopedido, stockseguridad, modeloinventario });

        await client.query('BEGIN');

        // Primero verificamos que el inventario existe y obtenemos el producto asociado
        const inventarioCheck = await client.query(`
            SELECT i.*, p.idproducto, p.modeloproducto, p.demanda, p.desviacionestandardemanda
            FROM inventario i
            JOIN producto p ON i.idproducto = p.idproducto
            WHERE i.idinventario = $1
        `, [id]);

        if (inventarioCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Inventario no encontrado' });
        }

        const idproducto = inventarioCheck.rows[0].idproducto;
        const modeloActual = inventarioCheck.rows[0].modeloinventario;
        const modeloProducto = inventarioCheck.rows[0].modeloproducto;

        // Si el modelo ha cambiado, actualizamos tanto el producto como el inventario
        if (modeloinventario && modeloinventario !== modeloActual) {
            console.log('Actualizando modelo:', { idproducto, modeloinventario });
            
            // Actualizar el modelo en la tabla producto
            await client.query(`
                UPDATE producto 
                SET modeloproducto = $1,
                    fechamodificacionproducto = CURRENT_DATE
                WHERE idproducto = $2
            `, [modeloinventario, idproducto]);

            // Actualizar el modelo en la tabla inventario
            await client.query(`
                UPDATE inventario 
                SET modeloinventario = $1
                WHERE idinventario = $2
            `, [modeloinventario, id]);
        }

        // Actualizar el resto de los campos del inventario
        const result = await client.query(`
            UPDATE inventario 
            SET stock = COALESCE($1, stock)
            WHERE idinventario = $2
            RETURNING *
        `, [stock, id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'No se pudo actualizar el inventario' });
        }

        // Verificar si hay datos del proveedor para recalcular automáticamente
        const proveedorCheck = await client.query(`
          SELECT pp.*, p.demanda, p.costoalmacenamiento, p.desviacionestandardemanda
          FROM proveedor_producto pp
          JOIN producto p ON pp.idproducto = p.idproducto
          WHERE pp.idproducto = $1 AND pp.proveedor_predeterminado = TRUE
          LIMIT 1
        `, [id]);

        // Si no hay proveedor predeterminado, usar el más barato como fallback
        if (proveedorCheck.rows.length === 0) {
          const fallbackCheck = await client.query(`
            SELECT pp.*, p.demanda, p.costoalmacenamiento, p.desviacionestandardemanda
            FROM proveedor_producto pp
            JOIN producto p ON pp.idproducto = p.idproducto
            WHERE pp.idproducto = $1
            ORDER BY pp.preciounitario ASC
            LIMIT 1
          `, [id]);
          
          if (fallbackCheck.rows.length > 0) {
            proveedorCheck.rows = fallbackCheck.rows;
          }
        }

        // Solo calcular costos si tenemos datos del proveedor
        if (proveedorCheck.rows.length > 0) {
            try {
                // Calcular costos basados en el modelo actual
                const modeloFinal = modeloinventario || modeloActual;
                let loteoptimo = 1;
                let stockseguridadCalculado = 0;
                let puntopedidoCalculado = 0;
                let costos = {
                    costoCompra: 0,
                    costoPedido: 0,
                    costoAlmacenamiento: 0,
                    costoTotal: 0
                };

                const { demanda, costopedido, costoalmacenamiento, preciounitario, desviacionestandardemanda, tiempoenvio } = proveedorCheck.rows[0];


                if (modeloFinal === 'LOTE_FIJO') {
                    // 1. Lote óptimo (EOQ): Q* = sqrt((2 * D * S) / H)
                    // Donde: D = demanda anual, S = costo de pedido, H = costo de almacenamiento                    
                    loteoptimo = Math.sqrt((2 * demanda * costopedido) / costoalmacenamiento);
                    
                    // Calcular costos
                    // 2. Demanda diaria promedio = demanda anual / 365 días
                    const demandaDiariaPromedio = demanda / 365;
                    
                    // 3. Stock de seguridad = 1.64 * sqrt(tiempo_envio) * desviacion_estandar
                    // Donde 1.64 corresponde a un nivel de servicio del 95%
                    stockseguridadCalculado = 1.64 * Math.sqrt(tiempoenvio) * desviacionestandardemanda;
                    
                    // 4. Punto de pedido = demanda diaria promedio * tiempo envío + stock seguridad
                    puntopedidoCalculado = demandaDiariaPromedio * tiempoenvio + stockseguridadCalculado;
                    
                    // 5. Costo de compra = demanda anual * precio unitario
                    costos.costoCompra = demanda * preciounitario;
                    
                    // 6. Costo de pedido = (demanda anual / lote óptimo) * costo de pedido
                    costos.costoPedido = (demanda / loteoptimo) * costopedido;
                    
                    // 7. Costo de almacenamiento = (lote óptimo / 2) * costo de almacenamiento
                    costos.costoAlmacenamiento = (loteoptimo / 2) * costoalmacenamiento;
                    
                    // 8. Costo total (CGI) = costo compra + costo pedido + costo almacenamiento
                    costos.costoTotal = costos.costoCompra + costos.costoPedido + costos.costoAlmacenamiento;
                    
                } else if (modeloFinal === 'PERIODO_FIJO') {
                    // FÓRMULAS PARA MODELO PERIODO_FIJO:
                    
                    // 1. Tiempo óptimo entre pedidos: T* = sqrt((2 * S) / (D * H))
                    // Donde: S = costo de pedido, D = demanda anual, H = costo de almacenamiento
                    const tiempoOptimo = Math.sqrt((2 * costopedido) / (demanda * costoalmacenamiento));                    

                    // 2. Desviación estándar de la demanda durante el periodo de revisión y entrega
                    // σ = sqrt(n * (tiempo óptimo + tiempo envío) * DE^2)
                    // Donde: n = número de períodos, DE = desviación estándar de la demanda
                    const desviacionPeriodo = Math.sqrt((tiempoOptimo + tiempoenvio) * desviacionestandardemanda * desviacionestandardemanda);
                    
                    // 3. Stock de seguridad = 1.64 * desviación del período
                    // Donde 1.64 corresponde a un nivel de servicio del 95%
                    stockseguridadCalculado = 1.64 * desviacionPeriodo;
                    
                    // 4. Lote óptimo = demanda * tiempo óptimo + stock seguridad
                    loteoptimo = demanda * tiempoOptimo + stockseguridadCalculado;
                    
                    // 5. Frecuencia de reabastecimiento = 1 / tiempo Optimo
                    const frecuenciaReabastecimiento = 1 / tiempoOptimo;
                    
                    // 6. Punto de pedido = stock seguridad (en modelo período fijo se revisa periódicamente)
                    puntopedidoCalculado = stockseguridadCalculado;
                    
                    // 7. Costos (mismas fórmulas que LOTE_FIJO)
                    costos.costoCompra = demanda * preciounitario;
                    costos.costoPedido = (demanda / loteoptimo) * costopedido;
                    costos.costoAlmacenamiento = (loteoptimo / 2) * costoalmacenamiento;
                    costos.costoTotal = costos.costoCompra + costos.costoPedido + costos.costoAlmacenamiento;
                }

                // Actualizar los costos
                await client.query(`
                    UPDATE inventario 
                    SET loteoptimo = $1,
                        stockseguridad = $2,
                        puntopedido = $3,
                        costocompra = $4,
                        costopedido = $5,
                        costoalmacenamiento = $6,
                        cgi = $7
                    WHERE idinventario = $8
                `, [
                    Math.round(loteoptimo),
                    Math.round(stockseguridadCalculado),
                    Math.round(puntopedidoCalculado),
                    costos.costoCompra,
                    costos.costoPedido,
                    costos.costoAlmacenamiento,
                    costos.costoTotal,
                    id
                ]);
                console.log('Valores calculados automáticamente:', {
                    loteoptimo: Math.round(loteoptimo),
                    stockseguridad: Math.round(stockseguridadCalculado),
                    puntopedido: Math.round(puntopedidoCalculado),
                    costos
                });
            } catch (error) {
                console.error('Error al calcular costos:', error);
                // No hacemos ROLLBACK aquí, solo registramos el error
                // Los costos se mantendrán en 0
            }
        } else {
            console.log('No se calcularon costos: No hay datos del proveedor');
        }

        await client.query('COMMIT');

        // Obtener el inventario actualizado con todos los cambios
        const finalResult = await client.query(`
            SELECT i.*, p.modeloproducto
            FROM inventario i
            JOIN producto p ON i.idproducto = p.idproducto
            WHERE i.idinventario = $1
        `, [id]);

        res.json(finalResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar inventario:', error);
        res.status(500).json({ 
            error: 'Error al actualizar inventario',
            details: error.message
        });
    } finally {
        client.release();
    }
};

export const deleteInventario = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM inventario WHERE idinventario = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inventario no encontrado' });
        }
        
        res.json({ message: 'Inventario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar inventario:', error);
        res.status(500).json({ error: 'Error al eliminar inventario: ' + error.message });
    }
};

// Obtener inventario por producto ID
export const getInventarioByProducto = async (req, res) => {
    try {
        const { idproducto } = req.params;
        const result = await pool.query(`
            SELECT i.*, p.nombreproducto 
            FROM inventario i
            LEFT JOIN producto p ON i.idproducto = p.idproducto
            WHERE i.idproducto = $1
        `, [idproducto]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inventario no encontrado para este producto' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener inventario por producto:', error);
        res.status(500).json({ error: 'Error al obtener inventario por producto: ' + error.message });
    }
};

// Actualizar inventario por ID de producto
export const updateInventarioByProducto = async (req, res) => {
  try {
    const { idproducto } = req.params;
    const { stock, puntopedido, stockseguridad, loteoptimo, modeloinventario } = req.body;
    
    // Verificar que el inventario existe para este producto
    const checkResult = await pool.query(
      'SELECT * FROM inventario WHERE idproducto = $1',
      [idproducto]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Inventario no encontrado para este producto' });
    }
    
    const result = await pool.query(`
      UPDATE inventario 
      SET stock = COALESCE($1, stock),
          puntopedido = COALESCE($2, puntopedido),
          stockseguridad = COALESCE($3, stockseguridad),
          loteoptimo = COALESCE($4, loteoptimo),
          modeloinventario = COALESCE($5, modeloinventario)
      WHERE idproducto = $6
      RETURNING *
    `, [stock, puntopedido, stockseguridad, loteoptimo, modeloinventario, idproducto]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar inventario por producto:', error);
    res.status(500).json({ error: 'Error al actualizar inventario por producto: ' + error.message });
  }
};

export const getValorTotalInventario = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COALESCE(SUM(i.stock), 0) as total_unidades,
                COUNT(DISTINCT i.idproducto) as total_productos,
                COALESCE(SUM(i.stock * COALESCE(pp.preciounitario, 0)), 0) as valor_total
            FROM inventario i
            LEFT JOIN proveedor_producto pp ON i.idproducto = pp.idproducto
            WHERE i.stock > 0
        `);

        const resultado = {
            valor_total: Number(result.rows[0]?.valor_total || 0),
            total_productos: Number(result.rows[0]?.total_productos || 0),
            total_unidades: Number(result.rows[0]?.total_unidades || 0)
        };

        res.json(resultado);
    } catch (error) {
        console.error('Error al calcular valor total del inventario:', error);
        // Devolver valores por defecto en caso de error
        res.json({
            valor_total: 0,
            total_productos: 0,
            total_unidades: 0
        });
    }
};

// Función para calcular la frecuencia de pedidos histórica
async function calcularFrecuenciaPedidosHistorica(idproducto) {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_ordenes,
                MIN(fechaorden) as primera_orden,
                MAX(fechaorden) as ultima_orden,
                AVG(cantidadsolicitada) as cantidad_promedio
            FROM orden_compra oc
            JOIN inventario i ON oc.idinventario = i.idinventario
            WHERE i.idproducto = $1 
            AND oc.estadoorden IN ('RECIBIDA', 'ABIERTA')
        `, [idproducto]);

        if (result.rows.length === 0 || result.rows[0].total_ordenes === 0) {
            return {
                frecuencia: 0,
                totalOrdenes: 0,
                periodoPromedio: 0,
                cantidadPromedio: 0
            };
        }

        const { total_ordenes, primera_orden, ultima_orden, cantidad_promedio } = result.rows[0];
        
        // Si solo hay una orden, usar un período de 30 días como referencia
        if (total_ordenes == 1) {
            return {
                frecuencia: 12, // 12 pedidos por año (cada mes)
                totalOrdenes: parseInt(total_ordenes),
                periodoPromedio: 30,
                cantidadPromedio: Math.round(cantidad_promedio || 0)
            };
        }
        
        // Calcular el período total en días
        const fechaInicio = new Date(primera_orden);
        const fechaFin = new Date(ultima_orden);
        const diasTotales = Math.max(1, (fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
        
        // Calcular frecuencia (pedidos por año)
        const frecuencia = (total_ordenes / diasTotales) * 365;
        
        // Calcular período promedio entre pedidos (días)
        const periodoPromedio = diasTotales / total_ordenes;

        return {
            frecuencia: Math.round(frecuencia * 100) / 100, // Redondear a 2 decimales
            totalOrdenes: parseInt(total_ordenes),
            periodoPromedio: Math.round(periodoPromedio * 100) / 100,
            cantidadPromedio: Math.round(cantidad_promedio || 0)
        };
    } catch (error) {
        console.error('Error al calcular frecuencia de pedidos histórica:', error);
        return {
            frecuencia: 0,
            totalOrdenes: 0,
            periodoPromedio: 0,
            cantidadPromedio: 0
        };
    }
}

// Función para obtener las últimas órdenes de compra del producto
async function obtenerUltimasOrdenes(idproducto, limite = 5) {
    try {
        const result = await pool.query(`
            SELECT 
                oc.idorden_compra,
                oc.fechaorden,
                oc.cantidadsolicitada,
                oc.estadoorden,
                p.nombreprove
            FROM orden_compra oc
            JOIN inventario i ON oc.idinventario = i.idinventario
            JOIN proveedor p ON oc.idproveedor = p.idproveedor
            WHERE i.idproducto = $1
            ORDER BY oc.fechaorden DESC
            LIMIT $2
        `, [idproducto, limite]);

        return result.rows;
    } catch (error) {
        console.error('Error al obtener últimas órdenes:', error);
        return [];
    }
}

// Función para recalcular automáticamente todos los valores del inventario
export const recalcularInventario = async (req, res) => {
    try {
        // Obtener todos los productos con sus datos de proveedor
        const productosResult = await pool.query(`
            SELECT 
                p.idproducto,
                p.demanda,
                p.costoalmacenamiento,
                p.desviacionestandardemanda,
                p.modeloproducto,
                pp.costopedido,
                pp.preciounitario,
                pp.tiempoenvio
            FROM producto p
            LEFT JOIN proveedor_producto pp ON p.idproducto = pp.idproducto
            WHERE pp.idproducto IS NOT NULL
            ORDER BY pp.preciounitario ASC
        `);

        let productosActualizados = 0;
        let productosSinProveedor = 0;

        for (const producto of productosResult.rows) {
            try {
                const { 
                    idproducto, 
                    demanda, 
                    costopedido, 
                    costoalmacenamiento, 
                    preciounitario, 
                    desviacionestandardemanda, 
                    tiempoenvio,
                    modeloproducto 
                } = producto;

                if (demanda && costopedido && costoalmacenamiento && preciounitario && desviacionestandardemanda && tiempoenvio) {
                    let loteoptimo = 1;
                    let stockseguridadCalculado = 0;
                    let puntopedidoCalculado = 0;
                    let costos = {
                        costoCompra: 0,
                        costoPedido: 0,
                        costoAlmacenamiento: 0,
                        costoTotal: 0
                    };

                    if (modeloproducto === 'LOTE_FIJO') {
                        // FÓRMULAS PARA MODELO LOTE_FIJO:
                        
                        // 1. Lote óptimo (EOQ): Q* = sqrt((2 * D * S) / H)
                        loteoptimo = Math.sqrt((2 * demanda * costopedido) / costoalmacenamiento);
                        
                        // 2. Demanda diaria promedio = demanda anual / 365 días
                        const demandaDiariaPromedio = demanda / 365;
                        
                        // 3. Stock de seguridad = 1.64 * sqrt(tiempo_envio) * desviacion_estandar
                        stockseguridadCalculado = 1.64 * Math.sqrt(tiempoenvio) * desviacionestandardemanda;
                        
                        // 4. Punto de pedido = demanda diaria promedio * tiempo envío + stock seguridad
                        puntopedidoCalculado = demandaDiariaPromedio * tiempoenvio + stockseguridadCalculado;
                        
                        // 5. Costos
                        costos.costoCompra = demanda * preciounitario;
                        costos.costoPedido = (demanda / loteoptimo) * costopedido;
                        costos.costoAlmacenamiento = (loteoptimo / 2) * costoalmacenamiento;
                        costos.costoTotal = costos.costoCompra + costos.costoPedido + costos.costoAlmacenamiento;
                        
                    } else if (modeloproducto === 'PERIODO_FIJO') {
                        // FÓRMULAS PARA MODELO PERIODO_FIJO:
                        
                        // 1. Tiempo óptimo entre pedidos: T* = sqrt((2 * S) / (D * H))
                        // Donde: S = costo de pedido, D = demanda anual, H = costo de almacenamiento
                        const tiempoOptimo = Math.sqrt((2 * costopedido) / (demanda * costoalmacenamiento));
                        
                        // 2. Desviación estándar de la demanda durante el periodo de revisión y entrega
                        // σ = sqrt(n * (tiempo óptimo + tiempo envío) * DE^2)
                        // Donde: n = número de períodos, DE = desviación estándar de la demanda
                        const desviacionPeriodo = Math.sqrt((tiempoOptimo + tiempoenvio) * desviacionestandardemanda * desviacionestandardemanda);
                        
                        // 3. Stock de seguridad = 1.64 * desviación del período
                        // Donde 1.64 corresponde a un nivel de servicio del 95%
                        stockseguridadCalculado = 1.64 * desviacionPeriodo;
                        
                        // 4. Lote óptimo = demanda * tiempo óptimo + stock seguridad
                        loteoptimo = demanda * tiempoOptimo + stockseguridadCalculado;
                        
                        // 5. Frecuencia de reabastecimiento = 1 / tiempo Optimo
                        const frecuenciaReabastecimiento = 1 / tiempoOptimo;
                        
                        // 6. Punto de pedido = stock seguridad (en modelo período fijo se revisa periódicamente)
                        puntopedidoCalculado = stockseguridadCalculado;
                        
                        // 7. Costos (mismas fórmulas que LOTE_FIJO)
                        costos.costoCompra = demanda * preciounitario;
                        costos.costoPedido = (demanda / loteoptimo) * costopedido;
                        costos.costoAlmacenamiento = (loteoptimo / 2) * costoalmacenamiento;
                        costos.costoTotal = costos.costoCompra + costos.costoPedido + costos.costoAlmacenamiento;
                    }

                    // Actualizar el inventario con los valores recalculados
                    await pool.query(`
                        UPDATE inventario 
                        SET loteoptimo = $1,
                            stockseguridad = $2,
                            puntopedido = $3,
                            costocompra = $4,
                            costopedido = $5,
                            costoalmacenamiento = $6,
                            cgi = $7,
                            modeloinventario = $8
                        WHERE idproducto = $9
                    `, [
                        Math.round(loteoptimo),
                        Math.round(stockseguridadCalculado),
                        Math.round(puntopedidoCalculado),
                        costos.costoCompra,
                        costos.costoPedido,
                        costos.costoAlmacenamiento,
                        costos.costoTotal,
                        modeloproducto,
                        idproducto
                    ]);

                    productosActualizados++;
                } else {
                    productosSinProveedor++;
                }
            } catch (productError) {
                console.error(`Error al recalcular producto ${producto.idproducto}:`, productError);
                productosSinProveedor++;
            }
        }

        res.json({
            message: 'Recálculo completado',
            productosActualizados,
            productosSinProveedor,
            totalProductos: productosResult.rows.length
        });

    } catch (error) {
        console.error('Error al recalcular inventario:', error);
        res.status(500).json({ 
            error: 'Error al recalcular inventario',
            details: error.message
        });
    }
};
