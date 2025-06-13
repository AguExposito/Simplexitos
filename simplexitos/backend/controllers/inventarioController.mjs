import readline from 'readline';
import inventario from "../models/inventario.js";
import proveedorproducto from "../models/proveedorproducto.js";


// Traer el inventario por el id

    export const getInventario = async (req, res) => {
        const { idinventario } = req.params;
    
        try {
            // Buscar el inventario por ID
            const item = await inventario.findOne({ where: { idinventario } });
    
            // Verificar si el inventario existe
            if (!item) {
                return res.status(404).send(`No se encontró el inventario con ID ${idinventario}`);
            }
    
            // Enviar el inventario encontrado como respuesta
            res.status(200).json(item);
        } catch (error) {
            console.error('Error al obtener el inventario:', error);
            res.status(500).send('Ocurrió un error al obtener el inventario.');
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
        const inventario = await inventario.findOne({
            where: { idinventario: idinventario }
        });
        const proveedor = await proveedorproducto.findOne({
            where: { idproducto: idproducto }
        });

        if (!proveedor) {
            throw new Error('No se encontró proveedor para el artículo especificado');
        }

        const demanda = inventario.demanda;
        const costopedido = proveedor.costopedido;
        const costoalmacenamiento = proveedor.costoalmacenamiento;
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

        const inventario = await inventario.findOne({
            where: { idinventario: idinventario }
        });
        const proveedor = await proveedorproducto.findOne({
            where: {idproducto: idproducto, idproveedor: idproveedor}
        });

        const demanda = inventario.demanda;

        if (!proveedor) {
            throw new Error('No se encontró proveedor para el artículo especificado');
        }
        
        const costopedido = proveedor.costopedido * (demanda / loteoptimo);
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

        const inventario = await inventario.findOne({
            where: { idinventario: idinventario }
        });

        const demanda = inventario.demanda;

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
        const inventarioActual = await inventario.findOne({
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
