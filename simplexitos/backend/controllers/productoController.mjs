import { pool } from '../db/db.mjs';

export const getProductos = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM producto ORDER BY idproducto');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos: ' + error.message });
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
    res.status(500).json({ error: 'Error al obtener producto: ' + error.message });
  }
};

export const createProducto = async (req, res) => {
  const {
    codproducto,
    nombreproducto,
    modeloproducto,
    descripcionproducto,
    estadoproducto,
    demanda = 0,
    stockseguridad = 0
  } = req.body;

  try {
    // Iniciar una transacción
    await pool.query('BEGIN');
    
    // Crear producto
    const productoResult = await pool.query(
      `INSERT INTO producto 
       (codproducto, nombreproducto, modeloproducto, descripcionproducto, demanda, stockseguridad, estadoproducto)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [codproducto, nombreproducto, modeloproducto, descripcionproducto, demanda, stockseguridad, estadoproducto || 'ACTIVO']
    );

    const nuevoProducto = productoResult.rows[0];
    
    // Crear un registro de inventario para este producto
    await pool.query(
      `INSERT INTO inventario 
       (idproducto, stock, demanda, puntopedido, stockseguridad, loteoptimo, modeloinventario)
       VALUES ($1, 0, $2, 5, $3, 10, $4)`,
      [nuevoProducto.idproducto, demanda, stockseguridad, 'Lote Fijo']
    );
    
    // Confirmar la transacción
    await pool.query('COMMIT');

    res.status(201).json(nuevoProducto);
  } catch (error) {
    // Revertir la transacción en caso de error
    await pool.query('ROLLBACK');
    
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
    res.status(500).json({ error: 'Error al actualizar producto: ' + error.message });
  }
};

export const deleteProducto = async (req, res) => {
  const { id } = req.params;

  try {
    // Iniciar una transacción
    await pool.query('BEGIN');
    
    // Eliminar registros relacionados en orden para evitar violaciones de clave foránea
    
    // 1. Eliminar registros de venta
    await pool.query('DELETE FROM venta WHERE idproducto = $1', [id]);
    
    // 2. Obtener el ID del inventario asociado con este producto
    const inventarioResult = await pool.query(
      'SELECT idinventario FROM inventario WHERE idproducto = $1',
      [id]
    );
    
    const inventarioIds = inventarioResult.rows.map(row => row.idinventario);
    
    // 3. Eliminar órdenes de compra asociadas a los inventarios
    if (inventarioIds.length > 0) {
      await pool.query(
        `DELETE FROM orden_compra WHERE idinventario IN (${inventarioIds.join(',')})`
      );
    }
    
    // 4. Eliminar el inventario asociado al producto
    await pool.query('DELETE FROM inventario WHERE idproducto = $1', [id]);
    
    // 5. Eliminar relaciones producto-proveedor
    await pool.query('DELETE FROM proveedor_producto WHERE idproducto = $1', [id]);
    
    // 6. Finalmente eliminar el producto
    const result = await pool.query(
      'DELETE FROM producto WHERE idproducto = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      // Revertir transacción si no se encuentra el producto
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Confirmar la transacción
    await pool.query('COMMIT');

    res.json({ message: 'Producto y sus registros relacionados han sido eliminados correctamente' });
  } catch (error) {
    // Revertir la transacción en caso de error
    await pool.query('ROLLBACK');
    
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto: ' + error.message });
  }
};