import express from 'express';
import { createProveedor, deleteProveedor, editProveedor, getAllProveedores } from '../controllers/proveedorController.js';

const proveedorRoute = express.Router()

proveedorRoute.get('/proveedores', getAllProveedores);
proveedorRoute.post('/crear-proveedor', createProveedor);
proveedorRoute.put ('/editar-proveedor/:idproveedor',editProveedor)
proveedorRoute.delete ('/eliminar-proveedor/:idproveedor', deleteProveedor);

export default proveedorRoute;