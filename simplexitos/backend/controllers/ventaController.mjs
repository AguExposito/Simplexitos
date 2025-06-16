import { pool } from '../db/db.mjs';

export const getVentas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.*,
        p.nombreproducto
      FROM venta v
      LEFT JOIN producto p ON v.idproducto = p.idproducto
      ORDER BY v.idventa
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ 
      error: 'Error al obtener ventas',
      details: error.message 
    });
  }
};

export const getVentaById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        v.*,
        p.nombreproducto
      FROM venta v
      LEFT JOIN producto p ON v.idproducto = p.idproducto
      WHERE v.idventa = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({ 
      error: 'Error al obtener venta',
      details: error.message 
    });
  }
};

export const createVenta = async (req, res) => {
  const client = await pool.connect();
  try {
    const { idproducto, cantidadventa } = req.body;
    
    console.log('Creando venta:', { idproducto, cantidadventa });
    
    await client.query('BEGIN');

    // Verificar el stock disponible y obtener el precio
    const stockResult = await client.query(`
      SELECT i.stock, pp.preciounitario
      FROM inventario i
      LEFT JOIN proveedor_producto pp ON i.idproducto = pp.idproducto
      WHERE i.idproducto = $1
      ORDER BY pp.preciounitario ASC
      LIMIT 1
    `, [idproducto]);

    console.log('Resultado de stock:', stockResult.rows[0]);

    if (stockResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        error: 'No se encontró el inventario para este producto' 
      });
    }

    const { stock, preciounitario } = stockResult.rows[0];

    if (!preciounitario) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'No se encontró el precio del producto. Asegúrese de que el producto tenga un proveedor asignado con precio unitario.'
      });
    }

    if (stock < cantidadventa) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Stock insuficiente',
        stockDisponible: stock
      });
    }

    // Calcular el precio total
    const preciototal = cantidadventa * preciounitario;

    console.log('Calculando precio total:', { cantidadventa, preciounitario, preciototal });

    // Crear la venta
    const ventaResult = await client.query(`
      INSERT INTO venta 
      (idproducto, cantidadventa, preciototal) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `, [idproducto, cantidadventa, preciototal]);

    console.log('Venta creada:', ventaResult.rows[0]);

    // Actualizar el stock
    const updateResult = await client.query(`
      UPDATE inventario 
      SET stock = stock - $1
      WHERE idproducto = $2
      RETURNING stock
    `, [cantidadventa, idproducto]);

    console.log('Stock actualizado:', updateResult.rows[0]);

    await client.query('COMMIT');
    
    res.status(201).json(ventaResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error detallado al crear venta:', error);
    res.status(500).json({ 
      error: 'Error al crear venta',
      details: error.message,
      stack: error.stack
    });
  } finally {
    client.release();
  }
};

export const updateVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidadventa, preciototal } = req.body;
    
    const result = await pool.query(`
      UPDATE venta 
      SET cantidadventa = $1,
          preciototal = $2
      WHERE idventa = $3
      RETURNING *
    `, [cantidadventa, preciototal, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    res.status(500).json({ 
      error: 'Error al actualizar venta',
      details: error.message 
    });
  }
};

export const deleteVenta = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM venta WHERE idventa = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }
    
    res.json({ message: 'Venta eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    res.status(500).json({ 
      error: 'Error al eliminar venta',
      details: error.message 
    });
  }
};

export const deleteAllVentas = async (req, res) => {
  try {
    await pool.query('DELETE FROM venta');
    res.json({ message: 'Todas las ventas han sido eliminadas' });
  } catch (error) {
    console.error('Error al eliminar todas las ventas:', error);
    res.status(500).json({ 
      error: 'Error al eliminar todas las ventas',
      details: error.message 
    });
  }
}; 