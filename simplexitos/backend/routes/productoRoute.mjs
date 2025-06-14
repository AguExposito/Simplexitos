import express from 'express';
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto
} from '../controllers/productoController.mjs';

const productoRoute = express.Router();

// Rutas de productos
productoRoute.get('/producto', getProductos);
productoRoute.get('/producto/:id', getProductoById);
productoRoute.post('/producto', createProducto);
productoRoute.put('/producto/:id', updateProducto);
productoRoute.delete('/producto/:id', deleteProducto);

export default productoRoute; 