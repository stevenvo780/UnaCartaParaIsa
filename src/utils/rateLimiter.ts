/**
 * Rate Limiter para operaciones costosas como regeneración de mapas
 * Previene abuso y protege recursos del sistema
 */

import { logAutopoiesis } from "./logger";

export interface RateLimitConfig {
  windowMs: number; // Ventana de tiempo en ms
  maxRequests: number; // Máximo número de requests en la ventana
  skipSuccessfulRequests?: boolean; // Solo contar requests fallidos
  skipFailedRequests?: boolean; // Solo contar requests exitosos
  keyGenerator?: (context: any) => string; // Generar clave personalizada
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

export interface RequestRecord {
  count: number;
  windowStart: number;
  lastRequest: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private requestCounts = new Map<string, RequestRecord>();
  private readonly cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // Limpieza automática cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Verificar si una operación está permitida bajo rate limiting
   */
  public isAllowed(
    key: string,
    config: RateLimitConfig,
    context?: any,
  ): RateLimitResult {
    const now = Date.now();
    const limitKey = config.keyGenerator ? config.keyGenerator(context) : key;

    // Obtener o crear registro de requests
    let record = this.requestCounts.get(limitKey);

    if (!record) {
      record = {
        count: 0,
        windowStart: now,
        lastRequest: 0,
      };
      this.requestCounts.set(limitKey, record);
    }

    // Verificar si la ventana de tiempo ha expirado
    if (now - record.windowStart >= config.windowMs) {
      // Reset window
      record.count = 0;
      record.windowStart = now;
    }

    const remaining = Math.max(0, config.maxRequests - record.count);
    const resetTime = record.windowStart + config.windowMs;
    const allowed = record.count < config.maxRequests;

    if (allowed) {
      record.count++;
      record.lastRequest = now;
    }

    const result: RateLimitResult = {
      allowed,
      remaining: allowed ? remaining - 1 : remaining,
      resetTime,
      totalHits: record.count,
    };

    // Log si se excede el límite
    if (!allowed) {
      logAutopoiesis.warn("Rate limit excedido", {
        key: limitKey,
        totalHits: record.count,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs,
        resetTime: new Date(resetTime).toISOString(),
      });
    }

    return result;
  }

  /**
   * Consumir un slot de rate limit (para requests exitosos)
   */
  public consume(
    key: string,
    config: RateLimitConfig,
    success: boolean = true,
    context?: any,
  ): RateLimitResult {
    // Solo contar según configuración
    if (config.skipSuccessfulRequests && success) {
      return this.getStatus(key, config, context);
    }

    if (config.skipFailedRequests && !success) {
      return this.getStatus(key, config, context);
    }

    return this.isAllowed(key, config, context);
  }

  /**
   * Obtener estado actual sin consumir slot
   */
  public getStatus(
    key: string,
    config: RateLimitConfig,
    context?: any,
  ): RateLimitResult {
    const limitKey = config.keyGenerator ? config.keyGenerator(context) : key;
    const record = this.requestCounts.get(limitKey);

    if (!record) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs,
        totalHits: 0,
      };
    }

    const now = Date.now();
    const windowExpired = now - record.windowStart >= config.windowMs;

    if (windowExpired) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        totalHits: 0,
      };
    }

    const remaining = Math.max(0, config.maxRequests - record.count);
    const allowed = record.count < config.maxRequests;

    return {
      allowed,
      remaining,
      resetTime: record.windowStart + config.windowMs,
      totalHits: record.count,
    };
  }

  /**
   * Reset rate limit para una clave específica
   */
  public reset(key: string): void {
    this.requestCounts.delete(key);
    logAutopoiesis.info("Rate limit reset", { key });
  }

  /**
   * Reset todos los rate limits
   */
  public resetAll(): void {
    const count = this.requestCounts.size;
    this.requestCounts.clear();
    logAutopoiesis.info("Todos los rate limits reseteados", { count });
  }

  /**
   * Limpieza de registros expirados
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of this.requestCounts.entries()) {
      // Limpiar registros que no se han usado en la última hora
      if (now - record.lastRequest > 3600000) {
        this.requestCounts.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logAutopoiesis.debug("Rate limiter cleanup completed", {
        cleaned,
        remaining: this.requestCounts.size,
      });
    }
  }

  /**
   * Obtener estadísticas del rate limiter
   */
  public getStats() {
    return {
      totalKeys: this.requestCounts.size,
      activeWindows: Array.from(this.requestCounts.values()).filter(
        (record) => Date.now() - record.windowStart < 3600000,
      ).length,
    };
  }

  /**
   * Destruir instancia (para testing)
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requestCounts.clear();
  }
}

/**
 * Configuraciones predefinidas para operaciones comunes
 */
export const RATE_LIMIT_CONFIGS = {
  // Regeneración de mundo - muy restrictivo
  WORLD_GENERATION: {
    windowMs: 60000, // 1 minuto
    maxRequests: 2, // Máximo 2 regeneraciones por minuto
  } as RateLimitConfig,

  // Regeneración de zonas - moderado
  ZONE_GENERATION: {
    windowMs: 30000, // 30 segundos
    maxRequests: 5, // Máximo 5 regeneraciones por 30s
  } as RateLimitConfig,

  // Cálculos de pathfinding - más permisivo
  PATHFINDING: {
    windowMs: 10000, // 10 segundos
    maxRequests: 20, // Máximo 20 cálculos por 10s
    skipSuccessfulRequests: true, // Solo contar fallos
  } as RateLimitConfig,

  // Operaciones de IA - balanceado
  AI_DECISIONS: {
    windowMs: 5000, // 5 segundos
    maxRequests: 10, // Máximo 10 decisiones por 5s
  } as RateLimitConfig,

  // Actualizaciones de emergencia - muy permisivo
  EMERGENCE_UPDATES: {
    windowMs: 30000, // 30 segundos
    maxRequests: 50, // Máximo 50 updates por 30s
  } as RateLimitConfig,
} as const;

/**
 * Función helper para rate limiting rápido
 */
export function checkRateLimit(
  operation: string,
  config: RateLimitConfig,
  context?: any,
): RateLimitResult {
  const rateLimiter = RateLimiter.getInstance();
  return rateLimiter.isAllowed(operation, config, context);
}

/**
 * Decorator para rate limiting de métodos
 */
export function RateLimit(config: RateLimitConfig, keyPrefix?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const rateLimiter = RateLimiter.getInstance();
      const key = keyPrefix ? `${keyPrefix}:${propertyKey}` : propertyKey;

      const result = rateLimiter.isAllowed(key, config, this);

      if (!result.allowed) {
        const error = new Error(
          `Rate limit exceeded for ${key}. Try again at ${new Date(result.resetTime).toISOString()}`,
        );
        (error as any).rateLimitInfo = result;
        throw error;
      }

      try {
        const methodResult = originalMethod.apply(this, args);

        // Si es una Promise, manejar éxito/fallo
        if (methodResult && typeof methodResult.then === "function") {
          return methodResult.catch((error: any) => {
            rateLimiter.consume(key, config, false, this);
            throw error;
          });
        }

        return methodResult;
      } catch (error) {
        rateLimiter.consume(key, config, false, this);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Instancia singleton del rate limiter
 */
export const rateLimiter = RateLimiter.getInstance();
