import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productoRoute from './routes/productoRoute.mjs';
import proveedorRoute from './routes/proveedorRoute.mjs';
import inventarioRoute from './routes/inventarioRoute.mjs';
import ventaRoute from './routes/ventaRoute.mjs';
import ordenCompraRoute from './routes/ordenCompraRoute.mjs';
import proveedorProductoRoute from './routes/proveedorProductoRoute.mjs';

dotenv.config();

const app = express();
const port = process.env.PORT || 1234;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Rutas API
app.use('/api', productoRoute);
app.use('/api', proveedorRoute);
app.use('/api', inventarioRoute);
app.use('/api', ventaRoute);
app.use('/api', ordenCompraRoute);
app.use('/api', proveedorProductoRoute);

// Ruta de prueba para /api
app.get('/api', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Manejador de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

// Manejador de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
}); 