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
async function calcularLoteOptimo(idproducto) {
    try {
        const inventario = await inventario.findOne({
            where: { idinventario: idinventario }
        });
        const proveedor = await proveedorproducto.findOne({
            where: { idproductos: idproducto }
        });

        if (!proveedor) {
            throw new Error('No se encontró proveedor para el artículo especificado');
        }

        const demanda = inventario.demanda;
        const costoPedido = proveedor.costopedido;
        const costoAlmacenamiento = proveedor.costoalmacenamiento;
        const loteOptimo = Math.sqrt((2 * demanda * costoPedido) / costoAlmacenamiento);

        return {loteOptimo, demanda};
    } catch (error) {
        throw new Error(`Error al calcular el Lote Óptimo: ${error.message}`);
    }
}

// Función para calcular el costo de compra
async function calcularCostoCompra(idproducto, idproveedor, loteOptimo) {
    try {
        const proveedorproducto = await proveedorproducto.findOne({
            where: { idproductos: idproducto, idproveedor: idproveedor }
        });

        if (!proveedorproducto) {
            throw new Error('No se encontró proveedor para el artículo especificado');
        }

        const preciounitario = proveedorproducto.preciounitario;
        const costoCompra = preciounitario * loteOptimo;

        return costoCompra;
    } catch (error) {
        throw new Error(`Error al calcular el costo de compra: ${error.message}`);
    }
}

//Funcion para calcular costo de almacenamiento 

async function calcularCostoAlmacenamiento(idproducto, idproveedor, loteOptimo){
    try {
        const proveedorproducto = await proveedorproducto.findOne({
            where: {idproductos: idproducto, idproveedor: idproveedor}
        });
        if (!proveedorproducto) {
            throw new Error('No se encontró proveedor para el artículo especificado');
        }

        const costalm1 = proveedorproducto.costoalmacenamiento;
        const costoAlmacenamiento = costalm1 * (loteOptimo/2)
        
        return costoAlmacenamiento;
    } catch (error) {
        throw new Error(`Error al calcular el costo de almacenamiento: ${error.message}`);
    }
}

//Funcion para calcular el costo de pedido

async function calcularCostoPedido(idproducto, idproveedor, loteOptimo, demanda){
    try {

        const inventario = await inventario.findOne({
            where: { idinventario: idinventario }
        });
        const proveedor = await proveedorproducto.findOne({
            where: {idproductos: idproducto, idproveedor: idproveedor}
        });

        const demanda = inventario.demanda;

        if (!proveedor) {
            throw new Error('No se encontró proveedor para el artículo especificado');
        }
        
        const costoPedido = proveedor.costopedido * (demanda / loteOptimo);
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

async function calcularROP(idproducto, idproveedor) {

    try {

        const diasLaborables = 90;

        const inventario = await inventario.findOne({
            where: { idinventario: idinventario }
        });

        const demanda = inventario.demanda;

        const proveedorproducto = await proveedorproducto.findOne({
            where: { idproductos: idproducto, idproveedor: idproveedor }
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
async function calcularStockSeguridad(idproducto, idproveedor) {
    try {
        const proveedorproducto = await proveedorproducto.findOne({
            where: { idproductos: idproducto, idproveedor: idproveedor }
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
        const stockSeguridad = z * desviacionL;

        return stockSeguridad;
    } catch (error) {
        throw new Error(`Error al calcular el Stock de Seguridad (SS): ${error.message}`);
    }
}

//Funcion para Inventario en el Front 

export const inventarioFuncion = async (idinventario, idproducto, modeloinventario, idproveedor) => {
    try {
      // Lógica de cálculo y actualización de inventario
      const { loteOptimo, demanda } = await calcularLoteOptimo(idproducto);
      let costoCompra = await calcularCostoCompra(idproducto, idproveedor, loteOptimo);
      let costoAlmacenamiento = await calcularCostoAlmacenamiento(idproducto, idproveedor, loteOptimo);
      let costoPedido = await calcularCostoPedido(idproducto, idproveedor, loteOptimo, demanda);
      let costoGeneralInventario = await calcularCostoGeneralInventario(costoCompra, costoAlmacenamiento, costoPedido);
  
      let ROP, stockSeguridad;
      if (modeloinventario === 'Pedido Fijo') {
        ROP = await calcularROP(idproducto, idproveedor);
        stockSeguridad = await calcularStockSeguridad(idproducto, idproveedor);
      }
  
      const updateData = {
        loteoptimo: loteOptimo,
        modeloinventario: modeloinventario,
        costocompra: costoCompra,
        costopedido: costoPedido,
        costoalmacenamiento: costoAlmacenamiento,
        cgi: costoGeneralInventario,
        puntopedido: modeloinventario === 'Pedido Fijo' ? ROP : null,
        stockseguridad: modeloinventario === 'Pedido Fijo' ? stockSeguridad : null
      };
  
      const [numRowsUpdated, [updatedInventario]] = await inventario.update(updateData, {
        where: {
          idproductos: idproducto,
          idinventario: idinventario
        },
        returning: true
      });
  
      if (numRowsUpdated > 0) {
        return updatedInventario.toJSON();
      } else {
        throw new Error(`No se encontró el artículo con ID ${idproducto} en el inventario.`);
      }
    } catch (error) {
      throw new Error(`Error en la función de inventario: ${error.message}`);
    }
  };
  
