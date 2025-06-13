import express from 'express';
import { createProveedorproducto, deleteProveedorproducto, getAllProveedorproducto, getProveedoresByproductoId } from '../controllers/proveedorproductoController.js';


const proveedorproductoRoute = express.Router();

proveedorproductoRoute.get('/proveedorproducto', getAllProveedorproducto);
proveedorproductoRoute.post('/crear-proveedorproducto', createProveedorproducto);
proveedorproductoRoute.delete('/eliminar-proveedor/:idproveedorproducto', deleteProveedorproducto);
proveedorproductoRoute.get('/proveedor-asociado-producto/:idproducto', getProveedoresByproductoId);

export default proveedorproductoRoute;
