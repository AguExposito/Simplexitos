import { pool } from './db/db.mjs';

async function seedData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insertar productos
    const productos = [
      {
        codproducto: 1001,
        nombreproducto: 'Laptop HP',
        modeloproducto: 'Pavilion',
        descripcionproducto: 'Laptop HP Pavilion 15"',
        demanda: 10,
        stockseguridad: 5
      },
      {
        codproducto: 1002,
        nombreproducto: 'Monitor Dell',
        modeloproducto: 'P2419H',
        descripcionproducto: 'Monitor Dell 24" Full HD',
        demanda: 8,
        stockseguridad: 3
      }
    ];

    for (const producto of productos) {
      await client.query(
        `INSERT INTO producto 
         (codproducto, nombreproducto, modeloproducto, descripcionproducto, demanda, stockseguridad)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          producto.codproducto,
          producto.nombreproducto,
          producto.modeloproducto,
          producto.descripcionproducto,
          producto.demanda,
          producto.stockseguridad
        ]
      );
    }

    // Insertar proveedores
    const proveedores = [
      {
        nombreprove: 'TecnoSupply',
        cuit: 12345678,
        localidad: 1
      },
      {
        nombreprove: 'CompuStore',
        cuit: 87654321,
        localidad: 2
      }
    ];

    for (const proveedor of proveedores) {
      await client.query(
        `INSERT INTO proveedor (nombreprove, cuit, localidad)
         VALUES ($1, $2, $3)`,
        [proveedor.nombreprove, proveedor.cuit, proveedor.localidad]
      );
    }

    // Obtener IDs de productos y proveedores
    const productosResult = await client.query('SELECT idproducto FROM producto');
    const proveedoresResult = await client.query('SELECT idproveedor FROM proveedor');

    // Insertar inventario
    for (const producto of productosResult.rows) {
      await client.query(
        `INSERT INTO inventario 
         (idproducto, stock, demanda, costoalmacenamiento, costocompra, costopedido, 
          puntopedido, stockseguridad, loteoptimo, modeloinventario, cgi, frecuenciadereabastecimiento)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          producto.idproducto,
          20, // stock
          10, // demanda
          5, // costoalmacenamiento
          100, // costocompra
          50, // costopedido
          15, // puntopedido
          5, // stockseguridad
          30, // loteoptimo
          'EOQ', // modeloinventario
          0.2, // cgi
          30 // frecuenciadereabastecimiento
        ]
      );
    }

    await client.query('COMMIT');
    console.log('Datos de prueba insertados correctamente');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al insertar datos de prueba:', error);
  } finally {
    client.release();
    pool.end();
  }
}

seedData(); 