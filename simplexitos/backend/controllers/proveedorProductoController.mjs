import { pool } from '../db/db.mjs';

// Obtener todos los proveedores de un producto
export const getProveedoresByProducto = async (req, res) => {
  try {
    const { idproducto } = req.params;
    const result = await pool.query(`
      SELECT pp.*, p.nombreprove, p.cuit
      FROM proveedor_producto pp
      JOIN proveedor p ON pp.idproveedor = p.idproveedor
      WHERE pp.idproducto = $1
    `, [idproducto]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener proveedores del producto:', error);
    res.status(500).json({ error: 'Error al obtener proveedores: ' + error.message });
  }
};

// Crear una relación proveedor-producto
export const createProveedorProducto = async (req, res) => {
  try {
    const { 
      idproducto, 
      idproveedor, 
      costopedido, 
      costocompra, 
      preciounitario, 
      tiempoenvio, 
      costoalmacenamiento, 
      frecuenciadereabastecimiento 
    } = req.body;
    
    // Verificar si ya existe la relación
    const checkResult = await pool.query(
      'SELECT * FROM proveedor_producto WHERE idproducto = $1 AND idproveedor = $2',
      [idproducto, idproveedor]
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'Esta relación producto-proveedor ya existe' });
    }
    
    const result = await pool.query(`
      INSERT INTO proveedor_producto 
      (idproducto, idproveedor, costopedido, costocompra, preciounitario, tiempoenvio, costoalmacenamiento, frecuenciadereabastecimiento) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `, [idproducto, idproveedor, costopedido, costocompra, preciounitario, tiempoenvio, costoalmacenamiento, frecuenciadereabastecimiento]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear relación producto-proveedor:', error);
    res.status(500).json({ error: 'Error al crear relación: ' + error.message });
  }
};

// Actualizar una relación proveedor-producto
export const updateProveedorProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      costopedido, 
      costocompra, 
      preciounitario, 
      tiempoenvio, 
      costoalmacenamiento, 
      frecuenciadereabastecimiento 
    } = req.body;
    
    const result = await pool.query(`
      UPDATE proveedor_producto 
      SET costopedido = COALESCE($1, costopedido),
          costocompra = COALESCE($2, costocompra),
          preciounitario = COALESCE($3, preciounitario),
          tiempoenvio = COALESCE($4, tiempoenvio),
          costoalmacenamiento = COALESCE($5, costoalmacenamiento),
          frecuenciadereabastecimiento = COALESCE($6, frecuenciadereabastecimiento)
      WHERE idproveedorproducto = $7
      RETURNING *
    `, [costopedido, costocompra, preciounitario, tiempoenvio, costoalmacenamiento, frecuenciadereabastecimiento, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relación no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar relación:', error);
    res.status(500).json({ error: 'Error al actualizar relación: ' + error.message });
  }
};

// Eliminar una relación proveedor-producto
export const deleteProveedorProducto = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM proveedor_producto WHERE idproveedorproducto = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relación no encontrada' });
    }
    
    res.json({ message: 'Relación eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar relación:', error);
    res.status(500).json({ error: 'Error al eliminar relación: ' + error.message });
  }
}; 