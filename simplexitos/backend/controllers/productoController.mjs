import { pool } from '../db/db.mjs';

export const getProductos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        COALESCE(i.stock, 0) as stockactual
      FROM producto p
      LEFT JOIN inventario i ON p.idproducto = i.idproducto
      ORDER BY p.idproducto
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    // Si hay error con el JOIN, intentar sin el JOIN
    try {
      const simpleResult = await pool.query(`
        SELECT 
          p.*,
          0 as stockactual
        FROM producto p
        ORDER BY p.idproducto
      `);
      res.json(simpleResult.rows);
    } catch (simpleError) {
      console.error('Error al obtener productos (fallback):', simpleError);
      res.status(500).json({ error: 'Error al obtener productos: ' + simpleError.message });
    }
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
      costoalmacenamiento,
      demanda,
      desviacionestandardemanda,
      estadoproducto 
    } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Primero creamos el producto
      const result = await client.query(`
        INSERT INTO producto 
        (codproducto, nombreproducto, modeloproducto, descripcionproducto, costoalmacenamiento, demanda, desviacionestandardemanda, estadoproducto, stockseguridad) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0) 
        RETURNING *
      `, [codproducto, nombreproducto, modeloproducto, descripcionproducto, costoalmacenamiento, demanda, desviacionestandardemanda, estadoproducto]);

      const idproducto = result.rows[0].idproducto;

      // Crear el inventario con valores por defecto
      await client.query(`
        INSERT INTO inventario 
        (idproducto, stock, puntopedido, stockseguridad, loteoptimo, modeloinventario, costocompra, costopedido, costoalmacenamiento, cgi) 
        VALUES ($1, 0, 0, 0, 1, $2, 0, 0, 0, 0)
      `, [idproducto, modeloproducto]);

      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
      costoalmacenamiento,
      demanda,
      desviacionestandardemanda,
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
            costoalmacenamiento = $5,
            demanda = $6,
            desviacionestandardemanda = $7,
            estadoproducto = $8,
            fechamodificacionproducto = CURRENT_DATE
        WHERE idproducto = $9
        RETURNING *
      `, [codproducto, nombreproducto, modeloproducto, descripcionproducto, costoalmacenamiento, demanda, desviacionestandardemanda, estadoproducto, id]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      // Si el modelo cambió, recalcular automáticamente el inventario
      if (modeloproducto && modeloproducto !== result.rows[0].modeloproducto) {
        console.log('Modelo de producto cambiado, recalculando inventario automáticamente');
        
        try {
          // Importar la función de recálculo automático
          const { recalcularInventarioAutomatico } = await import('./inventarioController.mjs');
          
          // Obtener el inventario asociado al producto
          const inventarioResult = await client.query(`
            SELECT idinventario FROM inventario WHERE idproducto = $1
          `, [id]);
          
          if (inventarioResult.rows.length > 0) {
            // Crear un mock response para la función de recálculo
            const mockRes = {
              json: (data) => {
                console.log('Recálculo automático completado después de cambio de modelo:', data);
              },
              status: (code) => ({
                json: (data) => {
                  if (code !== 200) {
                    console.error('Error en recálculo automático:', data);
                  }
                }
              })
            };
            
            await recalcularInventarioAutomatico({ params: { idinventario: inventarioResult.rows[0].idinventario } }, mockRes);
          }
        } catch (error) {
          console.error('Error al recalcular inventario automáticamente:', error);
        }
      }

      // Verificar si hay datos del proveedor para recalcular automáticamente
      const proveedorCheck = await client.query(`
        SELECT pp.*, p.demanda, p.costoalmacenamiento, p.desviacionestandardemanda
        FROM proveedor_producto pp
        JOIN producto p ON pp.idproducto = p.idproducto
        WHERE pp.idproducto = $1
        ORDER BY pp.preciounitario ASC
        LIMIT 1
      `, [id]);

      // Si hay datos del proveedor, recalcular automáticamente
      if (proveedorCheck.rows.length > 0) {
        const { demanda, costopedido, costoalmacenamiento, preciounitario, desviacionestandardemanda, tiempoenvio } = proveedorCheck.rows[0];

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
          // FÓRMULAS PARA MODELO LOTE_FIJO:
          
          // 1. Lote óptimo (EOQ): Q* = sqrt((2 * D * S) / H)
          loteoptimo = Math.max(1, Math.sqrt((2 * demanda * costopedido) / costoalmacenamiento));
          
          // 2. Demanda diaria promedio = demanda anual / 365 días
          const demandaDiariaPromedio = demanda / 365;
          
          // 3. Stock de seguridad = 1.64 * sqrt(tiempo_envio) * desviacion_estandar
          stockseguridadCalculado = Math.max(0, 1.64 * Math.sqrt(tiempoenvio) * desviacionestandardemanda);
          
          // 4. Punto de pedido = demanda diaria promedio * tiempo envío + stock seguridad
          puntopedidoCalculado = Math.max(0, demandaDiariaPromedio * tiempoenvio + stockseguridadCalculado);
          
          // 5. Costos
          costos.costoCompra = demanda * preciounitario;
          costos.costoPedido = (demanda / loteoptimo) * costopedido;
          costos.costoAlmacenamiento = (loteoptimo / 2) * costoalmacenamiento;
          costos.costoTotal = costos.costoCompra + costos.costoPedido + costos.costoAlmacenamiento;
          
        } else if (modeloproducto === 'PERIODO_FIJO') {
          // FÓRMULAS CORREGIDAS PARA MODELO PERIODO_FIJO según Investigación Operativa:
          
          // 1. Tiempo óptimo entre pedidos (T*) en días
          // T* = sqrt((2 * S) / (D * H)) * 365
          const tiempoOptimo = Math.sqrt((2 * costopedido) / (demanda * costoalmacenamiento)) * 365;
          
          // 2. Demanda diaria
          const demandaDiaria = demanda / 365;
          
          // 3. Desviación estándar del período de revisión + entrega
          // σ = sqrt((tiempo_optimo + tiempo_envio) * DE^2)
          const desviacionPeriodo = desviacionestandardemanda * Math.sqrt(tiempoOptimo + tiempoenvio);
          
          // 4. Stock de seguridad = 1.64 * σ - Inventario actual
          // Obtener el inventario actual del producto
          const inventarioResult = await client.query(`
            SELECT stock FROM inventario WHERE idproducto = $1
          `, [id]);
          const inventarioActual = inventarioResult.rows[0]?.stock || 0;
          stockseguridadCalculado = Math.max(0, 1.64 * desviacionPeriodo - inventarioActual);
          
          // 5. Lote óptimo = Demanda diaria * (Tiempo óptimo + tiempo envío) + Stock de seguridad
          loteoptimo = Math.max(1, demandaDiaria * (tiempoOptimo + tiempoenvio) + stockseguridadCalculado);
          
          // 6. Punto de pedido = Stock de seguridad (en PERIODO_FIJO)
          puntopedidoCalculado = stockseguridadCalculado;
          
          // 7. Frecuencia de reabastecimiento = 365 / Tiempo óptimo
          const frecuenciaReabastecimiento = 365 / tiempoOptimo;
          
          // 8. Costos (mismas fórmulas que LOTE_FIJO)
          costos.costoCompra = demanda * preciounitario;
          costos.costoPedido = (demanda / loteoptimo) * costopedido;
          costos.costoAlmacenamiento = (loteoptimo / 2) * costoalmacenamiento;
          costos.costoTotal = costos.costoCompra + costos.costoPedido + costos.costoAlmacenamiento;
          
          // Validación: asegurar que todos los valores sean positivos
          if (loteoptimo < 1) loteoptimo = 1;
          if (stockseguridadCalculado < 0) stockseguridadCalculado = 0;
          if (puntopedidoCalculado < 0) puntopedidoCalculado = 0;
        }

        // Actualizar el inventario con los valores recalculados automáticamente
        await client.query(`
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
          id
        ]);

        console.log('Valores recalculados automáticamente al actualizar producto:', {
          idproducto: id,
          loteoptimo: Math.round(loteoptimo),
          stockseguridad: Math.round(stockseguridadCalculado),
          puntopedido: Math.round(puntopedidoCalculado),
          costos
        });
      }

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
    
    // VALIDACIONES ANTES DE ELIMINAR
    
    // 1. Verificar si el producto tiene stock
    const stockResult = await pool.query(
      'SELECT stock FROM inventario WHERE idproducto = $1',
      [id]
    );
    
    if (stockResult.rows.length > 0 && stockResult.rows[0].stock > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'No se puede eliminar el producto',
        details: `El producto tiene ${stockResult.rows[0].stock} unidades en stock. Debe vender o transferir todo el stock antes de eliminar el producto.`
      });
    }
    
    // 2. Verificar si hay órdenes de compra pendientes o enviadas
    const ordenesResult = await pool.query(`
      SELECT oc.estadoorden, oc.idorden_compra, p.nombreproducto
      FROM orden_compra oc
      JOIN inventario i ON oc.idinventario = i.idinventario
      JOIN producto p ON i.idproducto = p.idproducto
      WHERE i.idproducto = $1 AND oc.estadoorden IN ('PENDIENTE', 'ENVIADA')
    `, [id]);
    
    if (ordenesResult.rows.length > 0) {
      await pool.query('ROLLBACK');
      const ordenesPendientes = ordenesResult.rows.filter(o => o.estadoorden === 'PENDIENTE');
      const ordenesEnviadas = ordenesResult.rows.filter(o => o.estadoorden === 'ENVIADA');
      
      let details = 'El producto tiene órdenes de compra activas:';
      if (ordenesPendientes.length > 0) {
        details += ` ${ordenesPendientes.length} pendiente(s)`;
      }
      if (ordenesEnviadas.length > 0) {
        details += ` ${ordenesEnviadas.length} enviada(s)`;
      }
      details += '. Debe cancelar todas las órdenes antes de eliminar el producto.';
      
      return res.status(400).json({ 
        error: 'No se puede eliminar el producto',
        details: details
      });
    }
    
    // Si pasa las validaciones, proceder con la eliminación
    
    // Eliminar registros relacionados en orden para evitar violaciones de clave foránea
    
    // 1. Eliminar registros de venta
    await pool.query('DELETE FROM venta WHERE idproducto = $1', [id]);
    
    // 2. Obtener el ID del inventario asociado con este producto
    const inventarioResult = await pool.query(
      'SELECT idinventario FROM inventario WHERE idproducto = $1',
      [id]
    );
    
    const inventarioIds = inventarioResult.rows.map(row => row.idinventario);
    
    // 3. Eliminar órdenes de compra asociadas a los inventarios (solo las canceladas)
    if (inventarioIds.length > 0) {
      await pool.query(
        `DELETE FROM orden_compra WHERE idinventario IN (${inventarioIds.join(',')}) AND estadoorden = 'CANCELADA'`
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

export const checkProductoStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el producto existe
    const productoResult = await pool.query('SELECT * FROM producto WHERE idproducto = $1', [id]);
    
    if (productoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    const producto = productoResult.rows[0];
    
    // Verificar stock
    const stockResult = await pool.query(
      'SELECT stock FROM inventario WHERE idproducto = $1',
      [id]
    );
    
    const stock = stockResult.rows.length > 0 ? stockResult.rows[0].stock : 0;
    
    // Verificar órdenes de compra
    const ordenesResult = await pool.query(`
      SELECT oc.estadoorden, oc.idorden_compra, oc.cantidadsolicitada, oc.fechaorden
      FROM orden_compra oc
      JOIN inventario i ON oc.idinventario = i.idinventario
      WHERE i.idproducto = $1 AND oc.estadoorden IN ('PENDIENTE', 'ENVIADA')
      ORDER BY oc.fechaorden DESC
    `, [id]);
    
    const ordenesPendientes = ordenesResult.rows.filter(o => o.estadoorden === 'PENDIENTE');
    const ordenesEnviadas = ordenesResult.rows.filter(o => o.estadoorden === 'ENVIADA');
    
    const canDelete = stock === 0 && ordenesResult.rows.length === 0;
    
    res.json({
      producto: {
        idproducto: producto.idproducto,
        nombreproducto: producto.nombreproducto,
        codproducto: producto.codproducto
      },
      stock: stock,
      ordenesPendientes: ordenesPendientes,
      ordenesEnviadas: ordenesEnviadas,
      canDelete: canDelete,
      reasons: {
        hasStock: stock > 0,
        hasActiveOrders: ordenesResult.rows.length > 0
      }
    });
  } catch (error) {
    console.error('Error al verificar estado del producto:', error);
    res.status(500).json({ error: 'Error al verificar estado del producto: ' + error.message });
  }
};