import express from 'express';
import {
  getInventario,
  getInventarioById,
  createInventario,
  updateInventario,
  deleteInventario
} from '../controllers/inventarioController.mjs';

const inventarioRoute = express.Router();

// Rutas de inventario
inventarioRoute.get('/inventario', getInventario);
inventarioRoute.get('/inventario/:id', getInventarioById);
inventarioRoute.post('/inventario', createInventario);
inventarioRoute.put('/inventario/:id', updateInventario);
inventarioRoute.delete('/inventario/:id', deleteInventario);

export default inventarioRoute;