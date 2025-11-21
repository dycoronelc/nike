# 📤 Comandos para Subir Código a GitHub

## Estado Actual
✅ Archivos grandes excluidos (Excel/CSV)
✅ Repositorio limpio
✅ Commits listos

## Comandos a Ejecutar:

### 1. Verificar estado (opcional)
```bash
git status
```

### 2. Hacer push a GitHub
```bash
git push -u origin main
```

O si ya tienes el upstream configurado:
```bash
git push
```

## ⚠️ Si pide autenticación:

### Opción A: Usar Personal Access Token (Recomendado)
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Selecciona scope: `repo`
4. Copia el token
5. Cuando git pida contraseña, usa el **token** en lugar de tu contraseña

### Opción B: Usar SSH (Alternativa)
```bash
git remote set-url origin git@github.com:dycoronelc/nike.git
git push -u origin main
```

## ✅ Verificación

Después del push, verifica en GitHub:
- https://github.com/dycoronelc/nike

Deberías ver:
- ✅ Todo el código fuente
- ✅ Archivos de configuración
- ❌ NO deberías ver: `*.xlsx`, `*.csv` (están en .gitignore)

## 📝 Nota sobre los Archivos de Datos

Los archivos Excel/CSV grandes **NO están en el repo** porque:
- La data ya está cargada en MySQL
- Para inicializar la BD en Railway, usas el script `server/init-db.js` desde tu máquina local con las credenciales de Railway
- O puedes usar Railway CLI para ejecutar el script

