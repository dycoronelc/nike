# Configuración del Frontend en Railway

## Problema Común

Si ves errores como:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'dotenv' imported from /app/server/index.js
```

Esto significa que Railway está intentando ejecutar el código del backend desde el servicio del frontend.

## Solución: Configuración Correcta del Frontend

### Paso 1: Configurar el Servicio Frontend en Railway

1. **Crear un nuevo servicio** para el frontend (separado del backend)
2. **Conectar el mismo repositorio de GitHub**
3. **Configurar las siguientes opciones:**

#### Build Settings:
- **Build Command**: `npm run build`
- **Start Command**: `npm run start` (o `vite preview --host 0.0.0.0 --port $PORT`)

#### Root Directory:
- **NO** configures un root directory, déjalo vacío (Railway detectará automáticamente)

### Paso 2: Variables de Entorno del Frontend

Crea estas variables en el servicio Frontend:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `VITE_API_URL` | URL de tu backend (ej: `https://tu-backend.up.railway.app`) | URL completa del backend API |
| `PORT` | (déjalo vacío, Railway lo asignará) | Puerto para servir el frontend |

**Ejemplo de `VITE_API_URL`:**
```
https://nike-dashboard-backend-production.up.railway.app
```

### Paso 3: Verificar la Configuración

1. **Build Command**: Debe ser `npm run build`
2. **Start Command**: Debe ser `npm run start` (que ejecuta `vite preview`)
3. **No debe haber referencias a `server/`** en los comandos del frontend

### Paso 4: Estructura Esperada

Railway debe:
- ✅ Ejecutar `npm install` en la raíz
- ✅ Ejecutar `npm run build` (que crea la carpeta `dist/`)
- ✅ Ejecutar `npm run start` (que sirve los archivos de `dist/`)

### Paso 5: Verificar los Logs

Después del build, deberías ver:
```
✓ built in X.XXs
```

Y al iniciar:
```
  ➜  Local:   http://localhost:4173/
  ➜  Network: use --host to expose
```

## Troubleshooting

### Error: "Cannot find package 'dotenv'"
- **Causa**: Railway está intentando ejecutar código del servidor
- **Solución**: Verifica que el Start Command sea `npm run start` y NO `node server/index.js`

### Error: "Build failed"
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de build para ver qué falta

### El frontend no se conecta al backend
- Verifica que `VITE_API_URL` esté configurada correctamente
- Asegúrate de que el backend esté corriendo y accesible
- Verifica que el backend tenga CORS habilitado (ya está configurado en `server/index.js`)

## Nota Importante

El frontend y el backend son **servicios separados** en Railway:
- **Backend Service**: Ejecuta `node server/index.js`
- **Frontend Service**: Ejecuta `npm run build` y luego `npm run start`

No deben compartir el mismo servicio.

