/**
 * EntityStateManager - Gestor centralizado de estado de entidades
 * Soluciona el problema de múltiples fuentes de verdad
 */

import type { NeedsState } from "../systems/NeedsSystem";
import { logAutopoiesis } from "../utils/logger";

export interface CompleteEntityState {
  // Datos básicos de entidad
  id: string;
  position: { x: number; y: number };
  sprite: string;

  // Estado de necesidades
  needs: NeedsState;

  // Estado de movimiento
  movement: {
    isMoving: boolean;
    targetPosition?: { x: number; y: number };
    currentPath?: Array<{ x: number; y: number }>;
    speed: number;
  };

  // Estado de AI
  ai: {
    currentBehavior: string;
    priority: string;
    lastDecision: number;
    playerControlled: boolean;
  };

  // Estado de diálogo/cartas
  dialogue: {
    activeCards: string[];
    lastCardResponse: number;
    conversationContext?: any;
  };

  // Metadatos de sincronización
  lastUpdate: number;
  version: number;
}

export class EntityStateManager {
  private entityStates = new Map<string, CompleteEntityState>();
  private scene: Phaser.Scene;
  private updateListeners = new Set<
    (entityId: string, state: CompleteEntityState) => void
  >();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Crear estado por defecto para una nueva entidad
   */
  private createDefaultState(entityId: string): CompleteEntityState {
    return {
      id: entityId,
      position: { x: 400 + Math.random() * 800, y: 300 + Math.random() * 600 },
      sprite: entityId === "isa" ? "woman" : "man",

      needs: {
        hunger: 80,
        thirst: 75,
        energy: 70,
        hygiene: 85,
        social: 60,
        fun: 55,
        mentalHealth: 75,
        lastUpdate: Date.now(),
      },

      movement: {
        isMoving: false,
        speed: 100,
      },

      ai: {
        currentBehavior: "idle",
        priority: "normal",
        lastDecision: Date.now(),
        playerControlled: false,
      },

      dialogue: {
        activeCards: [],
        lastCardResponse: 0,
      },

      lastUpdate: Date.now(),
      version: 1,
    };
  }

  /**
   * Actualizar estado de entidad (ÚNICA fuente de verdad)
   */
  public updateEntityState(
    entityId: string,
    partial: Partial<CompleteEntityState>,
  ): void {
    const current =
      this.entityStates.get(entityId) || this.createDefaultState(entityId);

    // Merge profundo manteniendo estructura
    const updated: CompleteEntityState = {
      ...current,
      ...partial,

      // Merge específico para objetos anidados
      needs: { ...current.needs, ...partial.needs },
      movement: { ...current.movement, ...partial.movement },
      ai: { ...current.ai, ...partial.ai },
      dialogue: { ...current.dialogue, ...partial.dialogue },

      // Metadatos actualizados
      lastUpdate: Date.now(),
      version: current.version + 1,
    };

    this.entityStates.set(entityId, updated);

    // Notificar a todos los sistemas suscritos
    this.scene.events.emit("entity:stateChanged", { entityId, state: updated });
    this.updateListeners.forEach((listener) => listener(entityId, updated));

    logAutopoiesis.debug(
      `Estado de entidad ${entityId} actualizado (v${updated.version})`,
    );
  }

  /**
   * Obtener estado completo de entidad
   */
  public getEntityState(entityId: string): CompleteEntityState | null {
    return this.entityStates.get(entityId) || null;
  }

  /**
   * Obtener estado parcial específico
   */
  public getEntityNeeds(entityId: string): NeedsState | null {
    const state = this.entityStates.get(entityId);
    return state ? state.needs : null;
  }

  public getEntityPosition(entityId: string): { x: number; y: number } | null {
    const state = this.entityStates.get(entityId);
    return state ? state.position : null;
  }

  public getEntityMovement(entityId: string) {
    const state = this.entityStates.get(entityId);
    return state ? state.movement : null;
  }

  public getEntityAI(entityId: string) {
    const state = this.entityStates.get(entityId);
    return state ? state.ai : null;
  }

  /**
   * Inicializar entidad con estado por defecto
   */
  public initializeEntity(
    entityId: string,
    initialData?: Partial<CompleteEntityState>,
  ): void {
    const defaultState = this.createDefaultState(entityId);
    const initialState = { ...defaultState, ...initialData };
    this.entityStates.set(entityId, initialState);

    logAutopoiesis.info(
      `Entidad ${entityId} inicializada en EntityStateManager`,
    );

    // Notificar inicialización
    this.scene.events.emit("entity:initialized", {
      entityId,
      state: initialState,
    });
  }

  /**
   * Eliminar entidad del estado
   */
  public removeEntity(entityId: string): void {
    if (this.entityStates.has(entityId)) {
      this.entityStates.delete(entityId);
      this.scene.events.emit("entity:removed", { entityId });
      logAutopoiesis.info(
        `Entidad ${entityId} eliminada del EntityStateManager`,
      );
    }
  }

  /**
   * Obtener todas las entidades
   */
  public getAllEntities(): CompleteEntityState[] {
    return Array.from(this.entityStates.values());
  }

  /**
   * Obtener IDs de todas las entidades
   */
  public getAllEntityIds(): string[] {
    return Array.from(this.entityStates.keys());
  }

  /**
   * Suscribirse a cambios de estado
   */
  public onEntityStateChange(
    callback: (entityId: string, state: CompleteEntityState) => void,
  ): void {
    this.updateListeners.add(callback);
  }

  /**
   * Desuscribirse de cambios de estado
   */
  public offEntityStateChange(
    callback: (entityId: string, state: CompleteEntityState) => void,
  ): void {
    this.updateListeners.delete(callback);
  }

  /**
   * Validar consistencia del estado
   */
  public validateState(entityId: string): boolean {
    const state = this.entityStates.get(entityId);
    if (!state) return false;

    // Validaciones básicas
    const isValid =
      typeof state.id === "string" &&
      typeof state.position.x === "number" &&
      typeof state.position.y === "number" &&
      state.needs.hunger >= 0 &&
      state.needs.hunger <= 100 &&
      state.needs.energy >= 0 &&
      state.needs.energy <= 100 &&
      state.lastUpdate > 0;

    if (!isValid) {
      logAutopoiesis.error(
        `Estado inconsistente para entidad ${entityId}`,
        { entityId, isValid },
      );
    }

    return isValid;
  }

  /**
   * Exportar estado para guardado
   */
  public exportState(): Record<string, CompleteEntityState> {
    const exported: Record<string, CompleteEntityState> = {};
    this.entityStates.forEach((state, entityId) => {
      exported[entityId] = { ...state };
    });
    return exported;
  }

  /**
   * Importar estado desde guardado
   */
  public importState(savedState: Record<string, CompleteEntityState>): void {
    this.entityStates.clear();
    Object.entries(savedState).forEach(([entityId, state]) => {
      this.entityStates.set(entityId, state);
    });
    logAutopoiesis.info(
      `Estado importado para ${Object.keys(savedState).length} entidades`,
    );
  }

  /**
   * Limpiar todos los estados
   */
  public cleanup(): void {
    this.entityStates.clear();
    this.updateListeners.clear();
    logAutopoiesis.info("EntityStateManager limpiado");
  }

  /**
   * Obtener estadísticas del estado
   */
  public getStats() {
    return {
      totalEntities: this.entityStates.size,
      averageNeeds: this.calculateAverageNeeds(),
      entitiesMoving: this.countMovingEntities(),
      entitiesWithActiveCards: this.countEntitiesWithActiveCards(),
    };
  }

  private calculateAverageNeeds() {
    if (this.entityStates.size === 0) return null;

    let totalHunger = 0,
      totalEnergy = 0,
      totalMental = 0;
    this.entityStates.forEach((state) => {
      totalHunger += state.needs.hunger;
      totalEnergy += state.needs.energy;
      totalMental += state.needs.mentalHealth;
    });

    const count = this.entityStates.size;
    return {
      hunger: totalHunger / count,
      energy: totalEnergy / count,
      mentalHealth: totalMental / count,
    };
  }

  private countMovingEntities(): number {
    return Array.from(this.entityStates.values()).filter(
      (state) => state.movement.isMoving,
    ).length;
  }

  private countEntitiesWithActiveCards(): number {
    return Array.from(this.entityStates.values()).filter(
      (state) => state.dialogue.activeCards.length > 0,
    ).length;
  }
}
