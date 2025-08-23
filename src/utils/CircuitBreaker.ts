/**
 * Circuit Breaker pattern para prevenir cascade failures
 * Protege sistemas críticos de fallos en cascada
 */

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, calls fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service is back
}

export interface CircuitBreakerOptions {
  failureThreshold: number;     // Número de fallos antes de abrir
  resetTimeout: number;         // Tiempo en ms antes de intentar cerrar
  monitoringWindow: number;     // Ventana de tiempo para contar fallos
  successThreshold: number;     // Intentos exitosos para cerrar desde HALF_OPEN
}

export class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private name: string;
  private options: CircuitBreakerOptions;

  // Track failure timestamps for sliding window
  private failures: number[] = [];

  constructor(name: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.name = name;
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeout: options.resetTimeout ?? 10000, // 10 segundos
      monitoringWindow: options.monitoringWindow ?? 60000, // 1 minuto
      successThreshold: options.successThreshold ?? 3
    };
  }

  /**
   * Ejecuta una función protegida por circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        console.log(`🔄 Circuit breaker ${this.name}: Transitioning to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Ejecuta una función síncrona protegida
   */
  executeSync<T>(fn: () => T): T {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        console.log(`🔄 Circuit breaker ${this.name}: Transitioning to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        console.log(`✅ Circuit breaker ${this.name}: Closed after successful recovery`);
      }
    }
  }

  private onFailure(): void {
    const now = Date.now();
    this.lastFailureTime = now;
    this.failures.push(now);
    
    // Clean old failures outside monitoring window
    this.cleanOldFailures();
    
    if (this.state === CircuitState.HALF_OPEN) {
      // If we fail in half-open, go back to open
      this.state = CircuitState.OPEN;
      this.successCount = 0;
      console.log(`⚠️ Circuit breaker ${this.name}: Back to OPEN after failure during recovery`);
    } else if (this.state === CircuitState.CLOSED) {
      if (this.failures.length >= this.options.failureThreshold) {
        this.state = CircuitState.OPEN;
        console.log(`🚨 Circuit breaker ${this.name}: OPENED due to ${this.failures.length} failures`);
      }
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.options.resetTimeout;
  }

  private cleanOldFailures(): void {
    const now = Date.now();
    const cutoff = now - this.options.monitoringWindow;
    this.failures = this.failures.filter(timestamp => timestamp > cutoff);
  }

  /**
   * Fuerza el circuito a abrirse
   */
  public forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.lastFailureTime = Date.now();
    console.log(`🔒 Circuit breaker ${this.name}: Manually opened`);
  }

  /**
   * Fuerza el circuito a cerrarse
   */
  public forceClose(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.failures = [];
    console.log(`🔓 Circuit breaker ${this.name}: Manually closed`);
  }

  /**
   * Resetea estadísticas pero mantiene el estado actual
   */
  public reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.failures = [];
    this.lastFailureTime = 0;
  }

  /**
   * Obtiene el estado actual del circuit breaker
   */
  public getState(): {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime: number;
  } {
    return {
      state: this.state,
      failures: this.failures.length,
      successes: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }

  /**
   * Verifica si el circuit breaker está disponible para llamadas
   */
  public isAvailable(): boolean {
    return this.state === CircuitState.CLOSED || 
           (this.state === CircuitState.HALF_OPEN);
  }
}

/**
 * Factory para crear circuit breakers con configuraciones predefinidas
 */
export class CircuitBreakerFactory {
  private static instances = new Map<string, CircuitBreaker>();

  /**
   * Circuit breaker para sistemas críticos (muy sensible)
   */
  static createCritical(name: string): CircuitBreaker {
    if (!this.instances.has(name)) {
      this.instances.set(name, new CircuitBreaker(name, {
        failureThreshold: 3,     // Fallos muy bajos
        resetTimeout: 5000,      // Recovery rápido
        monitoringWindow: 30000, // Ventana corta
        successThreshold: 2      // Pocos éxitos para cerrar
      }));
    }
    return this.instances.get(name)!;
  }

  /**
   * Circuit breaker para sistemas normales
   */
  static createNormal(name: string): CircuitBreaker {
    if (!this.instances.has(name)) {
      this.instances.set(name, new CircuitBreaker(name, {
        failureThreshold: 5,
        resetTimeout: 10000,
        monitoringWindow: 60000,
        successThreshold: 3
      }));
    }
    return this.instances.get(name)!;
  }

  /**
   * Circuit breaker para sistemas tolerantes a fallos
   */
  static createTolerant(name: string): CircuitBreaker {
    if (!this.instances.has(name)) {
      this.instances.set(name, new CircuitBreaker(name, {
        failureThreshold: 10,
        resetTimeout: 30000,
        monitoringWindow: 120000,
        successThreshold: 5
      }));
    }
    return this.instances.get(name)!;
  }

  /**
   * Obtiene estadísticas de todos los circuit breakers
   */
  static getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    this.instances.forEach((breaker, name) => {
      stats[name] = breaker.getState();
    });
    return stats;
  }
}