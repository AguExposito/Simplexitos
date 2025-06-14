import { Router } from 'express';
import { createProducto, updateProducto, deleteProducto, getAllproductos } from '../controllers/ProductoController.js';

const ProductoRoute = Router();

ProductoRoute.get('/productos', getAllproductos);
ProductoRoute.post('/productos', createProducto);
ProductoRoute.delete('/productos/:id', deleteProducto);

export default ProductoRoute;
