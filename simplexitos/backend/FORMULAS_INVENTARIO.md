# FÓRMULAS DE INVENTARIO IMPLEMENTADAS (CORREGIDAS)

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

### 5. Estado del Stock (LOTE_FIJO)
```
- Bajo: stock <= stock_seguridad
- Medio: stock_seguridad < stock <= punto_pedido
- Óptimo: stock > punto_pedido
```

### 6. Costos

#### 6.1 Costo de Compra
```
Costo de compra = Demanda anual * Precio unitario
```

#### 6.2 Costo de Pedido
```
Costo de pedido = (Demanda anual / Lote óptimo) * Costo de pedido
```

#### 6.3 Costo de Almacenamiento
```
Costo de almacenamiento = (Lote óptimo / 2) * Costo de almacenamiento
```

#### 6.4 Costo Total (CGI)
```
Costo total = Costo de compra + Costo de pedido + Costo de almacenamiento
```

## MODELO PERIODO_FIJO (FÓRMULAS CORREGIDAS)

### 1. Tiempo Óptimo entre Pedidos (T*)
```
T* = sqrt((2 * S) / (D * H)) * 365
```
**Donde:**
- T* = Tiempo óptimo entre pedidos (en días)
- S = Costo de pedido
- D = Demanda anual
- H = Costo de almacenamiento

### 2. Demanda Diaria
```
Demanda diaria = D / 365
```
**Donde:**
- D = Demanda anual

### 3. Desviación Estándar de la Demanda durante el Periodo de Revisión y Entrega
```
σ = sqrt((tiempo_optimo + tiempo_envio) * DE^2)
```
**Donde:**
- σ = Desviación estándar del período
- tiempo_optimo = Tiempo óptimo entre pedidos
- tiempo_envio = Tiempo de entrega del proveedor
- DE = Desviación estándar de la demanda diaria

### 4. Stock de Seguridad
```
Stock de seguridad = 1.64 * σ
```
**Donde:**
- 1.64 = Factor de seguridad para un nivel de servicio del 95%
- σ = Desviación estándar del período calculada en el paso anterior

### 5. Lote Óptimo (CORREGIDO)
```
Lote óptimo = Demanda diaria * Tiempo óptimo + Stock de seguridad
```
**Donde:**
- Demanda diaria = Demanda anual / 365
- Tiempo óptimo = Tiempo óptimo entre pedidos (en días)
- Stock de seguridad = Calculado en el paso anterior

**NOTA IMPORTANTE:** Esta es la fórmula corregida. La fórmula anterior era incorrecta y causaba valores negativos.

### 6. Punto de Pedido
```
Punto de pedido = Stock de seguridad
```
**Nota:** En el modelo de período fijo, el inventario se revisa periódicamente, por lo que el punto de pedido es igual al stock de seguridad.

### 7. Frecuencia de Reabastecimiento
```
Frecuencia de reabastecimiento = 365 / Tiempo óptimo
```
**Donde:**
- Tiempo óptimo = Tiempo óptimo entre pedidos calculado en el paso 1

### 8. Estado del Stock (PERIODO_FIJO)
```
- Bajo: stock <= stock_seguridad
- Medio: stock_seguridad < stock <= stock_seguridad * 2
- Óptimo: stock > stock_seguridad * 2
```

### 9. Costos
Los costos se calculan con las mismas fórmulas que en el modelo LOTE_FIJO:

#### 9.1 Costo de Compra
```
Costo de compra = Demanda anual * Precio unitario
```

#### 9.2 Costo de Pedido
```
Costo de pedido = (Demanda anual / Lote óptimo) * Costo de pedido
```

#### 9.3 Costo de Almacenamiento
```
Costo de almacenamiento = (Lote óptimo / 2) * Costo de almacenamiento
```

#### 9.4 Costo Total (CGI)
```
Costo total = Costo de compra + Costo de pedido + Costo de almacenamiento
```

## CORRECCIONES IMPLEMENTADAS

### Problemas Identificados y Solucionados:

1. **Fórmula incorrecta del Lote Óptimo en PERIODO_FIJO:**
   - **Antes (INCORRECTO):** `loteoptimo = demandaDiaria * (tiempoOptimo + tiempoenvio) + stockseguridadCalculado`
   - **Después (CORRECTO):** `loteoptimo = demandaDiaria * tiempoOptimo + stockseguridadCalculado`

2. **Cálculo innecesario del inventario actual:**
   - Se eliminó el cálculo del inventario actual que causaba valores negativos
   - El lote óptimo ahora se calcula directamente según las fórmulas de Investigación Operativa

3. **Validaciones agregadas:**
   - Se asegura que el lote óptimo sea al menos 1
   - Se asegura que el stock de seguridad sea no negativo
   - Se asegura que el punto de pedido sea no negativo

4. **Consistencia en todas las funciones:**
   - Se corrigieron las fórmulas en `inventarioController.mjs`
   - Se corrigieron las fórmulas en `productoController.mjs`
   - Se corrigieron las fórmulas en `proveedorProductoController.mjs`

### Nuevo Endpoint para Recalcular:

Se agregó un nuevo endpoint `/inventario/recalcular-corregido` que aplica las fórmulas corregidas a todos los productos.

## IMPLEMENTACIÓN EN EL CÓDIGO

### Campos Requeridos en la Base de Datos

#### Tabla `producto`:
- `demanda` (DOUBLE): Demanda anual del producto
- `desviacionestandardemanda` (INTEGER): Desviación estándar de la demanda diaria
- `costoalmacenamiento` (DOUBLE): Costo de almacenamiento por unidad por año
- `modeloproducto` (ENUM): 'LOTE_FIJO' o 'PERIODO_FIJO'

#### Tabla `proveedor_producto`:
- `costopedido` (DOUBLE): Costo fijo por pedido
- `preciounitario` (DOUBLE): Precio unitario del producto
- `tiempoenvio` (INTEGER): Tiempo de entrega en días

#### Tabla `inventario`:
- `stock` (INTEGER): Stock actual
- `stockseguridad` (INTEGER): Stock de seguridad calculado
- `puntopedido` (INTEGER): Punto de pedido calculado
- `loteoptimo` (INTEGER): Lote óptimo calculado
- `modeloinventario` (ENUM): 'LOTE_FIJO' o 'PERIODO_FIJO'
- `costocompra` (DOUBLE): Costo de compra calculado
- `costopedido` (DOUBLE): Costo de pedido calculado
- `costoalmacenamiento` (DOUBLE): Costo de almacenamiento calculado
- `cgi` (DOUBLE): Costo total calculado

### Cálculos Automáticos

Los siguientes valores se calculan automáticamente y **NO** se pueden asignar manualmente:

1. **Lote óptimo**: Calculado según la fórmula EOQ (LOTE_FIJO) o según las fórmulas corregidas de PERIODO_FIJO
2. **Stock de seguridad**: Calculado con el factor de seguridad del 95%
3. **Punto de pedido**: Calculado basado en la demanda diaria y stock de seguridad (LOTE_FIJO) o igual al stock de seguridad (PERIODO_FIJO)
4. **Costos**: Calculados automáticamente según las fórmulas especificadas
5. **Frecuencia de reabastecimiento**: Calculada automáticamente en PERIODO_FIJO (365 / tiempo óptimo)

### Nivel de Servicio

El sistema utiliza un factor de seguridad de **1.64**, que corresponde a un **nivel de servicio del 95%**. Esto significa que el stock de seguridad cubrirá la demanda en el 95% de los casos.

## DIFERENCIAS ENTRE MODELOS

### LOTE_FIJO (EOQ)
- **Característica principal**: Cantidad fija de pedido
- **Revisión**: Continua (cuando el stock llega al punto de pedido)
- **Punto de pedido**: Demanda diaria * tiempo envío + Stock de seguridad
- **Stock de seguridad**: Basado en tiempo de envío y desviación estándar
- **Estado del stock**:
  - Bajo: stock ≤ stock_seguridad
  - Medio: stock_seguridad < stock ≤ punto_pedido
  - Óptimo: stock > punto_pedido

### PERIODO_FIJO
- **Característica principal**: Tiempo fijo entre pedidos
- **Revisión**: Periódica (cada tiempo óptimo)
- **Punto de pedido**: Igual al stock de seguridad
- **Stock de seguridad**: Basado en desviación del período de revisión y entrega
- **Frecuencia de reabastecimiento**: Calculada automáticamente (365 / tiempo óptimo)
- **Estado del stock**:
  - Bajo: stock ≤ stock_seguridad
  - Medio: stock_seguridad < stock ≤ stock_seguridad * 2
  - Óptimo: stock > stock_seguridad * 2

## CÁLCULO DEL VALOR TOTAL DEL INVENTARIO

El valor total del inventario se calcula sumando el valor de cada producto:

```
Valor total = Σ(stock * precio_unitario)
```

**Donde:**
- stock = Stock actual del producto
- precio_unitario = Precio unitario del proveedor más barato para ese producto

## ESTADÍSTICAS DEL INVENTARIO

### Categorías de Stock
- **Stock Insuficiente**: Productos con estado "Bajo" (stock ≤ stock_seguridad)
- **Stock Suficiente**: Productos con estado "Medio" o "Óptimo" (stock > stock_seguridad)

### Distribución por Modelo
- **Lote Fijo**: Productos con modelo LOTE_FIJO
- **Período Fijo**: Productos con modelo PERIODO_FIJO

## NOTAS IMPORTANTES

1. **Desviación Estándar**: Debe ser ingresada manualmente para cada producto en el formulario de alta/edición de productos.

2. **Cálculos Automáticos**: Los valores de lote óptimo, stock de seguridad y punto de pedido se calculan automáticamente cada vez que se actualiza el inventario.

3. **Validaciones**: El sistema valida que todos los datos necesarios estén presentes antes de realizar los cálculos.

4. **Redondeo**: Los valores de lote óptimo, stock de seguridad y punto de pedido se redondean a números enteros para facilitar su uso práctico.

5. **Frecuencia de Reabastecimiento**: En el modelo PERIODO_FIJO, este valor se calcula automáticamente como 365 / tiempo_optimo.

6. **Estado del Stock**: La lógica para determinar el estado del stock es diferente entre LOTE_FIJO y PERIODO_FIJO debido a las características específicas de cada modelo.

7. **Aplicación de Fórmulas**: Las fórmulas se aplican automáticamente según el modelo seleccionado (LOTE_FIJO o PERIODO_FIJO) en el producto.

8. **Valor Total**: Se calcula usando el precio unitario del proveedor más barato para cada producto, multiplicado por el stock actual.

9. **Fórmulas Corregidas**: Las fórmulas del modelo PERIODO_FIJO han sido corregidas para evitar valores negativos y seguir estrictamente los principios de Investigación Operativa.

10. **Validaciones de Seguridad**: Se han agregado validaciones para asegurar que todos los valores calculados sean no negativos. 