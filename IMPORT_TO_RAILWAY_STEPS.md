# 📥 Importar Base de Datos a Railway - Pasos Exactos

## ✅ Paso 1: Obtener Credenciales de Railway MySQL

1. Ve a **Railway.app** → Tu proyecto
2. Click en el **servicio MySQL** que creaste
3. Ve a la pestaña **"Variables"** o **"Connect"**
4. Copia estas variables (son sensibles, mantenlas seguras):
   - `MYSQLHOST` o `MYSQLHOSTNAME`
   - `MYSQLPORT` (generalmente `3306`)
   - `MYSQLDATABASE` o `MYSQL_DATABASE`
   - `MYSQLUSER` o `MYSQLUSERNAME`
   - `MYSQLPASSWORD` o `MYSQL_ROOT_PASSWORD`

**Ejemplo de cómo se ven:**
```
MYSQLHOST=mysql-production.railway.internal
MYSQLPORT=3306
MYSQLDATABASE=railway
MYSQLUSER=root
MYSQLPASSWORD=abc123xyz789...
```

---

## 📤 Paso 2: Importar el Archivo SQL

### Opción A: Usando mysql desde línea de comandos (Recomendado)

**Comando básico:**
```bash
mysql -h MYSQLHOST -P MYSQLPORT -u MYSQLUSER -p'MYSQLPASSWORD' MYSQLDATABASE < tu_archivo.sql
```

**Ejemplo con valores reales:**
```bash
mysql -h mysql-production.railway.internal \
      -P 3306 \
      -u root \
      -p'TuPassword123' \
      railway \
      < nike_dashboard_export.sql
```

### Opción B: Si tienes problemas con caracteres especiales en la contraseña

```bash
# En Windows PowerShell
$env:MYSQL_PWD="TuPassword123"
mysql -h mysql-production.railway.internal -P 3306 -u root railway < nike_dashboard_export.sql
```

### Opción C: Especificar archivo completo (si el archivo no está en la ruta actual)

```bash
mysql -h MYSQLHOST -P MYSQLPORT -u MYSQLUSER -p'MYSQLPASSWORD' MYSQLDATABASE < C:\ruta\completa\a\tu\archivo.sql
```

---

## ⚠️ Si el archivo es muy grande (218 MB)

El archivo puede tardar varios minutos en importarse. Para archivos grandes:

### 1. Aumentar timeout (opcional)
```bash
mysql -h MYSQLHOST -P MYSQLPORT -u MYSQLUSER -p'MYSQLPASSWORD' \
      --max_allowed_packet=1G \
      --net_buffer_length=16384 \
      MYSQLDATABASE < tu_archivo.sql
```

### 2. Monitorear el progreso
El comando no muestra progreso por defecto, pero puedes:
- Abrir otra terminal y verificar con:
```bash
mysql -h MYSQLHOST -u MYSQLUSER -p'MYSQLPASSWORD' MYSQLDATABASE -e "SELECT COUNT(*) FROM sell_in;"
```

### 3. Si tienes errores de timeout
Algunos servicios de Railway pueden tener timeout. En ese caso:
- Importa durante horas de bajo tráfico
- O divide el archivo SQL en partes más pequeñas

---

## 🔍 Paso 3: Verificar Importación

Después de que termine la importación (puede tardar 5-15 minutos), verifica:

```bash
mysql -h MYSQLHOST -u MYSQLUSER -p'MYSQLPASSWORD' MYSQLDATABASE -e "
  SELECT 
    'sell_in' as tabla, COUNT(*) as registros FROM sell_in
  UNION ALL
  SELECT 'sell_out', COUNT(*) FROM sell_out
  UNION ALL
  SELECT 'inventario', COUNT(*) FROM inventario;
"
```

O ejecuta este SQL:
```sql
SELECT 
  'sell_in' as tabla, COUNT(*) as registros FROM sell_in
UNION ALL
SELECT 'sell_out', COUNT(*) FROM sell_out
UNION ALL
SELECT 'inventario', COUNT(*) FROM inventario;
```

---

## 🚨 Problemas Comunes

### Error: "Access denied"
- Verifica que las credenciales sean correctas
- Asegúrate de que el usuario tenga permisos

### Error: "Can't connect to MySQL server"
- Verifica que el HOST sea correcto
- Railway MySQL puede requerir conexión desde servicios de Railway
- En ese caso, usa Railway CLI o espera a tener el backend desplegado

### Error: "Too many connections"
- Espera unos minutos e intenta de nuevo
- O cierra otras conexiones MySQL

### El archivo es demasiado grande y MySQL rechaza la conexión
- Usa un cliente MySQL GUI (Workbench, HeidiSQL) que maneja mejor archivos grandes
- O divide el archivo SQL manualmente

---

## 💡 Alternativa: Usar Cliente MySQL GUI

Si el comando de línea no funciona, usa un cliente gráfico:

1. **MySQL Workbench** (gratis)
2. **HeidiSQL** (gratis, Windows)
3. **DBeaver** (gratis, multiplataforma)

**Pasos:**
1. Crea nueva conexión con las credenciales de Railway
2. Conéctate
3. File → Load SQL file / Execute Script
4. Selecciona tu archivo `.sql`
5. Ejecuta

---

## ✅ Checklist

- [ ] Credenciales de Railway MySQL copiadas
- [ ] Comando de importación listo con tus credenciales
- [ ] Archivo SQL ubicado correctamente
- [ ] Importación ejecutada
- [ ] Verificación de registros completada

