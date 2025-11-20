# 🚀 Deploy Rápido en Railway

## Pasos en 5 minutos:

### 1. Sube tu código a GitHub
```bash
git init
git add .
git commit -m "Initial commit - Nike Dashboard"
git remote add origin <tu-repositorio-github>
git push -u origin main
```

### 2. Crea cuenta en Railway
- Ve a [railway.app](https://railway.app)
- Crea cuenta con GitHub
- Click en "New Project"
- Selecciona "Deploy from GitHub repo"

### 3. Agrega MySQL Database
- Click "New" → "Database" → "Add MySQL"
- Railway creará automáticamente la base de datos
- **IMPORTANTE:** Copia las variables de conexión (las verás en "Variables")

### 4. Crea Backend Service
- Click "New" → "GitHub Repo"
- Selecciona tu repositorio
- Railway detectará Node.js
- En "Settings" → "Root Directory" cambia a: `server`
- En "Settings" → "Deploy" cambia "Start Command" a: `npm start`
- Ve a "Variables" y agrega:
  ```
  DB_HOST=<del_paso_3>
  DB_USER=<del_paso_3>
  DB_PASSWORD=<del_paso_3>
  DB_NAME=<del_paso_3>
  PORT=5000
  ```
- Genera dominio público (Settings → Generate Domain)

### 5. Crea Frontend Service
- Click "New" → "GitHub Repo" (mismo repositorio)
- En "Settings" → "Root Directory" deja: `.` (raíz)
- Cambia a "Static" en el tipo de servicio
- En "Build Command": `npm run build`
- En "Publish Directory": `dist`
- En "Variables" agrega:
  ```
  VITE_API_URL=https://<url-del-backend>.railway.app/api
  ```
- Genera dominio público

### 6. Inicializa la Base de Datos
Una vez que el backend esté corriendo, necesitas cargar los datos:

**Opción A: Desde tu máquina local**
```bash
# Usa las credenciales de Railway que copiaste
DB_HOST=<railway_host> \
DB_USER=<railway_user> \
DB_PASSWORD=<railway_password> \
DB_NAME=<railway_db> \
node server/init-db.js
```

**Opción B: Usando Railway CLI**
```bash
# Instala Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link a tu proyecto
railway link

# Ejecuta el script de inicialización
railway run node server/init-db.js
```

### 7. ¡Listo! 🎉
Tu aplicación estará disponible en:
- Frontend: `https://tu-frontend.up.railway.app`
- Backend API: `https://tu-backend.up.railway.app`

## Costo
- Free tier: $5 crédito gratis/mes
- Después: ~$5-20/mes según uso

## Troubleshooting
- Si el backend no inicia: Verifica que las variables de entorno estén correctas
- Si el frontend no carga: Verifica que `VITE_API_URL` apunte al backend correcto
- Si no hay datos: Ejecuta el script de inicialización de la base de datos

