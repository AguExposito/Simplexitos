import readline from 'readline';
import inventarioModel from "../models/inventario.mjs";
import proveedorproducto from "../models/proveedorproducto.mjs";
import producto from "../models/producto.mjs";
import { pool } from '../db/db.mjs';

// Obtener todo el inventario
export const getAllInventario = async (req, res) => {
    try {
        const items = await inventarioModel.findAll({
            include: [{ model: producto }]
        });
        res.status(200).json(items);
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
        res.status(500).json({ error: 'Error al obtener inventario' });
    }
};

export const getInventarioById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT i.*, p.nombreproducto 
            FROM inventario i
            LEFT JOIN producto p ON i.idproducto = p.idproducto
            WHERE i.idinventario = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registro de inventario no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener registro de inventario:', error);
        res.status(500).json({ error: 'Error al obtener registro de inventario' });
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

// Función para calcular el Lote Óptimo
async function calcularloteoptimo(idproducto) {
    try {
        const inventarioItem = await inventarioModel.findOne({
            where: { idinventario: idinventario }
        });
        const proveedorItem = await proveedorproducto.findOne({
            where: { idproducto: idproducto }
        });

        if (!proveedorItem) {
            throw new Error('No se encontró proveedor para el artículo especificado');
        }

        const demanda = inventarioItem.demanda;
        const costopedido = proveedorItem.costopedido;
        const costoalmacenamiento = proveedorItem.costoalmacenamiento;
        const loteoptimo = Math.sqrt((2 * demanda * costopedido) / costoalmacenamiento);

        return {loteoptimo, demanda};
    } catch (error) {
        throw new Error(`Error al calcular el Lote Óptimo: ${error.message}`);
    }
}

// Función para calcular el costo de compra
async function calcularcostocompra(idproducto, idproveedor, loteoptimo) {
    try {
        const proveedorproducto = await proveedorproducto.findOne({
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
        const proveedorproducto = await proveedorproducto.findOne({
            where: {idproducto: idproducto, idproveedor: idproveedor}
        });
        if (!proveedorproducto) {
            throw new Error('No se encontró proveedor para el artículo especificado');
        }

        const costalm1 = proveedorproducto.costoalmacenamiento;
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
        const proveedorItem = await proveedorproducto.findOne({
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

        const proveedorproducto = await proveedorproducto.findOne({
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
        const proveedorproducto = await proveedorproducto.findOne({
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
    const {
        idproducto,
        stock,
        demanda,
        costoalmacenamiento,
        costocompra,
        costopedido,
        puntopedido,
        stockseguridad,
        loteoptimo,
        modeloinventario,
        cgi,
        frecuenciadereabastecimiento
    } = req.body;

    try {
        // Verificar que el producto existe
        const productoCheck = await pool.query(
            'SELECT * FROM producto WHERE idproducto = $1',
            [idproducto]
        );

        if (productoCheck.rows.length === 0) {
            return res.status(400).json({ error: 'El producto no existe' });
        }

        const result = await pool.query(
            `INSERT INTO inventario 
             (idproducto, stock, demanda, costoalmacenamiento, costocompra, costopedido,
              puntopedido, stockseguridad, loteoptimo, modeloinventario, cgi, frecuenciadereabastecimiento)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [
                idproducto, stock, demanda, costoalmacenamiento, costocompra, costopedido,
                puntopedido, stockseguridad, loteoptimo, modeloinventario, cgi, frecuenciadereabastecimiento
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear registro de inventario:', error);
        res.status(500).json({ error: 'Error al crear registro de inventario' });
    }
};

export const updateInventario = async (req, res) => {
    const { id } = req.params;
    const {
        stock,
        demanda,
        costoalmacenamiento,
        costocompra,
        costopedido,
        puntopedido,
        stockseguridad,
        loteoptimo,
        modeloinventario,
        cgi,
        frecuenciadereabastecimiento
    } = req.body;

    try {
        const result = await pool.query(
            `UPDATE inventario 
             SET stock = COALESCE($1, stock),
                 demanda = COALESCE($2, demanda),
                 costoalmacenamiento = COALESCE($3, costoalmacenamiento),
                 costocompra = COALESCE($4, costocompra),
                 costopedido = COALESCE($5, costopedido),
                 puntopedido = COALESCE($6, puntopedido),
                 stockseguridad = COALESCE($7, stockseguridad),
                 loteoptimo = COALESCE($8, loteoptimo),
                 modeloinventario = COALESCE($9, modeloinventario),
                 cgi = COALESCE($10, cgi),
                 frecuenciadereabastecimiento = COALESCE($11, frecuenciadereabastecimiento)
             WHERE idinventario = $12
             RETURNING *`,
            [
                stock, demanda, costoalmacenamiento, costocompra, costopedido,
                puntopedido, stockseguridad, loteoptimo, modeloinventario, cgi,
                frecuenciadereabastecimiento, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registro de inventario no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar registro de inventario:', error);
        res.status(500).json({ error: 'Error al actualizar registro de inventario' });
    }
};

export const deleteInventario = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM inventario WHERE idinventario = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Registro de inventario no encontrado' });
        }

        res.json({ message: 'Registro de inventario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar registro de inventario:', error);
        res.status(500).json({ error: 'Error al eliminar registro de inventario' });
    }
};
