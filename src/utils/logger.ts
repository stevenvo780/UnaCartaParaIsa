/**
 * Tipos de datos válidos para logging
 */
export type LogData =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null
  | undefined
  | Error;

/**
 * Niveles de logging y configuración
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

/**
 * Configuración global de logging
 */
const CONFIG = {
  // En desarrollo muestra INFO+, en producción solo WARN+
  level: import.meta.env.DEV ? LogLevel.INFO : LogLevel.WARN,

  // Sistemas que pueden generar spam - limitados a INFO+ incluso en dev
  throttledSystems: new Set([
    "Animation played",
    "Decoration culling",
    "Asset placed",
    "Game cycle",
  ]),
};

/**
 * Sistema de throttling para evitar spam de logs
 */
const logThrottle = new Map<string, { count: number; lastLog: number }>();

/**
 * Revisa si un mensaje debe ser throttled
 */
function shouldThrottle(message: string): boolean {
  // Buscar sistemas conocidos que generan spam
  const isThrottledSystem = Array.from(CONFIG.throttledSystems).some((system) =>
    message.includes(system),
  );

  if (!isThrottledSystem) return false;

  const now = Date.now();
  const key = message.split(" ").slice(0, 3).join(" "); // Usar las primeras 3 palabras como key
  const entry = logThrottle.get(key);

  if (!entry) {
    logThrottle.set(key, { count: 1, lastLog: now });
    return false;
  }

  entry.count++;

  // Solo logear cada 5 segundos para mensajes throttled
  if (now - entry.lastLog > 5000) {
    entry.lastLog = now;
    return false;
  }

  return true;
}

export const logger = {
  debug: (message: string, data?: LogData) => {
    if (CONFIG.level > LogLevel.DEBUG) return;
    if (shouldThrottle(message)) return;

    if (console.debug) {
      console.debug(`🐛 ${message}`, data || "");
    }
  },

  info: (message: string, data?: LogData) => {
    if (CONFIG.level > LogLevel.INFO) return;
    if (shouldThrottle(message)) return;

    console.info(`ℹ️ ${message}`, data || "");
  },

  warn: (message: string, data?: LogData) => {
    if (CONFIG.level > LogLevel.WARN) return;
    console.warn(`⚠️ ${message}`, data || "");
  },

  error: (message: string, error?: LogData) => {
    if (CONFIG.level > LogLevel.ERROR) return;
    console.error(`❌ ${message}`, error || "");
  },
};

export const logAutopoiesis = {
  debug: (message: string, data?: LogData) => {
    logger.debug(`[Autopoiesis] ${message}`, data);
  },

  info: (message: string, data?: LogData) => {
    logger.info(`[Autopoiesis] ${message}`, data);
  },

  warn: (message: string, data?: LogData) => {
    logger.warn(`[Autopoiesis] ${message}`, data);
  },

  error: (message: string, error?: LogData) => {
    logger.error(`[Autopoiesis] ${message}`, error);
  },
};

/**
 * Utilidad para cambiar el nivel de logging en runtime
 */
export function setLogLevel(level: LogLevel): void {
  CONFIG.level = level;
  console.info(`🔧 Log level changed to: ${LogLevel[level]}`);
}

/**
 * Utilidad para debugging - muestra estadísticas de throttling
 */
export function getLogStats(): Record<
  string,
  { count: number; lastLog: number }
> {
  const stats: Record<string, { count: number; lastLog: number }> = {};
  logThrottle.forEach((value, key) => {
    stats[key] = value;
  });
  return stats;
}
