# 🚂 Guía Completa de Deployment en Railway

## 📋 Checklist Pre-Deployment

### ✅ Archivos Necesarios en el Repositorio
Asegúrate de que estos archivos estén incluidos en tu repositorio:
- ✅ `MUESTRA DE DATA CENTURY.xlsx` (en la raíz)
- ✅ `Sell Out.xlsx` o `SellOut.csv` (en la raíz)
- ✅ `database/schema.sql`
- ✅ `database/init.js`
- ✅ `server/init-db.js`
- ✅ Todos los archivos de código fuente

### ❌ Archivos NO Subir (están en .gitignore)
- `.env` (las variables se configuran en Railway)
- `node_modules/`
- `dist/`

---

## 🚀 Paso 1: Preparar Repositorio en GitHub

1. **Inicializa Git** (si aún no lo has hecho):
```bash
git init
git add .
git commit -m "Initial commit - Nike Dashboard PWA"
```

2. **Crea un repositorio en GitHub** y luego:
```bash
git remote add origin https://github.com/dycoronelc/nike.git
git branch -M main
git push -u origin main
```

---

## 🚂 Paso 2: Configurar Railway

### 2.1 Crear Cuenta y Proyecto
1. Ve a [railway.app](https://railway.app)
2. Click en **"Login"** y autoriza con GitHub
3. Click en **"New Project"**
4. Selecciona **"Deploy from GitHub repo"**
5. Elige tu repositorio

### 2.2 Agregar MySQL Database
1. En tu proyecto, click en **"New"**
2. Selecciona **"Database"** → **"Add MySQL"**
3. Railway creará automáticamente la base de datos MySQL
4. **IMPORTANTE:** Ve a la pestaña **"Variables"** del servicio MySQL y copia:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLDATABASE`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`

---

## 🔧 Paso 3: Crear Backend Service

1. Click en **"New"** → **"GitHub Repo"** (selecciona el mismo repositorio)
2. Railway detectará Node.js automáticamente
3. Ve a **"Settings"** del servicio backend:
   - **Root Directory:** `server`
   - **Start Command:** `npm start`
   - **Build Command:** (dejar vacío o `cd server && npm install`)

4. Ve a **"Variables"** y agrega estas variables de entorno:
   ```
   DB_HOST=<MYSQLHOST_del_paso_2.2>
   DB_PORT=<MYSQLPORT_del_paso_2.2>
   DB_USER=<MYSQLUSER_del_paso_2.2>
   DB_PASSWORD=<MYSQLPASSWORD_del_paso_2.2>
   DB_NAME=<MYSQLDATABASE_del_paso_2.2>
   PORT=5000
   NODE_ENV=production
   ```

5. **Conectar Base de Datos:**
   - Ve a **"Variables"** del servicio backend
   - Railway debería mostrar una opción para **"Connect Database"**
   - Selecciona el servicio MySQL que creaste
   - Esto automáticamente agregará las variables `MYSQL*`

6. **Generar Dominio Público:**
   - Ve a **"Settings"** → **"Generate Domain"**
   - Copia la URL (ej: `https://tu-backend.up.railway.app`)

---

## 🎨 Paso 4: Crear Frontend Service

1. Click en **"New"** → **"GitHub Repo"** (mismo repositorio)
2. Ve a **"Settings"**:
   - **Root Directory:** `.` (raíz)
   - Cambia el tipo de servicio a **"Static"**
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`

3. Ve a **"Variables"** y agrega:
   ```
   VITE_API_URL=https://TU_BACKEND_URL.railway.app/api
   ```
   ⚠️ **Reemplaza `TU_BACKEND_URL` con la URL del backend del Paso 3.6**

4. **Generar Dominio Público:**
   - Ve a **"Settings"** → **"Generate Domain"**
   - Copia la URL (ej: `https://tu-frontend.up.railway.app`)

---

## 💾 Paso 5: Inicializar Base de Datos

Una vez que ambos servicios estén desplegados, necesitas cargar los datos iniciales.

### Opción A: Usando Railway CLI (Recomendado)

1. **Instala Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login a Railway:**
```bash
railway login
```

3. **Link a tu proyecto:**
```bash
cd C:\react\nike
railway link
# Selecciona tu proyecto y servicio (backend)
```

4. **Ejecuta el script de inicialización:**
```bash
railway run node server/init-db.js
```

### Opción B: Desde tu máquina local

Necesitas las credenciales de la base de datos MySQL de Railway.

1. **Crea un archivo `.env` temporal** (NO lo subas a git):
```env
DB_HOST=<MYSQLHOST_de_Railway>
DB_PORT=<MYSQLPORT_de_Railway>
DB_USER=<MYSQLUSER_de_Railway>
DB_PASSWORD=<MYSQLPASSWORD_de_Railway>
DB_NAME=<MYSQLDATABASE_de_Railway>
```

2. **Ejecuta el script:**
```bash
node server/init-db.js
```

3. **Elimina el archivo `.env`** después de ejecutar

### Opción C: SSH a Railway (Avanzado)

Puedes conectarte directamente al servicio backend y ejecutar el script desde allí.

---

## ✅ Paso 6: Verificar Deployment

1. **Backend:**
   - Visita: `https://tu-backend.up.railway.app/api/health`
   - Debería retornar: `{"status":"ok","database":"connected",...}`

2. **Frontend:**
   - Visita: `https://tu-frontend.up.railway.app`
   - Deberías ver el dashboard cargando

3. **Probar endpoints:**
   - `https://tu-backend.up.railway.app/api/kpis`
   - `https://tu-backend.up.railway.app/api/clusters`

---

## 🔍 Troubleshooting

### Problema: Backend no inicia
- ✅ Verifica que las variables de entorno estén correctas
- ✅ Revisa los logs en Railway: **"Deployments"** → Click en el deployment → **"View Logs"**
- ✅ Verifica que el **Root Directory** sea `server`
- ✅ Verifica que **Start Command** sea `npm start`

### Problema: Frontend no carga datos
- ✅ Verifica que `VITE_API_URL` apunte correctamente al backend
- ✅ Verifica que la URL del backend termine en `/api`
- ✅ Revisa la consola del navegador (F12) para ver errores CORS

### Problema: Base de datos vacía
- ✅ Ejecuta el script de inicialización (Paso 5)
- ✅ Verifica que los archivos Excel/CSV estén en el repositorio
- ✅ Revisa los logs del script de inicialización

### Problema: Error de conexión a MySQL
- ✅ Verifica que el backend esté conectado al servicio MySQL
- ✅ En Railway, ve a **Variables** del backend y verifica las variables `MYSQL*`
- ✅ Verifica que el puerto sea `3306` (por defecto MySQL)

---

## 📊 Monitoreo

- **Logs en tiempo real:** Railway → Tu servicio → **"Deployments"** → Click en deployment activo → **"View Logs"**
- **Métricas:** Railway → Tu servicio → **"Metrics"**
- **Variables:** Railway → Tu servicio → **"Variables"**

---

## 💰 Costo

- **Free Tier:** $5 crédito gratis/mes
- **Después:** ~$5-20/mes según uso
- El plan gratuito suele ser suficiente para pruebas y desarrollo

---

## 🔄 Actualizar Deployment

Cada vez que hagas `git push` a la rama principal, Railway automáticamente:
1. Detecta los cambios
2. Reconstruye el servicio
3. Redespliega la aplicación

**Nota:** Si cambias variables de entorno o configuración, puede ser necesario hacer un redeploy manual desde Railway.

---

## 🎉 ¡Listo!

Tu aplicación estará disponible en:
- **Frontend:** `https://tu-frontend.up.railway.app`
- **Backend API:** `https://tu-backend.up.railway.app/api`

¡Felicidades! 🚀

