import express from 'express';
import { cargarOrdenCompra, deleteOrdencompra, editOrdenCompra, getAllOrdenCompra, confirmarOrdenCompra, cancelarOrdenCompra } from '../controllers/ordenCompraController.js';

const ordenCompraRoute = express.Router()

ordenCompraRoute.get('/ordenes-compra', getAllOrdenCompra);
ordenCompraRoute.put ('/editar-ordencompra/:idorden',editOrdenCompra)
ordenCompraRoute.delete ('/eliminar-ordencompra/:idorden', deleteOrdencompra);
ordenCompraRoute.post('/cargar-orden', cargarOrdenCompra)
ordenCompraRoute.put('/ordenes-compra/:idorden_compra/confirmar', confirmarOrdenCompra);
ordenCompraRoute.put('/ordenes-compra/:idorden_compra/cancelar', cancelarOrdenCompra);
export default ordenCompraRoute;