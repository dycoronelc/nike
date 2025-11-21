# 🔧 Solución a Error 1045 (Access denied)

## Posibles Causas

1. **Contraseña mal escapada** (caracteres especiales)
2. **Usuario incorrecto** (puede no ser `root`)
3. **Railway requiere conexión desde servicios internos** (no externas)
4. **Permisos del usuario** limitados para conexiones externas

---

## ✅ Solución 1: Verificar Variables Exactas de Railway

Revisa en Railway → Variables del servicio MySQL:

1. **¿Hay una variable `MYSQLUSER` diferente?** (puede no ser `root`)
2. **¿La contraseña tiene caracteres especiales?** Puede necesitar escapar
3. **¿Hay variables específicas para conexión externa?**

---

## ✅ Solución 2: Usar Variables de Entorno (PowerShell)

Para evitar problemas con caracteres especiales:

```powershell
# En PowerShell
$env:MYSQL_HOST="gondola.proxy.rlwy.net"
$env:MYSQL_PORT="18127"
$env:MYSQL_USER="root"
$env:MYSQL_PASSWORD="AssyoByxyfuUFSMhabDjUYPWtUbwyrJx"
$env:MYSQL_DATABASE="railway"

# Luego ejecutar
mysql -h $env:MYSQL_HOST -P $env:MYSQL_PORT -u $env:MYSQL_USER -p$env:MYSQL_PASSWORD $env:MYSQL_DATABASE < tu_archivo.sql
```

---

## ✅ Solución 3: Verificar Usuario Real

En Railway, revisa si hay una variable `MYSQLUSER` diferente. Puede ser que el usuario no sea `root`.

Si hay una variable `MYSQLUSER`, úsala en lugar de `root`.

---

## ✅ Solución 4: Usar Railway CLI (Recomendado si las anteriores no funcionan)

Railway CLI puede usar las variables automáticamente:

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link a tu proyecto
railway link
# Selecciona tu proyecto y servicio MySQL

# Usar las variables de Railway
railway run mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE < tu_archivo.sql
```

---

## ✅ Solución 5: Usar Cliente GUI (Más Seguro)

Un cliente GUI (Workbench, HeidiSQL) maneja mejor la autenticación:

### MySQL Workbench:
1. Nueva conexión
2. **Connection Method:** `Standard (TCP/IP)`
3. **Hostname:** `gondola.proxy.rlwy.net`
4. **Port:** `18127`
5. **Username:** `root` (o el de `MYSQLUSER`)
6. **Password:** `AssyoByxyfuUFSMhabDjUYPWtUbwyrJx`
7. **Default Schema:** `railway`
8. Click **"Test Connection"** primero
9. Si funciona, procede con la importación

---

## ✅ Solución 6: Esperar a Desplegar Backend

Si Railway MySQL no permite conexiones externas directas:

1. **Despliega el backend primero** en Railway
2. **Configura las variables de entorno** del backend para conectar a MySQL
3. **Usa Railway CLI para ejecutar el script de importación** desde el servicio backend:

```bash
railway run --service backend node server/init-db.js
```

Esto ejecutará el script desde dentro de Railway, donde sí tiene acceso a MySQL interno.

---

## 🔍 Verificar Conexión Primero

Antes de importar, prueba una conexión simple:

```bash
mysql -h gondola.proxy.rlwy.net -P 18127 -u root -p'AssyoByxyfuUFSMhabDjUYPWtUbwyrJx' -e "SELECT 1;"
```

O en PowerShell con variables:
```powershell
$env:MYSQL_PWD="AssyoByxyfuUFSMhabDjUYPWtUbwyrJx"
mysql -h gondola.proxy.rlwy.net -P 18127 -u root -e "SELECT 1;"
```

---

## ⚠️ Nota Importante

Algunos servicios de Railway MySQL **solo permiten conexiones desde servicios dentro de Railway** (no desde internet). En ese caso:

1. **Despliega el backend primero**
2. **Luego ejecuta el script de importación** usando Railway CLI desde el servicio backend
3. O usa **Railway's Data Import** si está disponible en el dashboard

