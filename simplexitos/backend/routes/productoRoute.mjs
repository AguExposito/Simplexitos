import express from 'express';
import { crearProducto, getProductos } from '../controllers/productoController.mjs';

const productoRoute = express.Router();

// Ruta para obtener todos los productos
productoRoute.get('/productos', getProductos);

// Ruta para crear un nuevo producto
productoRoute.post('/producto', crearProducto);

export default productoRoute; 