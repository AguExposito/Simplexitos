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
  try {
    const { 
      codproducto, 
      nombreproducto, 
      modeloproducto, 
      descripcionproducto, 
      demanda,
      stockseguridad,
      estadoproducto 
    } = req.body;

    // Primero creamos el producto
    const result = await pool.query(`
      INSERT INTO producto 
      (codproducto, nombreproducto, modeloproducto, descripcionproducto, demanda, stockseguridad, estadoproducto) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `, [codproducto, nombreproducto, modeloproducto, descripcionproducto, demanda, stockseguridad, estadoproducto]);

    // Luego creamos el inventario con el mismo stock de seguridad
    await pool.query(`
      INSERT INTO inventario 
      (idproducto, stock, puntopedido, stockseguridad, loteoptimo) 
      VALUES ($1, 0, 0, $2, 1)
    `, [result.rows[0].idproducto, stockseguridad]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto: ' + error.message });
  }
};

export const updateProducto = async (req, res) => {
  try {
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

    // Validate modeloproducto
    if (modeloproducto && !['LOTE_FIJO', 'PERIODO_FIJO'].includes(modeloproducto)) {
      return res.status(400).json({ 
        error: 'Modelo de producto inválido',
        details: 'El modelo debe ser LOTE_FIJO o PERIODO_FIJO'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Primero actualizamos el producto
      const result = await client.query(`
        UPDATE producto 
        SET codproducto = $1,
            nombreproducto = $2,
            modeloproducto = $3,
            descripcionproducto = $4,
            demanda = $5,
            stockseguridad = $6,
            estadoproducto = $7,
            fechamodificacionproducto = CURRENT_DATE
        WHERE idproducto = $8
        RETURNING *
      `, [codproducto, nombreproducto, modeloproducto, descripcionproducto, demanda, stockseguridad, estadoproducto, id]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      // Si el modelo cambió, actualizamos también el inventario
      if (modeloproducto) {
        await client.query(`
          UPDATE inventario 
          SET modeloinventario = $1
          WHERE idproducto = $2
        `, [modeloproducto, id]);
      }

      // Actualizamos el stock de seguridad en el inventario
      await client.query(`
        UPDATE inventario 
        SET stockseguridad = $1
        WHERE idproducto = $2
      `, [stockseguridad, id]);

      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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