# Análisis Profundo: Clustering y Forecasting con Estacionalidad

## 📊 Análisis de Campos Disponibles en la Base de Datos

### Estructura de Datos Identificada

#### **Tabla: `sell_in`** (Ventas a distribuidores)
- **Temporales:** `fecha`, `temp`, `mes`, `año`, `temp_code`
- **Geográficas/Operativas:** `cuenta`, `canal`, `sucursal`, `nombre_sucursal`
- **Producto:** `marca_codigo`, `genero_descripcion`, `genero_arreglado`, `categoria_descripcion`, `familia`, `silueta`
- **Ventas:** `unidades`, `ventas`
- **Negocio:** `bu`, `comp_noncomp`

#### **Tabla: `sell_out`** (Ventas a consumidores finales)
- **Temporales:** `fecha`, `temp`, `mes`, `año`, `temp_code`
- **Geográficas/Operativas:** `cuenta`, `canal`, `sucursal`, `nombre_sucursal`
- **Producto:** `codigo_marca`, `genero_desc`, `genero_arreglado`, `categoria`, `familia`, `silueta`
- **Ventas:** `cantidad`, `ventas`, `ventas_moneda_local`
- **Negocio:** `bu`, `comp_noncomp`

#### **Tabla: `inventario`** (Stock disponible)
- **Temporales:** `año`, `mes`, `dia`, `temp_code`
- **Geográficas/Operativas:** `cuenta`, `canal`, `nombre_sucursal`, `store_type`
- **Producto:** `codigo_marca`, `genero_desc`, `genero_arreglado`, `categoria`
- **Inventario:** `existencia`
- **Negocio:** `bu_arreglado`, `comp_nocomp`

---

## 🎯 RECOMENDACIONES PARA CLUSTERING

### **Campos Óptimos para Clustering**

#### **1. Clustering por Perfil de Producto** ⭐⭐⭐⭐⭐
**Objetivo:** Segmentar productos por comportamiento de ventas y características

**Campos Recomendados:**
- `silueta` (identificador único del producto)
- `categoria` / `categoria_descripcion`
- `familia`
- `genero_arreglado`
- **Métricas calculadas:**
  - `ventas_totales` (SUM de ventas)
  - `unidades_totales` (SUM de unidades/cantidad)
  - `ticket_promedio` (ventas / unidades)
  - `frecuencia_ventas` (COUNT de transacciones)
  - `ratio_sellout_sellin` (sell_out / sell_in para cada producto)
  - `rotacion_inventario` (ventas / existencia promedio)

**Justificación:**
- Permite identificar productos estrella, productos de nicho, y productos de bajo rendimiento
- Útil para estrategias de pricing, marketing dirigido, y gestión de inventario
- Los campos categóricos (`categoria`, `familia`, `genero`) proporcionan contexto semántico
- Las métricas numéricas capturan comportamiento de mercado

**K-means con k=4-6 clusters sugeridos:**
- Cluster 1: "Productos Estrella" (alta venta, alta rotación)
- Cluster 2: "Productos Premium" (alta venta, bajo volumen, alto ticket)
- Cluster 3: "Productos Masivos" (alto volumen, bajo ticket)
- Cluster 4: "Productos Lentos" (baja venta, baja rotación)
- Cluster 5: "Productos Estacionales" (ventas concentradas en períodos específicos)
- Cluster 6: "Productos Emergentes" (crecimiento reciente)

---

#### **2. Clustering por Perfil de Sucursal** ⭐⭐⭐⭐⭐
**Objetivo:** Segmentar sucursales por performance y características operativas

**Campos Recomendados:**
- `nombre_sucursal`
- `canal`
- `cuenta`
- `store_type` (si disponible)
- **Métricas calculadas:**
  - `ventas_totales_sucursal` (SUM de ventas por sucursal)
  - `unidades_totales_sucursal` (SUM de unidades)
  - `ticket_promedio_sucursal`
  - `diversidad_productos` (COUNT DISTINCT de siluetas)
  - `ratio_sellout_sellin_sucursal`
  - `inventario_promedio` (AVG de existencia)
  - `rotacion_sucursal` (ventas / inventario)
  - `estacionalidad` (variabilidad de ventas por mes)

**Justificación:**
- Identifica sucursales de alto rendimiento vs. bajo rendimiento
- Permite replicar mejores prácticas de sucursales exitosas
- Útil para asignación de recursos y estrategias de expansión
- El campo `canal` puede revelar diferencias entre tipos de puntos de venta

**K-means con k=3-5 clusters sugeridos:**
- Cluster 1: "Sucursales Premium" (alto ticket, alta rotación)
- Cluster 2: "Sucursales Masivas" (alto volumen, bajo ticket)
- Cluster 3: "Sucursales Estables" (rendimiento medio consistente)
- Cluster 4: "Sucursales Oportunidad" (bajo rendimiento, potencial de mejora)
- Cluster 5: "Sucursales Estacionales" (picos en temporadas específicas)

---

#### **3. Clustering por Perfil Temporal/Estacional** ⭐⭐⭐⭐
**Objetivo:** Identificar patrones estacionales y temporales

**Campos Recomendados:**
- `mes` (1-12)
- `año`
- `temp` / `temp_code` (temporada: Otoño-Invierno, Primavera-Verano)
- **Métricas calculadas:**
  - `ventas_mes` (SUM de ventas por mes)
  - `unidades_mes` (SUM de unidades)
  - `ratio_sellout_sellin_mes`
  - `crecimiento_mensual` (variación % vs mes anterior)
  - `inventario_promedio_mes`
  - `diversidad_productos_mes` (COUNT DISTINCT siluetas)

**Justificación:**
- Identifica meses/temporadas de alto y bajo rendimiento
- Útil para planificación de inventario y campañas promocionales
- El campo `temp` es especialmente valioso para calzado (estacionalidad fuerte)
- Permite anticipar picos y valles de demanda

**K-means con k=4 clusters sugeridos:**
- Cluster 1: "Temporada Alta" (meses de máximo rendimiento)
- Cluster 2: "Temporada Media" (rendimiento estable)
- Cluster 3: "Temporada Baja" (meses de menor demanda)
- Cluster 4: "Temporadas Especiales" (eventos, promociones, lanzamientos)

---

#### **4. Clustering por Perfil de Cliente/Cuenta** ⭐⭐⭐⭐
**Objetivo:** Segmentar cuentas por comportamiento de compra

**Campos Recomendados:**
- `cuenta`
- `canal`
- **Métricas calculadas:**
  - `ventas_totales_cuenta` (SUM de ventas por cuenta)
  - `frecuencia_compras` (COUNT de transacciones)
  - `ticket_promedio_cuenta`
  - `diversidad_productos_cuenta` (COUNT DISTINCT siluetas)
  - `lealtad_temporal` (meses activos)
  - `ratio_sellout_sellin_cuenta` (eficiencia de venta del cliente)

**Justificación:**
- Identifica clientes VIP, clientes masivos, y clientes ocasionales
- Útil para estrategias de CRM y programas de lealtad
- El campo `canal` diferencia entre tipos de clientes (retail, online, mayorista, etc.)

---

#### **5. Clustering Híbrido Multi-Dimensional** ⭐⭐⭐⭐⭐
**Objetivo:** Segmentación completa considerando producto + sucursal + temporal

**Campos Recomendados (combinación):**
- `silueta` + `nombre_sucursal` + `mes` (clave compuesta)
- `categoria` + `canal` + `temp`
- **Métricas calculadas:**
  - `ventas_combinadas` (ventas por producto-sucursal-mes)
  - `rotacion_combinada`
  - `tendencia_crecimiento` (tendencia de ventas en últimos 3 meses)
  - `estacionalidad_producto_sucursal` (variabilidad por mes)

**Justificación:**
- Proporciona la visión más completa del negocio
- Identifica combinaciones exitosas (producto X en sucursal Y en mes Z)
- Útil para optimización de surtido por sucursal
- Permite estrategias personalizadas por ubicación y temporada

**K-means con k=6-8 clusters sugeridos:**
- Cluster 1: "Combinaciones Óptimas" (alto rendimiento en todos los aspectos)
- Cluster 2: "Oportunidades de Expansión" (producto exitoso en pocas sucursales)
- Cluster 3: "Productos con Potencial" (bajo rendimiento pero en crecimiento)
- Cluster 4: "Desajustes de Inventario" (alta demanda, bajo stock)
- Cluster 5: "Productos Obsoletos" (bajo rendimiento, sin crecimiento)
- Cluster 6: "Estacionalidad Específica" (alto rendimiento en temporadas específicas)

---

### **Técnicas de Clustering Recomendadas**

1. **K-Means** (actual) - ✅ Buena para datos numéricos normalizados
2. **DBSCAN** - ⭐ Recomendado para detectar outliers y clusters de forma irregular
3. **Hierarchical Clustering** - Útil para entender jerarquías (ej: categoría > familia > silueta)
4. **K-Means++** - Mejora de K-Means con inicialización inteligente

---

## 🔮 RECOMENDACIONES PARA FORECASTING CON ESTACIONALIDAD

### **Contexto del Problema**
Las ventas de calzado tienen **estacionalidad fuerte** debido a:
- Cambios de temporada (Otoño-Invierno vs. Primavera-Verano)
- Eventos deportivos y culturales
- Días festivos y promociones
- Lanzamientos de productos
- Factores climáticos

### **Técnicas de ML Recomendadas (Ordenadas por Prioridad)**

---

#### **1. Prophet (Facebook) - ⭐⭐⭐⭐⭐ RECOMENDACIÓN PRINCIPAL**

**¿Por qué Prophet?**
- ✅ **Diseñado específicamente para series temporales con estacionalidad**
- ✅ Maneja automáticamente estacionalidad diaria, semanal, mensual y anual
- ✅ Robustez ante outliers y datos faltantes
- ✅ Incluye componentes de tendencia, estacionalidad y días festivos
- ✅ Fácil de interpretar y ajustar
- ✅ Excelente para datos de retail con patrones estacionales

**Implementación:**
```javascript
// Pseudocódigo conceptual
const prophet = new Prophet({
  yearly_seasonality: true,    // Estacionalidad anual
  weekly_seasonality: true,    // Patrones semanales
  daily_seasonality: false,    // No aplica para datos mensuales
  seasonality_mode: 'multiplicative', // Para calzado (estacionalidad multiplicativa)
  holidays: holidays,          // Días festivos y eventos
  changepoint_prior_scale: 0.05 // Sensibilidad a cambios de tendencia
});

// Agregar regresores externos
prophet.add_regressor('temp_code');      // Temporada (Otoño-Invierno, etc.)
prophet.add_regressor('inventario');     // Stock disponible
prophet.add_regressor('promociones');    // Campañas activas
```

**Campos a utilizar:**
- `fecha` (serie temporal principal)
- `ventas` (variable objetivo)
- `temp` / `temp_code` (regresor estacional)
- `mes` (para estacionalidad mensual)
- `inventario` (regresor externo - stock disponible)
- `promociones` (si disponible, como regresor binario)

**Ventajas:**
- Predicciones con intervalos de confianza
- Descomposición automática (tendencia + estacionalidad + residual)
- Manejo de múltiples estacionalidades simultáneas

**Desventajas:**
- Requiere librería externa (Python: `prophet`, JavaScript: `prophet-node` o implementación propia)
- Más lento que modelos simples para datasets muy grandes

---

#### **2. SARIMA (Seasonal ARIMA) - ⭐⭐⭐⭐⭐ EXCELENTE ALTERNATIVA**

**¿Por qué SARIMA?**
- ✅ **Estándar de la industria** para series temporales con estacionalidad
- ✅ Modelo estadístico robusto y bien entendido
- ✅ Maneja estacionalidad de forma explícita
- ✅ Proporciona intervalos de confianza
- ✅ Implementaciones disponibles en múltiples lenguajes

**Parámetros SARIMA(p,d,q)(P,D,Q)s:**
- `p, d, q`: Componentes ARIMA no estacionales
- `P, D, Q`: Componentes estacionales
- `s`: Período estacional (12 para datos mensuales con estacionalidad anual)

**Implementación:**
```javascript
// Pseudocódigo conceptual
const sarima = new SARIMA({
  order: [1, 1, 1],           // (p, d, q) - ARIMA base
  seasonal_order: [1, 1, 1, 12], // (P, D, Q, s) - Estacionalidad anual
  trend: 'c'                  // Constante
});

// Para calzado con estacionalidad fuerte:
// - s = 12 (meses)
// - D = 1 (diferenciación estacional)
// - P, Q = 1-2 (componentes estacionales)
```

**Campos a utilizar:**
- `fecha` (serie temporal)
- `ventas` (variable objetivo)
- Puede incluir regresores externos (SARIMAX)

**Ventajas:**
- Modelo estadístico sólido y probado
- Interpretación clara de componentes
- Buen rendimiento con datos estacionales

**Desventajas:**
- Requiere selección manual de parámetros (p, d, q, P, D, Q)
- Puede ser complejo de ajustar
- Asume estacionariedad (requiere diferenciación)

---

#### **3. LSTM (Long Short-Term Memory) - ⭐⭐⭐⭐ PARA PATRONES COMPLEJOS**

**¿Por qué LSTM?**
- ✅ **Red neuronal recurrente** que captura dependencias temporales largas
- ✅ Aprende patrones no lineales complejos
- ✅ Puede manejar múltiples variables de entrada (multivariado)
- ✅ Excelente para capturar interacciones entre variables

**Arquitectura recomendada:**
```javascript
// Pseudocódigo conceptual
const lstm = new LSTM({
  input_features: [
    'ventas_lag_1',      // Ventas del mes anterior
    'ventas_lag_12',     // Ventas del mismo mes año anterior (estacionalidad)
    'inventario',
    'temp_code_encoded', // Temporada codificada
    'mes_sin',           // Mes como seno/coseno (ciclicidad)
    'mes_cos',
    'promedio_movil_3',  // Promedio móvil 3 meses
    'promedio_movil_12'  // Promedio móvil 12 meses
  ],
  hidden_units: [64, 32], // Capas ocultas
  output_units: 1,        // Predicción de ventas
  dropout: 0.2            // Regularización
});
```

**Campos a utilizar:**
- `ventas` (con lags 1, 2, 3, 12)
- `inventario` (regresor externo)
- `temp_code` (codificado como one-hot o embedding)
- `mes` (codificado como seno/coseno para ciclicidad)
- Features derivadas: promedios móviles, tendencias, ratios

**Ventajas:**
- Captura patrones complejos y no lineales
- Puede aprender interacciones entre múltiples variables
- Flexible para agregar más features

**Desventajas:**
- Requiere más datos para entrenar efectivamente
- Computacionalmente más costoso
- Menos interpretable que modelos estadísticos
- Requiere tuning de hiperparámetros

---

#### **4. XGBoost con Features Temporales - ⭐⭐⭐⭐ PARA ENSEMBLES**

**¿Por qué XGBoost?**
- ✅ **Gradient Boosting** robusto y eficiente
- ✅ Maneja bien features categóricas y numéricas
- ✅ Puede capturar interacciones entre variables
- ✅ Excelente para datos tabulares
- ✅ Rápido de entrenar y predecir

**Features temporales a crear:**
```javascript
// Features derivadas para XGBoost
const features = {
  // Lags (valores pasados)
  ventas_lag_1: ventas[t-1],
  ventas_lag_2: ventas[t-2],
  ventas_lag_12: ventas[t-12],  // Estacionalidad anual
  
  // Estadísticas móviles
  media_movil_3: promedio(ventas[t-3:t-1]),
  media_movil_6: promedio(ventas[t-6:t-1]),
  media_movil_12: promedio(ventas[t-12:t-1]),
  std_movil_3: desviacion_estandar(ventas[t-3:t-1]),
  
  // Features temporales
  mes: mes_actual (1-12),
  mes_sin: sin(2π * mes / 12),  // Ciclicidad
  mes_cos: cos(2π * mes / 12),
  año: año_actual,
  temp_code: codigo_temporada,
  
  // Features de producto/sucursal
  categoria: categoria_producto,
  sucursal: nombre_sucursal,
  canal: canal_venta,
  
  // Features de inventario
  inventario_actual: existencia[t],
  ratio_inventario_ventas: existencia[t] / ventas[t-1],
  
  // Features de tendencia
  tendencia_3m: (ventas[t-1] - ventas[t-4]) / ventas[t-4],
  crecimiento_anual: (ventas[t-1] - ventas[t-13]) / ventas[t-13]
};
```

**Ventajas:**
- Muy rápido de entrenar
- Maneja bien features mixtas (numéricas + categóricas)
- Buena interpretabilidad (feature importance)
- Robusto ante outliers

**Desventajas:**
- Requiere ingeniería manual de features
- No captura automáticamente la estacionalidad (hay que crear features)
- Puede sobreajustar si no se regulariza bien

---

#### **5. Ensemble Híbrido (Prophet + XGBoost) - ⭐⭐⭐⭐⭐ MEJOR PRECISIÓN**

**Estrategia:**
1. **Prophet** captura la estacionalidad y tendencia base
2. **XGBoost** aprende los residuales y patrones adicionales
3. **Combinación** de ambas predicciones (promedio ponderado o stacking)

**Implementación:**
```javascript
// Paso 1: Prophet para estacionalidad base
const prophet_forecast = prophet.predict(future_dates);

// Paso 2: Calcular residuales
const residuals = ventas_reales - prophet_forecast.trend - prophet_forecast.seasonal;

// Paso 3: XGBoost para predecir residuales
const xgboost_residuals = xgboost.predict(features);

// Paso 4: Combinar
const final_forecast = prophet_forecast + xgboost_residuals;
```

**Ventajas:**
- Combina lo mejor de ambos mundos
- Mayor precisión que modelos individuales
- Prophet maneja estacionalidad, XGBoost captura patrones complejos

---

### **Recomendación Final para Forecasting**

#### **Fase 1: Implementación Inicial (Rápida)**
1. **Prophet** - Para estacionalidad automática
2. **SARIMA** - Como baseline estadístico

#### **Fase 2: Optimización (Mejora de Precisión)**
3. **XGBoost con Features Temporales** - Para capturar interacciones
4. **Ensemble Híbrido** - Combinar Prophet + XGBoost

#### **Fase 3: Avanzado (Si se requiere máxima precisión)**
5. **LSTM** - Para patrones complejos y multivariados

---

### **Campos Clave para Forecasting**

#### **Variables Objetivo:**
- `ventas` (sell_in + sell_out, o por separado)
- `unidades` / `cantidad`
- `inventario` (para forecast de stock)

#### **Regresores Temporales:**
- `fecha` (serie temporal principal)
- `mes` (1-12, codificado como seno/coseno)
- `año`
- `temp` / `temp_code` (temporada: Otoño-Invierno, Primavera-Verano)

#### **Regresores Externos:**
- `inventario` (stock disponible - afecta ventas)
- `promociones` (si disponible, binario o monto)
- `lanzamientos` (si disponible, binario o fecha)

#### **Features Derivadas (Lags):**
- `ventas_lag_1` (mes anterior)
- `ventas_lag_12` (mismo mes, año anterior - estacionalidad)
- `promedio_movil_3`, `promedio_movil_6`, `promedio_movil_12`
- `tendencia_3m`, `tendencia_6m`

#### **Features Categóricas:**
- `categoria` (one-hot encoding o embedding)
- `genero_arreglado`
- `canal`
- `sucursal` (si se hace forecast por sucursal)

---

### **Métricas de Evaluación para Forecasting**

1. **MAE (Mean Absolute Error)** - Error promedio absoluto
2. **RMSE (Root Mean Squared Error)** - Penaliza errores grandes
3. **MAPE (Mean Absolute Percentage Error)** - Error porcentual
4. **R² (R-squared)** - Bondad de ajuste
5. **Coverage de Intervalos de Confianza** - ¿Los intervalos contienen valores reales?

---

## 📋 Plan de Implementación Sugerido

### **Prioridad 1: Clustering**
1. ✅ Implementar **Clustering por Perfil de Producto** (K-means mejorado)
2. ✅ Agregar **Clustering por Perfil de Sucursal**
3. ⏳ Implementar **Clustering Híbrido Multi-Dimensional** (futuro)

### **Prioridad 2: Forecasting**
1. ✅ Reemplazar regresión lineal actual por **Prophet** o **SARIMA**
2. ✅ Agregar features temporales (lags, promedios móviles)
3. ⏳ Implementar **XGBoost** como alternativa/complemento
4. ⏳ Crear **Ensemble Híbrido** (futuro)

---

## 🛠️ Consideraciones Técnicas

### **Librerías Recomendadas (JavaScript/Node.js)**

**Para Clustering:**
- `ml-matrix` (ya en uso) - ✅
- `ml-kmeans` - Mejora de K-means
- `ml-hierarchical-clustering` - Clustering jerárquico

**Para Forecasting:**
- `prophet-node` - Wrapper de Prophet (requiere Python subprocess)
- `simple-statistics` (ya en uso) - Para SARIMA básico
- `@tensorflow/tfjs-node` - Para LSTM
- `xgboost` (vía Python subprocess) - Para XGBoost

**Alternativa: Implementación propia en JavaScript**
- Prophet: Algoritmo complejo, pero factible
- SARIMA: Más complejo, requiere librerías de álgebra lineal
- LSTM: TensorFlow.js es viable
- XGBoost: Mejor vía Python subprocess

---

## 📊 Resumen Ejecutivo

### **Clustering: Top 3 Recomendaciones**
1. **Clustering por Perfil de Producto** - Máximo valor de negocio
2. **Clustering por Perfil de Sucursal** - Alto impacto operativo
3. **Clustering Híbrido Multi-Dimensional** - Visión completa

### **Forecasting: Top 3 Recomendaciones**
1. **Prophet** - Mejor opción para estacionalidad automática
2. **SARIMA** - Baseline estadístico robusto
3. **Ensemble Híbrido (Prophet + XGBoost)** - Máxima precisión

---

**Documento generado:** $(date)
**Versión:** 1.0
**Autor:** Análisis Técnico - Nike Dashboard

