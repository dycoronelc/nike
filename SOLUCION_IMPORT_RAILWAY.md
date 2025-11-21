# ✅ Solución Definitiva: Importar SQL a Railway

## 🔴 Problema: Error 1045 (Access denied)

Railway MySQL probablemente **no permite conexiones externas directas** con ese usuario/contraseña. 

---

## ✅ Solución Recomendada: Usar Railway CLI

La mejor forma es ejecutar la importación **desde dentro de Railway** usando Railway CLI.

### Paso 1: Instalar Railway CLI

```bash
npm install -g @railway/cli
```

### Paso 2: Login y Link

```bash
railway login
cd C:\react\nike
railway link
# Selecciona tu proyecto y servicio backend (cuando lo crees)
```

### Paso 3: Importar usando el script de Node.js

Una vez que tengas el **backend desplegado en Railway**, ejecuta:

```bash
# Sube tu archivo SQL primero (puedes hacerlo temporalmente en el repo o usar un servicio de archivos)

# Luego ejecuta desde Railway:
railway run --service backend node server/import-sql.js ruta/al/archivo.sql
```

O mejor aún, **después de desplegar el backend**:

1. **Sube tu archivo SQL a algún lugar accesible** (puede ser temporalmente en GitHub en una rama temporal, o a un servicio de archivos)
2. **O usa un script que lea desde una URL**

---

## ✅ Solución Alternativa 1: Usar Cliente MySQL GUI

Si prefieres no esperar a desplegar el backend, usa un cliente GUI que maneja mejor la autenticación:

### MySQL Workbench:

1. **Descarga e instala:** https://dev.mysql.com/downloads/workbench/
2. **Nueva conexión:**
   - Connection Name: `Railway MySQL`
   - Connection Method: `Standard (TCP/IP)`
   - Hostname: `gondola.proxy.rlwy.net`
   - Port: `18127`
   - Username: `root` (o verifica si hay `MYSQLUSER` variable)
   - Password: `AssyoByxyfuUFSMhabDjUYPWtUbwyrJx`
   - Default Schema: `railway`
   - Click **"Test Connection"** primero

3. **Si la conexión funciona:**
   - Server → Data Import
   - Select **"Import from Self-Contained File"**
   - Selecciona tu archivo SQL
   - Default Target Schema: `railway`
   - Click **"Start Import"**

4. **Si la conexión NO funciona:**
   - Railway MySQL probablemente no permite conexiones externas
   - Usa la Solución Recomendada (Railway CLI) después de desplegar el backend

---

## ✅ Solución Alternativa 2: Verificar Variables Correctas

En Railway → Variables del servicio MySQL, verifica:

1. **¿Hay una variable `MYSQLUSER`?** (puede no ser `root`)
2. **¿La contraseña en `MYSQLPASSWORD` es exactamente la misma que en `MYSQL_PUBLIC_URL`?**
3. **¿Hay variables adicionales para conexión externa?**

Si encuentras variables diferentes, úsalas en el comando.

---

## ✅ Solución Alternativa 3: Esperar y Desplegar Backend Primero

1. **Despliega el backend en Railway** (según la guía RAILWAY_DEPLOY.md)
2. **Configura las variables de entorno** del backend para conectar a MySQL
3. **Una vez desplegado, usa Railway CLI:**

```bash
railway run --service backend node server/import-sql.js backup.sql
```

O si el archivo está en tu máquina local y Railway CLI puede acceder:

```bash
railway run --service backend bash -c "mysql -h \$MYSQLHOST -u \$MYSQLUSER -p\$MYSQLPASSWORD \$MYSQLDATABASE < /path/to/backup.sql"
```

---

## 📝 Resumen de Opciones

1. **Más fácil ahora:** Cliente MySQL GUI (Workbench/HeidiSQL) - Prueba la conexión
2. **Más seguro:** Desplegar backend primero → Usar Railway CLI
3. **Si GUI no funciona:** Definitivamente usa Railway CLI después de desplegar backend

---

## 🔍 Verificar si Railway Permite Conexiones Externas

Intenta con un cliente GUI primero. Si **NO funciona** con GUI (mismo error 1045), entonces Railway **no permite conexiones externas** y necesitas usar Railway CLI.

---

## ✅ Próximos Pasos Recomendados

1. **Prueba MySQL Workbench primero** (es lo más rápido)
2. **Si funciona:** Importa el archivo SQL
3. **Si NO funciona:** Continúa desplegando el backend y luego usa Railway CLI

---

## 💡 Script Creado

He creado `server/import-sql.js` que puede ejecutarse desde Railway CLI una vez que el backend esté desplegado. Este script:

- ✅ Lee variables de entorno automáticamente
- ✅ Maneja archivos grandes
- ✅ Muestra progreso
- ✅ Verifica datos después de importar

Usa este script con Railway CLI después de desplegar el backend.

