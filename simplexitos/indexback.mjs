import cors from 'cors'
import express from 'express';
import db from './backend/db/connection.js';
import inventarioRoute from './backend/routes/inventarioRoute.js';






const app = express()
const exposedPort = 1234;

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

const html = '<h1>Bienvenidos a la gestión de inventarios</h1>';

app.get('/', (req,res) => {
    res.status(200).send(html)
});


app.use('/', inventarioRoute);





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


