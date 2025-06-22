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
      (idinventario, idproveedor, descripcionordendecompra, cantidadsolicitada, estadoorden) 
      VALUES ($1, $2, $3, $4, 'PENDIENTE') 
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
    const { descripcionordendecompra, cantidadsolicitada } = req.body;
    
    // Verificar que la orden existe y está en estado PENDIENTE
    const ordenCheck = await pool.query(
      'SELECT * FROM orden_compra WHERE idorden_compra = $1',
      [id]
    );

    if (ordenCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    if (ordenCheck.rows[0].estadoorden !== 'PENDIENTE') {
      return res.status(400).json({ 
        error: 'No se puede modificar la orden de compra',
        details: 'Solo se pueden modificar órdenes en estado PENDIENTE'
      });
    }
    
    const result = await pool.query(`
      UPDATE orden_compra 
      SET descripcionordendecompra = COALESCE($1, descripcionordendecompra),
          cantidadsolicitada = COALESCE($2, cantidadsolicitada)
      WHERE idorden_compra = $3
      RETURNING *
    `, [descripcionordendecompra, cantidadsolicitada, id]);
    
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
    // Verificar que la orden existe y está en estado PENDIENTE
    const ordenCheck = await pool.query(
      'SELECT * FROM orden_compra WHERE idorden_compra = $1',
      [id]
    );

    if (ordenCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    if (ordenCheck.rows[0].estadoorden !== 'PENDIENTE') {
      return res.status(400).json({ 
        error: 'No se puede enviar la orden de compra',
        details: 'Solo se pueden enviar órdenes en estado PENDIENTE'
      });
    }

    // Actualizar el estado de la orden a ENVIADA
    const result = await pool.query(
      `UPDATE orden_compra 
       SET estadoorden = 'ENVIADA'
       WHERE idorden_compra = $1
       RETURNING *`,
      [id]
    );

    res.json({
      message: 'Orden de compra enviada correctamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al enviar orden de compra:', error);
    res.status(500).json({ error: 'Error al enviar orden de compra' });
  }
};

export const cancelarOrdenCompra = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que la orden existe y está en estado PENDIENTE
    const ordenCheck = await pool.query(
      'SELECT * FROM orden_compra WHERE idorden_compra = $1',
      [id]
    );

    if (ordenCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    if (ordenCheck.rows[0].estadoorden !== 'PENDIENTE') {
      return res.status(400).json({ 
        error: 'No se puede cancelar la orden de compra',
        details: 'Solo se pueden cancelar órdenes en estado PENDIENTE'
      });
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
    const result = await pool.query('DELETE FROM orden_compra RETURNING *');
    res.json({ 
      message: 'Todas las órdenes de compra han sido eliminadas',
      count: result.rows.length 
    });
  } catch (error) {
    console.error('Error al eliminar todas las órdenes de compra:', error);
    res.status(500).json({ error: 'Error al eliminar todas las órdenes de compra: ' + error.message });
  }
};

// Verificar órdenes activas para un producto específico
export const getOrdenesActivas = async (req, res) => {
  try {
    const { idinventario } = req.params;
    
    const result = await pool.query(`
      SELECT 
        oc.idorden_compra,
        oc.cantidadsolicitada,
        oc.estadoorden,
        oc.fechaorden,
        oc.descripcionordendecompra,
        p.nombreprove
      FROM orden_compra oc
      JOIN inventario i ON oc.idinventario = i.idinventario
      JOIN proveedor p ON oc.idproveedor = p.idproveedor
      WHERE oc.idinventario = $1 
      AND oc.estadoorden IN ('PENDIENTE', 'ENVIADA')
      ORDER BY oc.fechaorden DESC
    `, [idinventario]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al verificar órdenes activas:', error);
    res.status(500).json({ 
      error: 'Error al verificar órdenes activas',
      details: error.message 
    });
  }
};

export const finalizarOrdenCompra = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que la orden existe y está en estado ENVIADA
    const ordenCheck = await pool.query(`
      SELECT 
        oc.*,
        i.stock,
        i.puntopedido,
        p.modeloproducto,
        p.nombreproducto
      FROM orden_compra oc
      JOIN inventario i ON oc.idinventario = i.idinventario
      JOIN producto p ON i.idproducto = p.idproducto
      WHERE oc.idorden_compra = $1
    `, [id]);

    if (ordenCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Orden de compra no encontrada' });
    }

    const orden = ordenCheck.rows[0];

    if (orden.estadoorden !== 'ENVIADA') {
      return res.status(400).json({ 
        error: 'No se puede finalizar la orden de compra',
        details: 'Solo se pueden finalizar órdenes en estado ENVIADA'
      });
    }

    // Actualizar el stock en el inventario
    const nuevoStock = orden.stock + orden.cantidadsolicitada;
    await pool.query(
      `UPDATE inventario
       SET stock = $1
       WHERE idinventario = $2`,
      [nuevoStock, orden.idinventario]
    );

    // Actualizar el estado de la orden a FINALIZADA
    const result = await pool.query(
      `UPDATE orden_compra 
       SET estadoorden = 'FINALIZADA'
       WHERE idorden_compra = $1
       RETURNING *`,
      [id]
    );

    // Verificar si con la nueva cantidad el stock supera el punto de pedido (solo para LOTE_FIJO)
    let advertencia = null;
    if (orden.modeloproducto === 'LOTE_FIJO' && nuevoStock <= orden.puntopedido) {
      advertencia = {
        tipo: 'stock_insuficiente',
        mensaje: `El stock actual (${nuevoStock}) no supera el punto de pedido (${orden.puntopedido}). Considere realizar un nuevo pedido.`,
        stockActual: nuevoStock,
        puntoPedido: orden.puntopedido
      };
    }

    res.json({
      message: 'Orden de compra finalizada correctamente',
      data: result.rows[0],
      nuevoStock: nuevoStock,
      advertencia: advertencia
    });
  } catch (error) {
    console.error('Error al finalizar orden de compra:', error);
    res.status(500).json({ error: 'Error al finalizar orden de compra' });
  }
};

// Función para crear órdenes automáticas cuando el stock llega al punto de pedido
export const crearOrdenAutomatica = async (req, res) => {
  try {
    const { idinventario } = req.params;
    
    // Verificar que el inventario existe y obtener información del producto
    const inventarioCheck = await pool.query(`
      SELECT 
        i.*,
        p.modeloproducto,
        p.nombreproducto,
        pp.idproveedor,
        pp.preciounitario,
        pr.nombreprove
      FROM inventario i
      JOIN producto p ON i.idproducto = p.idproducto
      LEFT JOIN proveedor_producto pp ON i.idproducto = pp.idproducto
      LEFT JOIN proveedor pr ON pp.idproveedor = pr.idproveedor
      WHERE i.idinventario = $1
      AND pp.proveedor_predeterminado = TRUE
      LIMIT 1
    `, [idinventario]);

    if (inventarioCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No se puede crear orden automática',
        details: 'Producto no encontrado o sin proveedor predeterminado'
      });
    }

    const inventario = inventarioCheck.rows[0];

    // Solo crear orden automática para modelo LOTE_FIJO
    if (inventario.modeloproducto !== 'LOTE_FIJO') {
      return res.status(400).json({ 
        error: 'No se puede crear orden automática',
        details: 'Solo se crean órdenes automáticas para productos con modelo LOTE_FIJO'
      });
    }

    // Verificar si el stock está en o por debajo del punto de pedido
    if (inventario.stock > inventario.puntopedido) {
      return res.status(400).json({ 
        error: 'No se puede crear orden automática',
        details: 'El stock actual no ha llegado al punto de pedido'
      });
    }

    // Verificar si ya hay órdenes activas para este producto
    const ordenesActivas = await pool.query(`
      SELECT COUNT(*) as total
      FROM orden_compra oc
      WHERE oc.idinventario = $1 
      AND oc.estadoorden IN ('PENDIENTE', 'ENVIADA')
    `, [idinventario]);

    if (parseInt(ordenesActivas.rows[0].total) > 0) {
      return res.status(400).json({ 
        error: 'No se puede crear orden automática',
        details: 'Ya existen órdenes activas para este producto'
      });
    }

    // Crear la orden automática
    const result = await pool.query(`
      INSERT INTO orden_compra 
      (idinventario, idproveedor, descripcionordendecompra, cantidadsolicitada, estadoorden) 
      VALUES ($1, $2, $3, $4, 'PENDIENTE') 
      RETURNING *
    `, [
      idinventario, 
      inventario.idproveedor, 
      `Orden automática - Stock bajo (${inventario.stock}/${inventario.puntopedido})`,
      inventario.loteoptimo
    ]);

    res.status(201).json({
      message: 'Orden automática creada correctamente',
      data: result.rows[0],
      motivo: `Stock actual (${inventario.stock}) en o por debajo del punto de pedido (${inventario.puntopedido})`
    });
  } catch (error) {
    console.error('Error al crear orden automática:', error);
    res.status(500).json({ 
      error: 'Error al crear orden automática',
      details: error.message 
    });
  }
}; 