import { pool } from '../db/db.mjs';

export const getProveedores = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM proveedor ORDER BY idproveedor');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
};

export const getProveedorById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM proveedor WHERE idproveedor = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({ error: 'Error al obtener proveedor' });
  }
};

export const createProveedor = async (req, res) => {
  const { nombreprove, cuit, localidad } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO proveedor (nombreprove, cuit, localidad)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nombreprove, cuit, localidad]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
};

export const updateProveedor = async (req, res) => {
  const { id } = req.params;
  const { nombreprove, cuit, localidad } = req.body;

  try {
    const result = await pool.query(
      `UPDATE proveedor 
       SET nombreprove = COALESCE($1, nombreprove),
           cuit = COALESCE($2, cuit),
           localidad = COALESCE($3, localidad)
       WHERE idproveedor = $4
       RETURNING *`,
      [nombreprove, cuit, localidad, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
};

export const deleteProveedor = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM proveedor WHERE idproveedor = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
}; 