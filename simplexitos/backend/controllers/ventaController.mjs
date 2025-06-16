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
  try {
    const { idproducto, cantidadventa, preciototal } = req.body;
    
    const result = await pool.query(`
      INSERT INTO venta 
      (idproducto, cantidadventa, preciototal) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `, [idproducto, cantidadventa, preciototal]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({ 
      error: 'Error al crear venta',
      details: error.message 
    });
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