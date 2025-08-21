/**
 * Sistema de Misiones para Una Carta Para Isa
 * Integrado con todos los sistemas existentes de Phaser y del juego
 */

import { QuestCatalog } from "../data/QuestCatalog";
import { QuestUI } from "../components/QuestUI";
import type {
  Quest,
  QuestEvent,
  QuestObjective,
  QuestProgress,
} from "../types";
import type {
  EntityEventData,
  GameUpdateEventData,
  PlayerInteractionEventData,
  FoodConsumedEventData,
  FoodPurchasedEventData,
  DialogueCompletedEventData,
} from "../types/events";
import { randomInt } from "../utils/deterministicRandom";
import { logAutopoiesis } from "../utils/logger";

export class QuestSystem {
  private _scene: Phaser.Scene;
  private _questProgress: QuestProgress;
  private _eventEmitter: Phaser.Events.EventEmitter;
  private _questCheckTimer?: Phaser.Time.TimerEvent;
  private _questUI?: QuestUI;

  public constructor(scene: Phaser.Scene) {
    this._scene = scene;
    this._eventEmitter = new Phaser.Events.EventEmitter();

    // Inicializar progreso de misiones
    this._questProgress = {
      activeQuests: new Map(),
      completedQuests: new Map(),
      failedQuests: new Map(),
      availableQuests: new Map(),
      questHistory: [],
      totalQuestsCompleted: 0,
      totalExperienceGained: 0,
      unlockedTitles: [],
    };

    this._setupEventListeners();
    this._initializeQuests();
    
    // Inicializar QuestUI
    this._questUI = new QuestUI(scene);
  }

  /**
   * Configura listeners para integración con sistemas existentes
   */
  private _setupEventListeners(): void {
    // Integración con GameLogicManager
    this._scene.events.on("gameLogicUpdate", this._onGameUpdate, this);

    // Integración con sistema de diálogos
    this._scene.events.on(
      "dialogue_completed",
      this._onDialogueCompleted,
      this,
    );

    // Integración con sistema de comida
    this._scene.events.on("food_consumed", this._onFoodConsumed, this);
    this._scene.events.on("buyFood", this._onFoodPurchased, this);

    // Integración con interacciones de entidades
    this._scene.events.on("playerInteraction", this._onPlayerInteraction, this);

    // Timer para chequeos automáticos de misiones
    this._questCheckTimer = this._scene.time.addEvent({
      delay: 5000, // Chequeo cada 5 segundos
      callback: this._checkQuestProgress,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * Inicializa las misiones disponibles al inicio
   */
  private _initializeQuests(): void {
    const allQuests = QuestCatalog.getAllQuests();

    allQuests.forEach((quest) => {
      // Clonar la quest para evitar modificar el catálogo original
      const questCopy = JSON.parse(JSON.stringify(quest)) as Quest;

      if (this._checkQuestRequirements(questCopy)) {
        if (questCopy.status === "available") {
          this._questProgress.availableQuests.set(questCopy.id, questCopy);
          this._showQuestAvailableNotification(questCopy);
        }
      }
    });

    logAutopoiesis.info("QuestSystem initialized", {
      availableQuests: this._questProgress.availableQuests.size,
      totalQuests: allQuests.length,
    });
  }

  /**
   * Inicia una misión específica
   */
  public startQuest(questId: string): boolean {
    const quest = this._questProgress.availableQuests.get(questId);
    if (!quest) {
      logAutopoiesis.warn(`Quest ${questId} not available to start`);
      return false;
    }

    // Verificar si ya hay demasiadas misiones activas
    if (this._questProgress.activeQuests.size >= 5) {
      this._showNotification(
        "No puedes tener más de 5 misiones activas",
        "warning",
      );
      return false;
    }

    // Mover de disponible a activa
    this._questProgress.availableQuests.delete(questId);
    quest.status = "active";
    quest.startedAt = Date.now();
    this._questProgress.activeQuests.set(questId, quest);

    // Registrar en historial
    this._questProgress.questHistory.push({
      questId,
      action: "started",
      timestamp: Date.now(),
    });

    // Mostrar diálogo de introducción usando el sistema existente
    this._showQuestIntroDialogue(quest);

    // Emitir evento
    this._emitQuestEvent("quest_started", questId);

    logAutopoiesis.info(`Quest started: ${quest.title}`, { questId });
    return true;
  }

  /**
   * Completa una misión
   */
  public completeQuest(questId: string): boolean {
    const quest = this._questProgress.activeQuests.get(questId);
    if (!quest || quest.status !== "active") {
      return false;
    }

    // Verificar que todos los objetivos obligatorios estén completados
    const incompleteObjectives = quest.objectives.filter(
      (obj) => !obj.isCompleted && !obj.isOptional,
    );

    if (incompleteObjectives.length > 0) {
      logAutopoiesis.warn(
        `Cannot complete quest ${questId}, incomplete objectives`,
        {
          incompleteObjectives: incompleteObjectives.map((obj) => obj.id),
        },
      );
      return false;
    }

    // Completar misión
    quest.status = "completed";
    quest.completedAt = Date.now();

    // Mover a completadas
    this._questProgress.activeQuests.delete(questId);
    this._questProgress.completedQuests.set(questId, quest);
    this._questProgress.totalQuestsCompleted++;

    // Aplicar recompensas usando sistemas existentes
    this._applyQuestRewards(quest);

    // Mostrar diálogo de completación
    this._showQuestCompletionDialogue(quest);

    // Registrar en historial
    this._questProgress.questHistory.push({
      questId,
      action: "completed",
      timestamp: Date.now(),
    });

    // Verificar si se desbloquean nuevas misiones
    this._checkForNewAvailableQuests();

    // Emitir evento
    this._emitQuestEvent("quest_completed", questId);

    logAutopoiesis.info(`Quest completed: ${quest.title}`, {
      questId,
      rewards: quest.rewards.length,
    });

    return true;
  }

  /**
   * Actualiza el progreso de un objetivo específico
   */
  public updateObjectiveProgress(
    questId: string,
    objectiveId: string,
    amount = 1,
  ): void {
    const quest = this._questProgress.activeQuests.get(questId);
    if (!quest) return;

    const objective = quest.objectives.find((obj) => obj.id === objectiveId);
    if (!objective || objective.isCompleted) return;

    // Actualizar progreso
    if (objective.requiredAmount) {
      objective.currentAmount = (objective.currentAmount || 0) + amount;

      if (objective.currentAmount >= objective.requiredAmount) {
        objective.isCompleted = true;
        this._emitQuestEvent("objective_completed", questId, objectiveId);
        this._showObjectiveCompletedNotification(quest, objective);
      }
    } else {
      objective.isCompleted = true;
      this._emitQuestEvent("objective_completed", questId, objectiveId);
      this._showObjectiveCompletedNotification(quest, objective);
    }

    // Verificar si la misión está completa
    this._checkQuestCompletion(questId);
  }

  /**
   * Verifica automáticamente el progreso de todas las misiones activas
   */
  private _checkQuestProgress(): void {
    this._questProgress.activeQuests.forEach((quest) => {
      this._checkAllObjectives(quest);
    });
  }

  /**
   * Unified objective checking - replaces separate checking methods
   */
  private _checkAllObjectives(quest: Quest): void {
    const gameLogicManager = this._scene.registry.get("gameLogicManager");
    if (!gameLogicManager) return;

    const entities = gameLogicManager.getEntities();
    const isaEntity = entities.find((e: EntityEventData) => e.id === "isa");

    quest.objectives.forEach((objective) => {
      if (objective.isCompleted) return;

      switch (objective.type) {
        case "reach_location":
          if (isaEntity && objective.targetLocation) {
            const distance = Phaser.Math.Distance.Between(
              isaEntity.position.x,
              isaEntity.position.y,
              objective.targetLocation.x,
              objective.targetLocation.y,
            );
            if (distance <= (objective.targetLocation.radius || 50)) {
              this.updateObjectiveProgress(quest.id, objective.id);
            }
          }
          break;

        case "survive_time":
          if (objective.requiredAmount) {
            const elapsedTime = Date.now() - (quest.startedAt || Date.now());
            if (elapsedTime >= objective.requiredAmount * 1000) {
              this.updateObjectiveProgress(quest.id, objective.id);
            }
          }
          break;

        case "achieve_stats":
          if (objective.requirements?.stats) {
            const targetEntity = entities.find((e: EntityEventData) => e.id === (objective.targetEntity || "isa"));
            if (targetEntity?.stats && this._checkStatsRequirements(targetEntity.stats, objective.requirements.stats)) {
              this.updateObjectiveProgress(quest.id, objective.id);
            }
          }
          break;
      }
    });
  }

  /**
   * Maneja eventos de actualización del juego
   */
  private _onGameUpdate(data: GameUpdateEventData): void {
    // Integración con sistema de resonancia
    if (data.resonance > 80) {
      this._checkForResonanceQuests();
    }
  }

  /**
   * Unified event-based objective checking
   */
  private _checkEventBasedObjectives(
    objectiveType: string,
    targetValue: string,
    matchCondition?: (objective: QuestObjective, data: any) => boolean,
  ): void {
    this._questProgress.activeQuests.forEach((quest) => {
      quest.objectives.forEach((objective) => {
        if (objective.type === objectiveType && !objective.isCompleted) {
          const matches = matchCondition
            ? matchCondition(objective, targetValue)
            : objective.target === targetValue;

          if (matches) {
            this.updateObjectiveProgress(quest.id, objective.id);
          }
        }
      });
    });
  }

  /**
   * Maneja eventos de diálogos completados
   */
  private _onDialogueCompleted(data: DialogueCompletedEventData): void {
    this._checkEventBasedObjectives("talk_to_npc", data.speaker);
  }

  /**
   * Maneja eventos de comida consumida
   */
  private _onFoodConsumed(_data: FoodConsumedEventData): void {
    this._checkEventBasedObjectives("complete_activity", "eating");
  }

  /**
   * Maneja eventos de compra de comida
   */
  private _onFoodPurchased(_data: FoodPurchasedEventData): void {
    this._checkEventBasedObjectives("collect_resource", "food");
  }

  /**
   * Maneja interacciones del jugador
   */
  private _onPlayerInteraction(data: PlayerInteractionEventData): void {
    this._checkEventBasedObjectives(
      "interact_with_entity",
      data.entityId,
      (objective, entityId) =>
        objective.target === "partner_entity" || objective.target === entityId,
    );
  }

  /**
   * Aplica las recompensas de una misión usando sistemas existentes
   */
  private _applyQuestRewards(quest: Quest): void {
    const gameLogicManager = this._scene.registry.get("gameLogicManager");

    quest.rewards.forEach((reward) => {
      switch (reward.type) {
        case "experience":
          this._questProgress.totalExperienceGained += reward.amount || 0;
          break;

        case "stats_boost":
          if (reward.statsBoost && gameLogicManager) {
            // Aplicar boost de stats a las entidades
            const entities = gameLogicManager.getEntities();
            entities.forEach((entity: EntityEventData) => {
              if (entity.stats && reward.statsBoost) {
                Object.entries(reward.statsBoost).forEach(([stat, value]) => {
                  if (
                    typeof value === "number" &&
                    entity.stats[stat] !== undefined
                  ) {
                    entity.stats[stat] = Math.max(
                      0,
                      Math.min(100, entity.stats[stat] + value),
                    );
                  }
                });
              }
            });
          }
          break;

        case "money":
          // Integrar con sistema de dinero cuando esté disponible
          break;

        case "title":
          if (reward.title) {
            this._questProgress.unlockedTitles.push(reward.title);
          }
          break;

        case "unlock_feature":
          // Emitir evento para desbloquear características
          this._scene.events.emit("feature_unlocked", {
            featureId: reward.unlockId,
            questId: quest.id,
          });
          break;
      }
    });
  }

  /**
   * Muestra diálogo de introducción de misión usando el sistema existente
   */
  private _showQuestIntroDialogue(quest: Quest): void {
    const introDialogue = quest.dialogues.find((d) => d.stage === "intro");
    if (introDialogue) {
      // Usar el DialogueSystem existente
      this._scene.events.emit("show_dialogue", {
        speaker: introDialogue.speaker,
        text: introDialogue.text,
        mood: introDialogue.mood || "neutral",
        type: "quest_intro",
      });
    }
  }

  /**
   * Muestra diálogo de completación de misión
   */
  private _showQuestCompletionDialogue(quest: Quest): void {
    const completionDialogue = quest.dialogues.find(
      (d) => d.stage === "completion",
    );
    if (completionDialogue) {
      this._scene.events.emit("show_dialogue", {
        speaker: completionDialogue.speaker,
        text: completionDialogue.text,
        mood: completionDialogue.mood || "happy",
        type: "quest_completion",
      });
    }
  }

  /**
   * Muestra notificación de objetivo completado
   */
  private _showObjectiveCompletedNotification(
    quest: Quest,
    objective: QuestObjective,
  ): void {
    this._showNotification(`✓ ${objective.description}`, "success");

    // Si hay hints para el siguiente objetivo, mostrarlas
    const nextObjective = quest.objectives.find((obj) => !obj.isCompleted);
    if (
      nextObjective &&
      nextObjective.hints &&
      nextObjective.hints.length > 0
    ) {
      const randomHint =
        nextObjective.hints[randomInt(0, nextObjective.hints.length - 1)];
      this._scene.time.delayedCall(2000, () => {
        this._showNotification(`💡 ${randomHint}`, "info");
      });
    }
  }

  /**
   * Muestra notificación de misión disponible
   */
  private _showQuestAvailableNotification(quest: Quest): void {
    this._showNotification(`Nueva misión disponible: ${quest.title}`, "info");
  }

  /**
   * Muestra notificaciones usando el sistema de UI existente
   */
  private _showNotification(
    text: string,
    type: "success" | "warning" | "info" = "info",
  ): void {
    // Crear notificación temporal usando Phaser
    const colors = {
      success: 0x2ecc71,
      warning: 0xf39c12,
      info: 0x3498db,
    };

    const notification = this._scene.add.container(
      this._scene.cameras.main.width - 20,
      50,
    );

    const bg = this._scene.add.rectangle(0, 0, 300, 60, colors[type], 0.9);
    const textObj = this._scene.add.text(0, 0, text, {
      fontSize: "14px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: 280 },
    });
    textObj.setOrigin(0.5);

    notification.add([bg, textObj]);
    notification.setDepth(1000);
    notification.setAlpha(0);

    // Animación de entrada y salida
    this._scene.tweens.add({
      targets: notification,
      alpha: 1,
      duration: 300,
      ease: "Power2",
    });

    this._scene.time.delayedCall(3000, () => {
      this._scene.tweens.add({
        targets: notification,
        alpha: 0,
        duration: 300,
        ease: "Power2",
        onComplete: () => notification.destroy(),
      });
    });
  }

  /**
   * Verifica si una misión está completa
   */
  private _checkQuestCompletion(questId: string): void {
    const quest = this._questProgress.activeQuests.get(questId);
    if (!quest) return;

    const incompleteObjectives = quest.objectives.filter(
      (obj) => !obj.isCompleted && !obj.isOptional,
    );

    if (incompleteObjectives.length === 0) {
      this.completeQuest(questId);
    }
  }

  /**
   * Verifica si hay nuevas misiones disponibles
   */
  private _checkForNewAvailableQuests(): void {
    const allQuests = QuestCatalog.getAllQuests();

    allQuests.forEach((quest) => {
      if (
        !this._questProgress.availableQuests.has(quest.id) &&
        !this._questProgress.activeQuests.has(quest.id) &&
        !this._questProgress.completedQuests.has(quest.id)
      ) {
        if (this._checkQuestRequirements(quest)) {
          const questCopy = JSON.parse(JSON.stringify(quest)) as Quest;
          questCopy.status = "available";
          this._questProgress.availableQuests.set(quest.id, questCopy);
          this._showQuestAvailableNotification(questCopy);
          this._emitQuestEvent("quest_available", quest.id);
        }
      }
    });
  }

  /**
   * Verifica requisitos de una misión
   */
  private _checkQuestRequirements(quest: Quest): boolean {
    return quest.requirements.every((req) => {
      switch (req.type) {
        case "quest_completed":
          return req.questId
            ? this._questProgress.completedQuests.has(req.questId)
            : false;
        case "stats_threshold":
          if (req.entityId && req.stat && req.value) {
            const gameLogicManager = this._scene.registry.get("gameLogicManager");
            if (gameLogicManager) {
              const entities = gameLogicManager.getEntities();
              const entity = entities.find((e: EntityEventData) => e.id === req.entityId);
              return entity?.stats[req.stat] >= req.value;
            }
          }
          return false;
        case "time_elapsed":
          if (req.duration) {
            const gameStartTime = this._scene.registry.get("gameStartTime") || Date.now();
            const elapsed = Date.now() - gameStartTime;
            return elapsed >= req.duration;
          }
          return false;
        default:
          return true;
      }
    });
  }

  /**
   * Verifica misiones relacionadas con resonancia
   */
  private _checkForResonanceQuests(): void {
    // Activar misiones especiales cuando la resonancia es alta
    if (!this._questProgress.activeQuests.has("daily_resonance_meditation")) {
      const meditationQuest = QuestCatalog.getQuestById(
        "daily_resonance_meditation",
      );
      if (
        meditationQuest &&
        this._questProgress.availableQuests.has("daily_resonance_meditation")
      ) {
        this.startQuest("daily_resonance_meditation");
      }
    }
  }

  /**
   * Emite eventos del sistema de misiones
   */
  private _emitQuestEvent(
    type: QuestEvent["type"],
    questId: string,
    objectiveId?: string,
  ): void {
    const event: QuestEvent = {
      type,
      questId,
      objectiveId,
      timestamp: Date.now(),
    };

    this._eventEmitter.emit(type, event);
    this._scene.events.emit(`quest_${type}`, event);
  }

  /**
   * Obtiene el progreso actual de las misiones
   */
  public getQuestProgress(): QuestProgress {
    return { ...this._questProgress };
  }

  /**
   * Obtiene misiones activas
   */
  public getActiveQuests(): Quest[] {
    return Array.from(this._questProgress.activeQuests.values());
  }

  /**
   * Obtiene misiones disponibles
   */
  public getAvailableQuests(): Quest[] {
    return Array.from(this._questProgress.availableQuests.values());
  }

  /**
   * Obtiene misiones completadas
   */
  public getCompletedQuests(): Quest[] {
    return Array.from(this._questProgress.completedQuests.values());
  }

  /**
   * Verifica si las estadísticas cumplen con los requisitos
   */
  private _checkStatsRequirements(entityStats: any, requiredStats: any): boolean {
    for (const [statName, requiredValue] of Object.entries(requiredStats)) {
      const currentValue = entityStats[statName];
      if (typeof currentValue !== 'number' || currentValue < (requiredValue as number)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Limpieza del sistema
   */
  public destroy(): void {
    if (this._questCheckTimer) {
      this._questCheckTimer.destroy();
    }

    this._eventEmitter.removeAllListeners();
    this._scene.events.off("gameLogicUpdate", this._onGameUpdate, this);
    this._scene.events.off(
      "dialogue_completed",
      this._onDialogueCompleted,
      this,
    );
    this._scene.events.off("food_consumed", this._onFoodConsumed, this);
    this._scene.events.off("buyFood", this._onFoodPurchased, this);
    this._scene.events.off(
      "playerInteraction",
      this._onPlayerInteraction,
      this,
    );

    logAutopoiesis.info("QuestSystem destroyed");
  }
}
