import readline from 'readline'
import ventas from "../models/ventas.js";
import inventario from '../models/inventario.js';
import demandahistorica from '../models/demanda.js';
import proveedorproducto from '../models/proveedorproducto.js';
import producto from '../models/producto.js';

//Funcion para mostrar todas las ventas
export async function getAllVentas(req, res){
    try {
        const allVentas = await ventas.findAll({
            include: [{ model: producto }]
        });
        res.status(200).json(allVentas);
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
}

//Editar columnas de venta por id
export async function editVenta(req,res) {
    let idventaAEditar =parseInt(req.params.idventa)
    try {
        let ventaAActualizar = await ventas.findByPk(idventaAEditar)
        if (!ventaAActualizar) {
            return res.status(204).json({"message":"Producto no encontrado"})}

            await ventaAActualizar.update(req.body)

            res.status(200).send('Producto actualizado')
        }
    catch(error){
        res.status(204).json({"message":"Producto no encontrado"})
    }
}

//Funcion elminar venta por su id
export async function deleteVenta(req, res){
    let idventaABorrar = parseInt(req.params.idventa)
    try {
        let ventaABorrar = await ventas.findByPk(idventaABorrar)
        if (!ventaABorrar){
            return res.status(204).json({"message":"Venta no encontrada"})
        }

        await ventaABorrar.destroy()
        res.status(200).json({message: 'Venta borrada'})

    } catch (error) {
        res.status(204).json({message: error})
    }
};


//Funcion cargar y crear venta

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Cargar venta desde el back
/* 
export const cargarVenta = async () => {
    try {
        // Paso 1: Solicitar el ID del producto
        rl.question('Ingrese el ID del producto que desea vender (1-5): ', async (answer1) => {
            const idproducto = parseInt(answer1);

            // Verificar si el ID del producto es válido
            if (isNaN(idproducto) || idproducto < 1 || idproducto > 5) {
                console.log('ID de producto no válido.');
                rl.close();
                return;
            }

            try {
                // Paso 2: Solicitar la cantidad de venta
                rl.question('Ingrese la cantidad de venta: ', async (answer2) => {
                    const cantidadVenta = parseInt(answer2);

                    // Verificar si la cantidad de venta es válida
                    if (isNaN(cantidadVenta) || cantidadVenta <= 0) {
                        console.log('Cantidad no válida.');
                        rl.close();
                        return;
                    }

                    // Obtener el producto del inventario
                    const inventarioAsociado = await inventario.findOne({ where: { idproductos: idproducto } });
                    if (!inventarioAsociado) {
                        console.log('No se encontró inventario asociado al producto.');
                        rl.close();
                        return;
                    }

                    // Obtener el precio unitario del producto
                    const proveedorproducto = await proveedorproducto.findOne({ where: { idproductos: idproducto } });
                    if (!proveedorproducto) {
                        console.log('No se encontró proveedor asociado al producto.');
                        rl.close();
                        return;
                    }

                    // Calcular el precio de venta
                    const precioVenta = cantidadVenta * (proveedorproducto.preciounitario + 0.3 * proveedorproducto.preciounitario);
                    console.log('El precio de venta del producto es: ', precioVenta);

                    // Obtener el próximo ID de demanda
                    const ultimaDemanda = await demandahistorica.findOne({
                        order: [['iddemanda', 'DESC']]
                    });
                    const nuevoIdDemanda = ultimaDemanda ? ultimaDemanda.iddemanda + 1 : 1;

                    // Primera confirmación: Actualizar el stock del inventario
                    rl.question('Ingrese "confirmar" para actualizar el stock del inventario: ', async (answer3) => {
                        if (answer3.trim().toLowerCase() === 'confirmar') {
                            // Actualizar el inventario
                            inventarioAsociado.stock -= cantidadVenta;
                            await inventarioAsociado.save();
                            console.log(`Se restaron ${cantidadVenta} unidades del stock del inventario.`);
                        } else {
                            console.log('Actualización de stock cancelada.');
                            rl.close();
                            return;
                        }

                        // Segunda confirmación: Confirmar toda la operación
                        rl.question('Ingrese "confirmar" para confirmar toda la operación: ', async (answer4) => {
                            if (answer4.trim().toLowerCase() === 'confirmar') {
                                // Crear una nueva demanda histórica
                                const nuevoPeriodo = 'Julio - 2024'; // Ajustar esto según sea necesario
                                const nuevaDemanda = await demandahistorica.create({
                                    iddemanda: nuevoIdDemanda,
                                    idinventario: inventarioAsociado.idinventario,
                                    periodo: nuevoPeriodo,
                                    demandareal: cantidadVenta
                                });

                                console.log('Demanda histórica creada con éxito.');
                                console.log('Demanda:', nuevaDemanda.toJSON());

                                // Crear la venta
                                const nuevaVenta = await ventas.create({
                                    iddemanda: nuevaDemanda.iddemanda,
                                    idinventario: inventarioAsociado.idinventario,
                                    cantidadventa: cantidadVenta,
                                    preciototal: precioVenta
                                });

                                console.log('Venta creada con éxito.');
                                console.log('Venta:', nuevaVenta.toJSON());
                            } else {
                                console.log('Operación completa cancelada.');
                            }
                            rl.close();
                        });
                    });
                });
            } catch (error) {
                console.error('Error al cargar la venta:', error.message);
                rl.close();
            }
        });
    } catch (error) {
        console.error('Error al cargar la venta:', error.message);
        rl.close();
    }
}; */
/*
export const cargarVenta = async (req, res) => {
    const { idproducto, cantidadVenta } = req.body;

    try {
        // Verificar si el ID del producto es válido
        if (isNaN(idproducto) || idproducto < 1 || idproducto > 5) {
            return res.status(400).json({ message: 'ID de producto no válido.' });
        }

        // Verificar si la cantidad de venta es válida
        if (isNaN(cantidadVenta) || cantidadVenta <= 0) {
            return res.status(400).json({ message: 'Cantidad no válida.' });
        }

        // Obtener el producto del inventario
        const inventarioAsociado = await inventario.findOne({ where: { idproductos: idproducto } });
        if (!inventarioAsociado) {
            return res.status(404).json({ message: 'No se encontró inventario asociado al producto.' });
        }

        // Obtener el precio unitario del producto
        const proveedorproducto = await proveedorproducto.findOne({ where: { idproductos: idproducto } });
        if (!proveedorproducto) {
            return res.status(404).json({ message: 'No se encontró proveedor asociado al producto.' });
        }

        // Calcular el precio de venta
        const precioVenta = cantidadVenta * (proveedorproducto.preciounitario + 0.3 * proveedorproducto.preciounitario);

        // Obtener el próximo ID de demanda
        const ultimaDemanda = await demandahistorica.findOne({ order: [['iddemanda', 'DESC']] });
        const nuevoIdDemanda = ultimaDemanda ? ultimaDemanda.iddemanda + 1 : 1;

        // Actualizar el inventario
        inventarioAsociado.stock -= cantidadVenta;
        await inventarioAsociado.save();

        // Crear una nueva demanda histórica
        const nuevoPeriodo = 'Julio - 2024'; // Ajustar esto según sea necesario
        const nuevaDemanda = await demandahistorica.create({
            iddemanda: nuevoIdDemanda,
            idinventario: inventarioAsociado.idinventario,
            periodo: nuevoPeriodo,
            demandareal: cantidadVenta
        });

        // Crear la venta
        const nuevaVenta = await ventas.create({
            cantidadventa: cantidadVenta,
            preciototal: precioVenta,
            idinventario: inventarioAsociado.idinventario,
            iddemanda: nuevaDemanda.iddemanda
        });

        res.status(200).json({
            message: 'Venta creada con éxito.',
            venta: nuevaVenta.toJSON(),
            demanda: nuevaDemanda.toJSON()
        });
    } catch (error) {
        console.error('Error al cargar la venta:', error.message);
        res.status(500).json({ message: 'Error al cargar la venta: ' + error.message });
    }
};
*/

export const cargarVenta = async (req, res) => {
    const { idproducto, cantidadventa } = req.body;

    if (!idproducto || !cantidadventa) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

    try {
        // Verificar que el producto existe
        const productoAsociado = await producto.findOne({
            where: { idproducto }
        });
        if (!productoAsociado) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Obtener el precio unitario del producto
        const proveedorProducto = await proveedorproducto.findOne({
            where: { idproducto }
        });
        if (!proveedorProducto) {
            return res.status(404).json({ error: 'No se encontró información de precio para el producto' });
        }

        // Calcular el precio total (precio unitario + 30% de margen)
        const preciototal = cantidadventa * (proveedorProducto.preciounitario * 1.3);

        // Crear la venta
        const nuevaVenta = await ventas.create({
            idproducto,
            cantidadventa,
            preciototal,
            fechaaltaventa: new Date()
        });

        res.status(201).json({
            message: 'Venta registrada exitosamente',
            data: nuevaVenta
        });
    } catch (error) {
        console.error('Error al registrar la venta:', error.message);
        res.status(500).json({ error: 'Error al registrar la venta' });
    }
};
