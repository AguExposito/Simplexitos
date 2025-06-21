import express from 'express';
import {
  getInventario,
  getInventarioById,
  createInventario,
  updateInventario,
  deleteInventario,
  getInventarioByProducto,
  updateInventarioByProducto,
  getValorTotalInventario,
  recalcularInventario
} from '../controllers/inventarioController.mjs';

const inventarioRoute = express.Router();

// Rutas de inventario
inventarioRoute.get('/inventario', getInventario);
inventarioRoute.get('/inventario/total', getValorTotalInventario);
inventarioRoute.get('/inventario/:id', getInventarioById);
inventarioRoute.get('/inventario/producto/:idproducto', getInventarioByProducto);
inventarioRoute.post('/inventario', createInventario);
inventarioRoute.put('/inventario/:id', updateInventario);
inventarioRoute.put('/inventario/producto/:idproducto', updateInventarioByProducto);
inventarioRoute.delete('/inventario/:id', deleteInventario);

// Ruta para recalcular automáticamente todos los valores del inventario
inventarioRoute.post('/inventario/recalcular', recalcularInventario);

export default inventarioRoute;