import inventario from '../models/inventario.js';
import proveedorproducto from '../models/proveedorproducto.js';
import proveedores from '../models/proveedor.js';
import ordencompra from "../models/ordenCompra.js";
import productos from '../models/productos.js';

export async function getAllOrdenCompra(req, res){
    try {
        let getAllOrdenCompra = await ordencompra.findAll()
        console.log(getAllOrdenCompra);
        res.status(200).json(getAllOrdenCompra);
        
    } catch (error) {
        res.status(500).json({'message': error.message})
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
    const { idproducto, idProveedor, cantidadSolicitada } = req.body;

    if (!idproducto || !idProveedor || !cantidadSolicitada) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    try {
        const inventarioAsociado = await inventario.findOne({ where: { idproductos: idproducto } });
        if (!inventarioAsociado) {
            return res.status(404).json({ error: 'Inventario no encontrado para el producto dado' });
        }

        const nuevaOrden = await ordencompra.create({
            idinventario: inventarioAsociado.idinventario,
            estadoorden: 'Pendiente',
            fechaorden: new Date(),
            cantidadsolicitada: cantidadSolicitada
        });

        res.status(201).json(nuevaOrden);
    } catch (error) {
        console.error('Error al crear la orden de compra:', error.message);
        res.status(500).json({ error: 'Error al crear la orden de compra' });
    }
};

export const confirmarOrdenCompra = async (req, res) => {
    const { idorden } = req.params;

    try {
        const orden = await ordencompra.findByPk(idorden);
        if (!orden) {
            return res.status(404).json({ error: 'Orden de compra no encontrada' });
        }

        if (orden.estadoorden !== 'Pendiente') {
            return res.status(400).json({ error: 'La orden de compra no está en estado pendiente' });
        }

        orden.estadoorden = 'Entregado';
        await orden.save();

        const inventarioAsociado = await inventario.findByPk(orden.idinventario);
        inventarioAsociado.stock += orden.cantidadsolicitada;
        await inventarioAsociado.save();

        res.status(200).json({ message: 'Orden de compra confirmada y stock actualizado' });
    } catch (error) {
        console.error('Error al confirmar la orden de compra:', error.message);
        res.status(500).json({ error: 'Error al confirmar la orden de compra' });
    }
};

