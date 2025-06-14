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
ventaRoute.get('/ventas', getVentas);
ventaRoute.get('/ventas/:id', getVentaById);
ventaRoute.post('/ventas', createVenta);
ventaRoute.put('/ventas/:id', updateVenta);
ventaRoute.delete('/ventas/:id', deleteVenta);

export default ventaRoute; 