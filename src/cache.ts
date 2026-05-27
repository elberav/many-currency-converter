interface CacheItem {
  value: number;
  expiry: number;
}

class RamCache {
  private cache: Map<string, CacheItem> = new Map();

  // Guarda un valor en caché. ttlInSeconds es el tiempo de vida en segundos.
  set(key: string, value: number, ttlInSeconds: number): void {
    const expiry = Date.now() + ttlInSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  // Obtiene un valor. Si no existe o expiró, retorna null.
  get(key: string): number | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }
}

export const cache = new RamCache();
