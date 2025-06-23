import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import db from './db/connection.mjs';
import inventarioRoute from './routes/inventarioRoute.mjs';
import ordenCompraRoute from './routes/ordenCompraRoute.mjs';
import productoRoute from './routes/productoRoute.mjs';
import proveedorRoute from './routes/proveedorRoute.mjs';
import proveedorProductoRoute from './routes/proveedorProductoRoute.mjs';
import ventaRoute from './routes/ventaRoute.mjs';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

// Registrar todas las rutas
app.use('/', inventarioRoute);
app.use('/', ordenCompraRoute);
app.use('/', productoRoute);
app.use('/', proveedorRoute);
app.use('/', proveedorProductoRoute);
app.use('/', ventaRoute);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './index.html'));
});

(async () => {
    try {
        await db.authenticate();
        console.log('Conexión a la base de datos exitosa');
        await db.sync();
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    }
})();

app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
