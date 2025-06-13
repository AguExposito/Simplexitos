import { Router } from 'express';
import { createProducto, updateProducto, deleteProducto, getAllproductos } from '../controllers/ProductoController.js';

const ProductoRoute = Router();

ProductoRoute.get('/Productos', getAllproductos);
ProductoRoute.post('/crear-Producto', createProducto);
ProductoRoute.put('/editar-Producto/:id', updateProducto);
ProductoRoute.delete('/eliminar-Producto/:id', deleteProducto);

export default ProductoRoute;
