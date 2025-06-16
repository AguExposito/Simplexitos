import { pool } from '../db/db.mjs';

export const getOrdenesCompra = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        oc.*,
        i.idproducto,
        p.nombreproducto,
        pr.nombreprove
      FROM orden_compra oc
      LEFT JOIN inventario i ON oc.idinventario = i.idinventario
      LEFT JOIN producto p ON i.idproducto = p.idproducto
      LEFT JOIN proveedor pr ON oc.idproveedor = pr.idproveedor
      ORDER BY oc.idorden_compra
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener órdenes de compra:', error);
    res.status(500).json({ 
      error: 'Error al obtener órdenes de compra',
      details: error.message 
    });
  }
};

export const getOrdenCompraById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        oc.*,
        i.idproducto,
        p.nombreproducto,
        pr.nombreprove
      FROM orden_compra oc
      JOIN inventario i ON oc.idinventario = i.idinventario
      JOIN producto p ON i.idproducto = p.idproducto
      JOIN proveedor pr ON oc.idproveedor = pr.idproveedor
      WHERE oc.idorden_compra = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener orden de compra:', error);
    res.status(500).json({ error: 'Error al obtener orden de compra: ' + error.message });
  }
};

export const createOrdenCompra = async (req, res) => {
  try {
    const { idinventario, idproveedor, descripcionordendecompra, cantidadsolicitada } = req.body;
    
    const result = await pool.query(`
      INSERT INTO orden_compra 
      (idinventario, idproveedor, descripcionordendecompra, cantidadsolicitada) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `, [idinventario, idproveedor, descripcionordendecompra, cantidadsolicitada]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear orden de compra:', error);
    res.status(500).json({ error: 'Error al crear orden de compra: ' + error.message });
  }
};

export const updateOrdenCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcionordendecompra, estadoorden, cantidadsolicitada } = req.body;
    
    const result = await pool.query(`
      UPDATE orden_compra 
      SET descripcionordendecompra = $1,
          estadoorden = $2,
          cantidadsolicitada = $3
      WHERE idorden_compra = $4
      RETURNING *
    `, [descripcionordendecompra, estadoorden, cantidadsolicitada, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar orden de compra:', error);
    res.status(500).json({ error: 'Error al actualizar orden de compra: ' + error.message });
  }
};

export const deleteOrdenCompra = async (req, res) => {
  try {
    const { id } = req.params;
    
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
    res.status(500).json({ error: 'Error al eliminar orden de compra: ' + error.message });
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
    await pool.query('DELETE FROM orden_compra');
    res.json({ message: 'Todas las órdenes de compra han sido eliminadas' });
  } catch (error) {
    console.error('Error al eliminar todas las órdenes de compra:', error);
    res.status(500).json({ error: 'Error al eliminar todas las órdenes de compra: ' + error.message });
  }
}; 