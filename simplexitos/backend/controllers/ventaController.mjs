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
  const { idproducto, cantidadventa, preciototal } = req.body;

  try {
    // Verificar que el producto existe
    const productoCheck = await pool.query(
      'SELECT * FROM producto WHERE idproducto = $1',
      [idproducto]
    );

    if (productoCheck.rows.length === 0) {
      return res.status(400).json({ error: 'El producto no existe' });
    }

    const result = await pool.query(
      `INSERT INTO venta (idproducto, cantidadventa, preciototal, fechaaltaventa)
       VALUES ($1, $2, $3, CURRENT_DATE)
       RETURNING *`,
      [idproducto, cantidadventa, preciototal]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
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