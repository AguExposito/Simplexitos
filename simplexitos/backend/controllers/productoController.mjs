import { pool } from '../db/db.mjs';

export const getProductos = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM producto ORDER BY idproducto');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

export const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM producto WHERE idproducto = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

export const createProducto = async (req, res) => {
  const {
    codproducto,
    nombreproducto,
    modeloproducto,
    descripcionproducto,
    estadoproducto,
    demanda = 0,  // Valor por defecto
    stockseguridad = 0  // Valor por defecto
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO producto 
       (codproducto, nombreproducto, modeloproducto, descripcionproducto, demanda, stockseguridad, estadoproducto)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [codproducto, nombreproducto, modeloproducto, descripcionproducto, demanda, stockseguridad, estadoproducto || 'ACTIVO']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto: ' + error.message });
  }
};

export const updateProducto = async (req, res) => {
  const { id } = req.params;
  const {
    codproducto,
    nombreproducto,
    modeloproducto,
    descripcionproducto,
    demanda,
    stockseguridad,
    estadoproducto
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE producto 
       SET codproducto = COALESCE($1, codproducto),
           nombreproducto = COALESCE($2, nombreproducto),
           modeloproducto = COALESCE($3, modeloproducto),
           descripcionproducto = COALESCE($4, descripcionproducto),
           demanda = COALESCE($5, demanda),
           stockseguridad = COALESCE($6, stockseguridad),
           estadoproducto = COALESCE($7, estadoproducto),
           fechamodificacionproducto = CURRENT_DATE
       WHERE idproducto = $8
       RETURNING *`,
      [codproducto, nombreproducto, modeloproducto, descripcionproducto, demanda, stockseguridad, estadoproducto, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

export const deleteProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE producto SET estadoproducto = $1, fechabajaproducto = CURRENT_DATE WHERE idproducto = $2 RETURNING *',
      ['INACTIVO', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};