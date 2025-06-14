import { pool } from '../db/db.mjs';

export const getOrdenesCompra = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT oc.*, 
             i.idproducto,
             p.nombreprove as nombre_proveedor,
             pr.nombreproducto as nombre_producto
      FROM orden_compra oc
      LEFT JOIN inventario i ON oc.idinventario = i.idinventario
      LEFT JOIN proveedor p ON oc.idproveedor = p.idproveedor
      LEFT JOIN producto pr ON i.idproducto = pr.idproducto
      ORDER BY oc.fechaorden DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener órdenes de compra:', error);
    res.status(500).json({ error: 'Error al obtener órdenes de compra' });
  }
};

export const getOrdenCompraById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT oc.*, 
             i.idproducto,
             p.nombreprove as nombre_proveedor,
             pr.nombreproducto as nombre_producto
      FROM orden_compra oc
      LEFT JOIN inventario i ON oc.idinventario = i.idinventario
      LEFT JOIN proveedor p ON oc.idproveedor = p.idproveedor
      LEFT JOIN producto pr ON i.idproducto = pr.idproducto
      WHERE oc.idorden_compra = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener orden de compra:', error);
    res.status(500).json({ error: 'Error al obtener orden de compra' });
  }
};

export const createOrdenCompra = async (req, res) => {
  const { idinventario, idproveedor, descripcionordendecompra, cantidadsolicitada } = req.body;

  try {
    // Verificar que el inventario existe
    const inventarioCheck = await pool.query(
      'SELECT * FROM inventario WHERE idinventario = $1',
      [idinventario]
    );

    if (inventarioCheck.rows.length === 0) {
      return res.status(400).json({ error: 'El producto del inventario no existe' });
    }

    // Verificar que el proveedor existe
    const proveedorCheck = await pool.query(
      'SELECT * FROM proveedor WHERE idproveedor = $1',
      [idproveedor]
    );

    if (proveedorCheck.rows.length === 0) {
      return res.status(400).json({ error: 'El proveedor no existe' });
    }

    const result = await pool.query(
      `INSERT INTO orden_compra 
       (idinventario, idproveedor, descripcionordendecompra, cantidadsolicitada, estadoorden, fechaorden)
       VALUES ($1, $2, $3, $4, 'ABIERTA', CURRENT_DATE)
       RETURNING *`,
      [idinventario, idproveedor, descripcionordendecompra, cantidadsolicitada]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear orden de compra:', error);
    res.status(500).json({ error: 'Error al crear orden de compra' });
  }
};

export const updateOrdenCompra = async (req, res) => {
  const { id } = req.params;
  const { estadoorden, descripcionordendecompra, cantidadsolicitada } = req.body;

  try {
    const result = await pool.query(
      `UPDATE orden_compra 
       SET estadoorden = COALESCE($1, estadoorden),
           descripcionordendecompra = COALESCE($2, descripcionordendecompra),
           cantidadsolicitada = COALESCE($3, cantidadsolicitada)
       WHERE idorden_compra = $4
       RETURNING *`,
      [estadoorden, descripcionordendecompra, cantidadsolicitada, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar orden de compra:', error);
    res.status(500).json({ error: 'Error al actualizar orden de compra' });
  }
};

export const deleteOrdenCompra = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM orden_compra WHERE idorden_compra = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    res.json({ message: 'Orden de compra eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar orden de compra:', error);
    res.status(500).json({ error: 'Error al eliminar orden de compra' });
  }
}; 