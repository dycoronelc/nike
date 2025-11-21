# Comandos para Push a GitHub

## Comandos Básicos

```bash
# 1. Agregar los archivos modificados al staging
git add railway.json package.json

# 2. Hacer commit con un mensaje descriptivo
git commit -m "Fix Railway configuration: remove startCommand and add frontend start script"

# 3. Hacer push a GitHub
git push origin main
```

## Si prefieres agregar todos los cambios

```bash
# Agregar todos los archivos modificados y nuevos
git add .

# Commit
git commit -m "Fix Railway configuration and add deployment documentation"

# Push
git push origin main
```

## Verificar antes de hacer push

```bash
# Ver qué archivos están modificados
git status

# Ver los cambios específicos
git diff railway.json
```

## Si hay problemas con el push

```bash
# Si necesitas hacer pull primero (si hay cambios remotos)
git pull origin main

# Luego hacer push
git push origin main
```

