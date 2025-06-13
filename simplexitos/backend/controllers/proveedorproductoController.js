import proveedorproducto from "../models/proveedorproducto.js";
import proveedores from "../models/proveedor.js";


export async function getAllproveedorproducto(req, res){
    try {
        let allproveedorproducto = await proveedorproducto.findAll()
        console.log(allproveedorproducto);
        res.status(200).json(allproveedorproducto);
        
    } catch (error) {
        res.status(500).json({'message': error.message})
    }
}
export async function createproveedorproducto(req, res) {
    try {
    const proveedorproductoACrear = new proveedorproducto(req.body)
    await proveedorproductoACrear.save()
    res.status(201).json({"message": "success"})
} catch (error) {
    res.status(400).json({ message: error.message });
}

}
export async function deleteproveedorproducto(req, res){
    let idproveedorproductoABorrar = parseInt(req.params.idproveedorproducto)
    try {
        let proveedorproductoABorrar = await proveedorproducto.findByPk(idproveedorproductoABorrar)
        if (!proveedorproductoABorrar){
            return res.status(204).json({"message":"Proveedor producto no encontrado"})
        }

        await proveedorproductoABorrar.destroy()
        res.status(200).json({message: 'Proveedor producto borrado'})

    } catch (error) {
        res.status(204).json({message: error})
    }
};


export async function getProveedoresByProductoId(req, res) {
    const { idProducto } = req.params;
    
    try {
        const proveedoresAsociados = await proveedorproducto.findAll({
            where: { idProductos: idProducto },
            include: [{
                model: proveedores,
                attributes: ['idproveedor', 'nombreprove']
            }]
        });

        if (!proveedoresAsociados.length) {
            return res.status(404).json({ message: 'No se encontraron proveedores asociados para este producto' });
        }

        const proveedoresList = proveedoresAsociados.map(pa => ({
            id: pa.proveedore.idproveedor,
            nombre: pa.proveedore.nombreprove
        }));

        res.status(200).json(proveedoresList);
    } catch (error) {
        console.error('Error fetching associated providers:', error);
        res.status(500).json({ message: error.message });
    }
}
