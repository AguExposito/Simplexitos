import proveedores from "../models/proveedor.js";

export async function getAllProveedores(req, res){
    try {
        let allProveedores = await proveedores.findAll()
        console.log(allProveedores);
        res.status(200).json(allProveedores);
        
    } catch (error) {
        res.status(500).json({'message': error.message})
    }
}
// Crear Proveedor
    export async function createProveedor(req, res) {
        try {
        const proveedoresACrear = new proveedores(req.body)
        await proveedoresACrear.save()
        res.status(201).json({"message": "success"})
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
    
}
//Editar Proveedor
export async function editProveedor(req,res) {
    let idproveedorAEditar =parseInt(req.params.idproveedor)
    try {
        let proveedorAActualizar = await proveedores.findByPk(idproveedorAEditar)
        if (!proveedorAActualizar) {
            return res.status(204).json({"message":"Proveedor no encontrado"})}

            await proveedorAActualizar.update(req.body)

            res.status(200).send('Proveedor actualizado')
        }
    catch(error){
        res.status(204).json({"message":"Proveedor no encontrado"})
    }
}
//Borrar Proveedor
export async function deleteProveedor(req, res){
    let idproveedorABorrar = parseInt(req.params.idproveedor)
    try {
        let proveedorABorrar = await proveedores.findByPk(idproveedorABorrar)
        if (!proveedorABorrar){
            return res.status(204).json({"message":"Proveedor no encontrado"})
        }

        await proveedorABorrar.destroy()
        res.status(200).json({message: 'Proveedor borrado'})

    } catch (error) {
        res.status(204).json({message: error})
    }
};

