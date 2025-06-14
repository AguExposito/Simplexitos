import express from 'express';
import {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor
} from '../controllers/proveedorController.mjs';

const proveedorRoute = express.Router();

// Rutas de proveedores
proveedorRoute.get('/proveedor', getProveedores);
proveedorRoute.get('/proveedor/:id', getProveedorById);
proveedorRoute.post('/proveedor', createProveedor);
proveedorRoute.put('/proveedor/:id', updateProveedor);
proveedorRoute.delete('/proveedor/:id', deleteProveedor);

export default proveedorRoute; 