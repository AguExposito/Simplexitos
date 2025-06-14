import express from 'express';
import {
  getVentas,
  getVentaById,
  createVenta,
  updateVenta,
  deleteVenta
} from '../controllers/ventaController.mjs';

const ventaRoute = express.Router();

// Rutas de ventas
ventaRoute.get('/venta', getVentas);
ventaRoute.get('/venta/:id', getVentaById);
ventaRoute.post('/venta', createVenta);
ventaRoute.put('/venta/:id', updateVenta);
ventaRoute.delete('/venta/:id', deleteVenta);

export default ventaRoute; 