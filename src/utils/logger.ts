/** Tipos de datos válidos para logging */
export type LogData =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null
  | undefined
  | Error;

/** Niveles de logging y configuración */
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

/** Configuración global de logging orientada a rendimiento */
const CONFIG = {
    level: LogLevel.ERROR,
    // Sistemas silenciados para evitar spam frecuente
    throttledSystems: new Set([
        "Animation played",
        "Decoration culling",
        "Asset placed",
        "Game cycle",
        "updateEntity",
        "Diálogo mostrado",
        "resonance updated",
        "sprite updated",
        "changed activity",
        "visuals created",
    ]),
};

/** Sistema de throttling para evitar spam de logs */
const logThrottle = new Map<string, { count: number; lastLog: number }>();

/** Indica si un mensaje debe ser limitado (throttled) */
function shouldThrottle(message: string): boolean {
    // Buscar sistemas conocidos que generan spam
    const isThrottledSystem = Array.from(CONFIG.throttledSystems).some((system) =>
        message.includes(system),
    );

    if (!isThrottledSystem) return false;

    const now = Date.now();
    const key = message.split(" ").slice(0, 3).join(" ");
    const entry = logThrottle.get(key);

    if (!entry) {
        logThrottle.set(key, { count: 1, lastLog: now });
        return false;
    }

    entry.count++;

    // Solo registrar cada 5 segundos para mensajes limitados
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

