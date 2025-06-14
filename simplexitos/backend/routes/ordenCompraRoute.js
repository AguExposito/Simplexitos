import express from 'express';
import { cargarOrdenCompra, deleteOrdencompra, editOrdenCompra, getAllOrdenCompra, confirmarOrdenCompra, cancelarOrdenCompra } from '../controllers/ordenCompraController.js';

const ordenCompraRoute = express.Router()

ordenCompraRoute.get('/ordenCompra', getAllOrdenCompra);
ordenCompraRoute.put ('/editar-ordencompra/:idorden',editOrdenCompra)
ordenCompraRoute.delete ('/eliminar-ordencompra/:idorden', deleteOrdencompra);
ordenCompraRoute.post('/cargar-orden', cargarOrdenCompra)
ordenCompraRoute.post('/confirmar-ordencompra/:idorden', confirmarOrdenCompra);
ordenCompraRoute.put('/ordenCompra/:idorden_compra/confirmar', confirmarOrdenCompra);
ordenCompraRoute.put('/ordenCompra/:idorden_compra/cancelar', cancelarOrdenCompra);
export default ordenCompraRoute;