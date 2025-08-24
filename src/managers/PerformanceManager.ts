/**
 * Manager de rendimiento que optimiza sin afectar el renderizado base
 * Implementa LOD (Level of Detail) y optimizaciones dinámicas
 */

import { logAutopoiesis } from "../utils/logger";

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderCount: number;
}

export interface LODLevel {
  minZoom: number;
  maxZoom: number;
  textureScale: number;
  animationSpeed: number;
  particleCount: number;
}

export class PerformanceManager {
  private scene: Phaser.Scene;
  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16,
    memoryUsage: 0,
    renderCount: 0
  };
  
  private frameTimeHistory: number[] = [];
  private lastMetricUpdate = 0;
  private metricUpdateInterval = 1000; // 1 segundo
  
  // Niveles LOD predefinidos
  private lodLevels: LODLevel[] = [
    { minZoom: 0.0, maxZoom: 0.4, textureScale: 0.5, animationSpeed: 0.5, particleCount: 0.2 }, // Muy lejos
    { minZoom: 0.4, maxZoom: 0.8, textureScale: 0.75, animationSpeed: 0.75, particleCount: 0.5 }, // Lejos
    { minZoom: 0.8, maxZoom: 1.2, textureScale: 1.0, animationSpeed: 1.0, particleCount: 1.0 }, // Normal
    { minZoom: 1.2, maxZoom: 2.0, textureScale: 1.0, animationSpeed: 1.0, particleCount: 1.0 }  // Cerca
  ];
  
  private currentLODLevel = 2; // Normal por defecto
  private isOptimizationActive = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Actualiza las métricas de rendimiento
   */
  update(time: number, delta: number): void {
    const now = Date.now();
    
    // Guardar tiempo de frame
    this.frameTimeHistory.push(delta);
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }
    
    // Actualizar métricas cada segundo
    if (now - this.lastMetricUpdate >= this.metricUpdateInterval) {
      this.updateMetrics();
      this.adjustLODBasedOnPerformance();
      this.lastMetricUpdate = now;
    }
    
    // Actualizar LOD basado en zoom de cámara
    if (this.scene.cameras?.main) {
      this.updateLODBasedOnZoom(this.scene.cameras.main.zoom);
    }
  }

  /**
   * Actualiza las métricas de rendimiento
   */
  private updateMetrics(): void {
    // Calcular FPS promedio
    const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
    this.metrics.frameTime = avgFrameTime;
    this.metrics.fps = 1000 / avgFrameTime;
    
    // Estimar uso de memoria (aproximación)
    this.metrics.memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
    
    // Log métricas si el rendimiento es bajo
    if (this.metrics.fps < 45) {
      logAutopoiesis.debug("⚡ Rendimiento bajo detectado", {
        fps: Math.round(this.metrics.fps),
        frameTime: Math.round(this.metrics.frameTime),
        lodLevel: this.currentLODLevel
      });
    }
  }

  /**
   * Ajusta el LOD basado en el rendimiento
   */
  private adjustLODBasedOnPerformance(): void {
    const targetFPS = 50;
    
    if (this.metrics.fps < targetFPS && !this.isOptimizationActive) {
      this.isOptimizationActive = true;
      this.applyPerformanceOptimizations();
      logAutopoiesis.info("🚀 Optimizaciones de rendimiento activadas", {
        fps: Math.round(this.metrics.fps)
      });
    } else if (this.metrics.fps > targetFPS + 10 && this.isOptimizationActive) {
      this.isOptimizationActive = false;
      this.removePerformanceOptimizations();
      logAutopoiesis.info("✨ Optimizaciones de rendimiento desactivadas", {
        fps: Math.round(this.metrics.fps)
      });
    }
  }

  /**
   * Actualiza LOD basado en el zoom de la cámara
   */
  private updateLODBasedOnZoom(zoom: number): void {
    const newLODLevel = this.calculateLODLevel(zoom);
    
    if (newLODLevel !== this.currentLODLevel) {
      this.currentLODLevel = newLODLevel;
      this.applyLODLevel(this.lodLevels[newLODLevel]);
      
      logAutopoiesis.debug("🎯 LOD actualizado", {
        zoom: Math.round(zoom * 100) / 100,
        lodLevel: newLODLevel,
        textureScale: this.lodLevels[newLODLevel].textureScale
      });
    }
  }

  /**
   * Calcula el nivel LOD basado en el zoom
   */
  private calculateLODLevel(zoom: number): number {
    for (let i = 0; i < this.lodLevels.length; i++) {
      const level = this.lodLevels[i];
      if (zoom >= level.minZoom && zoom < level.maxZoom) {
        return i;
      }
    }
    return this.lodLevels.length - 1; // Último nivel por defecto
  }

  /**
   * Aplica un nivel LOD específico
   */
  private applyLODLevel(lodLevel: LODLevel): void {
    // Ajustar calidad de texturas globalmente si es posible
    if (this.scene.renderer && this.scene.renderer.gl) {
      // Configurar filtros de textura basados en el LOD
      const gl = this.scene.renderer.gl;
      const filter = lodLevel.textureScale < 1.0 ? gl.LINEAR : gl.NEAREST;
      // Nota: En un sistema más avanzado, aquí se aplicarían filtros específicos
    }
    
    // Ajustar velocidad de animaciones
    if (this.scene.anims) {
      this.scene.anims.globalTimeScale = lodLevel.animationSpeed;
    }
  }

  /**
   * Aplica optimizaciones de rendimiento cuando el FPS es bajo
   */
  private applyPerformanceOptimizations(): void {
    // Reducir calidad de física si existe
    if (this.scene.physics?.world) {
      (this.scene.physics.world as any).fps = 30; // Reducir FPS de física
    }
    
    // Reducir frecuencia de actualización de algunos sistemas
    this.scene.tweens.timeScale = 0.8; // Ralentizar tweens levemente
  }

  /**
   * Remueve optimizaciones de rendimiento
   */
  private removePerformanceOptimizations(): void {
    // Restaurar calidad de física
    if (this.scene.physics?.world) {
      (this.scene.physics.world as any).fps = 60;
    }
    
    // Restaurar velocidad normal de tweens
    this.scene.tweens.timeScale = 1.0;
  }

  /**
   * Obtiene las métricas actuales
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Obtiene el nivel LOD actual
   */
  getCurrentLODLevel(): number {
    return this.currentLODLevel;
  }

  /**
   * Fuerza un nivel LOD específico
   */
  setLODLevel(level: number): void {
    if (level >= 0 && level < this.lodLevels.length) {
      this.currentLODLevel = level;
      this.applyLODLevel(this.lodLevels[level]);
    }
  }
}