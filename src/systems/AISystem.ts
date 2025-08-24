/**
 * Sistema de IA Autónoma para "Una Carta Para Isa"
 * Permite a los agentes tomar decisiones basadas en necesidades y contexto
 */

import type { GameState, Zone } from "../types";
import type { NeedsSystem, EntityNeedsData } from "./NeedsSystem";
import type { MovementSystem } from "./MovementSystem";
import { logAutopoiesis } from "../utils/logger";

export interface AIGoal {
  id: string;
  type: "satisfy_need" | "explore" | "socialize" | "work" | "rest";
  priority: number;
  targetZone?: string;
  targetNeed?: string;
  estimatedDuration: number;
  startTime?: number;
}

export interface AIState {
  entityId: string;
  currentGoal?: AIGoal;
  goalQueue: AIGoal[];
  lastDecisionTime: number;
  isPlayerControlled: boolean;
  memory: {
    visitedZones: Set<string>;
    successfulActivities: Map<string, number>;
    failedAttempts: Map<string, number>;
  };
  personality: {
    explorationType: "cautious" | "balanced" | "adventurous";
    socialPreference: "introverted" | "balanced" | "extroverted";
    workEthic: "lazy" | "balanced" | "workaholic";
    riskTolerance: number; // 0-1
  };
}

export interface PathfindingNode {
  x: number;
  y: number;
  gCost: number;
  hCost: number;
  fCost: number;
  parent?: PathfindingNode;
}

export class AISystem {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private needsSystem: NeedsSystem;
  private aiStates = new Map<string, AIState>();

  // Configuración de IA
  private readonly DECISION_INTERVAL = 3000; // 3 segundos
  private readonly GOAL_TIMEOUT = 30000; // 30 segundos
  private readonly MIN_PRIORITY_THRESHOLD = 0.3;

  // Cache de pathfinding
  private pathCache = new Map<string, { x: number; y: number }[]>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 10000; // 10 segundos

  private movementSystem?: MovementSystem;

  constructor(
    scene: Phaser.Scene,
    gameState: GameState,
    needsSystem: NeedsSystem,
  ) {
    this.scene = scene;
    this.gameState = gameState;
    this.needsSystem = needsSystem;

    logAutopoiesis.info("🧠 Sistema de IA inicializado", {
      decisionInterval: this.DECISION_INTERVAL,
      goalTimeout: this.GOAL_TIMEOUT,
    });
  }

  /**
   * Inicializar IA para una entidad
   */
  public initializeEntityAI(entityId: string): void {
    const aiState: AIState = {
      entityId,
      goalQueue: [],
      lastDecisionTime: 0,
      isPlayerControlled: false,
      memory: {
        visitedZones: new Set(),
        successfulActivities: new Map(),
        failedAttempts: new Map(),
      },
      personality: this.generatePersonality(),
    };

    this.aiStates.set(entityId, aiState);

    logAutopoiesis.info(`🎭 IA inicializada para ${entityId}`, {
      personality: aiState.personality,
    });
  }

  /**
   * Generar personalidad aleatoria para la entidad
   */
  private generatePersonality() {
    const traits = {
      explorationType: ["cautious", "balanced", "adventurous"][
        Math.floor(Math.random() * 3)
      ] as any,
      socialPreference: ["introverted", "balanced", "extroverted"][
        Math.floor(Math.random() * 3)
      ] as any,
      workEthic: ["lazy", "balanced", "workaholic"][
        Math.floor(Math.random() * 3)
      ] as any,
      riskTolerance: 0.3 + Math.random() * 0.4, // 0.3 a 0.7
    };

    return traits;
  }

  /**
   * Actualizar sistema de IA
   */
  public update(): void {
    const now = Date.now();

    this.aiStates.forEach((aiState, entityId) => {
      if (aiState.isPlayerControlled) return;

      // Verificar si es tiempo de tomar una nueva decisión
      if (now - aiState.lastDecisionTime > this.DECISION_INTERVAL) {
        this.makeDecision(aiState);
        aiState.lastDecisionTime = now;
      }

      // Actualizar objetivo actual
      this.updateCurrentGoal(aiState);
    });

    // Limpiar cache expirado
    this.cleanupExpiredCache(now);
  }

  /**
   * Tomar decisión para una entidad
   */
  private makeDecision(aiState: AIState): void {
    const entityNeeds = this.needsSystem.getEntityNeeds(aiState.entityId);
    if (!entityNeeds) return;

    // Evaluar necesidades críticas
    const criticalGoals = this.evaluateCriticalNeeds(aiState, entityNeeds);

    // Evaluar oportunidades
    const opportunityGoals = this.evaluateOpportunities(aiState, entityNeeds);

    // Combinar y priorizar objetivos
    const allGoals = [...criticalGoals, ...opportunityGoals];
    const prioritizedGoals = this.prioritizeGoals(allGoals, aiState);

    // Actualizar cola de objetivos
    aiState.goalQueue = prioritizedGoals.slice(0, 3); // Mantener máximo 3 objetivos

    if (prioritizedGoals.length > 0) {
      logAutopoiesis.debug(`🎯 Nueva decisión para ${aiState.entityId}`, {
        newGoals: prioritizedGoals.length,
        topPriority: prioritizedGoals[0]?.type,
        targetZone: prioritizedGoals[0]?.targetZone,
      });
    }
  }

  /**
   * Evaluar necesidades críticas
   */
  private evaluateCriticalNeeds(
    aiState: AIState,
    entityNeeds: EntityNeedsData,
  ): AIGoal[] {
    const goals: AIGoal[] = [];
    const { needs } = entityNeeds;

    // Hambre crítica
    if (needs.hunger < 30) {
      const foodZones = this.needsSystem.getRecommendedZoneForNeed("hunger");
      const bestZone = this.selectBestZone(aiState, foodZones, "food");

      if (bestZone) {
        goals.push({
          id: `hunger_${Date.now()}`,
          type: "satisfy_need",
          priority: this.calculateNeedPriority(needs.hunger, 100),
          targetZone: bestZone,
          targetNeed: "hunger",
          estimatedDuration: 5000,
        });
      }
    }

    // Sed crítica
    if (needs.thirst < 25) {
      const waterZones = this.needsSystem.getRecommendedZoneForNeed("thirst");
      const bestZone = this.selectBestZone(aiState, waterZones, "water");

      if (bestZone) {
        goals.push({
          id: `thirst_${Date.now()}`,
          type: "satisfy_need",
          priority: this.calculateNeedPriority(needs.thirst, 120),
          targetZone: bestZone,
          targetNeed: "thirst",
          estimatedDuration: 3000,
        });
      }
    }

    // Energía crítica
    if (needs.energy < 20) {
      const restZones = this.needsSystem.getRecommendedZoneForNeed("energy");
      const bestZone = this.selectBestZone(aiState, restZones, "rest");

      if (bestZone) {
        goals.push({
          id: `energy_${Date.now()}`,
          type: "rest",
          priority: this.calculateNeedPriority(needs.energy, 80),
          targetZone: bestZone,
          targetNeed: "energy",
          estimatedDuration: 8000,
        });
      }
    }

    // Salud mental baja
    if (needs.mentalHealth < 40) {
      const socialZones =
        this.needsSystem.getRecommendedZoneForNeed("mentalHealth");
      const bestZone = this.selectBestZone(aiState, socialZones, "social");

      if (bestZone) {
        goals.push({
          id: `mental_${Date.now()}`,
          type: "socialize",
          priority: this.calculateNeedPriority(needs.mentalHealth, 60),
          targetZone: bestZone,
          targetNeed: "mentalHealth",
          estimatedDuration: 10000,
        });
      }
    }

    return goals;
  }

  /**
   * Evaluar oportunidades basadas en personalidad
   */
  private evaluateOpportunities(
    aiState: AIState,
    entityNeeds: EntityNeedsData,
  ): AIGoal[] {
    const goals: AIGoal[] = [];
    const { personality } = aiState;

    // Exploración basada en personalidad
    if (
      personality.explorationType === "adventurous" ||
      (personality.explorationType === "balanced" && Math.random() < 0.3)
    ) {
      const unexploredZones = this.getUnexploredZones(aiState);
      if (unexploredZones.length > 0) {
        const randomZone =
          unexploredZones[Math.floor(Math.random() * unexploredZones.length)];

        goals.push({
          id: `explore_${Date.now()}`,
          type: "explore",
          priority: 0.3 + personality.riskTolerance * 0.4,
          targetZone: randomZone,
          estimatedDuration: 15000,
        });
      }
    }

    // Trabajo basado en ética laboral
    if (
      personality.workEthic === "workaholic" ||
      (personality.workEthic === "balanced" && entityNeeds.needs.energy > 60)
    ) {
      const workZones = this.gameState.zones.filter((z) => z.type === "work");
      if (workZones.length > 0) {
        const bestWorkZone = this.selectBestZone(
          aiState,
          workZones.map((z) => z.id),
          "work",
        );

        if (bestWorkZone) {
          goals.push({
            id: `work_${Date.now()}`,
            type: "work",
            priority: personality.workEthic === "workaholic" ? 0.7 : 0.4,
            targetZone: bestWorkZone,
            estimatedDuration: 12000,
          });
        }
      }
    }

    // Socialización basada en preferencia social
    if (
      personality.socialPreference === "extroverted" ||
      (personality.socialPreference === "balanced" &&
        entityNeeds.needs.mentalHealth < 70)
    ) {
      const socialZones = this.gameState.zones.filter(
        (z) => z.type === "social",
      );
      if (socialZones.length > 0) {
        const bestSocialZone = this.selectBestZone(
          aiState,
          socialZones.map((z) => z.id),
          "social",
        );

        if (bestSocialZone) {
          goals.push({
            id: `social_${Date.now()}`,
            type: "socialize",
            priority:
              personality.socialPreference === "extroverted" ? 0.6 : 0.4,
            targetZone: bestSocialZone,
            estimatedDuration: 8000,
          });
        }
      }
    }

    return goals;
  }

  /**
   * Calcular prioridad de necesidad
   */
  private calculateNeedPriority(
    currentValue: number,
    urgencyMultiplier: number,
  ): number {
    const urgency = (100 - currentValue) / 100; // 0-1, mayor urgencia = mayor prioridad
    return Math.min(1, urgency * (urgencyMultiplier / 100));
  }

  /**
   * Seleccionar la mejor zona para un objetivo
   */
  private selectBestZone(
    aiState: AIState,
    zoneIds: string[],
    zoneType: string,
  ): string | null {
    if (zoneIds.length === 0) return null;

    // Filtrar zonas válidas
    const validZones = zoneIds
      .map((id) => this.gameState.zones.find((z) => z.id === id))
      .filter(Boolean) as Zone[];

    if (validZones.length === 0) return null;

    // Evaluar zonas basado en múltiples factores
    const evaluatedZones = validZones.map((zone) => {
      const distance = this.estimateDistance(aiState.entityId, zone);
      const attractiveness = zone.attractiveness || 5;
      const memoryBonus = aiState.memory.successfulActivities.get(zone.id) || 0;
      const failurePenalty = aiState.memory.failedAttempts.get(zone.id) || 0;

      const score =
        attractiveness + memoryBonus - failurePenalty - distance / 100;

      return { zone, score };
    });

    // Ordenar por puntuación y seleccionar la mejor
    evaluatedZones.sort((a, b) => b.score - a.score);

    return evaluatedZones[0]?.zone.id || null;
  }

  /**
   * Estimar distancia a una zona
   */
  private estimateDistance(entityId: string, zone: Zone): number {
    // Por ahora usar distancia simple, después se puede mejorar con pathfinding real
    const entity = this.getEntityPosition(entityId);
    if (!entity) return 1000;

    const zoneCenterX = zone.bounds.x + zone.bounds.width / 2;
    const zoneCenterY = zone.bounds.y + zone.bounds.height / 2;

    return Math.hypot(zoneCenterX - entity.x, zoneCenterY - entity.y);
  }

  /**
   * Obtener posición de entidad
   */
  private getEntityPosition(entityId: string): { x: number; y: number } | null {
    // Usar MovementSystem si está disponible
    if (this.movementSystem) {
      const state = this.movementSystem.getEntityMovementState(entityId);
      if (state && state.currentPosition) {
        return { x: state.currentPosition.x, y: state.currentPosition.y };
      }
    }

    // Fallback suave: centro aproximado del mundo (reduce sesgo)
    const defaultPos = this.gameState.entities?.find((e: any) => e.id === entityId)?.position;
    if (defaultPos) return { x: defaultPos.x, y: defaultPos.y };
    return { x: 0, y: 0 };
  }

  /**
   * Obtener zonas no exploradas
   */
  private getUnexploredZones(aiState: AIState): string[] {
    return this.gameState.zones
      .filter((zone) => !aiState.memory.visitedZones.has(zone.id))
      .map((zone) => zone.id);
  }

  /**
   * Priorizar objetivos
   */
  private prioritizeGoals(goals: AIGoal[], aiState: AIState): AIGoal[] {
    return goals
      .filter((goal) => goal.priority >= this.MIN_PRIORITY_THRESHOLD)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Actualizar objetivo actual
   */
  private updateCurrentGoal(aiState: AIState): void {
    const now = Date.now();

    // Verificar si el objetivo actual ha expirado
    if (aiState.currentGoal && aiState.currentGoal.startTime) {
      const elapsed = now - aiState.currentGoal.startTime;
      if (elapsed > this.GOAL_TIMEOUT) {
        logAutopoiesis.debug(`⏰ Objetivo expirado para ${aiState.entityId}`, {
          goalType: aiState.currentGoal.type,
          elapsed,
        });
        this.completeGoal(aiState, false);
      }
    }

    // Asignar nuevo objetivo si no hay uno activo
    if (!aiState.currentGoal && aiState.goalQueue.length > 0) {
      aiState.currentGoal = aiState.goalQueue.shift();
      if (aiState.currentGoal) {
        aiState.currentGoal.startTime = now;
        this.startGoalExecution(aiState, aiState.currentGoal);
      }
    }
  }

  /**
   * Iniciar ejecución de objetivo
   */
  private startGoalExecution(aiState: AIState, goal: AIGoal): void {
    logAutopoiesis.info(`🚀 Iniciando objetivo para ${aiState.entityId}`, {
      goalType: goal.type,
      targetZone: goal.targetZone,
      priority: goal.priority,
    });

    // Mover a la zona objetivo si está especificada
    if (goal.targetZone) {
      this.moveToZone(aiState.entityId, goal.targetZone);
    }

    // Marcar zona como visitada
    if (goal.targetZone) {
      aiState.memory.visitedZones.add(goal.targetZone);
    }
  }

  /**
   * Completar objetivo
   */
  private completeGoal(aiState: AIState, success: boolean): void {
    if (!aiState.currentGoal) return;

    const goal = aiState.currentGoal;

    // Actualizar memoria
    if (goal.targetZone) {
      if (success) {
        const current =
          aiState.memory.successfulActivities.get(goal.targetZone) || 0;
        aiState.memory.successfulActivities.set(goal.targetZone, current + 1);
      } else {
        const current = aiState.memory.failedAttempts.get(goal.targetZone) || 0;
        aiState.memory.failedAttempts.set(goal.targetZone, current + 1);
      }
    }

    logAutopoiesis.debug(`✅ Objetivo completado para ${aiState.entityId}`, {
      goalType: goal.type,
      success,
      targetZone: goal.targetZone,
    });

    aiState.currentGoal = undefined;
  }

  /**
   * Establecer referencia al sistema de movimiento
   */
  public setMovementSystem(movementSystem: MovementSystem): void {
    this.movementSystem = movementSystem;
  }

  /**
   * Notificación al llegar a una zona: actualizar memoria y completar objetivo si corresponde
   */
  public notifyEntityArrived(entityId: string, zoneId: string): void {
    const aiState = this.aiStates.get(entityId);
    if (!aiState) return;

    aiState.memory.visitedZones.add?.(zoneId);

    if (aiState.currentGoal && aiState.currentGoal.targetZone === zoneId) {
      this.completeGoal(aiState, true);
    }

    logAutopoiesis.debug(`📍 ${entityId} registrado en zona ${zoneId}`);
  }

  /**
   * Mover entidad a zona
   */
  private moveToZone(entityId: string, zoneId: string): void {
    const zone = this.gameState.zones.find((z) => z.id === zoneId);
    if (!zone) return;

    // Intentar mover usando el sistema de movimiento
    if (this.movementSystem) {
      const success = this.movementSystem.moveToZone(entityId, zoneId);

      if (success) {
        // Al iniciar viaje, limpiar zona actual para evitar beneficios en tránsito
        try {
          this.needsSystem.setEntityZone(entityId, undefined);
        } catch {}
        // La zona se marcará al ARRIBAR (evento entityArrivedAtZone)
        logAutopoiesis.debug(`🚶 ${entityId} iniciando viaje a zona ${zoneId}`);
      } else {
        logAutopoiesis.debug(
          `⛔ ${entityId} no pudo iniciar viaje a zona ${zoneId} - ocupado`,
        );

        // Si no puede moverse, marcar el objetivo como fallido
        const aiState = this.aiStates.get(entityId);
        if (aiState && aiState.currentGoal) {
          this.completeGoal(aiState, false);
        }
      }
    } else {
      // Fallback: notificar directamente al sistema de necesidades
      this.needsSystem.setEntityZone(entityId, zoneId);
      logAutopoiesis.debug(
        `🚶 ${entityId} moviéndose a zona ${zoneId} (sin sistema de movimiento)`,
      );
    }
  }

  /**
   * Limpiar cache expirado
   */
  private cleanupExpiredCache(now: number): void {
    this.cacheExpiry.forEach((expiry, key) => {
      if (now > expiry) {
        this.pathCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    });
  }

  /**
   * Establecer control manual de entidad
   */
  public setPlayerControl(entityId: string, controlled: boolean): void {
    const aiState = this.aiStates.get(entityId);
    if (aiState) {
      aiState.isPlayerControlled = controlled;

      if (controlled) {
        // Cancelar objetivo actual al tomar control
        aiState.currentGoal = undefined;
        aiState.goalQueue = [];
      }

      logAutopoiesis.info(
        `🎮 Control de ${entityId} ${controlled ? "tomado" : "liberado"} por jugador`,
      );
    }
  }

  /**
   * Obtener estado de IA de entidad
   */
  public getEntityAI(entityId: string): AIState | undefined {
    return this.aiStates.get(entityId);
  }

  /**
   * Obtener estadísticas del sistema
   */
  public getSystemStats() {
    const entities = Array.from(this.aiStates.values());

    return {
      totalEntities: entities.length,
      activeGoals: entities.filter((ai) => ai.currentGoal).length,
      playerControlled: entities.filter((ai) => ai.isPlayerControlled).length,
      averageGoalsInQueue:
        entities.reduce((sum, ai) => sum + ai.goalQueue.length, 0) /
        entities.length,
      memoryStats: {
        totalZonesRemembered: entities.reduce(
          (sum, ai) => sum + ai.memory.visitedZones.size,
          0,
        ),
        totalSuccessfulActivities: entities.reduce(
          (sum, ai) => sum + ai.memory.successfulActivities.size,
          0,
        ),
      },
    };
  }

  /**
   * Establecer prioridad específica para una entidad
   */
  public setEntityPriority(
    entityId: string,
    priority: "survival" | "normal" | "social",
  ): void {
    const aiState = this.aiStates.get(entityId);
    if (!aiState) return;

    // Limpiar goals actuales si es prioridad de supervivencia
    if (priority === "survival") {
      aiState.goalQueue = [];
      aiState.currentGoal = null;
      // Reset goal start time in current goal if exists

      // Generar goal de supervivencia inmediato
      const survivalGoal: AIGoal = {
        id: `survival_${Date.now()}`,
        type: "satisfy_need",
        targetZone: "any", // Buscar cualquier zona apropiada
        priority: 1.0,
        estimatedDuration: 10000,
        startTime: Date.now(),
      };

      aiState.goalQueue.push(survivalGoal);

      logAutopoiesis.warn(
        `🆘 Prioridad de supervivencia activada para ${entityId}`,
      );
    }
  }

  /**
   * Limpiar sistema
   */
  public cleanup(): void {
    this.aiStates.clear();
    this.pathCache.clear();
    this.cacheExpiry.clear();
  }
}
