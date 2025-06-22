-- Script para agregar el campo proveedor_predeterminado a la tabla proveedor_producto
-- Ejecutar este script en la base de datos existente

-- 1. Agregar el campo proveedor_predeterminado
ALTER TABLE proveedor_producto 
ADD COLUMN proveedor_predeterminado BOOLEAN DEFAULT FALSE;

-- 2. Actualizar registros existentes para marcar el proveedor más barato como predeterminado
-- (esto es temporal, el usuario puede cambiar manualmente después)
UPDATE proveedor_producto 
SET proveedor_predeterminado = TRUE 
WHERE idproveedorproducto IN (
    SELECT DISTINCT ON (idproducto) idproveedorproducto
    FROM proveedor_producto
    ORDER BY idproducto, preciounitario ASC
);

-- 3. Verificar que solo hay un proveedor predeterminado por producto
-- (esto es una validación adicional)
SELECT idproducto, COUNT(*) as proveedores_predeterminados
FROM proveedor_producto 
WHERE proveedor_predeterminado = TRUE 
GROUP BY idproducto 
HAVING COUNT(*) > 1; 