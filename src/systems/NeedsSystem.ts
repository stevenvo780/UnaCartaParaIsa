/**
 * Sistema de Necesidades para "Una Carta Para Isa"
 * Maneja hambre, sed, energía, salud mental y supervivencia de los agentes
 */

import type { GameState, Zone } from "../types";
import { logAutopoiesis } from "../utils/logger";

export interface NeedsState {
  hunger: number; // 0-100 (100 = completamente satisfecho)
  thirst: number; // 0-100
  energy: number; // 0-100
  mentalHealth: number; // 0-100
  lastUpdate: number;
}

export interface NeedsConfig {
  hungerDecayRate: number;
  thirstDecayRate: number;
  energyDecayRate: number;
  mentalHealthDecayRate: number;
  criticalThreshold: number;
  warningThreshold: number;
  recoveryMultiplier: number;
}

export interface EntityNeedsData {
  entityId: string;
  needs: NeedsState;
  currentZone?: string;
  satisfactionSources: Record<string, number>;
  emergencyLevel: "none" | "warning" | "critical" | "dying";
}

export class NeedsSystem {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private entityNeeds = new Map<string, EntityNeedsData>();
  private needsConfig: NeedsConfig;
  private lastUpdateTime = 0;
  private updateInterval = 1000; // 1 segundo

  // Eventos de necesidades
  private needsEvents = new Phaser.Events.EventEmitter();

  constructor(scene: Phaser.Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;

    this.needsConfig = {
      hungerDecayRate: 0.8, // Pierde 0.8 puntos por segundo
      thirstDecayRate: 1.2, // Sed decae más rápido
      energyDecayRate: 0.5, // Energía decae más lento
      mentalHealthDecayRate: 0.3, // Salud mental decae muy lento
      criticalThreshold: 20, // Crítico bajo 20
      warningThreshold: 40, // Advertencia bajo 40
      recoveryMultiplier: 2.5, // Velocidad de recuperación en zonas apropiadas
    };

    logAutopoiesis.info("💚 Sistema de Necesidades inicializado", {
      updateInterval: this.updateInterval,
      config: this.needsConfig,
    });
  }

  /**
   * Inicializar necesidades para una entidad
   */
  public initializeEntityNeeds(entityId: string): void {
    const needsData: EntityNeedsData = {
      entityId,
      needs: {
        hunger: 80 + Math.random() * 20, // Empezar entre 80-100
        thirst: 75 + Math.random() * 25,
        energy: 85 + Math.random() * 15,
        mentalHealth: 90 + Math.random() * 10,
        lastUpdate: Date.now(),
      },
      satisfactionSources: {},
      emergencyLevel: "none",
    };

    this.entityNeeds.set(entityId, needsData);

    logAutopoiesis.info(`🧬 Necesidades inicializadas para ${entityId}`, {
      initialNeeds: needsData.needs,
    });
  }

  /**
   * Actualizar todas las necesidades
   */
  public update(): void {
    const now = Date.now();

    if (now - this.lastUpdateTime < this.updateInterval) {
      return;
    }

    const deltaTime = (now - this.lastUpdateTime) / 1000; // En segundos

    this.entityNeeds.forEach((entityData, entityId) => {
      this.updateEntityNeeds(entityData, deltaTime);
      this.checkEmergencyLevels(entityData);
      this.handleZoneBenefits(entityData);
    });

    this.lastUpdateTime = now;
  }

  /**
   * Actualizar necesidades de una entidad específica
   */
  private updateEntityNeeds(
    entityData: EntityNeedsData,
    deltaTime: number,
  ): void {
    const { needs } = entityData;
    const config = this.needsConfig;

    // Decaimiento natural de necesidades
    needs.hunger = Math.max(
      0,
      needs.hunger - config.hungerDecayRate * deltaTime,
    );
    needs.thirst = Math.max(
      0,
      needs.thirst - config.thirstDecayRate * deltaTime,
    );
    needs.energy = Math.max(
      0,
      needs.energy - config.energyDecayRate * deltaTime,
    );
    needs.mentalHealth = Math.max(
      0,
      needs.mentalHealth - config.mentalHealthDecayRate * deltaTime,
    );

    // Efectos cruzados entre necesidades
    this.applyNeedsCrossEffects(needs, deltaTime);

    needs.lastUpdate = Date.now();
  }

  /**
   * Aplicar efectos cruzados entre necesidades
   */
  private applyNeedsCrossEffects(needs: NeedsState, deltaTime: number): void {
    // Hambre crítica afecta energía y salud mental
    if (needs.hunger < 20) {
      needs.energy = Math.max(0, needs.energy - 0.5 * deltaTime);
      needs.mentalHealth = Math.max(0, needs.mentalHealth - 0.3 * deltaTime);
    }

    // Sed crítica afecta todo
    if (needs.thirst < 15) {
      needs.hunger = Math.max(0, needs.hunger - 0.3 * deltaTime);
      needs.energy = Math.max(0, needs.energy - 0.8 * deltaTime);
      needs.mentalHealth = Math.max(0, needs.mentalHealth - 0.5 * deltaTime);
    }

    // Energía baja afecta capacidad de satisfacer otras necesidades
    if (needs.energy < 25) {
      // Dificulta la búsqueda de comida y agua
      needs.hunger = Math.max(0, needs.hunger - 0.2 * deltaTime);
      needs.thirst = Math.max(0, needs.thirst - 0.2 * deltaTime);
    }

    // Salud mental baja afecta todo
    if (needs.mentalHealth < 30) {
      needs.hunger = Math.max(0, needs.hunger - 0.1 * deltaTime);
      needs.energy = Math.max(0, needs.energy - 0.2 * deltaTime);
    }
  }

  /**
   * Verificar niveles de emergencia
   */
  private checkEmergencyLevels(entityData: EntityNeedsData): void {
    const { needs } = entityData;
    const config = this.needsConfig;
    const previousLevel = entityData.emergencyLevel;

    // Determinar nivel de emergencia
    const criticalNeeds = this.getCriticalNeeds(needs);
    const warningNeeds = this.getWarningNeeds(needs);

    if (criticalNeeds.length > 0) {
      entityData.emergencyLevel = this.isNearDeath(needs)
        ? "dying"
        : "critical";
    } else if (warningNeeds.length > 0) {
      entityData.emergencyLevel = "warning";
    } else {
      entityData.emergencyLevel = "none";
    }

    // Emitir eventos si el nivel cambió
    if (previousLevel !== entityData.emergencyLevel) {
      this.needsEvents.emit("emergencyLevelChanged", {
        entityId: entityData.entityId,
        previousLevel,
        currentLevel: entityData.emergencyLevel,
        criticalNeeds,
        warningNeeds,
      });

      logAutopoiesis.info(
        `🚨 Nivel de emergencia cambió para ${entityData.entityId}`,
        {
          from: previousLevel,
          to: entityData.emergencyLevel,
          needs: needs,
        },
      );
    }
  }

  /**
   * Obtener necesidades críticas
   */
  private getCriticalNeeds(needs: NeedsState): string[] {
    const critical: string[] = [];
    const threshold = this.needsConfig.criticalThreshold;

    if (needs.hunger < threshold) critical.push("hunger");
    if (needs.thirst < threshold) critical.push("thirst");
    if (needs.energy < threshold) critical.push("energy");
    if (needs.mentalHealth < threshold) critical.push("mentalHealth");

    return critical;
  }

  /**
   * Obtener necesidades en advertencia
   */
  private getWarningNeeds(needs: NeedsState): string[] {
    const warning: string[] = [];
    const threshold = this.needsConfig.warningThreshold;

    if (
      needs.hunger < threshold &&
      needs.hunger >= this.needsConfig.criticalThreshold
    ) {
      warning.push("hunger");
    }
    if (
      needs.thirst < threshold &&
      needs.thirst >= this.needsConfig.criticalThreshold
    ) {
      warning.push("thirst");
    }
    if (
      needs.energy < threshold &&
      needs.energy >= this.needsConfig.criticalThreshold
    ) {
      warning.push("energy");
    }
    if (
      needs.mentalHealth < threshold &&
      needs.mentalHealth >= this.needsConfig.criticalThreshold
    ) {
      warning.push("mentalHealth");
    }

    return warning;
  }

  /**
   * Verificar si la entidad está cerca de la muerte
   */
  private isNearDeath(needs: NeedsState): boolean {
    return (
      (needs.hunger < 5 && needs.thirst < 5) ||
      needs.thirst < 3 ||
      (needs.hunger < 3 && needs.energy < 5)
    );
  }

  /**
   * Manejar beneficios de zonas
   */
  private handleZoneBenefits(entityData: EntityNeedsData): void {
    if (!entityData.currentZone) return;

    const zone = this.gameState.zones.find(
      (z) => z.id === entityData.currentZone,
    );
    if (!zone) return;

    const recoveryRate = this.needsConfig.recoveryMultiplier;
    const deltaTime = this.updateInterval / 1000;

    // Aplicar beneficios según tipo de zona
    switch (zone.type) {
      case "food":
        this.satisfyNeed(entityData, "hunger", recoveryRate * deltaTime);
        break;

      case "water":
        this.satisfyNeed(entityData, "thirst", recoveryRate * deltaTime);
        break;

      case "shelter":
      case "rest":
        this.satisfyNeed(entityData, "energy", recoveryRate * deltaTime);
        break;

      case "social":
        this.satisfyNeed(entityData, "mentalHealth", recoveryRate * deltaTime);
        // Beneficio menor en otras necesidades por socialización
        this.satisfyNeed(entityData, "energy", recoveryRate * 0.3 * deltaTime);
        break;

      case "work":
        // Trabajo consume energía pero puede dar satisfacción mental
        entityData.needs.energy = Math.max(
          0,
          entityData.needs.energy - 0.3 * deltaTime,
        );
        this.satisfyNeed(
          entityData,
          "mentalHealth",
          recoveryRate * 0.5 * deltaTime,
        );
        break;
    }
  }

  /**
   * Satisfacer una necesidad específica
   */
  public satisfyNeed(
    entityData: EntityNeedsData,
    needType: keyof NeedsState,
    amount: number,
  ): void {
    if (needType === "lastUpdate") return;

    const currentValue = entityData.needs[needType] as number;
    const newValue = Math.min(100, currentValue + amount);

    if (newValue > currentValue) {
      (entityData.needs[needType] as number) = newValue;

      // Registrar fuente de satisfacción
      const sourceKey = entityData.currentZone || "unknown";
      entityData.satisfactionSources[sourceKey] =
        (entityData.satisfactionSources[sourceKey] || 0) + amount;

      logAutopoiesis.debug(
        `💫 ${needType} satisfecho para ${entityData.entityId}`,
        {
          amount,
          newValue,
          source: sourceKey,
        },
      );
    }
  }

  /**
   * Establecer zona actual de una entidad
   */
  public setEntityZone(entityId: string, zoneId: string | undefined): void {
    const entityData = this.entityNeeds.get(entityId);
    if (entityData) {
      entityData.currentZone = zoneId;

      if (zoneId) {
        logAutopoiesis.debug(`📍 ${entityId} entró en zona ${zoneId}`);
      }
    }
  }

  /**
   * Obtener necesidades de una entidad
   */
  public getEntityNeeds(entityId: string): EntityNeedsData | undefined {
    return this.entityNeeds.get(entityId);
  }

  /**
   * Modificar directamente una necesidad específica de una entidad
   */
  public modifyEntityNeed(entityId: string, needType: string, amount: number): boolean {
    const entityData = this.entityNeeds.get(entityId);
    if (!entityData) {
      logAutopoiesis.warn(`❌ Entidad ${entityId} no encontrada para modificar necesidad ${needType}`);
      return false;
    }

    const needs = entityData.needs;
    const validNeeds = ['hunger', 'thirst', 'energy', 'mentalHealth'];
    
    if (!validNeeds.includes(needType)) {
      logAutopoiesis.warn(`❌ Tipo de necesidad inválido: ${needType}`);
      return false;
    }

    // Aplicar modificación con clamps
    const currentValue = needs[needType as keyof NeedsState] as number;
    const newValue = Math.max(0, Math.min(100, currentValue + amount));
    
    (needs as any)[needType] = newValue;
    
    // Actualizar timestamp
    needs.lastUpdate = Date.now();
    
    // Re-evaluar nivel de emergencia
    this.updateEmergencyLevel(entityData);
    
    logAutopoiesis.debug(`🔧 Necesidad modificada: ${entityId}.${needType} ${currentValue} → ${newValue} (${amount > 0 ? '+' : ''}${amount})`);
    
    return true;
  }

  /**
   * Obtener el estado más crítico de necesidades
   */
  public getMostCriticalNeed(entityId: string): string | null {
    const entityData = this.entityNeeds.get(entityId);
    if (!entityData) return null;

    const { needs } = entityData;
    let lowestNeed = "none";
    let lowestValue = 100;

    (Object.entries(needs) as [keyof NeedsState, number][]).forEach(
      ([need, value]) => {
        if (need !== "lastUpdate" && value < lowestValue) {
          lowestValue = value;
          lowestNeed = need;
        }
      },
    );

    return lowestValue < this.needsConfig.warningThreshold ? lowestNeed : null;
  }

  /**
   * Obtener zona recomendada para satisfacer necesidad
   */
  public getRecommendedZoneForNeed(needType: string): string[] {
    const zoneTypes: Record<string, string[]> = {
      hunger: ["food"],
      thirst: ["water"],
      energy: ["rest", "shelter"],
      mentalHealth: ["social", "rest"],
    };

    const targetTypes = zoneTypes[needType] || [];

    return this.gameState.zones
      .filter((zone) => targetTypes.includes(zone.type))
      .sort((a, b) => b.attractiveness - a.attractiveness)
      .map((zone) => zone.id);
  }

  /**
   * Obtener estadísticas del sistema
   */
  public getSystemStats() {
    const entities = Array.from(this.entityNeeds.values());

    return {
      totalEntities: entities.length,
      emergencyLevels: {
        none: entities.filter((e) => e.emergencyLevel === "none").length,
        warning: entities.filter((e) => e.emergencyLevel === "warning").length,
        critical: entities.filter((e) => e.emergencyLevel === "critical")
          .length,
        dying: entities.filter((e) => e.emergencyLevel === "dying").length,
      },
      averageNeeds: this.calculateAverageNeeds(entities),
      config: this.needsConfig,
    };
  }

  /**
   * Calcular necesidades promedio
   */
  private calculateAverageNeeds(entities: EntityNeedsData[]) {
    if (entities.length === 0) {
      return { hunger: 0, thirst: 0, energy: 0, mentalHealth: 0 };
    }

    const totals = entities.reduce(
      (acc, entity) => {
        acc.hunger += entity.needs.hunger;
        acc.thirst += entity.needs.thirst;
        acc.energy += entity.needs.energy;
        acc.mentalHealth += entity.needs.mentalHealth;
        return acc;
      },
      { hunger: 0, thirst: 0, energy: 0, mentalHealth: 0 },
    );

    return {
      hunger: Math.round(totals.hunger / entities.length),
      thirst: Math.round(totals.thirst / entities.length),
      energy: Math.round(totals.energy / entities.length),
      mentalHealth: Math.round(totals.mentalHealth / entities.length),
    };
  }

  /**
   * Suscribirse a eventos de necesidades
   */
  public on(event: string, callback: (...args: any[]) => void): void {
    this.needsEvents.on(event, callback);
  }

  /**
   * Limpiar sistema
   */
  public cleanup(): void {
    this.entityNeeds.clear();
    this.needsEvents.removeAllListeners();
  }
}
