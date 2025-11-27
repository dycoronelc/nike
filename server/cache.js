// Sistema de cache simple en memoria para resultados costosos
// TTL (Time To Live) en milisegundos

const cache = new Map();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos por defecto

/**
 * Obtener valor del cache
 * @param {string} key - Clave del cache
 * @returns {any|null} - Valor cacheado o null si no existe o expiró
 */
export function get(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  // Verificar si expiró
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
}

/**
 * Guardar valor en cache
 * @param {string} key - Clave del cache
 * @param {any} value - Valor a cachear
 * @param {number} ttl - Tiempo de vida en milisegundos (default: 5 minutos)
 */
export function set(key, value, ttl = DEFAULT_TTL) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttl
  });
}

/**
 * Eliminar valor del cache
 * @param {string} key - Clave del cache
 */
export function del(key) {
  cache.delete(key);
}

/**
 * Limpiar todo el cache
 */
export function clear() {
  cache.clear();
}

/**
 * Invalidar cache por patrón (útil para invalidar grupos relacionados)
 * @param {string} pattern - Patrón de clave (ej: 'clusters:*')
 */
export function invalidatePattern(pattern) {
  const regex = new RegExp(pattern.replace('*', '.*'));
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
}

/**
 * Obtener estadísticas del cache
 */
export function getStats() {
  const now = Date.now();
  let valid = 0;
  let expired = 0;
  
  for (const item of cache.values()) {
    if (now > item.expiresAt) {
      expired++;
    } else {
      valid++;
    }
  }
  
  return {
    total: cache.size,
    valid,
    expired
  };
}

// Limpiar cache expirado cada 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now > item.expiresAt) {
      cache.delete(key);
    }
  }
}, 10 * 60 * 1000);

