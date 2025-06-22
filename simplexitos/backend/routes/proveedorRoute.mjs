import express from 'express';
import {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  checkProveedorStatus
} from '../controllers/proveedorController.mjs';

const proveedorRoute = express.Router();

// Rutas de proveedores
proveedorRoute.get('/proveedor', getProveedores);
proveedorRoute.get('/proveedor/:id', getProveedorById);
proveedorRoute.get('/proveedor/:id/status', checkProveedorStatus);
proveedorRoute.post('/proveedor', createProveedor);
proveedorRoute.put('/proveedor/:id', updateProveedor);
proveedorRoute.delete('/proveedor/:id', deleteProveedor);

export default proveedorRoute; 