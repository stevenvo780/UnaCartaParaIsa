/**
 * Game Logic Manager - Maneja la lógica del juego separada del rendering
 * Centraliza actualizaciones, timers y estado del juego
 */

import { GAME_BALANCE, gameConfig } from "../config/gameConfig";
import { DayNightSystem } from "../systems/DayNightSystem";
import { MovementSystem } from "../systems/MovementSystem";
import { NeedsSystem } from "../systems/NeedsSystem";
import { QuestSystem } from "../systems/QuestSystem";
import { SystemLoader } from "../utils/SystemLoader";
import type { AISystem } from "../systems/AISystem";
import type { CardDialogueSystem } from "../systems/CardDialogueSystem";
import type { EmergenceSystem } from "../systems/EmergenceSystem";
import type {
  Entity,
  EntityStats,
  GameEvents,
  GameLogicUpdateData,
  GameState,
  IGameLogicManager,
  Zone,
} from "../types";
import { logAutopoiesis } from "../utils/logger";
import { EntityManager } from "./EntityManager";
import { EntityStateManager } from "./EntityStateManager";

export class GameLogicManager implements IGameLogicManager {
  private _scene: Phaser.Scene;
  private _gameState: GameState;
  private _gameLoopTimer?: Phaser.Time.TimerEvent;
  private _entityManager: EntityManager;
  private _entityStateManager: EntityStateManager;
  private _eventEmitter: Phaser.Events.EventEmitter;
  private _registeredListeners: Array<{
    target: Phaser.Events.EventEmitter;
    event: string;
    callback: Function;
  }> = [];
  private _needsSystem: NeedsSystem;
  private _aiSystem: AISystem | null = null; // Loaded dynamically
  private _movementSystem: MovementSystem;
  private _cardDialogueSystem: CardDialogueSystem | null = null; // Loaded dynamically
  private _dayNightSystem: DayNightSystem;
  private _emergenceSystem: EmergenceSystem | null = null; // Loaded dynamically
  private _questSystem: QuestSystem;

  public constructor(scene: Phaser.Scene, initialGameState: GameState) {
    this._scene = scene;
    this._gameState = initialGameState;
    this._entityManager = new EntityManager();
    this._entityStateManager = new EntityStateManager(scene);
    this._eventEmitter = new Phaser.Events.EventEmitter();

    // FASE 1: Crear sistemas básicos sin dependencias cruzadas
    this._needsSystem = new NeedsSystem(scene, initialGameState);
    this._movementSystem = new MovementSystem(scene, initialGameState);
    this._dayNightSystem = new DayNightSystem(
      scene,
      initialGameState,
      this._needsSystem,
    );

    // FASE 2: Sistemas no críticos se cargan dinámicamente
    this._aiSystem = null;
    this._cardDialogueSystem = null; 
    this._emergenceSystem = null;
    this._questSystem = new QuestSystem(scene);

    logAutopoiesis.info(
      "🏗️ Fase 1 de inicialización completada - sistemas básicos creados",
    );
  }

  /**
   * Initialize the game logic system - FASE 2 de inicialización
   */
  public async initialize(): Promise<void> {
    logAutopoiesis.info(
      "🔧 Iniciando FASE 2: carga lazy de sistemas no críticos",
    );

    // FASE 2A: Cargar sistemas dinámicamente
    await this._loadNonCriticalSystems();

    // FASE 2B: Conectar referencias entre sistemas (después de que todos existan)
    if (this._aiSystem) {
      this._aiSystem.setMovementSystem(this._movementSystem);
    }

    // Solo conectar CardDialogueSystem con AISystem si ambos están listos
    if (this._cardDialogueSystem && this._aiSystem) {
      try {
        this._cardDialogueSystem.setAISystem?.(this._aiSystem);
      } catch (error) {
        logAutopoiesis.warn(
          "No se pudo conectar CardDialogueSystem con AISystem:",
          error,
        );
      }
    }

    // FASE 2C: Configurar eventos entre sistemas
    this._setupSystemEvents();

    // FASE 2D: Inicializar después de que el mundo esté listo (con delay para rendering)
    this._scene.time.delayedCall(200, () => {
      this._initializeAfterWorldReady();
    });

    // Configurar game loop principal
    this._setupGameLoop();

    logAutopoiesis.info("🏗️ FASE 2 completada - sistemas cargados y configurados");
  }

  /**
   * Carga sistemas no críticos de manera lazy
   */
  private async _loadNonCriticalSystems(): Promise<void> {
    try {
      // Cargar AISystem
      const { AISystem } = await SystemLoader.loadAISystem();
      this._aiSystem = new AISystem(this._scene, this._gameState, this._needsSystem);

      // Cargar CardDialogueSystem  
      const { CardDialogueSystem } = await SystemLoader.loadCardDialogueSystem();
      this._cardDialogueSystem = new CardDialogueSystem(
        this._scene,
        this._gameState, 
        this._needsSystem,
      );

      // Cargar EmergenceSystem
      const { EmergenceSystem } = await SystemLoader.loadEmergenceSystem();
      this._emergenceSystem = new EmergenceSystem(
        this._scene,
        this._gameState,
        this._needsSystem,
        this._aiSystem,
        this._dayNightSystem,
      );

      logAutopoiesis.info("✅ Sistemas no críticos cargados exitosamente");
    } catch (error) {
      logAutopoiesis.error("❌ Error cargando sistemas no críticos:", error);
      // Crear fallbacks básicos
      this._createSystemFallbacks();
    }
  }

  /**
   * Crear fallbacks para sistemas que fallaron al cargar
   */
  private _createSystemFallbacks(): void {
    if (!this._aiSystem) {
      this._aiSystem = { setMovementSystem: () => {}, update: () => {} };
    }
    if (!this._cardDialogueSystem) {
      this._cardDialogueSystem = { update: () => {}, cleanup: () => {} };
    }
    if (!this._emergenceSystem) {
      this._emergenceSystem = { update: () => {}, cleanup: () => {} };
    }
  }

  /**
   * Update method required by IGameLogicManager
   */
  public update(_deltaTime: number): void {
    // The actual update logic is handled by the timer-based game loop
    // This method exists to satisfy the interface requirement
  }

  /**
   * Setup main game logic timer
   */
  private _setupGameLoop(): void {
    this._gameLoopTimer = this._scene.time.addEvent({
      delay: gameConfig.timing.mainGameLogic,
      callback: this._updateGameLogic,
      callbackScope: this,
      loop: true,
    });

    logAutopoiesis.debug("Game logic loop started", {
      interval: gameConfig.timing.mainGameLogic,
    });
  }

  /**
   * Main game logic update - separated from rendering
   */
  private _updateGameLogic(): void {
    const now = Date.now();
    const rawDelta = now - (this._lastUpdateTime || now);
    this._lastUpdateTime = now;

    // Validación y limitación de deltaTime para prevenir espirales de muerte
    const deltaTimeSeconds = this._validateDeltaTime(rawDelta / 1000);
    const deltaTimeMs = deltaTimeSeconds * 1000;

    this._gameState.cycles++;

    // Si hay lag excesivo, procesar en pasos más pequeños
    if (deltaTimeSeconds > 0.1) {
      // Más de 100ms
      const steps = Math.ceil(deltaTimeSeconds / 0.016); // Dividir en pasos de ~60fps
      const stepDelta = deltaTimeSeconds / steps;
      const stepDeltaMs = stepDelta * 1000;

      logAutopoiesis.warn(
        `🐌 Lag detectado: ${deltaTimeSeconds.toFixed(3)}s - dividiendo en ${steps} pasos`,
      );

      for (let i = 0; i < Math.min(steps, 5); i++) {
        // Máximo 5 pasos para evitar bucles
        this._updateGameLogicStep(stepDeltaMs, stepDelta);
      }
    } else {
      this._updateGameLogicStep(deltaTimeMs, deltaTimeSeconds);
    }
  }

  private _lastUpdateTime: number = Date.now();

  /**
   * Validar y limitar deltaTime para prevenir valores extremos
   */
  private _validateDeltaTime(deltaTimeSeconds: number): number {
    // Límites de seguridad
    const MIN_DELTA = 0.001; // 1ms mínimo
    const MAX_DELTA = 0.1; // 100ms máximo por actualización

    if (deltaTimeSeconds < MIN_DELTA) {
      return MIN_DELTA;
    }

    if (deltaTimeSeconds > MAX_DELTA) {
      logAutopoiesis.warn(
        `⚠️ DeltaTime excesivo: ${deltaTimeSeconds.toFixed(3)}s - limitando a ${MAX_DELTA}s`,
      );
      return MAX_DELTA;
    }

    return deltaTimeSeconds;
  }

  /**
   * Paso individual de actualización de lógica de juego
   */
  private _updateGameLogicStep(
    deltaTimeMs: number,
    deltaTimeSeconds: number,
  ): void {
    this._entityManager.getAllEntities().forEach((entity) => {
      // Check if entity has updateEntity method (AnimatedGameEntity)
      if (
        entity &&
        typeof entity === "object" &&
        "updateEntity" in entity &&
        typeof entity.updateEntity === "function"
      ) {
        try {
          entity.updateEntity(deltaTimeMs);
        } catch (error) {
          logAutopoiesis.error("Error actualizando entidad:", error);
        }
      }
    });

    // Actualizar sistema de necesidades
    try {
      this._needsSystem.update();
    } catch (error) {
      logAutopoiesis.error("Error en NeedsSystem.update:", error);
    }

    // Emitir actualización de necesidades para UI
    for (const entityId of ["isa", "stev"]) {
      const entityData = this._needsSystem.getEntityNeeds(entityId);
      if (entityData) {
        this.emit("needsUpdated", { entityId, entityData });
      }
    }

    // Actualizar otros sistemas con manejo de errores
    try {
      this._movementSystem.update();
    } catch (error) {
      logAutopoiesis.error("Error en MovementSystem.update:", error);
    }

    try {
      this._aiSystem?.update();
    } catch (error) {
      logAutopoiesis.error("Error en AISystem.update:", error);
    }

    try {
      this._cardDialogueSystem?.update();
    } catch (error) {
      logAutopoiesis.error("Error en CardDialogueSystem.update:", error);
    }

    try {
      this._dayNightSystem.update();
    } catch (error) {
      logAutopoiesis.error("Error en DayNightSystem.update:", error);
    }

    try {
      this._emergenceSystem?.update();
    } catch (error) {
      logAutopoiesis.error("Error en EmergenceSystem.update:", error);
    }

    // Actualizar estados del juego
    this._updateResonance();
    this.synchronizeZones();

    // Actualizar tiempo juntos si ambas entidades están cerca
    this._updateTogetherTime();
  }

  /**
   * Actualizar tiempo juntos entre entidades principales
   */
  private _updateTogetherTime(): void {
    const isaEntity = this._entityManager.getEntity("isa");
    const stevEntity = this._entityManager.getEntity("stev");

    // Get entity data safely
    const getEntityData = (entity: unknown): Entity | null => {
      if (!entity) return null;
      if (
        typeof entity === "object" &&
        "getEntityData" in entity &&
        typeof entity.getEntityData === "function"
      ) {
        return entity.getEntityData();
      }
      return entity as Entity;
    };

    const isaData = getEntityData(isaEntity);
    const stevData = getEntityData(stevEntity);

    if (isaData && stevData) {
      // Calcular distancia entre entidades
      const dx = isaData.position.x - stevData.position.x;
      const dy = isaData.position.y - stevData.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Si están cerca (menos de 100 píxeles), incrementar tiempo juntos
      if (distance < 100) {
        this._gameState.togetherTime += gameConfig.timing.mainGameLogic;
      }
    }

    // Emitir datos de actualización para la UI
    const entityArray = Array.from(
      this._entityManager.getAllEntities().values(),
    )
      .map((entity) => getEntityData(entity))
      .filter(Boolean);

    const updateData: GameLogicUpdateData = {
      entities: entityArray,
      cycles: this._gameState.cycles,
      resonance: this._gameState.resonance,
      deltaTime: gameConfig.timing.mainGameLogic,
      togetherTime: this._gameState.togetherTime,
      isaStats: isaData?.stats ?? ({} as EntityStats),
      stevStats: stevData?.stats ?? ({} as EntityStats),
    };

    this.emit("gameLogicUpdate", updateData);

    if (this._gameState.cycles % GAME_BALANCE.CYCLE_LOG_FREQUENCY === 0) {
      this._logGameStatus();
    }
  }

  /**
   * Update resonance calculations between entities
   */
  private _updateResonance(): void {
    const isaEntity = this._entityManager.getEntity("isa");
    const stevEntity = this._entityManager.getEntity("stev");

    if (isaEntity && stevEntity) {
      // Get entity data safely
      const getEntityData = (entity: unknown): Entity | null => {
        if (!entity) return null;
        if (
          typeof entity === "object" &&
          "getEntityData" in entity &&
          typeof entity.getEntityData === "function"
        ) {
          return entity.getEntityData();
        }
        return entity as Entity;
      };

      const isaData = getEntityData(isaEntity);
      const stevData = getEntityData(stevEntity);

      if (isaData && stevData) {
        const isaResonance = isaData.resonance ?? 0;
        const stevResonance = stevData.resonance ?? 0;

        this._gameState.resonance = (isaResonance + stevResonance) / 2;

        const isaPos = isaData.position ?? { x: 0, y: 0 };
        const stevPos = stevData.position ?? { x: 0, y: 0 };
        const distance = Math.sqrt(
          Math.pow(isaPos.x - stevPos.x, 2) + Math.pow(isaPos.y - stevPos.y, 2),
        );

        if (distance < 100) {
          this._gameState.togetherTime += gameConfig.timing.mainGameLogic;
        }
      }
    }
  }

  /**
   * Sincronizar zonas estáticas con dinámicas
   */
  private synchronizeZones(): void {
    const worldRenderer = this._scene.registry.get("worldRenderer");
    const dynamicZones = worldRenderer?.getZones() || [];

    // Fusionar zonas estáticas con dinámicas
    const mergedZones = new Map<string, Zone>();

    // Primero agregar las estáticas
    this._gameState.zones.forEach((zone) => {
      mergedZones.set(zone.id, zone);
    });

    // Luego agregar/actualizar con las dinámicas
    dynamicZones.forEach((dynZone: any) => {
      if (mergedZones.has(dynZone.id)) {
        // Actualizar zona existente
        const existing = mergedZones.get(dynZone.id)!;
        existing.bounds = dynZone.bounds;
        existing.properties = { ...existing.properties, ...dynZone.properties };
      } else {
        // Agregar nueva zona dinámica
        mergedZones.set(dynZone.id, dynZone);
      }
    });

    // Actualizar gameState con zonas sincronizadas
    this._gameState.zones = Array.from(mergedZones.values());

    // Notificar a sistemas dependientes
    this._scene.events.emit("zones:synchronized", this._gameState.zones);
  }

  /**
   * Register an entity for game logic updates
   */
  public registerEntity(entityId: string, entity: any): void {
    this._entityManager.registerEntity(entityId, entity);

    // Inicializar en el gestor centralizado
    this._entityStateManager.initializeEntity(entityId);

    // Obtener estado desde fuente única
    const entityState = this._entityStateManager.getEntityState(entityId);
    if (!entityState) {
      logAutopoiesis.error(
        `No se pudo obtener estado para entidad ${entityId}`,
      );
      return;
    }

    // Inicializar sistemas usando el estado centralizado
    this._needsSystem.initializeEntityNeeds(entityId, entityState.needs);
    this._aiSystem?.initializeEntityAI(entityId);
    this._movementSystem.initializeEntityMovement(
      entityId,
      entityState.position,
    );

    logAutopoiesis.info(
      `Entidad ${entityId} registrada en sistemas con estado centralizado`,
    );
  }

  /**
   * Unregister an entity
   */
  public unregisterEntity(entityId: string): void {
    if (this._entityManager.hasEntity(entityId)) {
      this._entityManager.unregisterEntity(entityId);
      logAutopoiesis.debug(`Entity unregistered: ${entityId}`);
    }
  }

  /**
   * Handle player interactions with entities
   */
  public handlePlayerInteraction(
    entityId: string,
    interactionType: string,
  ): void {
    const entity = this._entityManager.getEntity(entityId);
    if (!entity) {
      logAutopoiesis.warn(
        `Player interaction failed - entity not found: ${entityId}`,
      );
      return;
    }

    this._gameState.connectionAnimation = {
      active: true,
      startTime: Date.now(),
      type: interactionType as any,
      entityId,
    };

    this.emit("playerInteraction", {
      entityId,
      interactionType,
      timestamp: Date.now(),
    });

    logAutopoiesis.info("Player interaction processed", {
      entityId,
      interactionType,
      resonance: this._gameState.resonance,
    });
  }

  /**
   * Get current game state (read-only copy)
   */
  public getGameState(): GameState {
    return { ...this._gameState };
  }

  /**
   * Get specific entity by ID
   */
  public getEntity(entityId: string): Entity | undefined {
    const entity = this._entityManager.getEntity(entityId);
    if (!entity) return undefined;
    // If the stored entity has a getEntityData method, use it to obtain domain data
    if (
      typeof entity === "object" &&
      entity !== null &&
      "getEntityData" in entity &&
      typeof (entity as any).getEntityData === "function"
    ) {
      return (entity as any).getEntityData();
    }
    return entity as unknown as Entity;
  }

  /**
   * Get all registered entities
   */
  public getEntities(): Entity[] {
    return this._entityManager.getEntities().map((entity) => {
      if (
        typeof entity === "object" &&
        entity !== null &&
        "getEntityData" in entity &&
        typeof (entity as any).getEntityData === "function"
      ) {
        return (entity as any).getEntityData();
      }
      return entity as unknown as Entity;
    });
  }

  public getAllEntities() {
    return this._entityManager.getAllEntities();
  }

  /**
   * Subscribe to game logic events
   */
  public on<K extends keyof GameEvents>(
    event: K,
    listener: (data: GameEvents[K]) => void,
    context?: any,
  ): void {
    this._eventEmitter.on(event, listener, context);
  }

  /**
   * Unsubscribe from game logic events
   */
  public off<K extends keyof GameEvents>(
    event: K,
    listener?: (data: GameEvents[K]) => void,
    context?: any,
  ): void {
    this._eventEmitter.off(event, listener, context);
  }

  /**
   * Emit typed event
   */
  public emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    this._eventEmitter.emit(event, data);
  }

  /**
   * Pause game logic updates
   */
  public pause(): void {
    if (this._gameLoopTimer) {
      this._gameLoopTimer.paused = true;
      logAutopoiesis.info("Game logic paused");
    }
  }

  /**
   * Resume game logic updates
   */
  public resume(): void {
    if (this._gameLoopTimer) {
      this._gameLoopTimer.paused = false;
      logAutopoiesis.info("Game logic resumed");
    }
  }

  /**
   * Change game speed multiplier
   */
  public setGameSpeed(multiplier: number): void {
    if (this._gameLoopTimer) {
      this._gameLoopTimer.destroy();
      const newDelay = gameConfig.timing.mainGameLogic / multiplier;
      this._gameLoopTimer = this._scene.time.addEvent({
        delay: newDelay,
        callback: () => {
          this._updateGameLogic();
        },
        loop: true,
      });
      logAutopoiesis.info(`Game speed set to ${multiplier}x`, {
        newDelay,
      });
    }
  }

  /**
   * Log current game status for debugging
   */
  private _logGameStatus(): void {
    const entityStates = this._entityManager.exportEntityStates();

    logAutopoiesis.info(`Game cycle ${this._gameState.cycles}`, {
      resonance: this._gameState.resonance.toFixed(2),
      togetherTime: Math.floor(this._gameState.togetherTime / 1000),
      entities: entityStates,
    });
  }

  /**
   * Get performance statistics
   */
  public getStats(): {
    cycles: number;
    resonance: number;
    entities: number;
    togetherTime: number;
    uptime: number;
  } {
    return {
      cycles: this._gameState.cycles,
      resonance: this._gameState.resonance,
      entities: this._entityManager.getAllEntities().size,
      togetherTime: this._gameState.togetherTime,
      uptime: Date.now() - this._gameState.lastSave,
    };
  }

  /**
   * Obtener sistema de necesidades
   */
  public getNeedsSystem(): NeedsSystem {
    return this._needsSystem;
  }

  /**
   * Obtener sistema de IA
   */
  public getAISystem(): AISystem | null {
    return this._aiSystem;
  }

  /**
   * Obtener sistema de movimiento
   */
  public getMovementSystem(): MovementSystem {
    return this._movementSystem;
  }

  /**
   * Obtener sistema de cartas de diálogo
   */
  public getCardDialogueSystem(): CardDialogueSystem | null {
    return this._cardDialogueSystem;
  }

  /**
   * Obtener sistema día/noche
   */
  public getDayNightSystem(): DayNightSystem {
    return this._dayNightSystem;
  }

  /**
   * Obtener sistema de emergencia
   */
  public getEmergenceSystem(): EmergenceSystem | null {
    return this._emergenceSystem;
  }

  /**
   * Obtener gestor centralizado de estado de entidades
   */
  public getEntityStateManager(): EntityStateManager {
    return this._entityStateManager;
  }

  /**
   * Establecer control manual de entidad
   */
  public setEntityPlayerControl(entityId: string, controlled: boolean): void {
    this._aiSystem?.setPlayerControl(entityId, controlled);
  }

  /**
   * FASE 2B: Configurar eventos entre sistemas
   */
  private _setupSystemEvents(): void {
    logAutopoiesis.info("🔗 Configurando eventos entre sistemas");

    // Conectar sistema de cartas con sistema de misiones
    const cardRespondedCallback = (data: any) => {
      this._questSystem.handleEvent({
        type: "dialogue_completed",
        entityId: data.card.sourceEntityId || "unknown",
        timestamp: Date.now(),
        data: { cardId: data.card.id, choice: data.choice },
      });
    };
    this._scene.events.on("cardResponded", cardRespondedCallback);
    this._registeredListeners.push({
      target: this._scene.events,
      event: "cardResponded",
      callback: cardRespondedCallback,
    });

    // Conectar emergencias con sistema de cartas
    this._scene.events.on("emergenceDetected", (data: any) => {
      if (data.type === "critical_need") {
        // Generar carta de diálogo relacionada con la emergencia
        this._cardDialogueSystem.triggerEmergencyCard?.(
          data.entityId,
          data.needType,
        );
      }
    });

    // Conectar sistema de necesidades con AI para prioridades
    this._needsSystem.on("emergencyLevelChanged", (data: any) => {
      if (data.currentLevel === "critical" || data.currentLevel === "dying") {
        this._aiSystem.setEntityPriority?.(data.entityId, "survival");
      }
    });

    // Eventos adicionales para conectar consumo de comida con quest system
    this._scene.events.on("food_consumed", (data: any) => {
      this._questSystem.handleEvent({
        type: "food_consumed",
        entityId: data.entityId,
        timestamp: Date.now(),
        data: { foodType: data.foodType, amount: data.amount },
      });
    });

    // Conectar compra de comida
    this._scene.events.on("buyFood", (data: any) => {
      this._questSystem.handleEvent({
        type: "food_purchased",
        entityId: data.entityId || "player",
        timestamp: Date.now(),
        data: { foodType: data.foodType, cost: data.cost },
      });
    });

    // Conectar actualizaciones de necesidades con el quest system
    this._needsSystem.on("needsSatisfied", (data: any) => {
      this._questSystem.handleEvent({
        type: "needs_satisfied",
        entityId: data.entityId,
        timestamp: Date.now(),
        data: { needType: data.needType, amount: data.amount },
      });
    });

    // Conectar movimiento con quest system
    this._scene.events.on("entityArrivedAtZone", (data: any) => {
      this._questSystem.handleEvent({
        type: "movement_completed",
        entityId: data.entityId,
        timestamp: Date.now(),
        data: { destination: data.position, zone: data.zoneId },
      });
    });

    // Conectar actividades completadas
    this._scene.events.on("entityActivityCompleted", (data: any) => {
      this._questSystem.handleEvent({
        type: "activity_completed",
        entityId: data.entityId,
        timestamp: Date.now(),
        data: { activity: data.activity, position: data.position },
      });
    });

    logAutopoiesis.info("✅ Eventos entre sistemas configurados");
  }

  /**
   * FASE 2C: Inicializar después de que el mundo esté listo
   */
  private _initializeAfterWorldReady(): void {
    logAutopoiesis.info("🌍 Inicializando después de que el mundo esté listo");

    // Refrescar obstáculos para movimiento (ahora que el mundo existe)
    try {
      if (typeof this._movementSystem.refreshObstacles === "function") {
        this._movementSystem.refreshObstacles();
        logAutopoiesis.info("✅ Obstáculos de movimiento actualizados");
      }
    } catch (error) {
      logAutopoiesis.warn("⚠️ No se pudieron actualizar obstáculos:", error);
    }

    // Precomputar distancias entre zonas (ahora que las zonas existen)
    try {
      if (typeof this._movementSystem.precomputeZoneDistances === "function") {
        this._movementSystem.precomputeZoneDistances();
        logAutopoiesis.info("✅ Distancias de zonas precomputadas");
      }
    } catch (error) {
      logAutopoiesis.warn(
        "⚠️ No se pudieron precomputar distancias de zonas:",
        error,
      );
    }

    // Inicializar sistemas para entidades existentes usando estado centralizado
    this._entityManager.getAllEntities().forEach((_, entityId) => {
      // Inicializar en el gestor centralizado primero
      this._entityStateManager.initializeEntity(entityId);

      // Obtener estado desde fuente única
      const entityState = this._entityStateManager.getEntityState(entityId);
      if (!entityState) return;

      // Inicializar sistemas usando el estado centralizado
      this._needsSystem.initializeEntityNeeds(entityId, entityState.needs);
      this._aiSystem?.initializeEntityAI(entityId);
      this._movementSystem.initializeEntityMovement(
        entityId,
        entityState.position,
      );
    });

    logAutopoiesis.info("🎯 Inicialización completa", {
      entities: this._gameState.entities.length,
      zones: this._gameState.zones.length,
      needsSystemActive: true,
    });
  }

  /**
   * Cleanup when destroying the manager
   */
  public destroy(): void {
    if (this._gameLoopTimer) {
      this._gameLoopTimer.destroy();
    }

    this._entityManager.clearAllEntities();
    this._entityStateManager.cleanup();
    this._needsSystem.cleanup();
    this._aiSystem?.cleanup();
    this._movementSystem.cleanup();
    this._cardDialogueSystem?.cleanup();
    this._dayNightSystem.cleanup();
    this._emergenceSystem?.cleanup();
    // Cleanup de event listeners registrados
    this._registeredListeners.forEach(({ target, event, callback }) => {
      target.off(event, callback);
    });
    this._registeredListeners.length = 0;

    this._eventEmitter.removeAllListeners();

    logAutopoiesis.info("GameLogicManager destroyed");
  }
}
