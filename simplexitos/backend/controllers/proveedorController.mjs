import { pool } from '../db/db.mjs';

export const getProveedores = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        COUNT(pp.idproducto) as productos_count
      FROM proveedor p
      LEFT JOIN proveedor_producto pp ON p.idproveedor = pp.idproveedor
      GROUP BY p.idproveedor, p.nombreprove, p.cuit, p.localidad, p.fechaaltaproveedor
      ORDER BY p.idproveedor
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error al obtener proveedores: ' + error.message });
  }
};

export const getProveedorById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM proveedor WHERE idproveedor = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({ error: 'Error al obtener proveedor: ' + error.message });
  }
};

export const createProveedor = async (req, res) => {
  try {
    const { nombreprove, cuit, localidad } = req.body;
    
    const result = await pool.query(`
      INSERT INTO proveedor (nombreprove, cuit, localidad) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `, [nombreprove, cuit, localidad]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ error: 'Error al crear proveedor: ' + error.message });
  }
};

export const updateProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreprove, cuit, localidad } = req.body;
    
    const result = await pool.query(`
      UPDATE proveedor 
      SET nombreprove = $1,
          cuit = $2,
          localidad = $3
      WHERE idproveedor = $4
      RETURNING *
    `, [nombreprove, cuit, localidad, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ error: 'Error al actualizar proveedor: ' + error.message });
  }
};

export const deleteProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el proveedor tiene productos asignados
    const productosCheck = await pool.query(
      'SELECT COUNT(*) as count FROM proveedor_producto WHERE idproveedor = $1',
      [id]
    );
    
    if (productosCheck.rows[0].count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el proveedor',
        details: 'El proveedor tiene productos asignados. Debe desvincular todos los productos antes de eliminarlo.'
      });
    }
    
    const result = await pool.query(
      'DELETE FROM proveedor WHERE idproveedor = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    
    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({ error: 'Error al eliminar proveedor: ' + error.message });
  }
};

export const checkProveedorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el proveedor existe
    const proveedorResult = await pool.query('SELECT * FROM proveedor WHERE idproveedor = $1', [id]);
    
    if (proveedorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    
    const proveedor = proveedorResult.rows[0];
    
    // Verificar productos asignados
    const productosResult = await pool.query(`
      SELECT pp.*, p.nombreproducto
      FROM proveedor_producto pp
      JOIN producto p ON pp.idproducto = p.idproducto
      WHERE pp.idproveedor = $1
    `, [id]);
    
    // 2. Verificar si hay órdenes de compra pendientes o enviadas
    const ordenesResult = await pool.query(`
      SELECT oc.estadoorden, oc.idorden_compra, p.nombreproducto
      FROM orden_compra oc
      JOIN inventario i ON oc.idinventario = i.idinventario
      JOIN producto p ON i.idproducto = p.idproducto
      WHERE oc.idproveedor = $1 AND oc.estadoorden IN ('PENDIENTE', 'ENVIADA')
    `, [id]);
    
    if (ordenesResult.rows.length > 0) {
      await pool.query('ROLLBACK');
      const ordenesPendientes = ordenesResult.rows.filter(o => o.estadoorden === 'PENDIENTE');
      const ordenesEnviadas = ordenesResult.rows.filter(o => o.estadoorden === 'ENVIADA');
    }
    
    const canDelete = productosResult.rows.length === 0 && ordenesResult.rows.length === 0;
    
    res.json({
      proveedor: {
        idproveedor: proveedor.idproveedor,
        nombreprove: proveedor.nombreprove,
        cuit: proveedor.cuit
      },
      productosAsignados: productosResult.rows,
      ordenesPendientes: ordenesPendientes,
      ordenesEnviadas: ordenesEnviadas,
      canDelete: canDelete,
      reasons: {
        hasProducts: productosResult.rows.length > 0,
        hasActiveOrders: ordenesResult.rows.length > 0
      }
    });
  } catch (error) {
    console.error('Error al verificar estado del proveedor:', error);
    res.status(500).json({ error: 'Error al verificar estado del proveedor: ' + error.message });
  }
}; 