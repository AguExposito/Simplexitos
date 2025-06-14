import express from 'express';
import {
  getOrdenesCompra,
  getOrdenCompraById,
  createOrdenCompra,
  updateOrdenCompra,
  deleteOrdenCompra,
  recibirOrdenCompra,
  cancelarOrdenCompra
} from '../controllers/ordenCompraController.mjs';

const ordenCompraRoute = express.Router();

// Rutas de órdenes de compra
ordenCompraRoute.get('/orden-compra', getOrdenesCompra);
ordenCompraRoute.get('/orden-compra/:id', getOrdenCompraById);
ordenCompraRoute.post('/orden-compra', createOrdenCompra);
ordenCompraRoute.put('/orden-compra/:id', updateOrdenCompra);
ordenCompraRoute.delete('/orden-compra/:id', deleteOrdenCompra);
ordenCompraRoute.put('/orden-compra/:id/recibir', recibirOrdenCompra);
ordenCompraRoute.put('/orden-compra/:id/cancelar', cancelarOrdenCompra);

export default ordenCompraRoute; 