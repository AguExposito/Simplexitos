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
  recalcularInventario,
  limpiarValoresNegativos,
  probarCalculos,
  recalcularInventarioAutomatico,
  recalcularInventarioPorId
} from '../controllers/inventarioController.mjs';

const inventarioRoute = express.Router();

// Rutas específicas primero (para evitar conflictos con rutas con parámetros)
inventarioRoute.get('/inventario/total', getValorTotalInventario);
inventarioRoute.get('/inventario/producto/:idproducto', getInventarioByProducto);
inventarioRoute.post('/inventario/recalcular', recalcularInventario);
inventarioRoute.post('/inventario/limpiar-negativos', limpiarValoresNegativos);
inventarioRoute.get('/inventario/probar-calculos', probarCalculos);
inventarioRoute.post('/inventario/:idinventario/recalcular-automatico', recalcularInventarioAutomatico);
inventarioRoute.post('/inventario/:idinventario/recalcular', recalcularInventarioPorId);

// Rutas con parámetros después
inventarioRoute.get('/inventario/:id', getInventarioById);
inventarioRoute.put('/inventario/:id', updateInventario);
inventarioRoute.delete('/inventario/:id', deleteInventario);
inventarioRoute.put('/inventario/producto/:idproducto', updateInventarioByProducto);

// Rutas generales al final
inventarioRoute.get('/inventario', getInventario);
inventarioRoute.post('/inventario', createInventario);

export default inventarioRoute;