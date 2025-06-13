import readline from 'readline';
import inventario from "../models/inventario.js";
import demandahistorica from '../models/demanda.js';
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
async function calcularLoteOptimo(idproducto) {
    try {
        const sumademandatotal = await demandahistorica.sum('demandareal');
        const proveedor = await proveedorproducto.findOne({
            where: { idproductos: idproducto }
        });

        if (!proveedor) {
            throw new Error('No se encontró proveedor para el producto especificado');
        }

        const costoPedido = proveedor.costopedido;
        const costoAlmacenamiento = proveedor.costoalmacenamiento;
        const loteOptimo = Math.sqrt((2 * sumademandatotal * costoPedido) / costoAlmacenamiento);

        return {loteOptimo, sumademandatotal};
    } catch (error) {
        throw new Error(`Error al calcular el Lote Óptimo: ${error.message}`);
    }
}

// Función para calcular el costo de compra
async function calcularCostoCompra(idproducto, idProveedor, loteOptimo) {
    try {
        const proveedor = await proveedorproducto.findOne({
            where: { idproductos: idproducto, idproveedor: idProveedor }
        });

        if (!proveedor) {
            throw new Error('No se encontró proveedor para el producto especificado');
        }

        const precioUnitario = proveedor.preciounitario;
        const costoCompra = precioUnitario * loteOptimo;

        return costoCompra;
    } catch (error) {
        throw new Error(`Error al calcular el costo de compra: ${error.message}`);
    }
}

//Funcion para calcular costo de almacenamiento 

async function calcularCostoAlmacenamiento(idproducto, idProveedor, loteOptimo){
    try {
        const proveedor = await proveedorproducto.findOne({
            where: {idproductos: idproducto, idproveedor: idProveedor}
        });
        if (!proveedor) {
            throw new Error('No se encontró proveedor para el producto especificado');
        }

        const costoal = proveedor.costoalmacenamiento;
        const costoAlmacenamiento = costoal * (loteOptimo/2)
        
        return costoAlmacenamiento;
    } catch (error) {
        throw new Error(`Error al calcular el costo de almacenamiento: ${error.message}`);
    }
}

//Funcion para calcular el costo de pedido

async function calcularCostoPedido(idproducto, idProveedor, loteOptimo, sumademandatotal){
    try {
        const sumademandatotal = await demandahistorica.sum('demandareal');
        const proveedor = await proveedorproducto.findOne({
            where: {idproductos: idproducto, idproveedor: idProveedor}
        });

        if (!proveedor) {
            throw new Error('No se encontró proveedor para el producto especificado');
        }
        
        const costoPedido = proveedor.costopedido * (sumademandatotal / loteOptimo);
        return costoPedido;
    } catch (error) {
        throw new Error(`Error al calcular el costo de almacenamiento: ${error.message}`);
    }
}

//Funcion para calcular CGI

async function calcularCostoGeneralInventario(costoCompra, costoAlmacenamiento, costoPedido) {
    try {
        // Sumar los costos obtenidos
        const costoGeneralInventario = costoCompra + costoAlmacenamiento + costoPedido;

        return costoGeneralInventario;
    } catch (error) {
        throw new Error(`Error al calcular el costo general de inventario (CGI): ${error.message}`);
    }
}

//Funcion para calcular punto de pedido

async function calcularROP(idproducto, idProveedor) {
    try {
        const sumademandatotal = await demandahistorica.sum('demandareal'); // Suma de demanda total

        const diasLaborables = 90; // Días laborables
        const proveedor = await proveedorproducto.findOne({
            where: { idproductos: idproducto, idproveedor: idProveedor }
        });
        
        if (!proveedor) {
            throw new Error('No se encontró proveedor para el producto y proveedor especificados');
        }

        const tiempoEntregaProveedor = proveedor.tiempoenvio; // Tiempo de entrega del proveedor
        const desviacionDemanda = 3; // Desviación estándar de la demanda

        // Calcular promedio de demanda diaria (d)
        const demandaDiaria = sumademandatotal / diasLaborables;

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
async function calcularStockSeguridad(idproducto, idProveedor) {
    try {
        const proveedor = await proveedorproducto.findOne({
            where: { idproductos: idproducto, idproveedor: idProveedor }
        });
        
        if (!proveedor) {
            throw new Error('No se encontró proveedor para el producto y proveedor especificados');
        }

        const tiempoEntregaProveedor = proveedor.tiempoenvio; // Tiempo de entrega del proveedor
        const desviacionDemanda = 3; // Desviación estándar de la demanda
        const z = 1.64; // Nivel de seguridad de servicio

        // Calcular la desviación del tiempo de entrega (desviacion L)
        const desviacionL = desviacionDemanda * Math.sqrt(tiempoEntregaProveedor);

        // Calcular el Stock de Seguridad (SS)
        const stockSeguridad = z * desviacionL;

        return stockSeguridad;
    } catch (error) {
        throw new Error(`Error al calcular el Stock de Seguridad (SS): ${error.message}`);
    }
}


//Funcion para Inventario en el Front 

export const inventarioFuncion = async (idInventario, idproducto, modeloInventario, idProveedor) => {
    try {
      // Lógica de cálculo y actualización de inventario
      const { loteOptimo, sumademandatotal } = await calcularLoteOptimo(idproducto);
      let costoCompra = await calcularCostoCompra(idproducto, idProveedor, loteOptimo);
      let costoAlmacenamiento = await calcularCostoAlmacenamiento(idproducto, idProveedor, loteOptimo);
      let costoPedido = await calcularCostoPedido(idproducto, idProveedor, loteOptimo, sumademandatotal);
      let costoGeneralInventario = await calcularCostoGeneralInventario(costoCompra, costoAlmacenamiento, costoPedido);
  
      let ROP, stockSeguridad;
      if (modeloInventario === 'Pedido Fijo') {
        ROP = await calcularROP(idproducto, idProveedor);
        stockSeguridad = await calcularStockSeguridad(idproducto, idProveedor);
      }
  
      const updateData = {
        loteoptimo: loteOptimo,
        modeloinventario: modeloInventario,
        costocompra: costoCompra,
        costopedido: costoPedido,
        costoalmacenamiento: costoAlmacenamiento,
        cgi: costoGeneralInventario,
        puntopedido: modeloInventario === 'Pedido Fijo' ? ROP : null,
        stockseguridad: modeloInventario === 'Pedido Fijo' ? stockSeguridad : null
      };
  
      const [numRowsUpdated, [updatedInventario]] = await inventario.update(updateData, {
        where: {
          idproductos: idproducto,
          idinventario: idInventario
        },
        returning: true
      });
  
      if (numRowsUpdated > 0) {
        return updatedInventario.toJSON();
      } else {
        throw new Error(`No se encontró el producto con ID ${idproducto} en el inventario.`);
      }
    } catch (error) {
      throw new Error(`Error en la función de inventario: ${error.message}`);
    }
  };
  
