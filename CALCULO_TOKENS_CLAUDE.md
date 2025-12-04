# Cálculo de Tokens para Claude - Dashboard Nike

## 📊 ¿Cómo se Calculan los Tokens?

Los tokens son unidades de texto que Claude procesa. En español, aproximadamente:
- **1 token ≈ 0.75 palabras** (o 4 caracteres)
- **1 palabra ≈ 1.33 tokens**

### Factores que Afectan el Consumo de Tokens:

1. **Input (Entrada):**
   - Prompt del sistema
   - Contexto de datos (KPIs, métricas, análisis)
   - Consulta del usuario
   - Resultados de análisis ML (si aplica)

2. **Output (Salida):**
   - Respuesta generada por Claude
   - Longitud de la respuesta (más detallada = más tokens)

---

## 🔍 Análisis de Consultas del Dashboard

### Ejemplos de Consultas Reales:

Basándonos en las consultas del chatbot y el código implementado:

1. **"¿Cuáles son las ventas totales?"**
2. **"Muéstrame la evolución de ventas"**
3. **"¿Qué predicciones tienes para el futuro?"**
4. **"¿Cuáles son los clusters de productos?"**
5. **"Muéstrame las sucursales con mejor rendimiento"**
6. **"¿Cómo está el inventario?"**

---

## 📝 Estructura del Prompt Enviado a Claude

### 1. System Message (Mensaje del Sistema)
```
Eres un asistente experto en análisis de datos de ventas con conocimiento 
profundo en retail y distribución. Proporcionas insights valiosos, 
recomendaciones accionables y análisis contextual basados en datos reales.
```

**Tokens estimados:** ~35 tokens

---

### 2. User Message (Prompt Completo con Contexto)

#### A. Contexto del Negocio (siempre incluido)
```
CONTEXTO DEL NEGOCIO:
- Sell In: Ventas de la empresa a distribuidores/clientes
- Sell Out: Ventas de los distribuidores a consumidores finales
- El ratio Sell Out/Sell In mide la eficiencia de ventas de los distribuidores
```

**Tokens estimados:** ~50 tokens

---

#### B. Datos Actuales (siempre incluido)
```
DATOS ACTUALES:
- Sell In Total: $45,678,901.23
- Sell Out Total: $38,234,567.89
- Total Ventas: $83,913,469.12
- Ratio Sell Out/Sell In: 83.7%
- Promedio Mensual: $6,992,789.09
- Inventario Total: 125,430 unidades
- Sucursales: 65
- Total Registros: 45,678
```

**Tokens estimados:** ~80 tokens

---

#### C. Performance (siempre incluido)
```
PERFORMANCE:
- Cambio mes anterior: +5.2%
- Vs. Promedio histórico: +12.3%
```

**Tokens estimados:** ~25 tokens

---

#### D. Tendencias (siempre incluido)
```
TENDENCIAS (últimos 6 meses):
- Tendencia: 📈 Creciente
- Cambio: +8.5%
```

**Tokens estimados:** ~20 tokens

---

#### E. Anomalías (si aplica, hasta 3)
```
ANOMALÍAS DETECTADAS:
- 2024-03-15: Pico de ventas (desviación: 2.45)
- 2024-05-20: Caída inusual (desviación: -1.89)
```

**Tokens estimados:** ~40 tokens (si hay anomalías)

---

#### F. Recomendaciones (siempre incluido, hasta 3)
```
RECOMENDACIONES DEL SISTEMA:
- Oportunidad: Optimizar inventario - Considera aumentar stock en productos de alta rotación
- Alerta: Ratio bajo - El ratio Sell Out/Sell In está por debajo del óptimo
```

**Tokens estimados:** ~60 tokens

---

#### G. Datos Adicionales (según tipo de consulta)

**Para Predicciones:**
```
PREDICCIONES (Modelo ML):
- 2024-10-01: $7,234,567.89 (confianza: 85.3%)
- 2024-11-01: $7,456,789.12 (confianza: 82.1%)
- 2024-12-01: $7,678,901.23 (confianza: 79.8%)
- R² del modelo: 0.847
```

**Tokens estimados:** ~70 tokens

---

**Para Sucursales:**
```
TOP SUCURSALES:
1. Sucursal Centro: $2,345,678.90
2. Sucursal Norte: $1,987,654.32
3. Sucursal Sur: $1,765,432.10
...
```

**Tokens estimados:** ~80 tokens (top 10 sucursales)

---

**Para Productos:**
```
TOP PRODUCTOS:
1. LOW TOP: $1,234,567.89
2. THREE QUARTER HIGH: $987,654.32
3. HIGH TOP: $876,543.21
...
```

**Tokens estimados:** ~80 tokens (top 10 productos)

---

#### H. Instrucciones (siempre incluido)
```
INSTRUCCIONES:
1. Responde de forma natural y conversacional en español
2. Utiliza los datos proporcionados para generar insights profundos y relevantes
3. Sé específico con números y porcentajes
4. Proporciona análisis contextual, no solo repitas los datos
5. Identifica oportunidades y riesgos basándote en los datos
6. Si la consulta requiere un gráfico específico, indica qué tipo de visualización sería útil
7. Mantén el formato profesional pero accesible
```

**Tokens estimados:** ~90 tokens

---

#### I. Consulta del Usuario
```
CONSULTA DEL USUARIO: "¿Cuáles son las ventas totales?"
```

**Tokens estimados:** ~10-30 tokens (depende de la longitud de la consulta)

---

## 📊 Cálculo de Tokens por Tipo de Consulta

### **Consulta Simple: "¿Cuáles son las ventas totales?"**

**Input:**
- System message: 35 tokens
- Contexto del negocio: 50 tokens
- Datos actuales: 80 tokens
- Performance: 25 tokens
- Tendencias: 20 tokens
- Recomendaciones: 60 tokens
- Instrucciones: 90 tokens
- Consulta del usuario: 15 tokens

**Total Input:** ~375 tokens

**Output (respuesta típica):**
```
Basándome en los datos actuales, las ventas totales del período analizado 
ascienden a $83,913,469.12. Este monto se desglosa en:

• Sell In (ventas a distribuidores): $45,678,901.23
• Sell Out (ventas de distribuidores a consumidores): $38,234,567.89

El ratio Sell Out/Sell In del 83.7% indica una eficiencia moderada en la 
conversión de ventas. Comparado con el promedio histórico, las ventas 
actuales están un 12.3% por encima, lo cual es una señal positiva.

Recomendación: Considera estrategias para mejorar el ratio de conversión 
y mantener el crecimiento sostenido.
```

**Total Output:** ~180 tokens

**Total por Consulta:** 375 input + 180 output = **555 tokens**

---

### **Consulta con Predicciones: "¿Qué predicciones tienes para el futuro?"**

**Input:**
- Base (igual que consulta simple): 375 tokens
- Predicciones ML: 70 tokens

**Total Input:** ~445 tokens

**Output (respuesta típica):**
```
Según el modelo predictivo Prophet-like implementado, las proyecciones 
para los próximos 3 meses son:

**Octubre 2024:** $7,234,567.89 (confianza: 85.3%)
   Rango probable: $6,500,000 - $7,900,000

**Noviembre 2024:** $7,456,789.12 (confianza: 82.1%)
   Rango probable: $6,700,000 - $8,200,000

**Diciembre 2024:** $7,678,901.23 (confianza: 79.8%)
   Rango probable: $6,900,000 - $8,500,000

El modelo tiene un R² de 0.847, lo que indica una buena capacidad 
predictiva. La tendencia es creciente (+8.5% en los últimos 6 meses), 
lo que sugiere un crecimiento sostenido.

**Insights:**
- Se espera un crecimiento del 5-8% en los próximos meses
- La confianza del modelo disminuye ligeramente hacia el futuro (normal)
- Diciembre muestra un patrón estacional esperado de mayor demanda

**Recomendaciones:**
- Aumentar inventario en preparación para la temporada alta
- Considerar campañas promocionales para maximizar las ventas proyectadas
```

**Total Output:** ~280 tokens

**Total por Consulta:** 445 input + 280 output = **725 tokens**

---

### **Consulta con Clusters: "¿Cuáles son los clusters de productos?"**

**Input:**
- Base: 375 tokens
- Datos de clusters (resumidos): ~100 tokens

**Total Input:** ~475 tokens

**Output (respuesta típica):**
```
He analizado los clusters de productos y he identificado 4 perfiles distintos:

**1. Productos Estrella (597 productos)**
   - Ventas promedio: $2,872,184
   - Ticket promedio: $148
   - Rotación: 33,274.33
   - Características: Alta rotación, alto ticket, alta diversidad

**2. Productos Premium (298 productos)**
   - Ventas promedio: $2,552,880
   - Ticket promedio: $144
   - Rotación: 13,167.07
   - Características: Alto ticket, rotación media-alta

**3. Productos Masivos (597 productos)**
   - Ventas promedio: $1,274,197
   - Ticket promedio: $158
   - Rotación: 9,046.30
   - Características: Alto volumen, rotación media

**4. Productos Estables (298 productos)**
   - Ventas promedio: $961,876
   - Ticket promedio: $142
   - Rotación: 6,543.21
   - Características: Rendimiento consistente

**Análisis:**
Los productos Estrella y Premium concentran el mayor valor, mientras que 
los Masivos representan volumen. Se recomienda enfocar estrategias de 
marketing en los clusters de mayor valor.
```

**Total Output:** ~250 tokens

**Total por Consulta:** 475 input + 250 output = **825 tokens**

---

### **Consulta con Sucursales: "Muéstrame las sucursales con mejor rendimiento"**

**Input:**
- Base: 375 tokens
- Top sucursales: 80 tokens

**Total Input:** ~455 tokens

**Output (respuesta típica):**
```
Las sucursales con mejor rendimiento son:

**Top 5 Sucursales:**
1. Sucursal Centro: $2,345,678.90
2. Sucursal Norte: $1,987,654.32
3. Sucursal Sur: $1,765,432.10
4. Sucursal Este: $1,543,210.98
5. Sucursal Oeste: $1,321,098.76

**Análisis:**
La Sucursal Centro lidera con un 28% del total de ventas. Las top 3 
sucursales concentran el 60% de las ventas totales, lo que indica una 
distribución concentrada.

**Recomendaciones:**
- Replicar estrategias exitosas de la Sucursal Centro en otras ubicaciones
- Analizar factores de éxito (ubicación, inventario, personal)
- Considerar expansión en zonas con potencial similar
```

**Total Output:** ~220 tokens

**Total por Consulta:** 455 input + 220 output = **675 tokens**

---

## 📈 Resumen de Tokens por Tipo de Consulta

| Tipo de Consulta | Input (tokens) | Output (tokens) | Total (tokens) |
|------------------|----------------|----------------|----------------|
| **Simple (ventas totales)** | 375 | 180 | **555** |
| **Con Predicciones** | 445 | 280 | **725** |
| **Con Clusters** | 475 | 250 | **825** |
| **Con Sucursales** | 455 | 220 | **675** |
| **Con Productos** | 455 | 220 | **675** |
| **Evolución Temporal** | 375 | 200 | **575** |
| **Inventario** | 375 | 190 | **565** |

### **Promedio Ponderado:**

Asumiendo distribución típica de consultas:
- 40% consultas simples: 555 tokens
- 20% con predicciones: 725 tokens
- 15% con clusters: 825 tokens
- 15% con sucursales: 675 tokens
- 10% otras: 600 tokens

**Promedio:** (0.4 × 555) + (0.2 × 725) + (0.15 × 825) + (0.15 × 675) + (0.1 × 600)
**Promedio:** 222 + 145 + 123.75 + 101.25 + 60 = **651.5 tokens/consulta**

**Redondeando:** ~**650 tokens por consulta promedio**

---

## 💰 Cálculo de Costos con Claude

### **Desglose por Token:**

**Claude Sonnet 4.5 (Recomendado):**
- Input: $3.00 por 1,000,000 tokens = **$0.000003 por token**
- Output: $15.00 por 1,000,000 tokens = **$0.000015 por token**

### **Costo por Consulta Promedio (650 tokens):**

**Asumiendo 60% input (390 tokens) + 40% output (260 tokens):**

- Input: 390 tokens × $0.000003 = **$0.00117**
- Output: 260 tokens × $0.000015 = **$0.00390**
- **Total por consulta: $0.00507** ≈ **$0.005**

### **Costo Mensual Estimado:**

| Volumen Mensual | Consultas | Costo (Sonnet) | Costo (Haiku) | Costo (Opus) |
|-----------------|-----------|----------------|---------------|--------------|
| **500 consultas** | 500 | **$2.54** | **$0.85** | **$4.23** |
| **1,000 consultas** | 1,000 | **$5.07** | **$1.69** | **$8.46** |
| **2,500 consultas** | 2,500 | **$12.68** | **$4.23** | **$21.15** |
| **5,000 consultas** | 5,000 | **$25.35** | **$8.46** | **$42.30** |
| **10,000 consultas** | 10,000 | **$50.70** | **$16.92** | **$84.60** |

---

## 🔄 Modelo Híbrido (70% simples + 30% IA)

### **Distribución:**
- 70% consultas simples: Procesadas por sistema local (0 tokens)
- 30% consultas complejas: Procesadas por Claude

### **Costo con Modelo Híbrido:**

| Volumen Total | Consultas IA | Costo (Sonnet) | Costo (Haiku) | Costo (Opus) |
|---------------|--------------|----------------|---------------|--------------|
| **1,000 consultas** | 300 | **$1.52** | **$0.51** | **$2.54** |
| **2,500 consultas** | 750 | **$3.80** | **$1.27** | **$6.35** |
| **5,000 consultas** | 1,500 | **$7.61** | **$2.54** | **$12.69** |
| **10,000 consultas** | 3,000 | **$15.21** | **$5.07** | **$25.38** |

---

## 📊 Comparación con Estimación Anterior

### **Estimación Anterior (en propuesta):**
- Consulta promedio: 500 tokens input + 300 tokens output = 800 tokens
- Costo estimado: $1.80 - $18/mes (modelo híbrido con Sonnet)

### **Cálculo Real (basado en código):**
- Consulta promedio: 390 tokens input + 260 tokens output = 650 tokens
- Costo real: **$1.52 - $15.21/mes** (modelo híbrido con Sonnet)

### **Diferencia:**
- **Más económico de lo estimado:** ~15-20% menos costoso
- La estimación anterior era conservadora (mejor para presupuesto)

---

## 🎯 Recomendación Final

### **Cálculo Real de Tokens:**
- **Promedio por consulta:** ~650 tokens
- **Distribución:** 60% input (390) + 40% output (260)

### **Costo Real con Claude Sonnet 4.5:**
- **Modelo Híbrido (Recomendado):** $1.52 - $15.21/mes
- **Uso Directo:** $2.54 - $50.70/mes

### **Optimizaciones Posibles:**
1. **Caché de Prompts:** Reducir tokens repetitivos (hasta 50% descuento)
2. **Procesamiento por Lotes:** Para reportes automáticos (50% descuento)
3. **Ajuste de Contexto:** Enviar solo datos relevantes según consulta
4. **Respuestas más Concisas:** Limitar max_tokens si no se necesita detalle

### **Con Optimizaciones:**
- Costo puede reducirse a **$0.75 - $7.50/mes** (modelo híbrido)
- Ahorro potencial: **50-70%**

---

## 📝 Notas Importantes

1. **Tokens pueden variar:**
   - Consultas más largas = más tokens
   - Respuestas más detalladas = más tokens output
   - Datos adicionales según consulta = más tokens input

2. **Factores que Aumentan Tokens:**
   - Consultas complejas con múltiples preguntas
   - Análisis de múltiples períodos
   - Comparaciones detalladas
   - Respuestas muy extensas

3. **Factores que Reducen Tokens:**
   - Consultas simples y directas
   - Respuestas concisas
   - Uso de caché de prompts
   - Procesamiento por lotes

4. **Monitoreo Recomendado:**
   - Implementar logging de tokens por consulta
   - Alertas si el consumo excede proyecciones
   - Dashboard de uso de tokens

---

*Documento generado para Northbay International Inc. - Dashboard Nike*
*Fecha: Diciembre 2024*



