// Simple logging system for development
export const logger = {
  debug: (message: string, data?: any) => {
    if (console.debug) {
      console.debug(`🐛 ${message}`, data || '');
    }
  },
  
  info: (message: string, data?: any) => {
    console.info(`ℹ️ ${message}`, data || '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ ${message}`, data || '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error || '');
  }
};

// Autopoiesis logging (simplified for now)
export const logAutopoiesis = {
  debug: (message: string, data?: any) => {
    logger.debug(`[Autopoiesis] ${message}`, data);
  },
  
  info: (message: string, data?: any) => {
    logger.info(`[Autopoiesis] ${message}`, data);
  },
  
  warn: (message: string, data?: any) => {
    logger.warn(`[Autopoiesis] ${message}`, data);
  },
  
  error: (message: string, error?: any) => {
    logger.error(`[Autopoiesis] ${message}`, error);
  }
};
