import proveedor from "../models/proveedor.js";

export async function getAllProveedores(req, res) {
    try {
        const allProveedores = await proveedor.findAll();
        res.status(200).json(allProveedores);
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
}

export async function createProveedor(req, res) {
    try {
        const { nombreprove, cuit, localidad } = req.body;

        if (!nombreprove || !cuit || !localidad) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        const nuevoProveedor = await proveedor.create({
            nombreprove,
            cuit,
            localidad,
            fechaaltaproveedor: new Date()
        });

        res.status(201).json({
            message: 'Proveedor creado exitosamente',
            data: nuevoProveedor
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function editProveedor(req, res) {
    try {
        const { idproveedor } = req.params;
        const { nombreprove, cuit, localidad } = req.body;

        const proveedorAActualizar = await proveedor.findByPk(idproveedor);
        if (!proveedorAActualizar) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        await proveedorAActualizar.update({
            nombreprove,
            cuit,
            localidad
        });

        res.status(200).json({
            message: 'Proveedor actualizado exitosamente',
            data: proveedorAActualizar
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

export async function deleteProveedor(req, res) {
    try {
        const { idproveedor } = req.params;

        const proveedorABorrar = await proveedor.findByPk(idproveedor);
        if (!proveedorABorrar) {
            return res.status(404).json({ error: 'Proveedor no encontrado' });
        }

        await proveedorABorrar.destroy();

        res.status(200).json({
            message: 'Proveedor eliminado exitosamente'
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

