import express from 'express';
import {
  getVentas,
  getVentaById,
  createVenta,
  updateVenta,
  deleteVenta,
  deleteAllVentas
} from '../controllers/ventaController.mjs';

const ventaRoute = express.Router();

// Rutas de ventas
ventaRoute.get('/venta', getVentas);
ventaRoute.post('/venta', createVenta);
ventaRoute.delete('/venta/all', deleteAllVentas);
ventaRoute.get('/venta/:id', getVentaById);
ventaRoute.put('/venta/:id', updateVenta);
ventaRoute.delete('/venta/:id', deleteVenta);

export default ventaRoute; 