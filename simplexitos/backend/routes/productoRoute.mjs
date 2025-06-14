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
productoRoute.get('/productos', getProductos);
productoRoute.get('/productos/:id', getProductoById);
productoRoute.post('/productos', createProducto);
productoRoute.put('/productos/:id', updateProducto);
productoRoute.delete('/productos/:id', deleteProducto);

export default productoRoute; 