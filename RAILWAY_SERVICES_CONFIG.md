# Configuración de Servicios en Railway

## ✅ Cambio Realizado

Se eliminó el `startCommand` del archivo `railway.json` para que Railway use automáticamente los scripts de `package.json`.

## 📋 Configuración Manual en Railway

Ahora debes configurar los comandos **directamente en Railway** para cada servicio:

### 🔧 Servicio Backend

1. Ve a tu **servicio Backend** en Railway
2. Settings → **Deploy**
3. Configura:
   - **Build Command**: (déjalo vacío o `npm install`)
   - **Start Command**: `node server/index.js`
   - **Root Directory**: (déjalo vacío)

### 🎨 Servicio Frontend

1. Ve a tu **servicio Frontend** en Railway
2. Settings → **Deploy**
3. Configura:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Root Directory**: (déjalo vacío)

### 📦 Variables de Entorno

#### Backend:
- `DB_HOST` → referencia a `MYSQLHOST`
- `DB_USER` → referencia a `MYSQLUSER`
- `DB_PASSWORD` → referencia a `MYSQLPASSWORD`
- `DB_NAME` → referencia a `MYSQLDATABASE`
- `NODE_ENV` → `production`
- `PORT` → (opcional, Railway lo asigna)

#### Frontend:
- `VITE_API_URL` → URL completa de tu backend (ej: `https://tu-backend.up.railway.app`)
- `PORT` → (opcional, Railway lo asigna)

## 🚀 Próximos Pasos

1. **Haz commit y push** del cambio en `railway.json`:
   ```bash
   git add railway.json
   git commit -m "Remove startCommand from railway.json to allow per-service configuration"
   git push
   ```

2. **Configura los comandos en Railway** para cada servicio (como se indica arriba)

3. **Redeploy** ambos servicios

## ⚠️ Nota Importante

Railway detectará automáticamente:
- **Backend**: Si hay una carpeta `server/` con `package.json`, usará `npm start` del `server/package.json`
- **Frontend**: Si hay un `package.json` en la raíz con script `start`, lo usará

Pero es mejor configurarlo explícitamente en Railway para evitar confusiones.

