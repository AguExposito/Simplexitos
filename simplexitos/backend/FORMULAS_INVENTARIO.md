# FÓRMULAS DE INVENTARIO IMPLEMENTADAS

## MODELO LOTE_FIJO (EOQ - Economic Order Quantity)

### 1. Lote Óptimo (Q*)
```
Q* = sqrt((2 * D * S) / H)
```
**Donde:**
- Q* = Lote óptimo (cantidad a pedir)
- D = Demanda anual
- S = Costo de pedido (costo fijo por pedido)
- H = Costo de almacenamiento por unidad por año

### 2. Demanda Diaria Promedio
```
Demanda diaria promedio = D / 365
```
**Donde:**
- D = Demanda anual

### 3. Stock de Seguridad
```
Stock de seguridad = 1.64 * sqrt(tiempo_envio) * desviacion_estandar
```
**Donde:**
- 1.64 = Factor de seguridad para un nivel de servicio del 95%
- tiempo_envio = Tiempo de entrega del proveedor en días
- desviacion_estandar = Desviación estándar de la demanda diaria

### 4. Punto de Pedido
```
Punto de pedido = Demanda diaria promedio * tiempo envío + Stock de seguridad
```

### 5. Costos

#### 5.1 Costo de Compra
```
Costo de compra = Demanda anual * Precio unitario
```

#### 5.2 Costo de Pedido
```
Costo de pedido = (Demanda anual / Lote óptimo) * Costo de pedido
```

#### 5.3 Costo de Almacenamiento
```
Costo de almacenamiento = (Lote óptimo / 2) * Costo de almacenamiento
```

#### 5.4 Costo Total (CGI)
```
Costo total = Costo de compra + Costo de pedido + Costo de almacenamiento
```

## MODELO PERIODO_FIJO

### 1. Tiempo Óptimo entre Pedidos (T*)
```
T* = sqrt((2 * S) / (D * H))
```
**Donde:**
- T* = Tiempo óptimo entre pedidos
- S = Costo de pedido
- D = Demanda anual
- H = Costo de almacenamiento

### 2. Lote Óptimo
```
Lote óptimo = Demanda anual * Tiempo óptimo
```

### 3. Demanda Diaria Promedio
```
Demanda diaria promedio = D / 365
```

### 4. Stock de Seguridad
```
Stock de seguridad = 1.64 * sqrt(tiempo_envio) * desviacion_estandar
```

### 5. Punto de Pedido
```
Punto de pedido = Demanda diaria promedio * tiempo envío + Stock de seguridad
```

### 6. Costos
Los costos se calculan con las mismas fórmulas que en el modelo LOTE_FIJO.

## IMPLEMENTACIÓN EN EL CÓDIGO

### Campos Requeridos en la Base de Datos

#### Tabla `producto`:
- `demanda` (DOUBLE): Demanda anual del producto
- `desviacionestandardemanda` (INTEGER): Desviación estándar de la demanda diaria
- `costoalmacenamiento` (DOUBLE): Costo de almacenamiento por unidad por año

#### Tabla `proveedor_producto`:
- `costopedido` (DOUBLE): Costo fijo por pedido
- `preciounitario` (DOUBLE): Precio unitario del producto
- `tiempoenvio` (INTEGER): Tiempo de entrega en días

### Cálculos Automáticos

Los siguientes valores se calculan automáticamente y **NO** se pueden asignar manualmente:

1. **Lote óptimo**: Calculado según la fórmula EOQ
2. **Stock de seguridad**: Calculado con el factor de seguridad del 95%
3. **Punto de pedido**: Calculado basado en la demanda diaria y stock de seguridad
4. **Costos**: Calculados automáticamente según las fórmulas especificadas

### Nivel de Servicio

El sistema utiliza un factor de seguridad de **1.64**, que corresponde a un **nivel de servicio del 95%**. Esto significa que el stock de seguridad cubrirá la demanda en el 95% de los casos.

## NOTAS IMPORTANTES

1. **Desviación Estándar**: Debe ser ingresada manualmente para cada producto en el formulario de alta/edición de productos.

2. **Cálculos Automáticos**: Los valores de lote óptimo, stock de seguridad y punto de pedido se calculan automáticamente cada vez que se actualiza el inventario.

3. **Validaciones**: El sistema valida que todos los datos necesarios estén presentes antes de realizar los cálculos.

4. **Redondeo**: Los valores de lote óptimo, stock de seguridad y punto de pedido se redondean a números enteros para facilitar su uso práctico. 