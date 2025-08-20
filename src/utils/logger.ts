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

export const logger = {
  debug: (message: string, data?: LogData) => {
    if (console.debug) {
      console.debug(`🐛 ${message}`, data || '');
    }
  },

  info: (message: string, data?: LogData) => {
    console.info(`ℹ️ ${message}`, data || '');
  },

  warn: (message: string, data?: LogData) => {
    console.warn(`⚠️ ${message}`, data || '');
  },

  error: (message: string, error?: LogData) => {
    console.error(`❌ ${message}`, error || '');
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
