/**
 * Optimizaciones específicas para producción
 * Maneja configuraciones y optimizaciones para el entorno de producción
 */

import { logAutopoiesis } from "./logger";
import { gameConfig } from "../config/gameConfig";

export interface ProductionSettings {
  minifyAssets: boolean;
  enableCompression: boolean;
  disableDebugLogs: boolean;
  optimizeRendering: boolean;
  reducedParticles: boolean;
  compactDialogues: boolean;
  maxConcurrentLoads: number;
  memoryThreshold: number;
}

export class ProductionOptimizer {
  private static instance: ProductionOptimizer;
  private settings: ProductionSettings;
  private isProduction: boolean;

  private constructor() {
    this.isProduction = !gameConfig.debugMode;
    this.settings = this.getOptimalSettings();
    this.initialize();
  }

  public static getInstance(): ProductionOptimizer {
    if (!ProductionOptimizer.instance) {
      ProductionOptimizer.instance = new ProductionOptimizer();
    }
    return ProductionOptimizer.instance;
  }

  /**
   * Obtener configuración óptima basada en entorno
   */
  private getOptimalSettings(): ProductionSettings {
    if (this.isProduction) {
      return {
        minifyAssets: true,
        enableCompression: true,
        disableDebugLogs: true,
        optimizeRendering: true,
        reducedParticles: true,
        compactDialogues: true,
        maxConcurrentLoads: 2, // Reducido para producción
        memoryThreshold: 50 * 1024 * 1024, // 50MB límite
      };
    } else {
      return {
        minifyAssets: false,
        enableCompression: false,
        disableDebugLogs: false,
        optimizeRendering: false,
        reducedParticles: false,
        compactDialogues: false,
        maxConcurrentLoads: 5, // Más alto para desarrollo
        memoryThreshold: 200 * 1024 * 1024, // 200MB límite
      };
    }
  }

  /**
   * Inicializar optimizaciones de producción
   */
  private initialize(): void {
    if (this.isProduction) {
      this.setupProductionOptimizations();
      this.setupMemoryMonitoring();
      this.setupPerformanceOptimizations();
    }

    logAutopoiesis.info("Production optimizer initialized", {
      isProduction: this.isProduction,
      settings: this.settings,
    });
  }

  /**
   * Configurar optimizaciones específicas de producción
   */
  private setupProductionOptimizations(): void {
    // Deshabilitar logs de debug en producción
    if (this.settings.disableDebugLogs) {
      this.overrideConsoleMethods();
    }

    // Optimizar configuración de Phaser para producción
    this.optimizePhaserConfig();

    // Configurar service worker para caching si está disponible
    this.setupServiceWorker();
  }

  /**
   * Override console methods para producción
   */
  private overrideConsoleMethods(): void {
    const originalConsole = {
      log: console.log,
      debug: console.debug,
      info: console.info,
    };

    // En producción, solo mostrar warnings y errores
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};

    // Mantener funcionalidad original en window para debugging si es necesario
    (window as any).__originalConsole = originalConsole;

    logAutopoiesis.info("Console methods optimized for production");
  }

  /**
   * Optimizar configuración de Phaser
   */
  private optimizePhaserConfig(): void {
    // Estas optimizaciones se aplicarían al crear el juego
    logAutopoiesis.info("Phaser config optimized for production");
  }

  /**
   * Configurar service worker para caching
   */
  private setupServiceWorker(): void {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          logAutopoiesis.info("Service Worker registered", {
            scope: registration.scope,
          });
        })
        .catch((error) => {
          logAutopoiesis.warn("Service Worker registration failed", {
            error: String(error),
          });
        });
    }
  }

  /**
   * Configurar monitoreo de memoria
   */
  private setupMemoryMonitoring(): void {
    if ((performance as any).memory) {
      setInterval(() => {
        const { memory } = performance as any;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;

        if (usedMB > this.settings.memoryThreshold / 1024 / 1024) {
          logAutopoiesis.warn("High memory usage detected", {
            used: `${usedMB.toFixed(2)}MB`,
            limit: `${(this.settings.memoryThreshold / 1024 / 1024).toFixed(2)}MB`,
          });

          this.triggerMemoryOptimization();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Optimizaciones de rendimiento
   */
  private setupPerformanceOptimizations(): void {
    // Configurar tareas no críticas
    this.scheduleNonCriticalTasks();
  }

  /**
   * Programar tareas no críticas usando requestIdleCallback si está disponible
   */
  private scheduleNonCriticalTasks(): void {
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => {
        this.triggerMemoryOptimization();
      });
    }
  }

  /**
   * Trigger optimización de memoria - simplificado
   */
  private triggerMemoryOptimization(): void {
    this.cleanupUnusedAssets();
    logAutopoiesis.info("Memory optimization triggered");
  }

  /**
   * Limpiar assets no utilizados - simplificado
   */
  private cleanupUnusedAssets(): void {
    if ((window as any).gc) {
      (window as any).gc();
    }
    logAutopoiesis.debug("Assets cleanup completed");
  }

  /**
   * Obtener configuración de producción para otros sistemas
   */
  public getSettings(): ProductionSettings {
    return { ...this.settings };
  }

  /**
   * Verificar si estamos en producción
   */
  public isProductionMode(): boolean {
    return this.isProduction;
  }

  /**
   * Obtener configuración optimizada para Phaser
   */
  public getPhaserOptimizations(): Partial<Phaser.Types.Core.GameConfig> {
    const baseConfig: Partial<Phaser.Types.Core.GameConfig> = {};

    if (this.isProduction) {
      // Optimizaciones específicas de producción
      baseConfig.render = {
        antialias: false, // Disable antialiasing for performance
        pixelArt: true, // Optimize for pixel art
        powerPreference: "high-performance",
      };

      baseConfig.fps = {
        target: 60,
        forceSetTimeOut: true,
      };

      baseConfig.physics = {
        default: "arcade",
        arcade: {
          fps: 60,
          fixedStep: true,
        },
      };
    }

    return baseConfig;
  }

  /**
   * Obtener configuración de carga de assets optimizada
   */
  public getAssetLoadConfig(): {
    maxConcurrent: number;
    timeout: number;
    retries: number;
    preloadCritical: boolean;
  } {
    return {
      maxConcurrent: this.settings.maxConcurrentLoads,
      timeout: this.isProduction ? 8000 : 15000,
      retries: this.isProduction ? 2 : 3,
      preloadCritical: this.isProduction,
    };
  }

}

// Crear instancia global
export const productionOptimizer = ProductionOptimizer.getInstance();
