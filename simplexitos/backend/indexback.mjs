import cors from 'cors'
import express from 'express';
import db from './db/connection.js';
import articuloRoute from './routes/articulosRoute.js';
import proveedorRoute from './routes/proveedorRoute.js';
import inventarioRoute from './routes/inventarioRoute.js';
import demandaRoute from './routes/demandaRoute.js';
import ventaRoute from './routes/ventaRoute.js';
import pronosticoRoute from './routes/pronosticoRoute.js';
import ordenCompraRoute from './routes/ordenCompraRoute.js';
import proveedorarticuloRoute from './routes/proveedorArticuloRoute.js';
import errorRoute from './routes/errorRoute.js';





const app = express()
const exposedPort = 1234;

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

const html = '<h1>Bienvenidos a la gestion de inventarios</h1>';

app.get('/', (req,res) => {
    res.status(200).send(html)
});

app.use('/', articuloRoute);
app.use('/', proveedorRoute);
app.use('/', inventarioRoute);
app.use('/', demandaRoute);
app.use ('/', ventaRoute);
app.use('/', pronosticoRoute);
app.use('/', ordenCompraRoute);
app.use('/', proveedorarticuloRoute);
app.use('/', errorRoute)




app.use((req,res)=> {
    res.status(404).send('<h1>404</h1>')
});
async function startServer() {
    try{
        await db.authenticate()
        console.log('La conexion salio bien.')

        app.listen(exposedPort, ()=>{
            console.log('El servidor esta escuchando en http://localhost:' + exposedPort)
        })

    } catch(error){
        console.error('La conexion no salio bien', error)
    }
}

startServer();


