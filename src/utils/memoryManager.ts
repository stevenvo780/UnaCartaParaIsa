/**
 * Gestor de memoria y streaming para cargas grandes
 * Previene agotamiento de memoria y mejora rendimiento
 */

import { logAutopoiesis } from "./logger";

interface MemoryLimits {
  readonly MAX_CACHE_SIZE_MB: number;
  readonly MAX_ARRAYS_LENGTH: number;
  readonly MAX_CONCURRENT_OPERATIONS: number;
  readonly CLEANUP_INTERVAL_MS: number;
  readonly LOW_MEMORY_THRESHOLD_MB: number;
}

const MEMORY_LIMITS: MemoryLimits = {
  MAX_CACHE_SIZE_MB: 50, // 50MB máximo en cache
  MAX_ARRAYS_LENGTH: 50000, // 50k elementos máximo por array (aumentado para world generation)
  MAX_CONCURRENT_OPERATIONS: 5, // 5 operaciones concurrentes máximo
  CLEANUP_INTERVAL_MS: 30000, // Limpiar cada 30 segundos
  LOW_MEMORY_THRESHOLD_MB: 100, // Alerta si queda menos de 100MB
} as const;

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  size: number; // Tamaño estimado en bytes
  accessCount: number;
  lastAccess: number;
}

export interface MemoryStats {
  totalCacheSize: number;
  entryCount: number;
  hitRate: number;
  oldestEntry: number;
  estimatedMemoryUsage: number;
}

export class MemoryManager {
  private static instance: MemoryManager;
  private cache = new Map<string, CacheEntry>();
  private totalCacheSize = 0;
  private hitCount = 0;
  private missCount = 0;
  private lastCleanup = 0;
  private activeOperations = 0;

  private constructor() {
    this.startPeriodicCleanup();
    this.monitorMemoryUsage();
  }

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Almacenar datos en cache con límites de memoria
   */
  public set<T>(key: string, data: T, ttl: number = 300000): boolean {
    try {
      // Verificar si hay demasiadas operaciones concurrentes
      if (this.activeOperations >= MEMORY_LIMITS.MAX_CONCURRENT_OPERATIONS) {
        logAutopoiesis.warn(
          "Demasiadas operaciones concurrentes, rechazando cache",
        );
        return false;
      }

      this.activeOperations++;

      const size = this.estimateSize(data);
      const maxSizeBytes = MEMORY_LIMITS.MAX_CACHE_SIZE_MB * 1024 * 1024;

      // Verificar si agregar este elemento excedería el límite
      if (this.totalCacheSize + size > maxSizeBytes) {
        // Intentar limpiar cache para hacer espacio
        this.evictLRU(size);

        // Si aún no hay espacio suficiente, rechazar
        if (this.totalCacheSize + size > maxSizeBytes) {
          logAutopoiesis.warn("Cache lleno, no se puede almacenar", {
            requestedSize: size,
            currentSize: this.totalCacheSize,
            maxSize: maxSizeBytes,
          });
          this.activeOperations--;
          return false;
        }
      }

      const now = Date.now();
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        size,
        accessCount: 0,
        lastAccess: now,
      };

      // Remover entrada existente si existe
      if (this.cache.has(key)) {
        const existing = this.cache.get(key)!;
        this.totalCacheSize -= existing.size;
      }

      this.cache.set(key, entry);
      this.totalCacheSize += size;

      // Programar limpieza automática
      if (ttl > 0) {
        setTimeout(() => {
          this.delete(key);
        }, ttl);
      }

      this.activeOperations--;
      return true;
    } catch (error) {
      logAutopoiesis.error("Error al establecer cache", error);
      this.activeOperations--;
      return false;
    }
  }

  /**
   * Recuperar datos del cache
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    // Actualizar estadísticas de acceso
    entry.accessCount++;
    entry.lastAccess = Date.now();
    this.hitCount++;

    return entry.data as T;
  }

  /**
   * Eliminar entrada del cache
   */
  public delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.totalCacheSize -= entry.size;
      this.cache.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Verificar si una clave existe en cache
   */
  public has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Limpiar cache completamente
   */
  public clear(): void {
    this.cache.clear();
    this.totalCacheSize = 0;
    logAutopoiesis.info("Cache limpiado completamente");
  }

  /**
   * Procesar array grande en chunks para evitar bloqueo
   */
  public async processArrayInChunks<T, R>(
    array: T[],
    processor: (chunk: T[]) => Promise<R[]> | R[],
    chunkSize: number = 1000,
  ): Promise<R[]> {
    if (array.length > MEMORY_LIMITS.MAX_ARRAYS_LENGTH) {
      logAutopoiesis.warn("Array demasiado grande para procesar", {
        length: array.length,
        maxLength: MEMORY_LIMITS.MAX_ARRAYS_LENGTH,
      });
      throw new Error(
        `Array excede límite máximo de ${MEMORY_LIMITS.MAX_ARRAYS_LENGTH} elementos`,
      );
    }

    const results: R[] = [];

    for (let i = 0; i < array.length; i += chunkSize) {
      // Verificar memoria antes de cada chunk
      if (this.isMemoryLow()) {
        logAutopoiesis.warn("Memoria baja detectada, pausando procesamiento");
        await this.waitForMemoryImprovement();
      }

      const chunk = array.slice(i, i + chunkSize);

      try {
        const chunkResults = await processor(chunk);
        results.push(...chunkResults);

        // Yield control to prevent blocking
        await this.yieldControl();
      } catch (error) {
        logAutopoiesis.error(
          `Error procesando chunk ${i}-${i + chunkSize}`,
          error,
        );
        throw error;
      }
    }

    return results;
  }

  /**
   * Streaming de generación de mundo
   */
  public async *streamWorldGeneration<T>(
    generator: () => Generator<T>,
    batchSize: number = 100,
  ): AsyncGenerator<T[]> {
    const gen = generator();
    let batch: T[] = [];

    for (const item of gen) {
      batch.push(item);

      if (batch.length >= batchSize) {
        // Verificar memoria antes de yield
        if (this.isMemoryLow()) {
          await this.waitForMemoryImprovement();
        }

        yield batch;
        batch = [];
        await this.yieldControl();
      }
    }

    // Yield último batch si no está vacío
    if (batch.length > 0) {
      yield batch;
    }
  }

  /**
   * Estimar tamaño de objeto en bytes
   */
  private estimateSize(obj: any): number {
    const seen = new WeakSet();

    const estimate = (obj: any): number => {
      if (obj === null || obj === undefined) return 0;
      if (seen.has(obj)) return 0;

      const type = typeof obj;

      switch (type) {
        case "boolean":
          return 1;
        case "number":
          return 8;
        case "string":
          return obj.length * 2; // UTF-16
        case "object":
          if (seen.has(obj)) return 0;
          seen.add(obj);

          if (Array.isArray(obj)) {
            return obj.reduce((size, item) => size + estimate(item), 0);
          } else {
            return Object.keys(obj).reduce((size, key) => {
              return size + key.length * 2 + estimate(obj[key]);
            }, 0);
          }
        default:
          return 0;
      }
    };

    return estimate(obj);
  }

  /**
   * Desalojar elementos menos usados recientemente (LRU)
   */
  private evictLRU(spaceNeeded: number): void {
    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.lastAccess - b.lastAccess,
    );

    let freedSpace = 0;
    let evicted = 0;

    for (const [key, entry] of entries) {
      if (freedSpace >= spaceNeeded) break;

      this.delete(key);
      freedSpace += entry.size;
      evicted++;
    }

    logAutopoiesis.info("Cache LRU eviction completed", {
      evicted,
      freedSpace,
      spaceNeeded,
    });
  }

  /**
   * Limpieza periódica automática
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.performCleanup();
    }, MEMORY_LIMITS.CLEANUP_INTERVAL_MS);
  }

  /**
   * Realizar limpieza de cache
   */
  private performCleanup(): void {
    const now = Date.now();
    const beforeSize = this.cache.size;
    const maxAge = 600000; // 10 minutos

    // Remover entradas viejas
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.delete(key);
      }
    }

    const afterSize = this.cache.size;
    const cleaned = beforeSize - afterSize;

    if (cleaned > 0) {
      logAutopoiesis.info("Limpieza automática de cache completada", {
        cleaned,
        remaining: afterSize,
        totalSize: this.totalCacheSize,
      });
    }

    this.lastCleanup = now;
  }

  /**
   * Monitorear uso de memoria
   */
  private monitorMemoryUsage(): void {
    if (
      typeof window !== "undefined" &&
      "performance" in window &&
      "memory" in (window.performance as any)
    ) {
      setInterval(() => {
        const memory = (window.performance as any).memory;
        const usedMB = memory.usedJSHeapSize / (1024 * 1024);
        const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);

        if (limitMB - usedMB < MEMORY_LIMITS.LOW_MEMORY_THRESHOLD_MB) {
          logAutopoiesis.warn("Memoria baja detectada", {
            usedMB: Math.round(usedMB),
            limitMB: Math.round(limitMB),
            remainingMB: Math.round(limitMB - usedMB),
          });

          // Forzar limpieza agresiva
          this.aggressiveCleanup();
        }
      }, 10000); // Verificar cada 10 segundos
    }
  }

  /**
   * Verificar si la memoria está baja
   */
  private isMemoryLow(): boolean {
    if (
      typeof window !== "undefined" &&
      "performance" in window &&
      "memory" in (window.performance as any)
    ) {
      const memory = (window.performance as any).memory;
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
      return limitMB - usedMB < MEMORY_LIMITS.LOW_MEMORY_THRESHOLD_MB;
    }
    return false;
  }

  /**
   * Esperar a que mejore la memoria
   */
  private async waitForMemoryImprovement(
    maxWait: number = 5000,
  ): Promise<void> {
    const startTime = Date.now();

    while (this.isMemoryLow() && Date.now() - startTime < maxWait) {
      // Forzar garbage collection si está disponible
      if (typeof window !== "undefined" && (window as any).gc) {
        (window as any).gc();
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Yield control para evitar bloqueo
   */
  private async yieldControl(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  /**
   * Limpieza agresiva en caso de memoria baja
   */
  private aggressiveCleanup(): void {
    const entriesBefore = this.cache.size;

    // Remover 50% de las entradas menos usadas
    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.accessCount - b.accessCount,
    );

    const toRemove = Math.floor(entries.length * 0.5);

    for (let i = 0; i < toRemove; i++) {
      this.delete(entries[i][0]);
    }

    logAutopoiesis.warn("Limpieza agresiva de memoria completada", {
      removed: toRemove,
      before: entriesBefore,
      after: this.cache.size,
    });
  }

  /**
   * Obtener estadísticas de memoria
   */
  public getMemoryStats(): MemoryStats {
    const now = Date.now();
    let oldestEntry = now;

    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
    }

    const totalAccesses = this.hitCount + this.missCount;
    const hitRate = totalAccesses > 0 ? this.hitCount / totalAccesses : 0;

    return {
      totalCacheSize: this.totalCacheSize,
      entryCount: this.cache.size,
      hitRate,
      oldestEntry: now - oldestEntry,
      estimatedMemoryUsage: this.totalCacheSize / (1024 * 1024), // MB
    };
  }

  /**
   * Forzar limpieza inmediata
   */
  public forceCleanup(): void {
    this.performCleanup();
  }
}

/**
 * Instancia singleton del gestor de memoria
 */
export const memoryManager = MemoryManager.getInstance();
