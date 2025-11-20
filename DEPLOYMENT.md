# Guía de Deployment - Nike Dashboard

## Opciones de Hosting Recomendadas

### 🏆 Opción 1: Railway (Recomendado) ⭐
**Mejor para: Todo en un solo lugar (Frontend + Backend + MySQL)**

**Ventajas:**
- ✅ Hostea frontend, backend Y base de datos MySQL en un solo lugar
- ✅ Fácil de configurar con GitHub
- ✅ Free tier generoso ($5 de crédito gratis/mes)
- ✅ No requiere cambios mayores en el código
- ✅ SSL automático
- ✅ Deploy automático desde Git

**Pasos:**
1. Crea cuenta en [Railway.app](https://railway.app)
2. Conecta tu repositorio de GitHub
3. Crea 3 servicios:
   - **MySQL Database** (selecciona el addon MySQL)
   - **Backend** (conecta `server/`)
   - **Frontend** (conecta raíz del proyecto)
4. Configura variables de entorno en cada servicio
5. Deploy automático

**Costo:** ~$5-20/mes (dependiendo del tráfico)

---

### 🚀 Opción 2: Vercel (Frontend) + Railway (Backend + DB)
**Mejor para: Frontend optimizado + Backend robusto**

**Ventajas:**
- ✅ Vercel excelente para React/Next.js
- ✅ CDN global para el frontend
- ✅ Railway para backend y MySQL
- ✅ Free tier en Vercel
- ✅ Mejor rendimiento global

**Pasos Frontend (Vercel):**
1. Crea cuenta en [Vercel.com](https://vercel.com)
2. Conecta repositorio de GitHub
3. Configura build: `npm run build`
4. Output directory: `dist`
5. Deploy automático

**Pasos Backend (Railway):**
- Mismo proceso que opción 1, solo backend + MySQL

---

### 🌐 Opción 3: Render
**Mejor para: Alternativa a Railway con estructura similar**

**Ventajas:**
- ✅ Similar a Railway
- ✅ Free tier disponible (más limitado)
- ✅ Fácil configuración
- ✅ Hostea frontend, backend y PostgreSQL (MySQL también disponible)

**Pasos:**
1. Crea cuenta en [Render.com](https://render.com)
2. Crea servicios:
   - PostgreSQL Database
   - Web Service (Backend)
   - Static Site (Frontend)

---

### 🔥 Opción 4: Firebase (Solo Frontend)
**Limitación: No puede hostear el backend Node.js directamente**

**Ventajas:**
- ✅ Excelente para PWA
- ✅ Free tier generoso
- ✅ CDN global

**Desventajas:**
- ❌ Necesitarías reescribir backend a Cloud Functions
- ❌ Necesitarías migrar MySQL a Firestore
- ❌ Mucho más trabajo

**No recomendado** para esta aplicación sin reescribir código.

---

## Recomendación Final: Railway ⭐

**Railway es la mejor opción** porque:
1. Hostea todo en un solo lugar
2. Menos configuración
3. MySQL incluido
4. Deploy automático
5. Fácil de escalar

## Preparación para Deploy

### 1. Variables de Entorno Necesarias

#### Backend (`server/.env`):
```env
DB_HOST=<host_proporcionado_por_railway>
DB_USER=<usuario_proporcionado>
DB_PASSWORD=<password_proporcionado>
DB_NAME=<nombre_db_proporcionado>
PORT=5000
```

#### Frontend (variables en Vercel/Railway):
```env
VITE_API_URL=https://tu-backend-url.railway.app/api
```

### 2. Scripts de Build

Ya están configurados:
- Frontend: `npm run build` → genera carpeta `dist/`
- Backend: Se ejecuta directamente con `node server/index.js`

### 3. Archivos Necesarios

Crear `railway.json` o archivos de configuración según la plataforma elegida.

---

## Pasos Detallados para Railway

### Paso 1: Preparar Repositorio
```bash
# Asegúrate de tener .gitignore configurado
# (ya está configurado para excluir .env y node_modules)
```

### Paso 2: Crear Proyecto en Railway
1. Ve a [railway.app](https://railway.app)
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza Railway y selecciona tu repositorio

### Paso 3: Agregar MySQL Database
1. En el dashboard de Railway, click "New"
2. Selecciona "Database" → "Add MySQL"
3. Railway creará la base de datos automáticamente
4. Copia las variables de conexión

### Paso 4: Configurar Backend Service
1. Click "New" → "GitHub Repo"
2. Selecciona tu repositorio
3. En "Root Directory" selecciona `server`
4. Railway detectará Node.js automáticamente
5. Agrega variables de entorno:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `PORT=5000`
6. Cambia el comando de start a: `npm start`

### Paso 5: Configurar Frontend Service
1. Click "New" → "GitHub Repo"
2. Selecciona tu repositorio (mismo repo)
3. Root Directory: `.` (raíz)
4. Build Command: `npm run build`
5. Start Command: `npm run preview` o usar servicio estático
6. Output Directory: `dist`
7. Agrega variable: `VITE_API_URL=<url_del_backend>`

### Paso 6: Inicializar Base de Datos
1. Conecta a la base de datos MySQL de Railway
2. Ejecuta el script de inicialización:
   ```bash
   # Desde tu máquina local, con las credenciales de Railway
   DB_HOST=<railway_host> DB_USER=<user> DB_PASSWORD=<pass> DB_NAME=<db> node server/init-db.js
   ```

---

## Alternativa Rápida: Netlify (Frontend) + Supabase (Backend)

Si prefieres algo más rápido para demo:

### Netlify para Frontend
- Free tier excelente
- Deploy automático desde Git
- Configurar build: `npm run build`

### Supabase para Backend
- PostgreSQL gratuito
- API REST automática
- Pero requiere migrar de MySQL a PostgreSQL

---

## Costos Estimados

| Plataforma | Costo Mensual (Est.) |
|------------|---------------------|
| Railway | $5-20 (free tier: $5 crédito) |
| Vercel + Railway | $0-15 (Vercel free + Railway) |
| Render | $7-25 (free tier limitado) |
| Firebase | $0 (solo frontend, backend requiere más) |

---

## ¡Listo para Deploy!

¿Quieres que cree los archivos de configuración específicos para Railway o prefieres otra plataforma?

