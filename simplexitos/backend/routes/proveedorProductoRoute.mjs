import express from 'express';
import {
  getProveedoresByProducto,
  createProveedorProducto,
  updateProveedorProducto,
  deleteProveedorProducto
} from '../controllers/proveedorProductoController.mjs';

const proveedorProductoRoute = express.Router();

proveedorProductoRoute.get('/proveedor-producto/producto/:idproducto', getProveedoresByProducto);
proveedorProductoRoute.post('/proveedor-producto', createProveedorProducto);
proveedorProductoRoute.put('/proveedor-producto/:id', updateProveedorProducto);
proveedorProductoRoute.delete('/proveedor-producto/:id', deleteProveedorProducto);

export default proveedorProductoRoute;