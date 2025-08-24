/**
 * Sistema de Necesidades para "Una Carta Para Isa"
 * Maneja hambre, sed, energía, salud mental y supervivencia de los agentes
 */

import type { GameState } from "../types";
import { logAutopoiesis } from "../utils/logger";

export interface NeedsState {
  hunger: number; // 0-100 (100 = completamente satisfecho)
  thirst: number; // 0-100
  energy: number; // 0-100
  hygiene: number; // 0-100
  social: number; // 0-100
  fun: number; // 0-100
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
  isDead?: boolean;
  deathTime?: number;
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
      hungerDecayRate: 0.2, // Pierde 0.2 puntos por segundo = 12/minuto → 100 a 0 en 8 minutos
      thirstDecayRate: 0.3, // Pierde 0.3 puntos por segundo = 18/minuto → 100 a 0 en 5.5 minutos
      energyDecayRate: 0.15, // Pierde 0.15 puntos por segundo = 9/minuto → 100 a 0 en 11 minutos
      mentalHealthDecayRate: 0.12, // Pierde 0.12 p/s = 7.2/min → 100 a 0 en ~14 min
      criticalThreshold: 20, // Crítico bajo 20
      warningThreshold: 40, // Advertencia bajo 40
      recoveryMultiplier: 5.0, // Velocidad de recuperación optimizada en zonas
    };

    logAutopoiesis.info("💚 Sistema de Necesidades inicializado", {
      updateInterval: this.updateInterval,
      config: this.needsConfig,
    });

    // Evitar deltaTime gigante en la primera actualización
    this.lastUpdateTime = Date.now();
  }

  /**
   * Obtener configuración actual del sistema de necesidades
   */
  public getConfig(): NeedsConfig {
    return { ...this.needsConfig };
  }

  /**
   * Actualizar parcialmente la configuración (con validaciones)
   */
  public updateConfig(partial: Partial<NeedsConfig>): void {
    const prev = { ...this.needsConfig };
    this.needsConfig = {
      ...this.needsConfig,
      ...partial,
    };
    // Validaciones básicas
    const clamp = (v: number, min: number, max: number) =>
      Math.max(min, Math.min(max, v));
    this.needsConfig.hungerDecayRate = clamp(
      this.needsConfig.hungerDecayRate,
      0.01,
      2,
    );
    this.needsConfig.thirstDecayRate = clamp(
      this.needsConfig.thirstDecayRate,
      0.01,
      2,
    );
    this.needsConfig.energyDecayRate = clamp(
      this.needsConfig.energyDecayRate,
      0.01,
      2,
    );
    this.needsConfig.mentalHealthDecayRate = clamp(
      this.needsConfig.mentalHealthDecayRate,
      0.0,
      1,
    );
    this.needsConfig.recoveryMultiplier = clamp(
      this.needsConfig.recoveryMultiplier,
      0.5,
      10,
    );

    logAutopoiesis.info("🛠️ Config NeedsSystem actualizada", {
      prev,
      next: this.needsConfig,
    });
  }

  /**
   * Inicializar necesidades para una entidad
   */
  public initializeEntityNeeds(
    entityId: string,
    initialNeeds?: NeedsState,
  ): void {
    const needsData: EntityNeedsData = {
      entityId,
      needs: initialNeeds || {
        hunger: 80 + Math.random() * 20, // Empezar entre 80-100
        thirst: 75 + Math.random() * 25,
        energy: 85 + Math.random() * 15,
        hygiene: 70 + Math.random() * 30,
        social: 50 + Math.random() * 50,
        fun: 60 + Math.random() * 40,
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
      // Saltar entidades muertas
      if (entityData.isDead) return;

      this.updateEntityNeeds(entityData, deltaTime);
      this.checkEntityDeath(entityId, entityData.needs);
      this.checkEmergencyLevels(entityData);
      this.handleZoneBenefits(entityData, deltaTime);
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

    // Decaimiento natural de necesidades (reducido para balance)
    needs.hunger = Math.max(
      0,
      needs.hunger - config.hungerDecayRate * 0.7 * deltaTime,
    );
    needs.thirst = Math.max(
      0,
      needs.thirst - config.thirstDecayRate * 0.7 * deltaTime,
    );
    needs.energy = Math.max(
      0,
      needs.energy - config.energyDecayRate * 0.7 * deltaTime,
    );
    needs.mentalHealth = Math.max(
      0,
      needs.mentalHealth - config.mentalHealthDecayRate * 0.7 * deltaTime,
    );

    // Decaimiento de nuevas necesidades (también reducido)
    needs.hygiene = Math.max(
      0,
      needs.hygiene - config.hungerDecayRate * 0.5 * deltaTime,
    );
    needs.social = Math.max(
      0,
      needs.social - config.mentalHealthDecayRate * 0.3 * deltaTime,
    );
    needs.fun = Math.max(
      0,
      needs.fun - config.mentalHealthDecayRate * 0.4 * deltaTime,
    );

    // Recuperación pasiva deshabilitada: la recuperación ocurre solo en zonas

    // Efectos cruzados entre necesidades
    this.applyNeedsCrossEffects(needs, deltaTime);

    needs.lastUpdate = Date.now();
  }

  /**
   * Aplicar recuperación pasiva básica para evitar que todas las estadísticas bajen constantemente
   */
  private applyBasicRecovery(
    entityData: EntityNeedsData,
    deltaTime: number,
  ): void {
    const { needs } = entityData;
    // Deshabilitado: la recuperación solo ocurre dentro de zonas designadas
    const BASIC_RECOVERY_RATE = 0.0;

    // Recuperación básica universal - todas las necesidades se recuperan lentamente
    // (sin efecto)

    // Recuperación adicional cuando las estadísticas están muy bajas (boost de supervivencia)
    const CRITICAL_BOOST = 0.0;

    // Boost moderado para salud mental
    // (sin efecto)
  }

  /**
   * Aplicar efectos cruzados entre necesidades (REBALANCEADO)
   */
  private applyNeedsCrossEffects(needs: NeedsState, deltaTime: number): void {
    // Límites de seguridad mínimos para evitar espirales de muerte
    const SAFETY_THRESHOLD = 5; // Reducir para permitir más variación

    // Hambre crítica afecta energía y salud mental (REDUCIDO)
    if (needs.hunger < 10) {
      // Solo en casos extremos
      needs.energy = Math.max(SAFETY_THRESHOLD, needs.energy - 0.1 * deltaTime);
      needs.mentalHealth = Math.max(
        SAFETY_THRESHOLD,
        needs.mentalHealth - 0.05 * deltaTime, // Reducido drasticamente
      );
    }

    // Sed crítica afecta energía principalmente (REDUCIDO)
    if (needs.thirst < 10) {
      // Solo en casos extremos
      needs.energy = Math.max(
        SAFETY_THRESHOLD,
        needs.energy - 0.15 * deltaTime,
      );
      needs.mentalHealth = Math.max(
        SAFETY_THRESHOLD,
        needs.mentalHealth - 0.05 * deltaTime, // Reducido drasticamente
      );
    }

    // Energía baja afecta menos agresivamente (con límites duros)
    if (needs.energy < 25) {
      needs.hunger = Math.max(SAFETY_THRESHOLD, needs.hunger - 0.1 * deltaTime);
      needs.thirst = Math.max(SAFETY_THRESHOLD, needs.thirst - 0.1 * deltaTime);
    }

    // Salud mental baja tiene efectos reducidos (con límites duros)
    if (needs.mentalHealth < 30) {
      needs.hunger = Math.max(
        SAFETY_THRESHOLD,
        needs.hunger - 0.05 * deltaTime,
      );
      needs.energy = Math.max(SAFETY_THRESHOLD, needs.energy - 0.1 * deltaTime);
    }

    // Higiene baja afecta salud mental (REDUCIDO)
    if (needs.hygiene < 10) {
      // Solo casos extremos
      needs.mentalHealth = Math.max(
        SAFETY_THRESHOLD,
        needs.mentalHealth - 0.02 * deltaTime, // Drasticamente reducido
      );
    }

    // Falta de diversión afecta salud mental (REDUCIDO)
    if (needs.fun < 5) {
      // Solo casos extremos
      needs.mentalHealth = Math.max(
        SAFETY_THRESHOLD,
        needs.mentalHealth - 0.03 * deltaTime, // Drasticamente reducido
      );
    }

    // Aislamiento social afecta salud mental (REDUCIDO)
    if (needs.social < 5) {
      // Solo casos extremos
      needs.mentalHealth = Math.max(
        SAFETY_THRESHOLD,
        needs.mentalHealth - 0.04 * deltaTime, // Drasticamente reducido
      );
    }

    // ✅ VALIDACIÓN FINAL DE SEGURIDAD - prevenir espirales de muerte
    this.applySafetyValidation(needs, deltaTime);
  }

  /**
   * Aplicar validaciones de seguridad para prevenir espirales de muerte
   */
  private applySafetyValidation(needs: NeedsState, deltaTime: number): void {
    const CRITICAL_THRESHOLD = 1; // Reducir umbral mínimo para permitir más variación
    const SAFETY_MULTIPLIER = 0.1; // Ralentizar cambios extremos

    // Si deltaTime es muy alto (lag/tabs), limitar efectos negativos
    if (deltaTime > 5) {
      // Más de 5 segundos es sospechoso
      logAutopoiesis.warn(
        `⚠️ DeltaTime sospechoso en NeedsSystem: ${deltaTime}s - aplicando compensación`,
      );

      // Revertir efectos excesivos aplicando recuperación parcial
      Object.keys(needs).forEach((key) => {
        const need = needs[key as keyof NeedsState];
        if (typeof need === "number" && need < 5) {
          (needs as any)[key] = Math.min(15, need + 5);
          logAutopoiesis.info(
            `🛡️ Recuperación de emergencia aplicada a ${key}: ${need} -> ${(needs as any)[key]}`,
          );
        }
      });
    }

    // Aplicar límites absolutos mínimos SOLO en casos extremos (excepto lastUpdate)
    (Object.keys(needs) as (keyof NeedsState)[])
      .filter((k) => k !== "lastUpdate")
      .forEach((key) => {
        const need = needs[key];
        if (typeof need === "number" && need < CRITICAL_THRESHOLD) {
          (needs as any)[key] = CRITICAL_THRESHOLD;
        }
      });

    // Límites máximos también (prevenir valores extremos) - excluir lastUpdate
    (Object.keys(needs) as (keyof NeedsState)[])
      .filter((k) => k !== "lastUpdate")
      .forEach((key) => {
        const need = needs[key];
        if (typeof need === "number" && need > 100) {
          (needs as any)[key] = 100;
        }
      });
  }

  /**
   * Verificar muerte de entidad
   */
  private checkEntityDeath(entityId: string, needs: NeedsState): void {
    const DEATH_THRESHOLD = 5;
    const criticalNeeds = [needs.hunger, needs.energy, needs.mentalHealth];
    const criticalCount = criticalNeeds.filter(
      (need) => need <= DEATH_THRESHOLD,
    ).length;

    if (criticalCount >= 2) {
      // Entidad en estado crítico - iniciar muerte
      this.handleEntityDeath(entityId);
    }
  }

  private handleEntityDeath(entityId: string): void {
    const entityData = this.entityNeeds.get(entityId);
    if (!entityData || entityData.isDead) return;

    // Marcar como muerto
    entityData.isDead = true;
    entityData.deathTime = Date.now();

    // Emitir evento de muerte
    this.scene.events.emit("entity:death", {
      entityId,
      cause: "needs_failure",
      needs: { ...entityData.needs },
    });

    logAutopoiesis.warn(`💀 ${entityId} ha muerto por necesidades críticas`, {
      needs: entityData.needs,
    });

    // Programar respawn
    this.scene.time.delayedCall(5000, () => {
      this.respawnEntity(entityId);
    });
  }

  private respawnEntity(entityId: string): void {
    const entityData = this.entityNeeds.get(entityId);
    if (!entityData) return;

    // Resetear estado
    entityData.isDead = false;
    entityData.deathTime = undefined;

    // Restaurar necesidades a niveles más altos para evitar muerte inmediata
    entityData.needs.hunger = 85;
    entityData.needs.thirst = 85; // Agregar sed también
    entityData.needs.energy = 85;
    entityData.needs.hygiene = 80;
    entityData.needs.mentalHealth = 90;
    entityData.needs.social = 70;
    entityData.needs.fun = 70;

    // Obtener punto de spawn
    const spawnPoint = this.getSpawnPoint(entityId);

    // Emitir evento de respawn
    this.scene.events.emit("entity:respawn", {
      entityId,
      position: spawnPoint,
      restoredNeeds: { ...entityData.needs },
    });

    logAutopoiesis.info(`✨ ${entityId} ha respawneado`, {
      spawnPoint,
      restoredNeeds: entityData.needs,
    });
  }

  private getSpawnPoint(entityId: string): { x: number; y: number } {
    // Definir puntos de spawn por entidad
    const spawnPoints: Record<string, { x: number; y: number }> = {
      isa: { x: 400, y: 300 },
      stev: { x: 450, y: 300 },
    };

    return spawnPoints[entityId] || { x: 400, y: 400 };
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
    if (needs.hygiene < threshold) critical.push("hygiene");
    if (needs.social < threshold) critical.push("social");
    if (needs.fun < threshold) critical.push("fun");
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
      needs.hygiene < threshold &&
      needs.hygiene >= this.needsConfig.criticalThreshold
    ) {
      warning.push("hygiene");
    }
    if (
      needs.social < threshold &&
      needs.social >= this.needsConfig.criticalThreshold
    ) {
      warning.push("social");
    }
    if (
      needs.fun < threshold &&
      needs.fun >= this.needsConfig.criticalThreshold
    ) {
      warning.push("fun");
    }
    if (
      needs.mentalHealth < threshold &&
      needs.mentalHealth >= this.needsConfig.criticalThreshold
    ) {
      warning.push("mentalHealth");
    }

    return warning;
  }

  /** Verifica si la entidad está cerca de la muerte */
  private isNearDeath(needs: NeedsState): boolean {
    // Contar necesidades en estado crítico extremo
    const criticalCount = [
      needs.hunger < 5,
      needs.thirst < 5,
      needs.energy < 5,
      needs.mentalHealth < 5,
    ].filter(Boolean).length;

    // Muerte por múltiples necesidades críticas O sed extrema
    return criticalCount >= 2 || needs.thirst < 2;
  }

  /**
   * Manejar beneficios de zonas
   */
  private handleZoneBenefits(entityData: EntityNeedsData, deltaTime: number): void {
    if (!entityData.currentZone) return;

    const zone = this.gameState.zones.find(
      (z) => z.id === entityData.currentZone,
    );
    if (!zone) return;

    const recoveryRate = this.needsConfig.recoveryMultiplier;

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
        this.satisfyNeed(entityData, "social", recoveryRate * 0.6 * deltaTime);
        this.satisfyNeed(
          entityData,
          "mentalHealth",
          recoveryRate * 0.3 * deltaTime,
        );
        this.satisfyNeed(entityData, "fun", recoveryRate * 0.3 * deltaTime);
        // Beneficio menor en otras necesidades por socialización
        this.satisfyNeed(entityData, "energy", recoveryRate * 0.2 * deltaTime);
        break;

      case "hygiene":
        this.satisfyNeed(entityData, "hygiene", recoveryRate * deltaTime);
        this.satisfyNeed(
          entityData,
          "mentalHealth",
          recoveryRate * 0.15 * deltaTime,
        );
        break;

      case "entertainment":
      case "fun":
        this.satisfyNeed(entityData, "fun", recoveryRate * deltaTime);
        this.satisfyNeed(
          entityData,
          "mentalHealth",
          recoveryRate * 0.2 * deltaTime,
        );
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
          recoveryRate * 0.15 * deltaTime,
        );
        break;

      // Zonas adicionales ya definidas en WorldConfig
      case "medical":
        // Enfocado en salud mental (recuperación) y un pequeño descanso energético
        this.satisfyNeed(
          entityData,
          "mentalHealth",
          recoveryRate * 0.4 * deltaTime,
        );
        this.satisfyNeed(entityData, "energy", recoveryRate * 0.2 * deltaTime);
        break;

      case "training":
        // Entrenamiento consume energía, pero mejora bienestar mental
        entityData.needs.energy = Math.max(
          0,
          entityData.needs.energy - 0.25 * deltaTime,
        );
        this.satisfyNeed(
          entityData,
          "mentalHealth",
          recoveryRate * 0.2 * deltaTime,
        );
        this.satisfyNeed(entityData, "fun", recoveryRate * 0.2 * deltaTime);
        break;

      case "knowledge":
        // Conocimiento aporta bienestar mental y algo de diversión; ligero coste de energía
        entityData.needs.energy = Math.max(
          0,
          entityData.needs.energy - 0.1 * deltaTime,
        );
        this.satisfyNeed(
          entityData,
          "mentalHealth",
          recoveryRate * 0.25 * deltaTime,
        );
        this.satisfyNeed(entityData, "fun", recoveryRate * 0.2 * deltaTime);
        break;

      case "spiritual":
        // Espiritualidad fuertemente restaurativa para salud mental
        this.satisfyNeed(
          entityData,
          "mentalHealth",
          recoveryRate * 0.5 * deltaTime,
        );
        break;

      case "market":
        // Mercado/socialización ligera, aumenta bienestar general leve
        this.satisfyNeed(entityData, "social", recoveryRate * 0.3 * deltaTime);
        this.satisfyNeed(
          entityData,
          "mentalHealth",
          recoveryRate * 0.1 * deltaTime,
        );
        this.satisfyNeed(entityData, "fun", recoveryRate * 0.2 * deltaTime);
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

      // Emitir evento para QuestSystem
      this.scene.events.emit("needsSatisfied", {
        entityId: entityData.entityId,
        needType,
        amount,
        currentValue: newValue,
      });

      // Si se satisfizo hambre, emitir evento de comida consumida
      if (needType === "hunger" && amount > 5) {
        this.scene.events.emit("food_consumed", {
          entityId: entityData.entityId,
          foodType: this.deduceFoodType(amount),
          amount,
        });
      }

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
  public modifyEntityNeed(
    entityId: string,
    needType: string,
    amount: number,
  ): boolean {
    const entityData = this.entityNeeds.get(entityId);
    if (!entityData) {
      logAutopoiesis.warn(
        `❌ Entidad ${entityId} no encontrada para modificar necesidad ${needType}`,
      );
      return false;
    }

    const needs = entityData.needs;
    const validNeeds = [
      "hunger",
      "thirst",
      "energy",
      "hygiene",
      "social",
      "fun",
      "mentalHealth",
    ];

    if (!validNeeds.includes(needType)) {
      logAutopoiesis.warn(`❌ Tipo de necesidad inválido: ${needType}`);
      return false;
    }

    // Aplicar modificación con clamps
    const currentValue = needs[needType as keyof NeedsState] as number;
    const newValue = Math.max(0, Math.min(100, currentValue + amount));

    // Usar type assertion más específica para la asignación
    (needs as unknown as Record<string, number | Date>)[needType] = newValue;

    // Actualizar timestamp
    needs.lastUpdate = Date.now();

    // Re-evaluar nivel de emergencia
    this.checkEmergencyLevels(entityData);

    logAutopoiesis.debug(
      `🔧 Necesidad modificada: ${entityId}.${needType} ${currentValue} → ${newValue} (${amount > 0 ? "+" : ""}${amount})`,
    );

    return true;
  }

  /**
   * Método público para modificar necesidades (alias más simple)
   */
  public modifyNeed(
    entityId: string,
    needType: string,
    amount: number,
  ): boolean {
    return this.modifyEntityNeed(entityId, needType, amount);
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
      // Ampliamos tipos útiles para bienestar mental según zonas existentes
      mentalHealth: [
        "social",
        "rest",
        "spiritual",
        "knowledge",
        "medical",
        "market",
        "fun",
      ],
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
      return {
        hunger: 0,
        thirst: 0,
        energy: 0,
        hygiene: 0,
        social: 0,
        fun: 0,
        mentalHealth: 0,
      };
    }

    const totals = entities.reduce(
      (acc, entity) => {
        acc.hunger += entity.needs.hunger;
        acc.thirst += entity.needs.thirst;
        acc.energy += entity.needs.energy;
        acc.hygiene += entity.needs.hygiene;
        acc.social += entity.needs.social;
        acc.fun += entity.needs.fun;
        acc.mentalHealth += entity.needs.mentalHealth;
        return acc;
      },
      {
        hunger: 0,
        thirst: 0,
        energy: 0,
        hygiene: 0,
        social: 0,
        fun: 0,
        mentalHealth: 0,
      },
    );

    return {
      hunger: Math.round(totals.hunger / entities.length),
      thirst: Math.round(totals.thirst / entities.length),
      energy: Math.round(totals.energy / entities.length),
      hygiene: Math.round(totals.hygiene / entities.length),
      social: Math.round(totals.social / entities.length),
      fun: Math.round(totals.fun / entities.length),
      mentalHealth: Math.round(totals.mentalHealth / entities.length),
    };
  }

  /**
   * Suscribirse a eventos de necesidades
   */
  public on(
    event: string,
    callback: (...args: Array<string | number | boolean | object>) => void,
  ): void {
    this.needsEvents.on(event, callback);
  }

  /**
   * Deducir tipo de comida basado en la cantidad consumida
   */
  private deduceFoodType(amount: number): string {
    if (amount <= 10) return "snack";
    if (amount <= 20) return "light_meal";
    if (amount <= 35) return "normal_meal";
    return "feast";
  }

  /**
   * Limpiar sistema
   */
  public cleanup(): void {
    this.entityNeeds.clear();
    this.needsEvents.removeAllListeners();
  }
}
