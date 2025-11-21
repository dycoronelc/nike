# 💻 Importar usando Cliente MySQL GUI (Recomendado para archivos grandes)

## 🎯 Opción A: MySQL Workbench (Recomendado)

### Paso 1: Descargar MySQL Workbench
1. Ve a: https://dev.mysql.com/downloads/workbench/
2. Descarga e instala MySQL Workbench

### Paso 2: Crear Nueva Conexión

1. Abre **MySQL Workbench**
2. Click en **"+"** junto a "MySQL Connections"
3. Configura la conexión:
   - **Connection Name:** `Railway MySQL`
   - **Hostname:** `gondola.proxy.rlwy.net`
   - **Port:** `18127`
   - **Username:** `root`
   - **Password:** `AssyoByxyfuUFSMhabDjUYPWtUbwyrJx`
   - **Default Schema:** `railway` (opcional)
4. Click **"Test Connection"** para verificar
5. Click **"OK"**

### Paso 3: Conectar e Importar

1. Haz doble click en la conexión **"Railway MySQL"** para conectarte
2. Una vez conectado, ve a **Server** → **Data Import**
3. Selecciona **"Import from Self-Contained File"**
4. Click en **"..."** y selecciona tu archivo SQL (`tu_archivo.sql`)
5. En **"Default Target Schema"** selecciona `railway` o crea una nueva
6. Click en **"Start Import"**
7. Espera a que termine (puede tardar varios minutos para 218 MB)

---

## 🎯 Opción B: HeidiSQL (Más ligero, Windows)

### Paso 1: Descargar HeidiSQL
1. Ve a: https://www.heidisql.com/download.php
2. Descarga e instala HeidiSQL

### Paso 2: Crear Nueva Conexión

1. Abre **HeidiSQL**
2. Click en **"New"** en la ventana de conexiones
3. Configura:
   - **Network type:** `MySQL (TCP/IP)`
   - **Hostname / IP:** `gondola.proxy.rlwy.net`
   - **User:** `root`
   - **Password:** `AssyoByxyfuUFSMhabDjUYPWtUbwyrJx`
   - **Port:** `18127`
   - **Database:** `railway`
4. Click **"Save"** y luego **"Open"**

### Paso 3: Importar

1. Una vez conectado, haz click derecho en la base de datos `railway`
2. Selecciona **"Load SQL file..."**
3. Selecciona tu archivo SQL
4. Click **"Execute"**
5. Espera a que termine

---

## 🎯 Opción C: DBeaver (Multiplataforma, Gratis)

### Paso 1: Descargar DBeaver
1. Ve a: https://dbeaver.io/download/
2. Descarga e instala DBeaver Community Edition

### Paso 2: Crear Nueva Conexión

1. Abre **DBeaver**
2. Click en **"New Database Connection"** (icono de enchufe)
3. Selecciona **"MySQL"**
4. Configura:
   - **Host:** `gondola.proxy.rlwy.net`
   - **Port:** `18127`
   - **Database:** `railway`
   - **Username:** `root`
   - **Password:** `AssyoByxyfuUFSMhabDjUYPWtUbwyrJx`
5. Click **"Test Connection"** (puede pedirte descargar driver MySQL)
6. Click **"Finish"**

### Paso 3: Importar

1. Haz click derecho en la base de datos `railway`
2. Selecciona **"Tools"** → **"Execute Script"**
3. Selecciona tu archivo SQL
4. Click **"Start"**

---

## ✅ Verificación Después de Importar

Ejecuta este SQL en cualquiera de los clientes:

```sql
SELECT 
  'sell_in' as tabla, COUNT(*) as registros FROM sell_in
UNION ALL
SELECT 'sell_out', COUNT(*) FROM sell_out
UNION ALL
SELECT 'inventario', COUNT(*) FROM inventario;
```

Esto te mostrará cuántos registros tiene cada tabla.

