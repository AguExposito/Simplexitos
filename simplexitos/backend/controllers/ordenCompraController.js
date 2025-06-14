import readline from 'readline';
import inventario from '../models/inventario.js';
import proveedorproducto from '../models/proveedorproducto.js';
import proveedor from '../models/proveedor.js';
import ordencompra from "../models/ordenCompra.js";
import productos from '../models/producto.js';

export async function getAllOrdenCompra(req, res) {
    try {
        const ordenes = await ordencompra.findAll({
            include: [
                { model: inventario },
                { model: proveedor }
            ]
        });
        res.status(200).json(ordenes);
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
}

export async function editOrdenCompra(req,res){
    let idordenAEditar =parseInt(req.params.idorden)
        try{
            let ordenCompraAActualizar = await ordencompra.findByPk(idordenAEditar)
            if(!ordenCompraAActualizar){
                return res.status(204).json({"message":"Orden de compra no encontrada"})}
            await ordenCompraAActualizar.update(req.body)
            res.status(200).send("Orden de compra actualizada")
        }
        catch(error){
            res.status(204).json({"message":"Orden de compra no encontrada"})
        }
}


//Borrar Proveedor
export async function deleteOrdencompra(req, res){
    let idordencompraABorrar = parseInt(req.params.idorden)
    try {
        let ordenCompraABorrar = await ordencompra.findByPk(idordencompraABorrar)
        if (!ordenCompraABorrar){
            return res.status(204).json({"message":"Proveedor no encontrado"})
        }

        await ordenCompraABorrar.destroy()
        res.status(200).json({message: 'Proveedor borrado'})

    } catch (error) {
        res.status(204).json({message: error})
    }
};

export const cargarOrdenCompra = async (req, res) => {
    const { idinventario, idproveedor, descripcionordendecompra, cantidadsolicitada } = req.body;

    if (!idinventario || !idproveedor || !cantidadsolicitada) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    try {
        // Verificar que el inventario existe
        const inventarioAsociado = await inventario.findOne({ 
            where: { idinventario: idinventario } 
        });
        if (!inventarioAsociado) {
            return res.status(404).json({ error: 'Inventario no encontrado' });
        }

        // Verificar que el proveedor existe
        const proveedorAsociado = await proveedor.findOne({ 
            where: { idproveedor: idproveedor } 
        });
        if (!proveedorAsociado) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        // Crear la orden de compra
        const nuevaOrden = await ordencompra.create({
            idinventario,
            idproveedor,
            descripcionordendecompra,
            estadoorden: 'ABIERTA',
            cantidadsolicitada,
            fechaorden: new Date()
        });

        res.status(201).json({
            message: 'Orden de compra creada exitosamente',
            data: nuevaOrden
        });
    } catch (error) {
        console.error('Error al crear la orden de compra:', error.message);
        res.status(500).json({ error: 'Error al crear la orden de compra' });
    }
};

export const confirmarOrdenCompra = async (req, res) => {
    const { idorden_compra } = req.params;

    try {
        const orden = await ordencompra.findOne({
            where: { idorden_compra }
        });

        if (!orden) {
            return res.status(404).json({ error: 'Orden de compra no encontrada' });
        }

        if (orden.estadoorden !== 'ABIERTA') {
            return res.status(400).json({ error: 'La orden de compra no está en estado ABIERTA' });
        }

        await orden.update({
            estadoorden: 'RECIBIDA'
        });

        res.status(200).json({
            message: 'Orden de compra confirmada exitosamente',
            data: orden
        });
    } catch (error) {
        console.error('Error al confirmar la orden de compra:', error.message);
        res.status(500).json({ error: 'Error al confirmar la orden de compra' });
    }
};

export const cancelarOrdenCompra = async (req, res) => {
    const { idorden_compra } = req.params;

    try {
        const orden = await ordencompra.findOne({
            where: { idorden_compra }
        });

        if (!orden) {
            return res.status(404).json({ error: 'Orden de compra no encontrada' });
        }

        if (orden.estadoorden === 'CANCELADA') {
            return res.status(400).json({ error: 'La orden de compra ya está cancelada' });
        }

        await orden.update({
            estadoorden: 'CANCELADA'
        });

        res.status(200).json({
            message: 'Orden de compra cancelada exitosamente',
            data: orden
        });
    } catch (error) {
        console.error('Error al cancelar la orden de compra:', error.message);
        res.status(500).json({ error: 'Error al cancelar la orden de compra' });
    }
};

