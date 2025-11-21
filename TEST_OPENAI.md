# 🧪 Pasos para Probar la Integración de OpenAI

## 1. Verificar que el servidor detecte la API Key

El servidor debería mostrar en los logs:
```
✅ OpenAI client inicializado correctamente
```

## 2. Reiniciar el Servidor

**Si el servidor está corriendo:**
- Detén el servidor (Ctrl+C)
- Inícialo de nuevo: `cd server && npm run dev`

**Si no está corriendo:**
```bash
cd server
npm run dev
```

## 3. Probar el Chatbot

Abre el dashboard en `http://localhost:3000` y prueba estas consultas:

### Consultas Simples:
- "¿Cómo están las ventas?"
- "Dame un resumen de las ventas totales"
- "Muéstrame el estado del inventario"

### Consultas Avanzadas:
- "Analiza las tendencias de ventas y dame recomendaciones"
- "¿Qué predicciones tienes para los próximos meses?"
- "Compara las ventas del último mes con el promedio histórico"
- "Identifica las principales oportunidades de mejora"

### Consultas Específicas:
- "¿Cuáles son las top sucursales?"
- "Muéstrame el análisis de productos"
- "Explica qué significan los clusters detectados"

## 4. Verificar la Respuesta

**Con OpenAI activo:**
- ✅ Respuesta más conversacional y natural
- ✅ Análisis más profundo y contextual
- ✅ Referencias a los datos específicos
- ✅ Recomendaciones más detalladas

**Sin OpenAI (fallback):**
- Respuesta estructurada con formato predefinido
- Insights automáticos del sistema

## 5. Verificar en los Logs

En la consola del servidor deberías ver:
- `✅ OpenAI client inicializado correctamente` al iniciar
- Si hay un error con OpenAI: `⚠️ OpenAI no respondió, usando análisis basado en reglas`

## 6. Monitorear Costos

Ve a tu dashboard de OpenAI: https://platform.openai.com/usage
- Monitorea el uso de tokens
- Cada consulta usa ~500-800 tokens
- Costo aproximado: $0.0016 por consulta (GPT-3.5 Turbo)

---

**¡Listo para probar!** 🚀

