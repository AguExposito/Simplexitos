# Reglas de Negocio - Órdenes de Compra

## Estados de las Órdenes de Compra

### 1. PENDIENTE (Estado Inicial)
- **Creación**: Todas las órdenes se crean en estado PENDIENTE, tanto manuales como automáticas
- **Modificación**: Solo se pueden modificar órdenes en estado PENDIENTE
- **Cancelación**: Solo se pueden cancelar órdenes en estado PENDIENTE
- **Transición**: Se puede cambiar a ENVIADA o CANCELADA

### 2. ENVIADA
- **Creación**: Solo se puede cambiar desde PENDIENTE
- **Modificación**: NO se puede modificar
- **Cancelación**: NO se puede cancelar
- **Transición**: Se puede cambiar a FINALIZADA

### 3. FINALIZADA
- **Creación**: Solo se puede cambiar desde ENVIADA
- **Modificación**: NO se puede modificar
- **Cancelación**: NO se puede cancelar
- **Acción**: Al finalizar, se actualiza automáticamente el inventario
- **Verificación**: Para productos LOTE_FIJO, se verifica si el stock supera el punto de pedido

### 4. CANCELADA
- **Creación**: Solo se puede cambiar desde PENDIENTE
- **Modificación**: NO se puede modificar
- **Cancelación**: NO se puede cancelar (ya está cancelada)

## Flujo de Estados

```
PENDIENTE → ENVIADA → FINALIZADA
     ↓
  CANCELADA
```

## Órdenes Automáticas

### Condiciones para Crear Órdenes Automáticas
1. **Modelo de Inventario**: Solo para productos con modelo LOTE_FIJO
2. **Stock**: El stock actual debe estar en o por debajo del punto de pedido
3. **Proveedor**: El producto debe tener un proveedor predeterminado asignado
4. **Órdenes Activas**: No debe haber órdenes activas (PENDIENTE o ENVIADA) para el mismo producto

### Creación Automática
- **Cantidad**: Se usa el lote óptimo calculado
- **Proveedor**: Se usa el proveedor predeterminado
- **Descripción**: Se genera automáticamente indicando el motivo
- **Estado**: Se crea en estado PENDIENTE

## Verificaciones Especiales

### Al Finalizar una Orden (LOTE_FIJO)
- Se verifica si el nuevo stock supera el punto de pedido
- Si no supera, se muestra una advertencia al usuario
- Se sugiere realizar un nuevo pedido

### Validaciones de Estado
- **Modificación**: Solo PENDIENTE
- **Cancelación**: Solo PENDIENTE
- **Envío**: Solo PENDIENTE
- **Finalización**: Solo ENVIADA

## Endpoints Implementados

### Backend
- `POST /orden-compra` - Crear orden (siempre en PENDIENTE)
- `PUT /orden-compra/:id` - Modificar orden (solo PENDIENTE)
- `PUT /orden-compra/:id/recibir` - Enviar orden (PENDIENTE → ENVIADA)
- `PUT /orden-compra/:id/cancelar` - Cancelar orden (PENDIENTE → CANCELADA)
- `PUT /orden-compra/:id/finalizar` - Finalizar orden (ENVIADA → FINALIZADA)
- `POST /orden-compra/automatica/:idinventario` - Crear orden automática

### Frontend
- Botones de acción según el estado de la orden
- Verificación de órdenes activas antes de crear nuevas
- Notificaciones de advertencia cuando el stock no supera el punto de pedido
- Botón de orden automática en inventario para productos con stock bajo

## Casos de Uso

### 1. Creación Manual de Orden
1. Usuario selecciona proveedor/producto
2. Sistema verifica órdenes activas
3. Si hay órdenes activas, pide confirmación
4. Se crea orden en estado PENDIENTE

### 2. Creación Automática de Orden
1. Sistema detecta stock bajo en producto LOTE_FIJO
2. Verifica condiciones (proveedor predeterminado, sin órdenes activas)
3. Crea orden automática con lote óptimo
4. Orden se crea en estado PENDIENTE

### 3. Flujo de Trabajo de Orden
1. **PENDIENTE**: Se puede modificar o cancelar
2. **ENVIADA**: Se envía al proveedor (no se puede modificar)
3. **FINALIZADA**: Se recibe la mercancía y se actualiza inventario

### 4. Verificación de Stock
1. Al finalizar orden, se actualiza el inventario
2. Para LOTE_FIJO, se verifica si supera punto de pedido
3. Si no supera, se muestra advertencia al usuario 