import express from 'express';
import {getAllVentas, editVenta, deleteVenta, cargarVenta } from '../controllers/ventasController.js';

const ventaRoute = express.Router()

ventaRoute.get('/ventas', getAllVentas)
ventaRoute.patch('/editar-venta/:idventa', editVenta)
ventaRoute.delete('/borrar-venta/:idventa', deleteVenta);
ventaRoute.post('/cargar-venta', cargarVenta);

export default ventaRoute;