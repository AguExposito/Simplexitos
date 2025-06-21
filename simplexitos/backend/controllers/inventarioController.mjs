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
            SELECT i.*, p.nombreproducto 
            FROM inventario i
            LEFT JOIN producto p ON i.idproducto = p.idproducto
            ORDER BY i.idinventario
        `);
        res.json(result.rows);
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

        // Fórmula EOQ: Q* = sqrt((2 * D * S) / H)
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

        // Fórmula del costo total:
        // CT = (D * Cu) + (D/Q * S) + (Q/2 * H)
        const costoCompra = demandaNum * preciounitarioNum;
        const costoPedido = (demandaNum / cantidadPedirNum) * costopedidoNum;
        const costoAlmacenamiento = (cantidadPedirNum / 2) * costoalmacenamientoNum;
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
            SELECT i.*, p.idproducto, p.modeloproducto, p.demanda
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
            SET stock = COALESCE($1, stock),
                puntopedido = COALESCE($2, puntopedido),
                stockseguridad = COALESCE($3, stockseguridad)
            WHERE idinventario = $4
            RETURNING *
        `, [stock, puntopedido, stockseguridad, id]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'No se pudo actualizar el inventario' });
        }

        // Verificar si hay datos necesarios para los cálculos
        const proveedorCheck = await client.query(`
            SELECT pp.*, p.demanda, p.costoalmacenamiento
            FROM proveedor_producto pp
            JOIN producto p ON pp.idproducto = p.idproducto
            WHERE pp.idproducto = $1
            ORDER BY pp.preciounitario ASC
            LIMIT 1
        `, [idproducto]);

        const tieneDatosProveedor = proveedorCheck.rows.length > 0;

        // Solo calcular costos si tenemos datos del proveedor
        if (tieneDatosProveedor) {
            try {
                // Calcular costos basados en el modelo actual
                const modeloFinal = modeloinventario || modeloActual;
                let loteoptimo = 1;
                let costos = {
                    costoCompra: 0,
                    costoPedido: 0,
                    costoAlmacenamiento: 0,
                    costoTotal: 0
                };

                const { demanda, costopedido, costoalmacenamiento, preciounitario } = proveedorCheck.rows[0];

                if (modeloFinal === 'LOTE_FIJO') {
                    // Fórmula EOQ: Q* = sqrt((2 * D * S) / H)
                    loteoptimo = Math.sqrt((2 * demanda * costopedido) / costoalmacenamiento);
                    
                    // Calcular costos
                    costos.costoCompra = demanda * preciounitario;
                    costos.costoPedido = (demanda / loteoptimo) * costopedido;
                    costos.costoAlmacenamiento = (loteoptimo / 2) * costoalmacenamiento;
                    costos.costoTotal = costos.costoCompra + costos.costoPedido + costos.costoAlmacenamiento;
                } else if (modeloFinal === 'PERIODO_FIJO') {
                    // Calcular el tiempo óptimo entre pedidos (T*)
                    const tiempoOptimo = Math.sqrt((2 * costopedido) / (demanda * costoalmacenamiento));
                    loteoptimo = demanda * tiempoOptimo;
                    
                    // Calcular costos
                    costos.costoCompra = demanda * preciounitario;
                    costos.costoPedido = (demanda / loteoptimo) * costopedido;
                    costos.costoAlmacenamiento = (loteoptimo / 2) * costoalmacenamiento;
                    costos.costoTotal = costos.costoCompra + costos.costoPedido + costos.costoAlmacenamiento;
                }

                // Actualizar los costos
                await client.query(`
                    UPDATE inventario 
                    SET loteoptimo = $1,
                        costocompra = $2,
                        costopedido = $3,
                        costoalmacenamiento = $4,
                        cgi = $5
                    WHERE idinventario = $6
                `, [
                    Math.round(loteoptimo),
                    costos.costoCompra,
                    costos.costoPedido,
                    costos.costoAlmacenamiento,
                    costos.costoTotal,
                    id
                ]);
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
    const client = await pool.connect();
    try {
        const result = await client.query(`
            WITH valor_total AS (
                SELECT 
                    COALESCE(SUM(i.stock * COALESCE(pp.preciounitario, 0)), 0) as valor_total
                FROM inventario i
                LEFT JOIN proveedor_producto pp ON i.idproducto = pp.idproducto
                WHERE i.stock > 0
            ),
            conteo AS (
                SELECT 
                    COUNT(DISTINCT i.idproducto) as total_productos,
                    COALESCE(SUM(i.stock), 0) as total_unidades
                FROM inventario i
                WHERE i.stock > 0
            )
            SELECT 
                COALESCE(vt.valor_total, 0) as valor_total,
                COALESCE(c.total_productos, 0) as total_productos,
                COALESCE(c.total_unidades, 0) as total_unidades
            FROM valor_total vt
            CROSS JOIN conteo c
        `);

        const resultado = {
            valor_total: Number(result.rows[0]?.valor_total || 0),
            total_productos: Number(result.rows[0]?.total_productos || 0),
            total_unidades: Number(result.rows[0]?.total_unidades || 0)
        };

        res.json(resultado);
    } catch (error) {
        console.error('Error al calcular valor total del inventario:', error);
        res.status(500).json({ 
            error: 'Error al calcular valor total del inventario',
            details: error.message
        });
    } finally {
        client.release();
    }
};
