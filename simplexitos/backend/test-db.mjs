import { pool } from './db/db.mjs';

async function testConnection() {
  try {
    // Probar conexión
    const client = await pool.connect();
    console.log('Conexión exitosa a la base de datos');

    // Probar consulta de productos
    const productosResult = await client.query('SELECT * FROM producto LIMIT 5');
    console.log('Productos encontrados:', productosResult.rows);

    // Probar consulta de proveedores
    const proveedoresResult = await client.query('SELECT * FROM proveedor LIMIT 5');
    console.log('Proveedores encontrados:', proveedoresResult.rows);

    // Probar consulta de inventario
    const inventarioResult = await client.query('SELECT * FROM inventario LIMIT 5');
    console.log('Inventario encontrado:', inventarioResult.rows);

    client.release();
  } catch (error) {
    console.error('Error al probar la conexión:', error);
  } finally {
    pool.end();
  }
}

testConnection(); 