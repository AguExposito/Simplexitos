import readline from 'readline'
import ventas from "../models/ventas.js";
import inventario from '../models/inventario.js';
import demandahistorica from '../models/demanda.js';
import proveedorproducto from '../models/proveedorproducto.js';

//Funcion para mostrar todas las ventas
export async function getAllVentas(req, res){
    try {
        let allVentas = await ventas.findAll()
        console.log(allVentas);
        res.status(200).json(allVentas);
        
    } catch (error) {
        res.status(500).json({'message': error.message})
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


export const cargarVenta = async (req, res) => {
    const { idproducto, cantidadVenta } = req.body;

    try {
        // Verificar si el ID del artículo es válido
        if (isNaN(idproducto) || idproducto < 1 || idproducto > 5) {
            return res.status(400).json({ message: 'ID de artículo no válido.' });
        }

        // Verificar si la cantidad de venta es válida
        if (isNaN(cantidadVenta) || cantidadVenta <= 0) {
            return res.status(400).json({ message: 'Cantidad no válida.' });
        }

        // Obtener el artículo del inventario
        const inventarioAsociado = await inventario.findOne({ where: { idproductos: idproducto } });
        if (!inventarioAsociado) {
            return res.status(404).json({ message: 'No se encontró inventario asociado al artículo.' });
        }

        // Obtener el precio unitario del artículo
        const proveedorproducto = await proveedorproducto.findOne({ where: { idproductos: idproducto } });
        if (!proveedorproducto) {
            return res.status(404).json({ message: 'No se encontró proveedor asociado al artículo.' });
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
