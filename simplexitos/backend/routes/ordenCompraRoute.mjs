import express from 'express';
import {
  getOrdenesCompra,
  getOrdenCompraById,
  createOrdenCompra,
  updateOrdenCompra,
  deleteOrdenCompra
} from '../controllers/ordenCompraController.mjs';

const ordenCompraRoute = express.Router();

// Obtener todas las órdenes de compra
ordenCompraRoute.get('/ordenes-compra', getOrdenesCompra);

// Obtener una orden de compra por ID
ordenCompraRoute.get('/ordenes-compra/:id', getOrdenCompraById);

// Crear una nueva orden de compra
ordenCompraRoute.post('/ordenes-compra', createOrdenCompra);

// Actualizar una orden de compra
ordenCompraRoute.put('/ordenes-compra/:id', updateOrdenCompra);

// Eliminar una orden de compra
ordenCompraRoute.delete('/ordenes-compra/:id', deleteOrdenCompra);

export default ordenCompraRoute; 