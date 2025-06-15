import { pool } from '../db/db.mjs';

export const getOrdenesCompra = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT oc.*, i.idproducto, p.nombreproducto 
      FROM orden_compra oc
      JOIN inventario i ON oc.idinventario = i.idinventario
      JOIN producto p ON i.idproducto = p.idproducto
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

export const recibirOrdenCompra = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que la orden existe y está en estado ABIERTA
    const ordenCheck = await pool.query(
      'SELECT * FROM orden_compra WHERE idorden_compra = $1',
      [id]
    );

    if (ordenCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    if (ordenCheck.rows[0].estadoorden !== 'ABIERTA') {
      return res.status(400).json({ error: 'La orden de compra no está en estado ABIERTA' });
    }

    // Actualizar el estado de la orden
    const result = await pool.query(
      `UPDATE orden_compra 
       SET estadoorden = 'RECIBIDA'
       WHERE idorden_compra = $1
       RETURNING *`,
      [id]
    );

    // Actualizar el stock en el inventario
    const orden = result.rows[0];
    await pool.query(
      `UPDATE inventario
       SET stock = stock + $1
       WHERE idinventario = $2`,
      [orden.cantidadsolicitada, orden.idinventario]
    );

    res.json({
      message: 'Orden de compra recibida correctamente',
      data: orden
    });
  } catch (error) {
    console.error('Error al recibir orden de compra:', error);
    res.status(500).json({ error: 'Error al recibir orden de compra' });
  }
};

export const cancelarOrdenCompra = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que la orden existe y no está ya cancelada
    const ordenCheck = await pool.query(
      'SELECT * FROM orden_compra WHERE idorden_compra = $1',
      [id]
    );

    if (ordenCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    if (ordenCheck.rows[0].estadoorden === 'CANCELADA') {
      return res.status(400).json({ error: 'La orden de compra ya está cancelada' });
    }

    // Actualizar el estado de la orden
    const result = await pool.query(
      `UPDATE orden_compra 
       SET estadoorden = 'CANCELADA'
       WHERE idorden_compra = $1
       RETURNING *`,
      [id]
    );

    res.json({
      message: 'Orden de compra cancelada correctamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al cancelar orden de compra:', error);
    res.status(500).json({ error: 'Error al cancelar orden de compra' });
  }
};

export const deleteAllOrdenesCompra = async (req, res) => {
  try {
    // Iniciamos una transacción
    await pool.query('BEGIN');

    // Primero eliminamos todas las órdenes de compra
    await pool.query('DELETE FROM orden_compra');

    // Reiniciamos la secuencia
    await pool.query('ALTER SEQUENCE orden_compra_idorden_compra_seq RESTART WITH 1');

    // Confirmamos la transacción
    await pool.query('COMMIT');

    res.json({ message: 'Historial de órdenes de compra eliminado correctamente' });
  } catch (error) {
    // Si hay error, revertimos la transacción
    await pool.query('ROLLBACK');
    console.error('Error al eliminar historial de órdenes de compra:', error);
    res.status(500).json({ 
      error: 'Error al eliminar historial de órdenes de compra',
      details: error.message 
    });
  }
}; 