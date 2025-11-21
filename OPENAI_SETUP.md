# Configuración de OpenAI para el Asistente de IA

## 🚀 Integración Completada

Se ha integrado OpenAI en el sistema del chatbot para generar respuestas más naturales e inteligentes. El sistema funciona como un **híbrido inteligente**:

1. **Primero intenta usar OpenAI** (si está configurado)
2. **Si OpenAI falla o no está configurado**, usa el sistema basado en reglas existente

## 📋 Configuración Requerida

### 1. Obtener API Key de OpenAI

1. Ve a https://platform.openai.com/api-keys
2. Inicia sesión con tu cuenta
3. Crea una nueva API key
4. Copia la key (solo se muestra una vez, guárdala bien)

### 2. Configurar Variable de Entorno

Agrega la siguiente variable a tu archivo `.env` en la raíz del proyecto:

```env
OPENAI_API_KEY=sk-tu-api-key-aqui
```

**Opcional - Modelo:**
```env
OPENAI_MODEL=gpt-3.5-turbo
```

Modelos disponibles:
- `gpt-3.5-turbo` (recomendado - económico): ~$0.002 por 1K tokens
- `gpt-4-turbo-preview` (más preciso): ~$0.01 por 1K tokens
- `gpt-4` (máxima precisión): ~$0.03 por 1K tokens

### 3. Para Railway (Producción)

1. Ve a tu servicio Backend en Railway
2. Settings → Variables
3. Agrega:
   - **Nombre:** `OPENAI_API_KEY`
   - **Valor:** Tu API key de OpenAI
4. (Opcional) Agrega:
   - **Nombre:** `OPENAI_MODEL`
   - **Valor:** `gpt-3.5-turbo` o `gpt-4-turbo-preview`

## 🔧 Cómo Funciona

### Sistema Híbrido

El chatbot ahora funciona de la siguiente manera:

```
Usuario hace consulta
        ↓
¿OpenAI configurado?
   ↓ Sí            ↓ No
Usa OpenAI    →   Sistema basado en reglas
        ↓                ↓
Genera respuesta    Análisis con algoritmos ML
con contexto            locales + insights
        ↓
Respuesta + Gráficos
```

### Flujo de OpenAI

1. **Análisis Previo:**
   - Ejecuta algoritmos ML locales (regresión, clustering, análisis estadístico)
   - Detecta anomalías, tendencias, y genera recomendaciones
   - Extrae datos relevantes de la base de datos

2. **Construcción de Prompt:**
   - Prepara un prompt estructurado con:
     - Contexto del negocio
     - Datos actuales (KPIs, ventas, inventario)
     - Análisis ML ejecutado (predicciones, clusters, tendencias)
     - Anomalías detectadas
     - Recomendaciones del sistema
     - Consulta del usuario

3. **Procesamiento con OpenAI:**
   - Envía el prompt a OpenAI
   - Recibe respuesta generativa natural

4. **Integración:**
   - Combina la respuesta de OpenAI con gráficos correspondientes
   - Mantiene la estructura de respuesta existente

## 💰 Costos Estimados

### GPT-3.5 Turbo (Recomendado)
- **Input:** ~$0.002 por 1K tokens
- **Output:** ~$0.002 por 1K tokens
- **Consulta promedio:** ~500 tokens input + 300 tokens output = **$0.0016/consulta**
- **1000 consultas/mes:** ~**$1.60/mes**
- **10000 consultas/mes:** ~**$16/mes**

### GPT-4 Turbo
- **Input:** ~$0.01 por 1K tokens
- **Output:** ~$0.03 por 1K tokens
- **Consulta promedio:** ~**$0.04/consulta**
- **1000 consultas/mes:** ~**$40/mes**

### Control de Costos

El sistema incluye:
- ✅ Timeout automático (si OpenAI tarda mucho, usa fallback)
- ✅ Manejo de errores (si OpenAI falla, usa sistema local)
- ✅ Límite de tokens configurable en el código

## 🧪 Pruebas

### Probar Localmente

1. Agrega `OPENAI_API_KEY` a tu `.env`
2. Inicia el servidor: `cd server && npm run dev`
3. Abre el dashboard y prueba el chatbot con preguntas como:
   - "¿Cómo están las ventas este mes?"
   - "Muéstrame un análisis completo de las tendencias"
   - "¿Qué recomiendas para mejorar las ventas?"
   - "Analiza la performance de las sucursales"

### Verificar que Funciona

Si OpenAI está funcionando correctamente, verás en los logs del servidor:
```
✅ OpenAI client inicializado correctamente
```

Si falla, verás:
```
⚠️ OpenAI no respondió, usando análisis basado en reglas
```

## 🔒 Seguridad

- **NUNCA** subas el `.env` a Git (ya está en `.gitignore`)
- **NUNCA** expongas tu API key en el frontend
- La API key solo se usa en el backend
- Railway maneja las variables de entorno de forma segura

## 📊 Ventajas de la Integración

### Antes (Sistema Basado en Reglas):
- ⚠️ Requiere palabras clave específicas
- ⚠️ Respuestas predefinidas
- ⚠️ Limitado en comprensión de contexto
- ✅ Sin costos

### Ahora (Con OpenAI):
- ✅ Comprensión natural del lenguaje
- ✅ Respuestas conversacionales y contextuales
- ✅ Puede responder preguntas complejas
- ✅ Mejora continua con updates de OpenAI
- ✅ Bajo costo con GPT-3.5 Turbo

### Híbrido (Mejor de Ambos Mundos):
- ✅ Respuestas inteligentes con OpenAI
- ✅ Fallback automático si OpenAI falla
- ✅ Análisis ML local siempre disponible
- ✅ Costo optimizado (solo paga cuando usa OpenAI)

## 🛠️ Troubleshooting

### Error: "OpenAI client not initialized"
- Verifica que `OPENAI_API_KEY` esté en `.env`
- Reinicia el servidor después de agregar la variable

### Error: "API key is invalid"
- Verifica que la key esté correcta
- Asegúrate de que la cuenta de OpenAI tenga créditos

### OpenAI no se está usando
- Verifica los logs del servidor
- Asegúrate de que la variable de entorno esté cargada
- El sistema usará fallback automáticamente

### Costos muy altos
- Cambia a `gpt-3.5-turbo` (más económico)
- Revisa el número de consultas
- Considera implementar rate limiting

## 🎯 Próximos Pasos

1. Configura tu API key en `.env` (desarrollo) o Railway (producción)
2. Prueba el chatbot con diferentes tipos de consultas
3. Monitorea los costos en tu dashboard de OpenAI
4. Ajusta el modelo según necesidades (3.5 vs 4)

---

**¡Listo para probar!** 🚀

