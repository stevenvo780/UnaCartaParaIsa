/**
 * Sistema de Emergencia para "Una Carta Para Isa"
 * Implementa la emergencia de dinámicas complejas desde reglas simples
 * Basado en principios de autopoiesis y sistemas adaptativos complejos
 */

import Phaser from "phaser";
import type { GameState } from "../types";
import type { NeedsSystem, EntityNeedsData } from "./NeedsSystem";
import type { AISystem } from "./AISystem";
import type { DayNightSystem } from "./DayNightSystem";
import { logAutopoiesis } from "../utils/logger";

export interface EmergentPattern {
  id: string;
  name: string;
  description: string;
  type: "behavioral" | "social" | "environmental" | "systemic";
  strength: number; // 0-1, how pronounced the pattern is
  duration: number; // How long the pattern has been active (ms)
  triggers: string[]; // What triggered this pattern
  intensity?: number; // Intensidad del patrón (opcional para compatibilidad)
  participants?: string[]; // Entidades participantes (opcional)
  effects: {
    needsModifiers?: Record<string, number>;
    aiModifiers?: Record<string, unknown>;
    worldModifiers?: Record<string, number>;
  };
  conditions: {
    minResonance?: number;
    maxResonance?: number;
    timeOfDay?: string[];
    weatherConditions?: string[];
    entityStates?: Array<{
      entity: string;
      needs: Record<string, { min?: number; max?: number }>;
    }>;
  };
}

export interface SystemMetrics {
  complexity: number; // Overall system complexity (0-1)
  coherence: number; // How well systems work together (0-1)
  adaptability: number; // System's ability to adapt to changes (0-1)
  sustainability: number; // Long-term viability of current state (0-1)
  entropy: number; // System disorder level (0-1)
  autopoiesis: number; // Self-organization level (0-1)
}

export interface FeedbackLoop {
  id: string;
  type: "positive" | "negative"; // Reinforcing vs balancing
  strength: number; // 0-1
  elements: string[]; // System elements involved
  description: string;
  active: boolean;
  lastActivation: number;
}

export class EmergenceSystem {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private needsSystem: NeedsSystem;
  private aiSystem: AISystem;
  private dayNightSystem: DayNightSystem;

  // Emergence tracking
  private emergentPatterns = new Map<string, EmergentPattern>();
  private feedbackLoops = new Map<string, FeedbackLoop>();
  private systemMetrics: SystemMetrics;
  private metricsHistory: SystemMetrics[] = [];

  // Pattern templates
  private patternTemplates: Omit<
    EmergentPattern,
    "id" | "strength" | "duration"
  >[] = [];

  // Configuration
  private readonly METRICS_UPDATE_INTERVAL = 5000; // 5 seconds
  private readonly PATTERN_CHECK_INTERVAL = 10000; // 10 seconds
  private readonly MAX_METRICS_HISTORY = 100;
  private lastMetricsUpdate = 0;
  private lastPatternCheck = 0;

  // Threshold for pattern recognition
  private readonly PATTERN_THRESHOLD = 0.6;
  private readonly PATTERN_PERSISTENCE_TIME = 30000; // 30 seconds

  constructor(
    scene: Phaser.Scene,
    gameState: GameState,
    needsSystem: NeedsSystem,
    aiSystem: AISystem,
    dayNightSystem: DayNightSystem,
  ) {
    this.scene = scene;
    this.gameState = gameState;
    this.needsSystem = needsSystem;
    this.aiSystem = aiSystem;
    this.dayNightSystem = dayNightSystem;

    // Initialize metrics
    this.systemMetrics = {
      complexity: 0.3,
      coherence: 0.5,
      adaptability: 0.5,
      sustainability: 0.5,
      entropy: 0.4,
      autopoiesis: 0.3,
    };

    this.initializePatternTemplates();
    this.initializeFeedbackLoops();

    logAutopoiesis.info("🌌 Sistema de Emergencia inicializado", {
      patternTemplates: this.patternTemplates.length,
      feedbackLoops: this.feedbackLoops.size,
      initialMetrics: this.systemMetrics,
    });
  }

  /**
   * Inicializar plantillas de patrones emergentes
   */
  private initializePatternTemplates(): void {
    this.patternTemplates = [
      // PATRONES COMPORTAMENTALES
      {
        name: "Codependencia Simbiótica",
        description:
          "Los agentes desarrollan una dependencia mutua que refuerza su supervivencia",
        type: "behavioral",
        triggers: ["high_resonance", "mutual_aid", "resource_sharing"],
        effects: {
          needsModifiers: { mentalHealth: 0.2, energy: 0.1 },
          aiModifiers: { cooperationTendency: 0.3 },
        },
        conditions: {
          minResonance: 0.7,
          entityStates: [
            { entity: "isa", needs: { mentalHealth: { min: 60 } } },
            { entity: "stev", needs: { mentalHealth: { min: 60 } } },
          ],
        },
      },

      {
        name: "Ciclo de Aislamiento",
        description:
          "Un patrón destructivo donde el aislamiento refuerza más aislamiento",
        type: "behavioral",
        triggers: ["low_resonance", "individual_focus", "avoided_interaction"],
        effects: {
          needsModifiers: { mentalHealth: -0.1, energy: -0.05 },
          aiModifiers: { socialAvoidance: 0.2 },
        },
        conditions: {
          maxResonance: 0.3,
          entityStates: [
            { entity: "isa", needs: { mentalHealth: { max: 40 } } },
            { entity: "stev", needs: { mentalHealth: { max: 40 } } },
          ],
        },
      },

      // PATRONES SOCIALES
      {
        name: "Sincronización Circadiana",
        description:
          "Los agentes sincronizan sus patrones de actividad con el ciclo día/noche",
        type: "social",
        triggers: ["time_sync", "shared_routine", "environmental_adaptation"],
        effects: {
          needsModifiers: { energy: 0.15, mentalHealth: 0.1 },
          aiModifiers: { temporalAwareness: 0.3 },
        },
        conditions: {
          timeOfDay: ["morning", "dusk"],
        },
      },

      {
        name: "Resonancia Emocional",
        description: "Los estados emocionales se contagian entre los agentes",
        type: "social",
        triggers: ["proximity", "shared_experience", "emotional_state"],
        effects: {
          needsModifiers: { mentalHealth: 0.1 },
          aiModifiers: { empathyLevel: 0.2 },
        },
        conditions: {
          minResonance: 0.5,
        },
      },

      // PATRONES AMBIENTALES
      {
        name: "Adaptación Climática",
        description: "Los agentes desarrollan estrategias adaptativas al clima",
        type: "environmental",
        triggers: [
          "weather_change",
          "shelter_seeking",
          "resource_conservation",
        ],
        effects: {
          needsModifiers: { energy: 0.1 },
          aiModifiers: { environmentalAwareness: 0.3 },
        },
        conditions: {
          weatherConditions: ["rainy", "stormy", "snowy"],
        },
      },

      // PATRONES SISTÉMICOS
      {
        name: "Autopoiesis Emergente",
        description:
          "El sistema desarrolla capacidad de auto-organización y auto-mantenimiento",
        type: "systemic",
        triggers: ["system_stability", "adaptive_behavior", "self_regulation"],
        effects: {
          worldModifiers: { systemStability: 0.2, adaptiveCapacity: 0.3 },
        },
        conditions: {
          minResonance: 0.6,
        },
      },

      {
        name: "Cascada de Complejidad",
        description:
          "Pequeños cambios generan efectos complejos en todo el sistema",
        type: "systemic",
        triggers: [
          "butterfly_effect",
          "system_perturbation",
          "non_linear_response",
        ],
        effects: {
          worldModifiers: { complexity: 0.2, unpredictability: 0.1 },
        },
        conditions: {},
      },
    ];
  }

  /**
   * Inicializar bucles de retroalimentación
   */
  private initializeFeedbackLoops(): void {
    const loops: FeedbackLoop[] = [
      {
        id: "resonance_wellbeing_loop",
        type: "positive",
        strength: 0.7,
        elements: ["resonance", "mental_health", "cooperation"],
        description:
          "Mayor resonancia mejora bienestar, que facilita más cooperación",
        active: false,
        lastActivation: 0,
      },
      {
        id: "isolation_spiral_loop",
        type: "positive",
        strength: 0.6,
        elements: ["isolation", "mental_health_decline", "further_isolation"],
        description:
          "El aislamiento deteriora la salud mental, causando más aislamiento",
        active: false,
        lastActivation: 0,
      },
      {
        id: "resource_balance_loop",
        type: "negative",
        strength: 0.5,
        elements: ["resource_scarcity", "cooperation", "resource_efficiency"],
        description:
          "La escasez impulsa cooperación, que mejora la eficiencia de recursos",
        active: false,
        lastActivation: 0,
      },
      {
        id: "circadian_sync_loop",
        type: "negative",
        strength: 0.4,
        elements: ["day_night_cycle", "energy_levels", "activity_sync"],
        description:
          "El ciclo día/noche regula los niveles de energía y sincroniza actividades",
        active: false,
        lastActivation: 0,
      },
    ];

    loops.forEach((loop) => {
      this.feedbackLoops.set(loop.id, loop);
    });
  }

  /**
   * Actualizar sistema de emergencia
   */
  public update(): void {
    const now = Date.now();

    // Actualizar métricas del sistema
    if (now - this.lastMetricsUpdate > this.METRICS_UPDATE_INTERVAL) {
      this.updateSystemMetrics();
      this.lastMetricsUpdate = now;
    }

    // Verificar patrones emergentes
    if (now - this.lastPatternCheck > this.PATTERN_CHECK_INTERVAL) {
      this.checkEmergentPatterns();
      this.updateFeedbackLoops();
      this.lastPatternCheck = now;
    }

    // Aplicar efectos de patrones activos
    this.applyPatternEffects();
  }

  /**
   * Actualizar métricas del sistema
   */
  private updateSystemMetrics(): void {
    const entities = ["isa", "stev"];
    let totalNeeds = 0;
    let totalVariance = 0;
    let interactionLevel = 0;

    // Calcular métricas basadas en estado de entidades
    entities.forEach((entityId) => {
      const needs = this.needsSystem.getEntityNeeds(entityId);
      if (needs) {
        const needsValues = Object.values(needs.needs);
        totalNeeds +=
          needsValues.reduce((sum, val) => sum + val, 0) / needsValues.length;

        // Calcular varianza en necesidades (indicador de estrés/desequilibrio)
        const mean =
          needsValues.reduce((sum, val) => sum + val, 0) / needsValues.length;
        const variance =
          needsValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          needsValues.length;
        totalVariance += variance;
      }
    });

    const avgNeeds = totalNeeds / entities.length;
    const avgVariance = totalVariance / entities.length;
    interactionLevel = this.gameState.resonance;

    // Calcular nuevas métricas
    const newMetrics: SystemMetrics = {
      complexity: this.calculateComplexity(),
      coherence: Math.min(1, interactionLevel + 0.1), // Resonancia como indicador de coherencia
      adaptability: this.calculateAdaptability(),
      sustainability: Math.min(1, avgNeeds / 100), // Necesidades satisfechas = sostenibilidad
      entropy: Math.min(1, avgVariance / 1000), // Varianza como entropía
      autopoiesis: this.calculateAutopoiesis(),
    };

    // Suavizar cambios
    const smoothing = 0.1;
    Object.keys(newMetrics).forEach((key) => {
      const metric = key as keyof SystemMetrics;
      this.systemMetrics[metric] =
        this.systemMetrics[metric] * (1 - smoothing) +
        newMetrics[metric] * smoothing;
    });

    // Agregar al historial
    this.metricsHistory.push({ ...this.systemMetrics });
    if (this.metricsHistory.length > this.MAX_METRICS_HISTORY) {
      this.metricsHistory.shift();
    }

    // Emitir evento para UI
    this.scene.events.emit("emergenceMetricsUpdated", {
      metrics: this.systemMetrics,
      patterns: Array.from(this.emergentPatterns.values()),
      feedbackLoops: Array.from(this.feedbackLoops.values()).filter(
        (loop) => loop.active,
      ),
    });
  }

  /**
   * Calcular complejidad del sistema
   */
  private calculateComplexity(): number {
    const activePatterns = this.emergentPatterns.size;
    const activeFeedback = Array.from(this.feedbackLoops.values()).filter(
      (l) => l.active,
    ).length;
    const timeFactors =
      this.dayNightSystem.getCurrentTime().phase === "night" ? 1.2 : 1.0;

    return Math.min(
      1,
      (activePatterns * 0.3 + activeFeedback * 0.2) * timeFactors,
    );
  }

  /**
   * Calcular adaptabilidad
   */
  private calculateAdaptability(): number {
    // Basado en variabilidad reciente en métricas
    if (this.metricsHistory.length < 5) return 0.5;

    const recent = this.metricsHistory.slice(-5);
    let totalChange = 0;

    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1];
      const curr = recent[i];
      totalChange += Math.abs(curr.complexity - prev.complexity);
      totalChange += Math.abs(curr.coherence - prev.coherence);
    }

    return Math.min(1, totalChange / 4); // Normalizar
  }

  /**
   * Calcular nivel de autopoiesis
   */
  private calculateAutopoiesis(): number {
    const selfOrgPatterns = Array.from(this.emergentPatterns.values()).filter(
      (p) => p.type === "systemic",
    ).length;
    const systemStability = 1 - this.systemMetrics.entropy;
    const adaptiveBalance =
      this.systemMetrics.adaptability * this.systemMetrics.sustainability;

    return Math.min(
      1,
      selfOrgPatterns * 0.4 + systemStability * 0.3 + adaptiveBalance * 0.3,
    );
  }

  /**
   * Verificar patrones emergentes
   */
  private checkEmergentPatterns(): void {
    this.patternTemplates.forEach((template) => {
      const patternId = this.generatePatternId(template.name);
      const strength = this.evaluatePatternStrength(template);

      if (strength >= this.PATTERN_THRESHOLD) {
        // Patrón detectado
        if (!this.emergentPatterns.has(patternId)) {
          // Nuevo patrón
          this.emergentPatterns.set(patternId, {
            id: patternId,
            ...template,
            strength,
            duration: 0,
          });

          logAutopoiesis.info(`🌟 Nuevo patrón emergente: ${template.name}`, {
            strength: Math.round(strength * 100),
            type: template.type,
          });

          this.scene.events.emit("emergentPatternDetected", {
            id: patternId,
            name: template.name,
            strength,
            type: template.type,
          });
        } else {
          // Patrón existente - actualizar duración y fuerza
          const existing = this.emergentPatterns.get(patternId)!;
          existing.duration += this.PATTERN_CHECK_INTERVAL;
          existing.strength = (existing.strength + strength) / 2; // Promedio suavizado
        }
      } else {
        // Patrón no detectado - eliminar si existe
        if (this.emergentPatterns.has(patternId)) {
          const pattern = this.emergentPatterns.get(patternId)!;
          if (pattern.duration > this.PATTERN_PERSISTENCE_TIME) {
            this.emergentPatterns.delete(patternId);
            logAutopoiesis.info(`💨 Patrón desvanecido: ${pattern.name}`);
          }
        }
      }
    });
  }

  /**
   * Evaluar la fuerza de un patrón específico
   */
  private evaluatePatternStrength(
    template: Omit<EmergentPattern, "id" | "strength" | "duration">,
  ): number {
    let strength = 0;
    let factors = 0;

    const conditions = template.conditions;

    // Verificar resonancia
    if (conditions.minResonance !== undefined) {
      if (this.gameState.resonance >= conditions.minResonance) {
        strength += 0.3;
      }
      factors++;
    }

    if (conditions.maxResonance !== undefined) {
      if (this.gameState.resonance <= conditions.maxResonance) {
        strength += 0.3;
      }
      factors++;
    }

    // Verificar hora del día
    if (conditions.timeOfDay) {
      const currentPhase = this.dayNightSystem.getCurrentTime().phase;
      if (conditions.timeOfDay.includes(currentPhase)) {
        strength += 0.2;
      }
      factors++;
    }

    // Verificar condiciones climáticas
    if (conditions.weatherConditions) {
      const currentWeather = this.dayNightSystem.getCurrentWeather().type;
      if (conditions.weatherConditions.includes(currentWeather)) {
        strength += 0.2;
      }
      factors++;
    }

    // Verificar estados de entidades
    if (conditions.entityStates) {
      let entityMatches = 0;
      conditions.entityStates.forEach((entityCondition) => {
        const needs = this.needsSystem.getEntityNeeds(entityCondition.entity);
        if (needs) {
          let needMatches = 0;
          let totalNeedChecks = 0;

          Object.entries(entityCondition.needs).forEach(([needType, range]) => {
            const needValue = needs.needs[needType as keyof typeof needs.needs];
            if (needValue !== undefined) {
              totalNeedChecks++;
              if (range.min !== undefined && needValue >= range.min)
                needMatches++;
              if (range.max !== undefined && needValue <= range.max)
                needMatches++;
            }
          });

          if (needMatches === totalNeedChecks) {
            entityMatches++;
          }
        }
      });

      if (entityMatches === conditions.entityStates.length) {
        strength += 0.3;
      }
      factors++;
    }

    // Si no hay condiciones específicas, usar métricas generales
    if (factors === 0) {
      strength =
        (this.systemMetrics.complexity + this.systemMetrics.coherence) / 2;
      factors = 1;
    }

    return factors > 0 ? strength / factors : 0;
  }

  /**
   * Actualizar bucles de retroalimentación
   */
  private updateFeedbackLoops(): void {
    this.feedbackLoops.forEach((loop) => {
      const shouldBeActive = this.evaluateFeedbackLoop(loop);

      if (shouldBeActive && !loop.active) {
        loop.active = true;
        loop.lastActivation = Date.now();
        logAutopoiesis.info(
          `🔄 Bucle de retroalimentación activado: ${loop.description}`,
        );
      } else if (!shouldBeActive && loop.active) {
        loop.active = false;
        logAutopoiesis.info(
          `⏸️ Bucle de retroalimentación desactivado: ${loop.description}`,
        );
      }
    });
  }

  /**
   * Evaluar si un bucle de retroalimentación debe estar activo
   */
  private evaluateFeedbackLoop(loop: FeedbackLoop): boolean {
    // Lógica específica para cada tipo de bucle
    switch (loop.id) {
      case "resonance_wellbeing_loop":
        return (
          this.gameState.resonance > 0.6 && this.systemMetrics.coherence > 0.5
        );

      case "isolation_spiral_loop":
        return (
          this.gameState.resonance < 0.3 && this.systemMetrics.entropy > 0.6
        );

      case "resource_balance_loop":
        // Verificar si hay escasez de recursos
        const entities = ["isa", "stev"];
        const hasResourceStress = entities.some((entityId) => {
          const needs = this.needsSystem.getEntityNeeds(entityId);
          return needs && (needs.needs.hunger < 40 || needs.needs.thirst < 40);
        });
        return hasResourceStress && this.gameState.resonance > 0.4;

      case "circadian_sync_loop":
        const timePhase = this.dayNightSystem.getCurrentTime().phase;
        return timePhase === "morning" || timePhase === "dusk";

      default:
        return false;
    }
  }

  /**
   * Aplicar efectos de patrones activos
   */
  private applyPatternEffects(): void {
    this.emergentPatterns.forEach((pattern) => {
      // Aplicar efectos según el tipo de patrón
      switch (pattern.type) {
        case "social": {
          this.applySocialClusterEffects(pattern);
          break;
        }
        case "environmental": {
          this.applyResourceScarcityEffects(pattern);
          break;
        }
        case "behavioral": {
          this.applyEmotionalContagionEffects(pattern);
          break;
        }
        case "systemic": {
          this.applyTerritorialEffects(pattern);
          break;
        }
      }

      // Emitir evento para UI
      this.scene.events.emit("emergence:pattern_active", {
        pattern: pattern.name,
        intensity: pattern.intensity || pattern.strength,
        effects: pattern.effects,
      });
    });
  }

  private applySocialClusterEffects(pattern: EmergentPattern): void {
    const affectedEntities = pattern.participants || [];

    affectedEntities.forEach((entityId) => {
      if (this.needsSystem && this.needsSystem.modifyNeed) {
        // Boost social para entidades en el cluster
        this.needsSystem.modifyNeed(entityId, "social", 0.5);
        this.needsSystem.modifyNeed(entityId, "fun", 0.3);
      }
    });
  }

  private applyResourceScarcityEffects(pattern: EmergentPattern): void {
    // Aumentar precios en vendors
    const vendors = this.gameState.mapElements.filter(
      (e) => e.type === "food_vendor",
    );
    vendors.forEach((vendor) => {
      vendor.priceMultiplier = 1.5;
    });

    // Reducir spawn de recursos
    this.scene.events.emit("resources:scarcity", { multiplier: 0.5 });
  }

  private applyEmotionalContagionEffects(pattern: EmergentPattern): void {
    const affectedEntities = pattern.participants || [];

    affectedEntities.forEach((entityId) => {
      if (this.needsSystem && this.needsSystem.modifyNeed) {
        // Propagar estado emocional
        const intensity = pattern.intensity * 0.2;
        this.needsSystem.modifyNeed(
          entityId,
          "mentalHealth",
          intensity > 0.5 ? 0.3 : -0.2,
        );
      }
    });
  }

  private applyTerritorialEffects(pattern: EmergentPattern): void {
    const affectedEntities = pattern.participants || [];

    affectedEntities.forEach((entityId) => {
      if (this.needsSystem && this.needsSystem.modifyNeed) {
        // Estrés por conflicto territorial
        this.needsSystem.modifyNeed(entityId, "mentalHealth", -0.4);
        this.needsSystem.modifyNeed(entityId, "energy", -0.2);
      }
    });
  }

  /**
   * Generar ID único para patrón
   */
  private generatePatternId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, "_");
  }

  /**
   * Obtener métricas actuales del sistema
   */
  public getSystemMetrics(): SystemMetrics {
    return { ...this.systemMetrics };
  }

  /**
   * Obtener patrones emergentes activos
   */
  public getActivePatterns(): EmergentPattern[] {
    return Array.from(this.emergentPatterns.values());
  }

  /**
   * Obtener bucles de retroalimentación activos
   */
  public getActiveFeedbackLoops(): FeedbackLoop[] {
    return Array.from(this.feedbackLoops.values()).filter(
      (loop) => loop.active,
    );
  }

  /**
   * Obtener historial de métricas
   */
  public getMetricsHistory(): SystemMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Forzar evaluación de patrones (para testing)
   */
  public forcePatternEvaluation(): void {
    this.checkEmergentPatterns();
    this.updateFeedbackLoops();
  }

  /**
   * Obtener estadísticas del sistema
   */
  public getStats() {
    return {
      activePatterns: this.emergentPatterns.size,
      activeFeedbackLoops: Array.from(this.feedbackLoops.values()).filter(
        (l) => l.active,
      ).length,
      totalFeedbackLoops: this.feedbackLoops.size,
      systemComplexity: Math.round(this.systemMetrics.complexity * 100),
      autopoiesisLevel: Math.round(this.systemMetrics.autopoiesis * 100),
      systemCoherence: Math.round(this.systemMetrics.coherence * 100),
    };
  }

  /**
   * Obtener estadísticas del sistema (método público)
   */
  public getSystemStats(): SystemMetrics & { patterns: number; feedbackLoops: number } {
    return {
      ...this.systemMetrics,
      patterns: this.emergentPatterns.size,
      feedbackLoops: this.feedbackLoops.size,
    };
  }

  /**
   * Limpiar sistema
   */
  public cleanup(): void {
    this.emergentPatterns.clear();
    this.feedbackLoops.clear();
    this.metricsHistory = [];
  }
}
