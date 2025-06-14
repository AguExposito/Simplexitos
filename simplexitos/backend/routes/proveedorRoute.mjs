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
proveedorRoute.get('/proveedores', getProveedores);
proveedorRoute.get('/proveedores/:id', getProveedorById);
proveedorRoute.post('/proveedores', createProveedor);
proveedorRoute.put('/proveedores/:id', updateProveedor);
proveedorRoute.delete('/proveedores/:id', deleteProveedor);

export default proveedorRoute; 