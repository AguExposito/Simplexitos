import { pool } from '../db/db.mjs';

export const getVentas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, p.nombreproducto 
      FROM venta v
      LEFT JOIN producto p ON v.idproducto = p.idproducto
      ORDER BY v.fechaaltaventa DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
};

export const getVentaById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT v.*, p.nombreproducto 
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
    res.status(500).json({ error: 'Error al obtener venta' });
  }
};

export const createVenta = async (req, res) => {
  const { idproducto, cantidadventa } = req.body;

  try {
    // Iniciar transacción
    await pool.query('BEGIN');

    // Verificar stock disponible
    const inventarioCheck = await pool.query(`
      SELECT i.*, p.preciounitario 
      FROM inventario i
      JOIN proveedor_producto p ON i.idproducto = p.idproducto
      WHERE i.idproducto = $1
      ORDER BY p.preciounitario ASC
      LIMIT 1
    `, [idproducto]);

    if (inventarioCheck.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'No hay inventario disponible para este producto' });
    }

    const inventario = inventarioCheck.rows[0];
    if (inventario.stock < cantidadventa) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    // Calcular precio total
    const preciototal = cantidadventa * inventario.preciounitario;

    // Crear la venta
    const ventaResult = await pool.query(
      `INSERT INTO venta (idproducto, cantidadventa, preciototal, fechaaltaventa)
       VALUES ($1, $2, $3, CURRENT_DATE)
       RETURNING *`,
      [idproducto, cantidadventa, preciototal]
    );

    // Actualizar el stock
    await pool.query(
      `UPDATE inventario 
       SET stock = stock - $1
       WHERE idproducto = $2`,
      [cantidadventa, idproducto]
    );

    // Confirmar transacción
    await pool.query('COMMIT');

    res.status(201).json(ventaResult.rows[0]);
  } catch (error) {
    // Revertir transacción en caso de error
    await pool.query('ROLLBACK');
    console.error('Error al crear venta:', error);
    res.status(500).json({ error: 'Error al crear venta' });
  }
};

export const updateVenta = async (req, res) => {
  const { id } = req.params;
  const { cantidadventa, preciototal } = req.body;

  try {
    const result = await pool.query(
      `UPDATE venta 
       SET cantidadventa = COALESCE($1, cantidadventa),
           preciototal = COALESCE($2, preciototal)
       WHERE idventa = $3
       RETURNING *`,
      [cantidadventa, preciototal, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    res.status(500).json({ error: 'Error al actualizar venta' });
  }
};

export const deleteVenta = async (req, res) => {
  const { id } = req.params;

  try {
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
    res.status(500).json({ error: 'Error al eliminar venta' });
  }
};

export const deleteAllVentas = async (req, res) => {
  try {
    // Iniciamos una transacción
    await pool.query('BEGIN');

    // Primero eliminamos todas las ventas
    await pool.query('DELETE FROM venta');

    // Reiniciamos la secuencia
    await pool.query('ALTER SEQUENCE venta_idventa_seq RESTART WITH 1');

    // Confirmamos la transacción
    await pool.query('COMMIT');

    res.json({ message: 'Historial de ventas eliminado correctamente' });
  } catch (error) {
    // Si hay error, revertimos la transacción
    await pool.query('ROLLBACK');
    console.error('Error al eliminar historial de ventas:', error);
    res.status(500).json({ 
      error: 'Error al eliminar historial de ventas',
      details: error.message 
    });
  }
}; 