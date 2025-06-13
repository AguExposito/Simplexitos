import readline from 'readline';
import inventario from "../models/inventario.js";
import proveedorproducto from "../models/proveedorproducto.js";


// Funcion que te trae el inventario por el id

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

//Funcion para solicitar el idInventario
const solicitarIdInventario = () => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Ingrese el idInventario: ', (idInventario) => {
            resolve(parseInt(idInventario));
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
const solicitarModeloInventario = () => {
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

// Función para solicitar el idProveedor
const solicitarIdProveedor = () => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Ingrese el idProveedor: ', (idProveedor) => {
            resolve(parseInt(idProveedor));
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

// Función para calcular el costo de compra

//Funcion para calcular costo de almacenamiento 

//Funcion para calcular el costo de pedido

//Funcion para calcular CGI

//Funcion para calcular punto de pedido

// Función para calcular el Stock de Seguridad (SS)

//Funcion para Inventario en el Front 

  
