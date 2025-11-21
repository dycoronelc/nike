# 🚀 Configuración Rápida de OpenAI

## Pasos para Activar OpenAI

### 1️⃣ Obtener API Key

1. Ve a: https://platform.openai.com/api-keys
2. Inicia sesión
3. Haz clic en "Create new secret key"
4. Copia la key (ejemplo: `sk-proj-...`)

### 2️⃣ Configurar Localmente (Desarrollo)

Edita o crea el archivo `.env` en la raíz del proyecto:

```env
OPENAI_API_KEY=sk-tu-api-key-aqui
OPENAI_MODEL=gpt-3.5-turbo
```

**Nota:** El modelo por defecto es `gpt-3.5-turbo` (económico). Puedes cambiarlo a:
- `gpt-4-turbo-preview` para mejor calidad
- `gpt-4` para máxima precisión (más caro)

### 3️⃣ Configurar en Railway (Producción)

1. Ve a Railway → Tu Servicio Backend
2. Settings → Variables
3. Agrega:
   - **Variable:** `OPENAI_API_KEY`
   - **Valor:** Tu API key
4. (Opcional) Agrega:
   - **Variable:** `OPENAI_MODEL`
   - **Valor:** `gpt-3.5-turbo`

### 4️⃣ Reiniciar el Servidor

**Local:**
```bash
cd server
npm run dev
```

**Railway:**
- Se reiniciará automáticamente al agregar la variable

### 5️⃣ Verificar que Funciona

En los logs del servidor deberías ver:
```
✅ OpenAI client inicializado correctamente
```

Si ves esto, ¡está funcionando! 🎉

## 💰 Costos

**GPT-3.5 Turbo (Recomendado):**
- ~$0.0016 por consulta
- 1000 consultas = $1.60/mes

**GPT-4 Turbo:**
- ~$0.04 por consulta
- 1000 consultas = $40/mes

## 🧪 Probar

Prueba estas preguntas en el chatbot:
- "Dame un análisis completo de las ventas"
- "¿Qué recomiendas para mejorar el rendimiento?"
- "Analiza las tendencias y dime qué esperar"
- "¿Cómo está el inventario y qué debería hacer?"

---

**¡Listo!** Una vez configurado, el chatbot usará OpenAI automáticamente. Si OpenAI falla, usará el sistema basado en reglas como respaldo.

