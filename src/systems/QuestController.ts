/**
 * Controlador de Misiones - Integra las misiones con las actividades del juego
 * Usa todas las herramientas existentes del motor para detectar y actualizar progreso
 */

import type { ActivityType } from "../types";
import type {
  EntityEventData,
  GameUpdateEventData,
  PlayerInteractionEventData,
  FoodConsumedEventData,
  DialogueCompletedEventData,
  QuestEventData,
} from "../types/events";
import { randomBool } from "../utils/deterministicRandom";
import { logAutopoiesis } from "../utils/logger";
import type { DialogueSystem } from "./DialogueSystem";
import type { QuestSystem } from "./QuestSystem";

export class QuestController {
  private _scene: Phaser.Scene;
  private _questSystem: QuestSystem;
  private _dialogueSystem: DialogueSystem;
  private _activityTimer?: Phaser.Time.TimerEvent;
  private _currentActivities = new Map<string, ActivityType>();

  public constructor(
    scene: Phaser.Scene,
    questSystem: QuestSystem,
    dialogueSystem: DialogueSystem,
  ) {
    this._scene = scene;
    this._questSystem = questSystem;
    this._dialogueSystem = dialogueSystem;

    this._setupActivityTracking();
    this._setupSmartQuestTriggers();
  }

  /**
   * Configura el seguimiento automático de actividades
   */
  private _setupActivityTracking(): void {
    // Monitorear actividades cada 3 segundos
    this._activityTimer = this._scene.time.addEvent({
      delay: 3000,
      callback: this._checkActivities,
      callbackScope: this,
      loop: true,
    });

    // Escuchar eventos específicos del juego
    this._scene.events.on("gameLogicUpdate", this._onGameUpdate, this);
    this._scene.events.on("playerInteraction", this._onPlayerInteraction, this);
    this._scene.events.on("food_consumed", this._onFoodConsumed, this);
    this._scene.events.on("dialogue_started", this._onDialogueStarted, this);
  }

  /**
   * Configura triggers inteligentes para misiones
   */
  private _setupSmartQuestTriggers(): void {
    // Trigger para misión de comida cuando el hambre es baja
    this._scene.time.addEvent({
      delay: 10000, // Cada 10 segundos
      callback: this._checkHungerQuests,
      callbackScope: this,
      loop: true,
    });

    // Trigger para misión de resonancia cuando están cerca
    this._scene.time.addEvent({
      delay: 5000, // Cada 5 segundos
      callback: this._checkProximityQuests,
      callbackScope: this,
      loop: true,
    });

    // Trigger para misiones de exploración
    this._scene.time.addEvent({
      delay: 15000, // Cada 15 segundos
      callback: this._checkExplorationQuests,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * Verifica y actualiza actividades de las entidades
   */
  private _checkActivities(): void {
    const gameLogicManager = this._scene.registry.get("gameLogicManager");
    if (!gameLogicManager) return;

    const entities = gameLogicManager.getEntities();

    entities.forEach((entity: EntityEventData) => {
      if (entity.activity) {
        const previousActivity = this._currentActivities.get(entity.id);
        this._currentActivities.set(entity.id, entity.activity);

        // Si cambió de actividad, verificar objetivos relacionados
        if (previousActivity !== entity.activity) {
          this._checkActivityObjectives(entity.id, entity.activity);
        }
      }
    });
  }

  /**
   * Verifica objetivos relacionados con actividades específicas
   */
  private _checkActivityObjectives(
    entityId: string,
    activity: ActivityType,
  ): void {
    const activeQuests = this._questSystem.getActiveQuests();

    activeQuests.forEach((quest) => {
      quest.objectives.forEach((objective) => {
        if (
          objective.type === "complete_activity" &&
          objective.target === activity.toLowerCase() &&
          !objective.isCompleted
        ) {
          this._questSystem.updateObjectiveProgress(quest.id, objective.id);
          logAutopoiesis.info("Activity objective updated", {
            entityId,
            activity,
            questId: quest.id,
            objectiveId: objective.id,
          });
        }
      });
    });
  }

  /**
   * Maneja eventos de actualización del juego
   */
  private _onGameUpdate(data: GameUpdateEventData): void {
    // Verificar objetivos de estadísticas
    this._checkStatsObjectives(data);

    // Verificar objetivos de tiempo
    this._checkTimeObjectives();

    // Auto-trigger de misiones basadas en resonancia
    if (
      data.resonance > 70 &&
      !this._questSystem
        .getActiveQuests()
        .find((q) => q.id === "daily_resonance_meditation")
    ) {
      const availableQuests = this._questSystem.getAvailableQuests();
      const meditationQuest = availableQuests.find(
        (q) => q.id === "daily_resonance_meditation",
      );
      if (meditationQuest) {
        this._questSystem.startQuest("daily_resonance_meditation");
      }
    }
  }

  /**
   * Verifica objetivos relacionados con estadísticas
   */
  private _checkStatsObjectives(data: GameUpdateEventData): void {
    const activeQuests = this._questSystem.getActiveQuests();

    activeQuests.forEach((quest) => {
      quest.objectives.forEach((objective) => {
        if (objective.type === "achieve_stats" && !objective.isCompleted) {
          // Verificar si se cumplieron los requisitos de stats
          // (implementar cuando se definan mejor los objetivos de stats)

          // Por ejemplo, si la resonancia es muy alta por cierto tiempo
          if (data.resonance > 80) {
            this._questSystem.updateObjectiveProgress(quest.id, objective.id);
          }
        }
      });
    });
  }

  /**
   * Verifica objetivos de tiempo
   */
  private _checkTimeObjectives(): void {
    const activeQuests = this._questSystem.getActiveQuests();

    activeQuests.forEach((quest) => {
      quest.objectives.forEach((objective) => {
        if (
          objective.type === "survive_time" &&
          !objective.isCompleted &&
          objective.requiredAmount
        ) {
          const elapsedTime = Date.now() - (quest.startedAt || Date.now());
          if (elapsedTime >= objective.requiredAmount * 1000) {
            this._questSystem.updateObjectiveProgress(quest.id, objective.id);
          }
        }
      });
    });
  }

  /**
   * Maneja interacciones del jugador
   */
  private _onPlayerInteraction(data: PlayerInteractionEventData): void {
    // Verificar objetivos de interacción
    const activeQuests = this._questSystem.getActiveQuests();

    activeQuests.forEach((quest) => {
      quest.objectives.forEach((objective) => {
        if (
          objective.type === "interact_with_entity" &&
          !objective.isCompleted
        ) {
          if (
            objective.target === "partner_entity" ||
            objective.target === data.entityId ||
            data.interactionType === objective.target
          ) {
            this._questSystem.updateObjectiveProgress(quest.id, objective.id);

            // Mostrar diálogo específico de la misión si existe
            this._showQuestDialogue(quest, "progress");
          }
        }
      });
    });
  }

  /**
   * Maneja eventos de comida consumida
   */
  private _onFoodConsumed(data: FoodConsumedEventData): void {
    const activeQuests = this._questSystem.getActiveQuests();

    activeQuests.forEach((quest) => {
      quest.objectives.forEach((objective) => {
        // Actualizar objetivos de comer
        if (
          objective.type === "complete_activity" &&
          objective.target === "eating" &&
          !objective.isCompleted
        ) {
          this._questSystem.updateObjectiveProgress(quest.id, objective.id);
        }

        // Actualizar objetivos de recolectar comida
        if (
          objective.type === "collect_resource" &&
          objective.target === "food" &&
          !objective.isCompleted
        ) {
          this._questSystem.updateObjectiveProgress(quest.id, objective.id);
        }
      });
    });
  }

  /**
   * Maneja eventos de diálogo iniciado
   */
  private _onDialogueStarted(data: DialogueCompletedEventData): void {
    const activeQuests = this._questSystem.getActiveQuests();

    activeQuests.forEach((quest) => {
      quest.objectives.forEach((objective) => {
        if (
          objective.type === "talk_to_npc" &&
          objective.target === data.speakerId &&
          !objective.isCompleted
        ) {
          this._questSystem.updateObjectiveProgress(quest.id, objective.id);
        }
      });
    });
  }

  /**
   * Verifica y activa misiones relacionadas con hambre
   */
  private _checkHungerQuests(): void {
    const gameLogicManager = this._scene.registry.get("gameLogicManager");
    if (!gameLogicManager) return;

    const entities = gameLogicManager.getEntities();
    const lowHungerEntities = entities.filter(
      (e: EntityEventData) => e.stats && e.stats.hunger < 30,
    );

    if (lowHungerEntities.length > 0) {
      const availableQuests = this._questSystem.getAvailableQuests();
      const foodQuest = availableQuests.find((q) => q.id === "main_first_meal");

      if (
        foodQuest &&
        !this._questSystem
          .getActiveQuests()
          .find((q) => q.id === "main_first_meal")
      ) {
        this._questSystem.startQuest("main_first_meal");
        logAutopoiesis.info("Food quest auto-triggered due to low hunger");
      }
    }
  }

  /**
   * Verifica misiones de proximidad entre entidades
   */
  private _checkProximityQuests(): void {
    const gameLogicManager = this._scene.registry.get("gameLogicManager");
    if (!gameLogicManager) return;

    const entities = gameLogicManager.getEntities();
    const isaEntity = entities.find((e: EntityEventData) => e.id === "isa");
    const stevEntity = entities.find((e: EntityEventData) => e.id === "stev");

    if (isaEntity && stevEntity) {
      const distance = Phaser.Math.Distance.Between(
        isaEntity.position.x,
        isaEntity.position.y,
        stevEntity.position.x,
        stevEntity.position.y,
      );

      // Si están muy cerca, activar misiones de proximidad
      if (distance < 80) {
        const availableQuests = this._questSystem.getAvailableQuests();
        const proximityQuest = availableQuests.find(
          (q) => q.tags.includes("bonding") || q.tags.includes("romance"),
        );

        if (proximityQuest) {
          this._questSystem.startQuest(proximityQuest.id);
          logAutopoiesis.info("Proximity quest auto-triggered", { distance });
        }
      }
    }
  }

  /**
   * Verifica misiones de exploración basadas en movimiento
   */
  private _checkExplorationQuests(): void {
    const gameLogicManager = this._scene.registry.get("gameLogicManager");
    if (!gameLogicManager) return;

    // Si las entidades han estado moviéndose mucho, sugerir exploración
    const wanderingEntities = Array.from(
      this._currentActivities.entries(),
    ).filter(
      ([_, activity]) => activity === "WANDERING" || activity === "EXPLORING",
    );

    if (wanderingEntities.length > 0) {
      const availableQuests = this._questSystem.getAvailableQuests();
      const explorationQuest = availableQuests.find(
        (q) => q.category === "exploration" || q.tags.includes("exploration"),
      );

      if (explorationQuest && randomBool(0.1)) {
        // 10% de probabilidad
        this._questSystem.startQuest(explorationQuest.id);
        logAutopoiesis.info("Exploration quest auto-triggered");
      }
    }
  }

  /**
   * Muestra diálogo específico de misión usando el sistema existente
   */
  private _showQuestDialogue(quest: QuestEventData, stage: string): void {
    const dialogue = quest.dialogues.find((d) => d.stage === stage);
    if (dialogue) {
      // Usar el sistema de diálogos existente
      this._scene.events.emit("show_dialogue", {
        speaker: dialogue.speaker,
        text: dialogue.text,
        mood: dialogue.mood || "neutral",
        type: `quest_${stage}`,
      });
    }
  }

  /**
   * Activa objetivos basados en ítems encontrados
   */
  public onItemFound(itemId: string, location: { x: number; y: number }): void {
    const activeQuests = this._questSystem.getActiveQuests();

    activeQuests.forEach((quest) => {
      quest.objectives.forEach((objective) => {
        if (
          objective.type === "find_item" &&
          objective.target === itemId &&
          !objective.isCompleted
        ) {
          this._questSystem.updateObjectiveProgress(quest.id, objective.id);

          logAutopoiesis.info("Item found for quest", {
            itemId,
            location,
            questId: quest.id,
          });
        }
      });
    });
  }

  /**
   * Activa objetivos basados en ubicaciones visitadas
   */
  public onLocationReached(
    locationId: string,
    coordinates: { x: number; y: number },
  ): void {
    const activeQuests = this._questSystem.getActiveQuests();

    activeQuests.forEach((quest) => {
      quest.objectives.forEach((objective) => {
        if (objective.type === "reach_location" && !objective.isCompleted) {
          if (
            objective.target === locationId ||
            (objective.targetLocation &&
              Phaser.Math.Distance.Between(
                coordinates.x,
                coordinates.y,
                objective.targetLocation.x,
                objective.targetLocation.y,
              ) <= (objective.targetLocation.radius || 50))
          ) {
            this._questSystem.updateObjectiveProgress(quest.id, objective.id);

            logAutopoiesis.info("Location reached for quest", {
              locationId,
              coordinates,
              questId: quest.id,
            });
          }
        }
      });
    });
  }

  /**
   * Manejo inteligente de progreso de misiones basado en contexto
   */
  public handleContextualProgress(context: {
    entityIds: string[];
    activity: ActivityType;
    location: { x: number; y: number };
    stats?: EntityEventData;
    duration?: number;
  }): void {
    const activeQuests = this._questSystem.getActiveQuests();

    activeQuests.forEach((quest) => {
      // Verificar si el contexto actual cumple algún objetivo de la misión
      quest.objectives.forEach((objective) => {
        if (objective.isCompleted) return;

        switch (objective.type) {
          case "complete_activity":
            if (context.activity.toLowerCase() === objective.target) {
              this._questSystem.updateObjectiveProgress(quest.id, objective.id);
            }
            break;

          case "reach_location":
            if (objective.targetLocation) {
              const distance = Phaser.Math.Distance.Between(
                context.location.x,
                context.location.y,
                objective.targetLocation.x,
                objective.targetLocation.y,
              );
              if (distance <= (objective.targetLocation.radius || 50)) {
                this._questSystem.updateObjectiveProgress(
                  quest.id,
                  objective.id,
                );
              }
            }
            break;

          case "interact_with_entity":
            if (
              context.entityIds.length > 1 &&
              objective.target === "partner_entity"
            ) {
              this._questSystem.updateObjectiveProgress(quest.id, objective.id);
            }
            break;
        }
      });
    });
  }

  /**
   * Limpieza del controlador
   */
  public destroy(): void {
    if (this._activityTimer) {
      this._activityTimer.destroy();
    }

    this._scene.events.off("gameLogicUpdate", this._onGameUpdate, this);
    this._scene.events.off(
      "playerInteraction",
      this._onPlayerInteraction,
      this,
    );
    this._scene.events.off("food_consumed", this._onFoodConsumed, this);
    this._scene.events.off("dialogue_started", this._onDialogueStarted, this);

    logAutopoiesis.info("QuestController destroyed");
  }
}
