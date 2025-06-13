import express from 'express';
import {  getInventario,  inventarioFuncion } from '../controllers/inventarioController.js';

const inventarioRoute = express.Router()

//Ruta para consultar el inventario segun su id
inventarioRoute.get('/inventario/:idinventario', getInventario);

//Ruta para realizar inventario y actualizarlo en la base de datos
inventarioRoute.put('/inventario', async (req, res) => {
    const { idInventario, idproducto, modeloInventario, idProveedor } = req.body;
    try {
        await inventarioFuncion(idInventario, idproducto, modeloInventario, idProveedor);
        res.status(200).send('Actualización de inventario completada correctamente.');
    } catch (error) {
        console.error('Error en la ruta de inventario:', error);
        res.status(500).json({ error: error.message });
    }
});


export default inventarioRoute;