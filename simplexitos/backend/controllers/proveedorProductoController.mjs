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
      tiempoenvio
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
      (idproducto, idproveedor, costopedido, costocompra, preciounitario, tiempoenvio) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `, [idproducto, idproveedor, costopedido, costocompra, preciounitario, tiempoenvio]);
    
    // Recalcular inventario automáticamente
    await recalcularInventarioProducto(idproducto);
    
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
      tiempoenvio
    } = req.body;
    
    // Obtener el idproducto antes de actualizar
    const getProductoResult = await pool.query(
      'SELECT idproducto FROM proveedor_producto WHERE idproveedorproducto = $1',
      [id]
    );
    
    if (getProductoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Relación no encontrada' });
    }
    
    const idproducto = getProductoResult.rows[0].idproducto;
    
    const result = await pool.query(`
      UPDATE proveedor_producto 
      SET costopedido = COALESCE($1, costopedido),
          costocompra = COALESCE($2, costocompra),
          preciounitario = COALESCE($3, preciounitario),
          tiempoenvio = COALESCE($4, tiempoenvio)
      WHERE idproveedorproducto = $5
      RETURNING *
    `, [costopedido, costocompra, preciounitario, tiempoenvio, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relación no encontrada' });
    }
    
    // Recalcular inventario automáticamente
    await recalcularInventarioProducto(idproducto);
    
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
    
    // Obtener el idproducto antes de eliminar
    const getProductoResult = await pool.query(
      'SELECT idproducto FROM proveedor_producto WHERE idproveedorproducto = $1',
      [id]
    );
    
    if (getProductoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Relación no encontrada' });
    }
    
    const idproducto = getProductoResult.rows[0].idproducto;
    
    const result = await pool.query(
      'DELETE FROM proveedor_producto WHERE idproveedorproducto = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relación no encontrada' });
    }
    
    // Recalcular inventario automáticamente
    await recalcularInventarioProducto(idproducto);
    
    res.json({ message: 'Relación eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar relación:', error);
    res.status(500).json({ error: 'Error al eliminar relación: ' + error.message });
  }
};

// Obtener todos los productos de un proveedor
export const getProductosByProveedor = async (req, res) => {
  try {
    const { idproveedor } = req.params;
    const result = await pool.query(`
      SELECT pp.*, p.nombreproducto, p.codproducto
      FROM proveedor_producto pp
      JOIN producto p ON pp.idproducto = p.idproducto
      WHERE pp.idproveedor = $1
    `, [idproveedor]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos del proveedor:', error);
    res.status(500).json({ error: 'Error al obtener productos: ' + error.message });
  }
};

// Función para recalcular inventario después de modificar relación proveedor-producto
async function recalcularInventarioProducto(idproducto) {
  try {
    // Obtener datos del producto y su mejor proveedor
    const result = await pool.query(`
      SELECT 
        p.idproducto,
        p.demanda,
        p.costoalmacenamiento,
        p.desviacionestandardemanda,
        p.modeloproducto,
        pp.costopedido,
        pp.preciounitario,
        pp.tiempoenvio
      FROM producto p
      LEFT JOIN proveedor_producto pp ON p.idproducto = pp.idproducto
      WHERE p.idproducto = $1
      ORDER BY pp.preciounitario ASC
      LIMIT 1
    `, [idproducto]);

    if (result.rows.length === 0) {
      console.log('No se encontró información para recalcular inventario del producto:', idproducto);
      return;
    }

    const { 
      demanda, 
      costopedido, 
      costoalmacenamiento, 
      preciounitario, 
      desviacionestandardemanda, 
      tiempoenvio,
      modeloproducto 
    } = result.rows[0];

    if (!demanda || !costopedido || !costoalmacenamiento || !preciounitario || !desviacionestandardemanda || !tiempoenvio) {
      console.log('Faltan datos para recalcular inventario del producto:', idproducto);
      return;
    }

    let loteoptimo = 1;
    let stockseguridadCalculado = 0;
    let puntopedidoCalculado = 0;
    let costos = {
      costoCompra: 0,
      costoPedido: 0,
      costoAlmacenamiento: 0,
      costoTotal: 0
    };

    if (modeloproducto === 'LOTE_FIJO') {
      // FÓRMULAS PARA MODELO LOTE_FIJO
      loteoptimo = Math.sqrt((2 * demanda * costopedido) / costoalmacenamiento);
      const demandaDiariaPromedio = demanda / 365;
      stockseguridadCalculado = 1.64 * Math.sqrt(tiempoenvio) * desviacionestandardemanda;
      puntopedidoCalculado = demandaDiariaPromedio * tiempoenvio + stockseguridadCalculado;
      
      costos.costoCompra = demanda * preciounitario;
      costos.costoPedido = (demanda / loteoptimo) * costopedido;
      costos.costoAlmacenamiento = (loteoptimo / 2) * costoalmacenamiento;
      costos.costoTotal = costos.costoCompra + costos.costoPedido + costos.costoAlmacenamiento;
      
    } else if (modeloproducto === 'PERIODO_FIJO') {
      // FÓRMULAS PARA MODELO PERIODO_FIJO
      const tiempoOptimo = Math.sqrt((2 * costopedido) / (demanda * costoalmacenamiento));
      const desviacionPeriodo = Math.sqrt((tiempoOptimo + tiempoenvio) * desviacionestandardemanda * desviacionestandardemanda);
      stockseguridadCalculado = 1.64 * desviacionPeriodo;
      loteoptimo = demanda * tiempoOptimo + stockseguridadCalculado;
      puntopedidoCalculado = stockseguridadCalculado;
      
      costos.costoCompra = demanda * preciounitario;
      costos.costoPedido = (demanda / loteoptimo) * costopedido;
      costos.costoAlmacenamiento = (loteoptimo / 2) * costoalmacenamiento;
      costos.costoTotal = costos.costoCompra + costos.costoPedido + costos.costoAlmacenamiento;
    }

    // Actualizar el inventario
    await pool.query(`
      UPDATE inventario 
      SET loteoptimo = $1,
          stockseguridad = $2,
          puntopedido = $3,
          costocompra = $4,
          costopedido = $5,
          costoalmacenamiento = $6,
          cgi = $7
      WHERE idproducto = $8
    `, [
      Math.round(loteoptimo),
      Math.round(stockseguridadCalculado),
      Math.round(puntopedidoCalculado),
      costos.costoCompra,
      costos.costoPedido,
      costos.costoAlmacenamiento,
      costos.costoTotal,
      idproducto
    ]);

    console.log('Inventario recalculado automáticamente para producto:', idproducto);
  } catch (error) {
    console.error('Error al recalcular inventario del producto:', idproducto, error);
  }
} 