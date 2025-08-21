/**
 * Sistema de Guardado para "Una Carta Para Isa"
 * Maneja el guardado automático y manual del estado del juego
 */

import type { GameState } from "../types";
import type { EntityNeedsData } from "./NeedsSystem";
import { logAutopoiesis } from "../utils/logger";

export interface SaveData {
  version: string;
  timestamp: number;
  gameTime: number;

  entities: SerializedEntity[];
  needs: SerializedNeeds[];
  quests: SerializedQuest[];
  worldState: SerializedWorldState;

  stats: {
    playtime: number;
    daysPassed: number;
  };
}

export interface SerializedEntity {
  id: string;
  position: { x: number; y: number };
  isDead?: boolean;
  deathTime?: number;
  currentZone?: string;
  currentActivity?: string;
  fatigue?: number;
}

export interface SerializedNeeds {
  entityId: string;
  needs: {
    hunger: number;
    thirst: number;
    energy: number;
    hygiene: number;
    social: number;
    fun: number;
    mentalHealth: number;
  };
  emergencyLevel: string;
  isDead?: boolean;
  deathTime?: number;
}

export interface SerializedQuest {
  id: string;
  status: string;
  progress: number;
  startTime?: number;
  completionTime?: number;
  objectives: any[];
}

export interface SerializedWorldState {
  zones: any[];
  mapElements: any[];
  dayTime: number;
  weather?: string;
  resources: Record<string, number>;
}

export class SaveSystem {
  private scene: Phaser.Scene;
  private SAVE_KEY = "unaCartaParaIsa_saveData";
  private AUTO_SAVE_INTERVAL = 60000; // 1 minuto
  private autoSaveTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupAutoSave();
    this.setupSaveEvents();

    logAutopoiesis.info("💾 Sistema de Guardado inicializado", {
      autoSaveInterval: this.AUTO_SAVE_INTERVAL / 1000,
    });
  }

  private setupAutoSave(): void {
    this.autoSaveTimer = this.scene.time.addEvent({
      delay: this.AUTO_SAVE_INTERVAL,
      callback: () => this.saveGame(),
      loop: true,
    });
  }

  private setupSaveEvents(): void {
    // Guardar al cambiar de escena
    this.scene.events.on("shutdown", () => this.saveGame());

    // Guardar con tecla F5
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.on("keydown-F5", (event: KeyboardEvent) => {
        event.preventDefault();
        this.quickSave();
      });
    }

    // Guardar cuando se cierre la ventana
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.saveGame();
      });
    }
  }

  public saveGame(): SaveData {
    const gameState = this.scene.registry.get("gameState") as GameState;
    const questSystem = this.scene.registry.get("questSystem");
    const needsSystem = this.scene.registry.get("needsSystem");

    if (!gameState) {
      logAutopoiesis.warn("⚠️ No hay GameState para guardar");
      throw new Error("GameState no disponible");
    }

    const saveData: SaveData = {
      version: "1.0.0",
      timestamp: Date.now(),
      gameTime: this.scene.time.now,

      entities: this.serializeEntities(gameState.entities),
      needs: this.serializeNeeds(needsSystem),
      quests: this.serializeQuests(questSystem),
      worldState: this.serializeWorld(gameState),

      stats: {
        playtime: this.scene.time.now,
        daysPassed: Math.floor(this.scene.time.now / 86400000),
      },
    };

    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
      this.showSaveNotification("Juego guardado");

      logAutopoiesis.info("💾 Juego guardado exitosamente", {
        entities: saveData.entities.length,
        timestamp: new Date(saveData.timestamp).toISOString(),
      });

      return saveData;
    } catch (error) {
      console.error("Error al guardar:", error);
      this.showSaveNotification("Error al guardar", true);
      throw error;
    }
  }

  public loadGame(): SaveData | null {
    try {
      const savedData = localStorage.getItem(this.SAVE_KEY);
      if (!savedData) {
        logAutopoiesis.info("💾 No hay datos de guardado previos");
        return null;
      }

      const saveData: SaveData = JSON.parse(savedData);

      // Validar versión
      if (!this.isCompatibleVersion(saveData.version)) {
        throw new Error("Versión de guardado incompatible");
      }

      this.applySaveData(saveData);
      this.showSaveNotification("Juego cargado");

      logAutopoiesis.info("📂 Juego cargado exitosamente", {
        version: saveData.version,
        entities: saveData.entities.length,
        timestamp: new Date(saveData.timestamp).toISOString(),
      });

      return saveData;
    } catch (error) {
      console.error("Error al cargar:", error);
      this.showSaveNotification("Error al cargar", true);
      return null;
    }
  }

  private applySaveData(saveData: SaveData): void {
    const gameState = this.scene.registry.get("gameState") as GameState;
    const questSystem = this.scene.registry.get("questSystem");
    const needsSystem = this.scene.registry.get("needsSystem");

    if (!gameState) {
      logAutopoiesis.error("❌ GameState no disponible para cargar");
      return;
    }

    // Restaurar entidades
    gameState.entities = this.deserializeEntities(saveData.entities);

    // Restaurar necesidades
    this.restoreNeeds(needsSystem, saveData.needs);

    // Restaurar quests
    this.restoreQuests(questSystem, saveData.quests);

    // Restaurar mundo
    this.restoreWorld(gameState, saveData.worldState);

    // Emitir evento de carga completa
    this.scene.events.emit("save:loaded", saveData);
  }

  private quickSave(): void {
    const saveData = this.saveGame();

    // Crear slot de guardado rápido
    const quickSaveKey = `${this.SAVE_KEY}_quick`;
    localStorage.setItem(quickSaveKey, JSON.stringify(saveData));

    this.showSaveNotification("Guardado rápido", false);

    logAutopoiesis.info("⚡ Guardado rápido completado");
  }

  private showSaveNotification(message: string, isError = false): void {
    if (!this.scene.add) return;

    const notification = this.scene.add.text(
      this.scene.cameras.main.width - 200,
      20,
      message,
      {
        fontSize: "16px",
        color: isError ? "#ff4444" : "#44ff44",
        backgroundColor: "#000000",
        padding: { x: 10, y: 5 },
      },
    );

    notification.setScrollFactor(0).setDepth(10000);

    this.scene.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 2000,
      delay: 1000,
      onComplete: () => notification.destroy(),
    });
  }

  private isCompatibleVersion(version: string): boolean {
    // Por ahora todas las versiones 1.x son compatibles
    return version.startsWith("1.");
  }

  private serializeEntities(entities: any[]): SerializedEntity[] {
    return entities.map((entity) => ({
      id: entity.id,
      position: { ...entity.position },
      isDead: entity.isDead,
      deathTime: entity.deathTime,
      currentZone: entity.currentZone,
      currentActivity: entity.currentActivity,
      fatigue: entity.fatigue,
    }));
  }

  private deserializeEntities(serializedEntities: SerializedEntity[]): any[] {
    return serializedEntities.map((data) => ({
      id: data.id,
      position: { ...data.position },
      isDead: data.isDead || false,
      deathTime: data.deathTime,
      currentZone: data.currentZone,
      currentActivity: data.currentActivity || "idle",
      fatigue: data.fatigue || 0,
    }));
  }

  private serializeNeeds(needsSystem: any): SerializedNeeds[] {
    if (!needsSystem || !needsSystem.entityNeeds) return [];

    const serialized: SerializedNeeds[] = [];

    // Si needsSystem.entityNeeds es un Map
    if (needsSystem.entityNeeds instanceof Map) {
      needsSystem.entityNeeds.forEach(
        (entityData: EntityNeedsData, entityId: string) => {
          serialized.push({
            entityId,
            needs: {
              hunger: entityData.needs.hunger,
              thirst: entityData.needs.thirst,
              energy: entityData.needs.energy,
              hygiene: entityData.needs.hygiene,
              social: entityData.needs.social,
              fun: entityData.needs.fun,
              mentalHealth: entityData.needs.mentalHealth,
            },
            emergencyLevel: entityData.emergencyLevel,
            isDead: entityData.isDead,
            deathTime: entityData.deathTime,
          });
        },
      );
    }

    return serialized;
  }

  private restoreNeeds(
    needsSystem: any,
    serializedNeeds: SerializedNeeds[],
  ): void {
    if (!needsSystem || !serializedNeeds) return;

    serializedNeeds.forEach((data) => {
      if (needsSystem.initializeEntityNeeds) {
        needsSystem.initializeEntityNeeds(data.entityId);
      }

      const entityData = needsSystem.entityNeeds?.get(data.entityId);
      if (entityData) {
        Object.assign(entityData.needs, data.needs);
        entityData.emergencyLevel = data.emergencyLevel;
        entityData.isDead = data.isDead || false;
        entityData.deathTime = data.deathTime;
      }
    });
  }

  private serializeQuests(questSystem: any): SerializedQuest[] {
    if (!questSystem || !questSystem.activeQuests) return [];

    const serialized: SerializedQuest[] = [];

    // Si questSystem.activeQuests es un Map
    if (questSystem.activeQuests instanceof Map) {
      questSystem.activeQuests.forEach((quest: any, questId: string) => {
        serialized.push({
          id: questId,
          status: quest.status,
          progress: quest.progress || 0,
          startTime: quest.startTime,
          completionTime: quest.completionTime,
          objectives: quest.objectives || [],
        });
      });
    }

    return serialized;
  }

  private restoreQuests(
    questSystem: any,
    serializedQuests: SerializedQuest[],
  ): void {
    if (!questSystem || !serializedQuests) return;

    serializedQuests.forEach((questData) => {
      if (questSystem.loadQuestFromSave) {
        questSystem.loadQuestFromSave(questData);
      }
    });
  }

  private serializeWorld(gameState: GameState): SerializedWorldState {
    return {
      zones: gameState.zones || [],
      mapElements: gameState.mapElements || [],
      dayTime: gameState.dayTime || 0,
      weather: gameState.weather,
      resources: gameState.resources || {},
    };
  }

  private restoreWorld(
    gameState: GameState,
    worldState: SerializedWorldState,
  ): void {
    if (!worldState) return;

    gameState.zones = worldState.zones || [];
    gameState.mapElements = worldState.mapElements || [];
    gameState.dayTime = worldState.dayTime || 0;
    gameState.weather = worldState.weather;
    gameState.resources = worldState.resources || {};
  }

  public hasSaveData(): boolean {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }

  public deleteSaveData(): void {
    localStorage.removeItem(this.SAVE_KEY);
    localStorage.removeItem(`${this.SAVE_KEY}_quick`);

    this.showSaveNotification("Datos de guardado eliminados");
    logAutopoiesis.info("🗑️ Datos de guardado eliminados");
  }

  public getSaveInfo(): { timestamp: number; version: string } | null {
    const savedData = localStorage.getItem(this.SAVE_KEY);
    if (!savedData) return null;

    try {
      const saveData: SaveData = JSON.parse(savedData);
      return {
        timestamp: saveData.timestamp,
        version: saveData.version,
      };
    } catch {
      return null;
    }
  }

  public cleanup(): void {
    if (this.autoSaveTimer) {
      this.autoSaveTimer.destroy();
    }

    this.scene.events.off("shutdown");

    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.off("keydown-F5");
    }

    logAutopoiesis.info("💾 SaveSystem limpiado");
  }
}
