# Propuesta Técnica y Económica
## Dashboard Nike - Northbay International Inc.

---

## 📋 RESUMEN EJECUTIVO

Este documento describe la arquitectura técnica, los algoritmos de Machine Learning utilizados, y la propuesta para el Asistente de IA del Dashboard Nike desarrollado para Northbay International Inc.

---

## 🔬 ALGORITMOS DE MACHINE LEARNING IMPLEMENTADOS

### 1. **REGRESIÓN LINEAL PARA PREDICCIONES** 📈

**Tipo de Algoritmo:** Supervised Learning - Linear Regression

**Descripción:**
Implementamos regresión lineal para predecir ventas futuras basándose en tendencias históricas. Este algoritmo es fundamental para los indicadores predictivos del dashboard.

**Características Técnicas:**
- **Librería:** `simple-statistics` (JavaScript puro)
- **Método:** Regresión lineal por mínimos cuadrados (OLS - Ordinary Least Squares)
- **Fórmula:** `y = mx + b`
  - `m`: Pendiente (tasa de crecimiento mensual)
  - `b`: Intercepto (valor base)
  - `x`: Período temporal (mes)
  - `y`: Valor de ventas predicho

**Métricas de Evaluación:**
- **R² (Coeficiente de Determinación):** Mide qué tan bien el modelo explica la varianza de los datos (0-1, donde 1 es perfecto)
- **RMSE (Root Mean Square Error):** Medida del error promedio del modelo
- **Intervalos de Confianza:** Calculados usando desviación estándar (95% de confianza, z-score = 1.96)

**Outputs del Modelo:**
- Predicciones para 3 meses futuros
- Intervalo superior e inferior (bandas de confianza)
- Nivel de confianza por predicción (0-100%)
- Tendencias históricas vs. tendencia del modelo

**Ventajas:**
- ✅ Interpretable y transparente
- ✅ Rápido y eficiente (cálculo en milisegundos)
- ✅ No requiere GPU ni infraestructura especial
- ✅ Funciona bien con datos temporales con tendencias lineales
- ✅ Costo de cómputo: $0 (local, sin APIs externas)

**Limitaciones:**
- ⚠️ Asume una tendencia lineal (no captura estacionalidad compleja)
- ⚠️ Requiere suficientes datos históricos (mínimo 6-12 meses recomendado)

---

### 2. **K-MEANS CLUSTERING PARA SEGMENTACIÓN** 🎯

**Tipo de Algoritmo:** Unsupervised Learning - Clustering

**Descripción:**
Algoritmo K-means implementado para agrupar períodos temporales con características similares (ventas, demanda, inventario), permitiendo identificar patrones automáticamente.

**Características Técnicas:**
- **Librería:** `ml-matrix` (implementación personalizada)
- **Método:** K-means clustering iterativo
- **Número de Clusters:** 5 (configurable según necesidades)
- **Características (Features):** 4 dimensiones por período:
  1. Ventas Sell In
  2. Ventas Sell Out
  3. Unidades Sell In
  4. Cantidad Sell Out

**Proceso de Clustering:**
1. **Normalización:** Estandarización de características (z-score)
2. **Inicialización:** Centroides aleatorios
3. **Asignación:** Cada período asignado al cluster más cercano (distancia euclidiana)
4. **Actualización:** Recalculo de centroides basado en asignaciones
5. **Convergencia:** Iteración hasta estabilización (máx. 100 iteraciones)

**Tipos de Clusters Identificados:**
- 🟢 **Alto Stock:** Períodos con alta compra y baja venta
- 🔴 **Alta Demanda:** Períodos con baja compra y alta venta
- 🟡 **Pico de Ventas:** Períodos con ventas excepcionalmente altas
- 🔴 **Bajo Rendimiento:** Períodos con rendimiento por debajo del promedio
- ⚪ **Rendimiento Estable:** Períodos con comportamiento normal

**Ventajas:**
- ✅ Identificación automática de patrones sin supervisión
- ✅ Segmentación inteligente para análisis comparativo
- ✅ Detecta anomalías y períodos excepcionales
- ✅ Costo de cómputo: $0 (local)

**Limitaciones:**
- ⚠️ Requiere datos suficientes para identificar patrones (mínimo 12+ meses)
- ⚠️ Sensible a la inicialización (se usa inicialización aleatoria)

---

### 3. **ANÁLISIS ESTADÍSTICO DESCRIPTIVO** 📊

**Algoritmos Complementarios:**

#### **Detección de Anomalías**
- **Método:** Z-score analysis
- **Threshold:** |z-score| > 2 (2 desviaciones estándar)
- **Uso:** Identifica picos y caídas inusuales en los datos

#### **Análisis de Tendencias**
- **Método:** Comparación de promedios móviles (6 meses vs 6 meses anteriores)
- **Métrica:** Cambio porcentual y clasificación (creciente/decreciente/estable)

#### **Análisis de Performance**
- **Método:** Comparación mes a mes y vs. promedio histórico
- **Métricas:** Cambio porcentual, desviación vs. promedio, mejor mes

---

## 🤖 ASISTENTE DE IA - ARQUITECTURA ACTUAL

### **ESTADO ACTUAL: Sistema Basado en Reglas + ML Local**

**Tipo de Implementación:** 
- **Híbrido:** Análisis basado en reglas + Algoritmos de ML local
- **NO utiliza** modelos de lenguaje generativo (LLMs) externos actualmente

**Funcionamiento Actual:**

```
Usuario → Frontend → Backend API (/api/chat)
         ↓
Análisis de Consulta (analyzeQuery)
         ↓
Detección de Intención (palabras clave)
         ↓
Ejecución de Algoritmos ML Locales
         ↓
Generación de Insights y Recomendaciones
         ↓
Respuesta Estructurada + Gráficos
```

**Proceso Detallado:**

1. **Recepción de Consulta:**
   - El usuario escribe una pregunta en lenguaje natural
   - El sistema analiza palabras clave (ej: "ventas", "predicción", "sucursal")

2. **Detección de Intención:**
   - Sistema basado en reglas que detecta el tipo de consulta:
     - "ventas totales" → Análisis de KPIs
     - "evolución" / "tendencia" → Time series analysis
     - "predicción" / "futuro" → Linear regression
     - "clusters" / "patrones" → K-means clustering
     - "sucursal" → Análisis por sucursal
     - "producto" → Análisis por producto

3. **Ejecución de Análisis:**
   - Se ejecutan algoritmos ML locales según la intención
   - Se calculan métricas estadísticas
   - Se detectan anomalías y tendencias

4. **Generación de Insights:**
   - Análisis comparativo automático
   - Detección de anomalías
   - Cálculo de tendencias
   - Generación de recomendaciones basadas en datos

5. **Respuesta:**
   - Texto estructurado con insights
   - Gráficos generados automáticamente
   - Recomendaciones contextuales

**Capacidades Actuales:**
- ✅ Análisis profundo de datos con insights automáticos
- ✅ Detección de anomalías y alertas
- ✅ Recomendaciones basadas en datos
- ✅ Análisis comparativo (mes a mes, trimestral)
- ✅ Generación automática de gráficos
- ✅ **Costo:** $0 (sin APIs externas)

**Limitaciones Actuales:**
- ⚠️ Requiere que el usuario use palabras clave específicas
- ⚠️ No entiende consultas complejas o con contexto
- ⚠️ Respuestas predefinidas (aunque inteligentes)
- ⚠️ No puede responder preguntas abiertas sobre datos

---

## 🚀 PROPUESTA: MEJORA CON IA GENERATIVA

### **OPCIÓN 1: Integración con OpenAI GPT-4** (Recomendada)

**Arquitectura Propuesta:**
```
Usuario → Frontend → Backend API (/api/chat)
         ↓
Pre-procesamiento (extracción de datos relevantes)
         ↓
OpenAI GPT-4 API (con contexto de datos)
         ↓
Análisis ML Local (predicciones, clusters)
         ↓
Post-procesamiento (integración insights)
         ↓
Respuesta Generativa + Gráficos
```

**Implementación:**
- **Modelo:** GPT-4 Turbo o GPT-3.5 Turbo (según necesidad)
- **Enfoque:** Sistema de prompts inteligentes (RAG - Retrieval Augmented Generation)
- **Contexto:** Datos estructurados enviados al LLM + resultados de ML local

**Flujo de Trabajo:**
1. Usuario hace pregunta en lenguaje natural
2. Sistema extrae datos relevantes de la base de datos
3. Se ejecutan algoritmos ML locales (regresión, clustering)
4. Se construye un prompt estructurado con:
   - Datos relevantes del usuario
   - Resultados de análisis ML
   - Contexto del negocio
   - Instrucciones para generar insights
5. OpenAI procesa y genera respuesta natural
6. Sistema integra respuesta con gráficos y visualizaciones

**Ventajas:**
- ✅ Comprensión natural del lenguaje
- ✅ Respuestas más conversacionales y contextuales
- ✅ Puede responder preguntas complejas y abiertas
- ✅ Mejora continua con updates de OpenAI
- ✅ Integración existente: `openai` package ya está en dependencias

**Costo Estimado:**
- **GPT-3.5 Turbo:** ~$0.002 por 1K tokens (muy económico)
  - Consulta promedio: ~500 tokens input + 300 tokens output = $0.0016/consulta
  - 1000 consultas/mes = ~$1.60/mes
- **GPT-4 Turbo:** ~$0.01 por 1K tokens input, $0.03 por 1K tokens output
  - Consulta promedio: ~$0.04/consulta
  - 1000 consultas/mes = ~$40/mes

**Recomendación:** Empezar con GPT-3.5 Turbo, escalar a GPT-4 si se requiere mayor precisión

---

### **OPCIÓN 2: Integración con Google Gemini** 

**Características:**
- **Modelo:** Gemini Pro o Gemini Ultra
- **Ventajas:** Excelente con datos estructurados, visión multimodal
- **Costo:** Similar a GPT-3.5, competitivo con GPT-4

**Estimación:** $0.00025 por 1K tokens input, $0.0005 por 1K tokens output
- 1000 consultas/mes = ~$0.50/mes (muy económico)

---

### **OPCIÓN 3: Integración con Anthropic Claude**

**Características:**
- **Modelo:** Claude 3 Sonnet o Opus
- **Ventajas:** Excelente para análisis complejos, respuestas más largas
- **Costo:** Similar a GPT-4

**Estimación:** ~$0.03 por 1K tokens
- 1000 consultas/mes = ~$30/mes

---

### **OPCIÓN 4: Modelo Híbrido Avanzado** (Mejor Opción)

**Arquitectura:**
1. **Análisis Inicial:** Sistema actual (reglas + ML local) para consultas simples
2. **Escalado a IA:** OpenAI/Gemini para consultas complejas o cuando no se detecta intención clara
3. **Enriquecimiento:** IA genera insights adicionales basándose en resultados ML

**Ventajas:**
- ✅ Mejor costo-beneficio (solo usa IA cuando es necesario)
- ✅ Mantiene velocidad para consultas simples
- ✅ Flexibilidad para consultas complejas
- ✅ Costo optimizado

**Costo Estimado:** 
- 70% consultas simples (gratis) + 30% consultas complejas (IA)
- 1000 consultas/mes = ~$12-15/mes (con GPT-3.5)

---

## 💰 ANÁLISIS ECONÓMICO COMPARATIVO

### **Escenario Actual (Sin IA Generativa)**
- **Costo de IA:** $0
- **Capacidades:** Limitadas a palabras clave predefinidas
- **Ventaja:** Sin costos recurrentes

### **Opción 1: OpenAI GPT-3.5 Turbo**
- **Costo mensual:** ~$1.60 - $15 (según volumen)
- **Capacidades:** Comprensión natural, respuestas conversacionales
- **ROI:** Alto - mejora significativa de experiencia de usuario

### **Opción 2: OpenAI GPT-4 Turbo**
- **Costo mensual:** ~$40 - $400 (según volumen)
- **Capacidades:** Mayor precisión, mejor razonamiento
- **ROI:** Medio-Alto - solo si se requiere alta precisión

### **Opción 3: Google Gemini**
- **Costo mensual:** ~$0.50 - $5 (según volumen)
- **Capacidades:** Excelente con datos estructurados
- **ROI:** Muy Alto - mejor relación costo-beneficio

### **Opción 4: Modelo Híbrido**
- **Costo mensual:** ~$12 - $50 (según volumen y % de uso IA)
- **Capacidades:** Balance perfecto entre costo y funcionalidad
- **ROI:** Óptimo - mejor solución

---

## 📋 RECOMENDACIÓN TÉCNICA Y ECONÓMICA

### **RECOMENDACIÓN FINAL:**

**Fase 1 (Actual - Prototipo):**
- ✅ Mantener sistema actual (reglas + ML local)
- ✅ **Costo:** $0
- ✅ Adecuado para demostración al cliente

**Fase 2 (Producción - Mejora):**
- 🚀 Implementar **Modelo Híbrido con Google Gemini Pro**
- 🎯 Motivos:
  1. **Costo óptimo:** $0.50 - $5/mes (muy competitivo)
  2. **Excelente con datos estructurados:** Ideal para dashboards
  3. **API estable y confiable:** Google Cloud Platform
  4. **Flexibilidad:** Fácil migración a otros modelos si es necesario

**Fase 3 (Escalado - Avanzado):**
- Si el volumen crece significativamente (>10K consultas/mes):
  - Considerar OpenAI GPT-4 para mayor precisión
  - O implementar modelo propio con fine-tuning

---

## 🔧 ESPECIFICACIONES TÉCNICAS IMPLEMENTADAS

### **Stack Tecnológico:**

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Recharts (visualizaciones)
- React Query (gestión de estado)

**Backend:**
- Node.js 18+ con Express
- MySQL 8.0+ (base de datos)
- Librerías ML:
  - `simple-statistics` v7.8.3 (regresión lineal, estadísticas)
  - `ml-matrix` v6.10.7 (operaciones matriciales para clustering)

**Algoritmos Implementados:**
- ✅ Regresión Lineal (Linear Regression)
- ✅ K-Means Clustering
- ✅ Análisis Estadístico Descriptivo
- ✅ Detección de Anomalías (Z-score)
- ✅ Análisis de Tendencias (Moving Averages)
- ✅ Análisis Comparativo (Period-over-Period)

**Arquitectura:**
- PWA (Progressive Web App)
- API RESTful
- Sistema de filtros avanzado
- Modales informativos con descripciones técnicas

---

## 📊 MÉTRICAS Y VALIDACIÓN

### **Métricas de Calidad de Modelos:**

**Regresión Lineal:**
- R² > 0.7: Modelo bueno
- R² > 0.9: Modelo excelente
- RMSE: Error promedio del modelo

**K-Means:**
- Silhouette Score: Mide calidad de clustering (0-1)
- Inercia: Medida de cohesión intra-cluster
- Estabilidad: Consistencia entre ejecuciones

**Validación:**
- Split temporal: Últimos 3 meses como test set
- Backtesting: Validación con datos históricos
- Métricas de negocio: Apertura de intervalos de confianza

---

## 🎯 CONCLUSIÓN

### **Estado Actual:**
El sistema implementado utiliza algoritmos de Machine Learning locales (regresión lineal y K-means) que proporcionan:
- Predicciones precisas de ventas
- Segmentación inteligente de períodos
- Insights automáticos y recomendaciones

### **Propuesta de Mejora:**
Integración con IA generativa (Google Gemini Pro recomendado) para:
- Comprensión natural del lenguaje
- Respuestas más conversacionales
- Capacidad de responder preguntas complejas
- Costo muy competitivo (~$0.50 - $5/mes)

### **Valor Agregado:**
- ✅ **Costo mínimo:** Algoritmos ML locales = $0
- ✅ **Escalabilidad:** Fácil integración de IA generativa cuando se requiera
- ✅ **Flexibilidad:** Sistema modular que permite mejoras incrementales
- ✅ **ROI:** Alto retorno de inversión con mejoras de experiencia de usuario

---

## 📞 CONTACTO PARA IMPLEMENTACIÓN

Para implementar la integración con IA generativa:
1. Configurar API key de Google Gemini / OpenAI
2. Implementar sistema de prompts inteligentes
3. Integrar con análisis ML local existente
4. Testing y optimización de respuestas

**Tiempo estimado de implementación:** 2-3 días hábiles

---

*Documento generado para Northbay International Inc. - Dashboard Nike*
*Fecha: 2024*

