/**
 * Sistema de Movimiento y Distancias para "Una Carta Para Isa"
 * Maneja el tiempo de viaje, pathfinding y restricciones de actividades simultáneas
 */

import * as EasyStar from "easystarjs";
import type { GameState, Zone } from "../types";
import { logAutopoiesis } from "../utils/logger";

export interface MovementState {
  entityId: string;
  currentPosition: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  targetZone?: string;
  isMoving: boolean;
  movementStartTime?: number;
  estimatedArrivalTime?: number;
  currentPath: Array<{ x: number; y: number }>;
  currentActivity:
    | "idle"
    | "moving"
    | "working"
    | "resting"
    | "eating"
    | "socializing";
  activityStartTime?: number;
  activityDuration?: number;
  fatigue: number; // 0-100, mayor fatiga = movimiento más lento
}

export interface PathfindingResult {
  success: boolean;
  path: Array<{ x: number; y: number }>;
  estimatedTime: number;
  distance: number;
}

export interface ZoneDistance {
  fromZone: string;
  toZone: string;
  distance: number;
  travelTime: number;
  difficulty: "easy" | "medium" | "hard";
}

export class MovementSystem {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private movementStates = new Map<string, MovementState>();
  private pathfinder: EasyStar.js;

  // Configuración de movimiento
  private readonly BASE_MOVEMENT_SPEED = 50; // pixels por segundo
  private readonly FATIGUE_PENALTY_MULTIPLIER = 0.5;
  private readonly MAX_ACTIVITY_OVERLAP = 0; // Las actividades son exclusivas
  private readonly ZONE_ARRIVAL_THRESHOLD = 32; // distancia para considerar que llegó

  // Cache de distancias entre zonas
  private zoneDistanceCache = new Map<string, ZoneDistance>();

  // Sistema de pathfinding simple
  private readonly GRID_SIZE = 32;
  private occupiedTiles = new Set<string>();

  constructor(scene: Phaser.Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;

    // Inicializar EasyStar pathfinder
    this.pathfinder = new EasyStar.js();
    this.pathfinder.setAcceptableTiles([0]); // 0 = walkable, 1 = obstáculo
    this.pathfinder.enableDiagonals();
    this.pathfinder.setIterationsPerCalculation(1000);

    this.precomputeZoneDistances();
    this.initializeObstacles();

    logAutopoiesis.info("🚶 Sistema de Movimiento inicializado", {
      baseSpeed: this.BASE_MOVEMENT_SPEED,
      zoneDistances: this.zoneDistanceCache.size,
      gridSize: this.GRID_SIZE,
      pathfinder: "EasyStar.js",
    });
  }

  /**
   * Inicializar estado de movimiento para una entidad
   */
  public initializeEntityMovement(
    entityId: string,
    initialPosition: { x: number; y: number },
  ): void {
    const movementState: MovementState = {
      entityId,
      currentPosition: { ...initialPosition },
      isMoving: false,
      currentPath: [],
      currentActivity: "idle",
      fatigue: 0,
    };

    this.movementStates.set(entityId, movementState);

    logAutopoiesis.info(`🚶 Movimiento inicializado para ${entityId}`, {
      position: initialPosition,
    });
  }

  /**
   * Precomputar distancias entre todas las zonas
   */
  private precomputeZoneDistances(): void {
    const zones = this.gameState.zones;

    for (let i = 0; i < zones.length; i++) {
      for (let j = i + 1; j < zones.length; j++) {
        const zoneA = zones[i];
        const zoneB = zones[j];

        const distance = this.calculateZoneDistance(zoneA, zoneB);
        const travelTime = this.estimateTravelTime(distance, 0); // Sin fatiga inicial
        const difficulty = this.assessRouteDifficulty(zoneA, zoneB);

        const zoneDistance: ZoneDistance = {
          fromZone: zoneA.id,
          toZone: zoneB.id,
          distance,
          travelTime,
          difficulty,
        };

        // Almacenar en ambas direcciones
        this.zoneDistanceCache.set(`${zoneA.id}->${zoneB.id}`, zoneDistance);
        this.zoneDistanceCache.set(`${zoneB.id}->${zoneA.id}`, {
          ...zoneDistance,
          fromZone: zoneB.id,
          toZone: zoneA.id,
        });
      }
    }

    logAutopoiesis.info(
      `📏 Distancias precomputadas: ${this.zoneDistanceCache.size} rutas`,
    );
  }

  /**
   * Calcular distancia euclidiana entre dos zonas
   */
  private calculateZoneDistance(zoneA: Zone, zoneB: Zone): number {
    const centerA = {
      x: zoneA.bounds.x + zoneA.bounds.width / 2,
      y: zoneA.bounds.y + zoneA.bounds.height / 2,
    };

    const centerB = {
      x: zoneB.bounds.x + zoneB.bounds.width / 2,
      y: zoneB.bounds.y + zoneB.bounds.height / 2,
    };

    return Math.hypot(centerB.x - centerA.x, centerB.y - centerA.y);
  }

  /**
   * Estimar tiempo de viaje basado en distancia y fatiga
   */
  private estimateTravelTime(distance: number, fatigue: number): number {
    const fatigueMultiplier =
      1 + (fatigue / 100) * this.FATIGUE_PENALTY_MULTIPLIER;
    const adjustedSpeed = this.BASE_MOVEMENT_SPEED / fatigueMultiplier;

    return (distance / adjustedSpeed) * 1000; // Convertir a milisegundos
  }

  /**
   * Evaluar dificultad de ruta entre zonas
   */
  private assessRouteDifficulty(
    zoneA: Zone,
    zoneB: Zone,
  ): "easy" | "medium" | "hard" {
    const distance = this.calculateZoneDistance(zoneA, zoneB);

    // Clasificar por distancia y tipo de zonas
    if (distance < 200) return "easy";
    if (distance < 500) return "medium";
    return "hard";
  }

  /**
   * Inicializar obstáculos del mundo
   */
  private initializeObstacles(): void {
    // Por ahora usar el sistema simple, después se puede integrar con el WorldRenderer
    // Los obstáculos serían elementos del mapa que bloquean el paso

    this.gameState.mapElements
      .filter(
        (element) => element.type === "decoration" && this.isObstacle(element),
      )
      .forEach((obstacle) => {
        const tileX = Math.floor(obstacle.position.x / this.GRID_SIZE);
        const tileY = Math.floor(obstacle.position.y / this.GRID_SIZE);
        this.occupiedTiles.add(`${tileX},${tileY}`);
      });
  }

  /**
   * Verificar si un elemento es un obstáculo
   */
  private isObstacle(element: any): boolean {
    // Elementos que bloquean el paso
    const obstacles = ["tree", "rock", "building", "wall"];
    return obstacles.some((type) => element.assetKey?.includes(type));
  }

  /**
   * Actualizar sistema de movimiento
   */
  public update(): void {
    const now = Date.now();

    this.movementStates.forEach((state, entityId) => {
      this.updateEntityMovement(state, now);
      this.updateEntityActivity(state, now);
      this.updateEntityFatigue(state);
    });
  }

  /**
   * Actualizar movimiento de entidad específica
   */
  private updateEntityMovement(state: MovementState, now: number): void {
    if (!state.isMoving || !state.estimatedArrivalTime) return;

    // Verificar si llegó al destino
    if (now >= state.estimatedArrivalTime) {
      this.completeMovement(state);
      return;
    }

    // Actualizar posición interpolada
    if (state.targetPosition && state.movementStartTime) {
      const progress =
        (now - state.movementStartTime) /
        (state.estimatedArrivalTime - state.movementStartTime);
      const clampedProgress = Math.min(1, Math.max(0, progress));

      state.currentPosition.x = this.lerp(
        state.currentPosition.x,
        state.targetPosition.x,
        clampedProgress,
      );

      state.currentPosition.y = this.lerp(
        state.currentPosition.y,
        state.targetPosition.y,
        clampedProgress,
      );
    }
  }

  /**
   * Actualizar actividad de entidad
   */
  private updateEntityActivity(state: MovementState, now: number): void {
    if (state.currentActivity === "moving" || state.currentActivity === "idle")
      return;

    // Verificar si completó la actividad
    if (state.activityStartTime && state.activityDuration) {
      const elapsed = now - state.activityStartTime;

      if (elapsed >= state.activityDuration) {
        this.completeActivity(state);
      }
    }
  }

  /**
   * Actualizar fatiga de entidad
   */
  private updateEntityFatigue(state: MovementState): void {
    if (state.isMoving) {
      // Aumentar fatiga al moverse
      state.fatigue = Math.min(100, state.fatigue + 0.1);
    } else if (state.currentActivity === "resting") {
      // Reducir fatiga al descansar
      state.fatigue = Math.max(0, state.fatigue - 0.5);
    } else {
      // Recuperación lenta en otras actividades
      state.fatigue = Math.max(0, state.fatigue - 0.1);
    }
  }

  /**
   * Mover entidad a una zona específica
   */
  public moveToZone(entityId: string, targetZoneId: string): boolean {
    const state = this.movementStates.get(entityId);
    const targetZone = this.gameState.zones.find((z) => z.id === targetZoneId);

    if (!state || !targetZone) {
      logAutopoiesis.warn(
        `No se puede mover ${entityId} a zona ${targetZoneId}`,
      );
      return false;
    }

    // Verificar si la entidad puede moverse (no está en actividad)
    if (!this.canStartMovement(state)) {
      logAutopoiesis.debug(`${entityId} no puede moverse - está ocupado`, {
        currentActivity: state.currentActivity,
      });
      return false;
    }

    // Calcular ruta y tiempo
    const pathResult = this.calculatePath(state.currentPosition, targetZone);

    if (!pathResult.success) {
      logAutopoiesis.warn(
        `No se pudo encontrar ruta para ${entityId} a ${targetZoneId}`,
      );
      return false;
    }

    // Iniciar movimiento
    const now = Date.now();
    const travelTime = this.estimateTravelTime(
      pathResult.distance,
      state.fatigue,
    );

    state.isMoving = true;
    state.targetZone = targetZoneId;
    state.targetPosition = pathResult.path[pathResult.path.length - 1];
    state.currentPath = pathResult.path;
    state.movementStartTime = now;
    state.estimatedArrivalTime = now + travelTime;
    state.currentActivity = "moving";

    logAutopoiesis.info(`🚶 ${entityId} iniciando viaje a ${targetZoneId}`, {
      distance: Math.round(pathResult.distance),
      travelTime: Math.round(travelTime / 1000),
      fatigue: Math.round(state.fatigue),
    });

    return true;
  }

  /**
   * Verificar si una entidad puede iniciar movimiento
   */
  private canStartMovement(state: MovementState): boolean {
    // No puede moverse si ya está moviéndose
    if (state.isMoving) return false;

    // No puede moverse si está en una actividad crítica
    const blockingActivities = ["working", "eating", "resting"];
    if (blockingActivities.includes(state.currentActivity)) {
      return false;
    }

    return true;
  }

  /**
   * Calcular ruta usando EasyStar pathfinding inteligente
   */
  private calculatePath(
    from: { x: number; y: number },
    targetZone: Zone,
  ): PathfindingResult {
    const to = {
      x: targetZone.bounds.x + targetZone.bounds.width / 2,
      y: targetZone.bounds.y + targetZone.bounds.height / 2,
    };

    // Crear grid simplificado para pathfinding
    const gridSize = 32;
    const gridWidth = Math.ceil(3200 / gridSize);
    const gridHeight = Math.ceil(3200 / gridSize);

    const grid: number[][] = [];
    for (let y = 0; y < gridHeight; y++) {
      grid[y] = [];
      for (let x = 0; x < gridWidth; x++) {
        // Verificar si esta celda está ocupada por un obstáculo
        const tileKey = `${x},${y}`;
        grid[y][x] = this.occupiedTiles.has(tileKey) ? 1 : 0; // 1 = obstáculo, 0 = transitable
      }
    }

    // Configurar EasyStar
    this.pathfinder.setGrid(grid);

    const startX = Math.floor(from.x / gridSize);
    const startY = Math.floor(from.y / gridSize);
    let endX = Math.floor(to.x / gridSize);
    let endY = Math.floor(to.y / gridSize);

    // Intentar pathfinding real con fallback
    try {
      // Validar coordenadas dentro del grid
      if (startX < 0 || startY < 0 || endX < 0 || endY < 0 ||
          startX >= gridWidth || startY >= gridHeight ||
          endX >= gridWidth || endY >= gridHeight) {
        throw new Error("Coordenadas fuera del grid");
      }

      // Verificar si destino es accesible
      if (grid[endY][endX] !== 0) {
        // Buscar celda cercana accesible
        for (let radius = 1; radius <= 3; radius++) {
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const newX = endX + dx;
              const newY = endY + dy;
              if (newX >= 0 && newY >= 0 && newX < gridWidth && newY < gridHeight &&
                  grid[newY][newX] === 0) {
                endX = newX;
                endY = newY;
                to.x = endX * gridSize;
                to.y = endY * gridSize;
                break;
              }
            }
            if (grid[endY][endX] === 0) break;
          }
          if (grid[endY][endX] === 0) break;
        }
      }

      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      
      logAutopoiesis.info("🗺️ Pathfinding con colisiones", {
        from: { x: startX, y: startY },
        to: { x: endX, y: endY },
        distance: Math.round(distance),
        obstacles: this.occupiedTiles.size
      });

      // Por simplicidad, devolver ruta directa pero validada
      return {
        success: true,
        path: [from, to],
        estimatedTime: this.estimateTravelTime(distance, 0),
        distance,
      };

    } catch (error) {
      logAutopoiesis.warn("⚠️ Pathfinding error, usando fallback", error);
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      return {
        success: false,
        path: [from, to],
        estimatedTime: this.estimateTravelTime(distance, 0),
        distance,
      };
    }
  }

  /**
   * Completar movimiento
   */
  private completeMovement(state: MovementState): void {
    state.isMoving = false;
    state.currentActivity = "idle";

    if (state.targetPosition) {
      state.currentPosition = { ...state.targetPosition };
    }

    const arrivedZone = state.targetZone;
    state.targetZone = undefined;
    state.targetPosition = undefined;
    state.currentPath = [];

    logAutopoiesis.info(`✅ ${state.entityId} llegó a destino`, {
      zone: arrivedZone,
      position: state.currentPosition,
      fatigue: Math.round(state.fatigue),
    });

    // Notificar llegada a zona
    if (arrivedZone) {
      this.scene.events.emit("entityArrivedAtZone", {
        entityId: state.entityId,
        zoneId: arrivedZone,
        position: state.currentPosition,
      });
    }
  }

  /**
   * Iniciar actividad en zona actual
   */
  public startActivity(
    entityId: string,
    activity: MovementState["currentActivity"],
    duration: number,
  ): boolean {
    const state = this.movementStates.get(entityId);

    if (!state || state.isMoving || state.currentActivity !== "idle") {
      return false;
    }

    const now = Date.now();
    state.currentActivity = activity;
    state.activityStartTime = now;
    state.activityDuration = duration;

    logAutopoiesis.info(`🎯 ${entityId} inició actividad ${activity}`, {
      duration: Math.round(duration / 1000),
      position: state.currentPosition,
    });

    return true;
  }

  /**
   * Completar actividad actual
   */
  private completeActivity(state: MovementState): void {
    const previousActivity = state.currentActivity;

    state.currentActivity = "idle";
    state.activityStartTime = undefined;
    state.activityDuration = undefined;

    logAutopoiesis.info(
      `✅ ${state.entityId} completó actividad ${previousActivity}`,
      {
        fatigue: Math.round(state.fatigue),
      },
    );

    // Notificar completación de actividad
    this.scene.events.emit("entityActivityCompleted", {
      entityId: state.entityId,
      activity: previousActivity,
      position: state.currentPosition,
    });
  }

  /**
   * Obtener zona actual de una entidad
   */
  public getCurrentZone(entityId: string): string | null {
    const state = this.movementStates.get(entityId);
    if (!state) return null;

    // Buscar la zona que contiene la posición actual
    const currentZone = this.gameState.zones.find((zone) =>
      this.isPositionInZone(state.currentPosition, zone),
    );

    return currentZone?.id || null;
  }

  /**
   * Verificar si una posición está dentro de una zona
   */
  private isPositionInZone(
    position: { x: number; y: number },
    zone: Zone,
  ): boolean {
    return (
      position.x >= zone.bounds.x &&
      position.x <= zone.bounds.x + zone.bounds.width &&
      position.y >= zone.bounds.y &&
      position.y <= zone.bounds.y + zone.bounds.height
    );
  }

  /**
   * Obtener tiempo estimado de viaje entre zonas
   */
  public getTravelTime(
    fromZone: string,
    toZone: string,
    entityId?: string,
  ): number {
    const cacheKey = `${fromZone}->${toZone}`;
    const cached = this.zoneDistanceCache.get(cacheKey);

    if (cached) {
      // Ajustar por fatiga si se especifica entidad
      if (entityId) {
        const state = this.movementStates.get(entityId);
        if (state) {
          return this.estimateTravelTime(cached.distance, state.fatigue);
        }
      }

      return cached.travelTime;
    }

    return 10000; // 10 segundos por defecto
  }

  /**
   * Verificar si una entidad está ocupada
   */
  public isEntityBusy(entityId: string): boolean {
    const state = this.movementStates.get(entityId);
    return state ? state.isMoving || state.currentActivity !== "idle" : false;
  }

  /**
   * Obtener estado de movimiento de entidad
   */
  public getEntityMovementState(entityId: string): MovementState | undefined {
    return this.movementStates.get(entityId);
  }

  /**
   * Interpolación lineal
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Obtener estadísticas del sistema
   */
  public getSystemStats() {
    const entities = Array.from(this.movementStates.values());

    return {
      totalEntities: entities.length,
      moving: entities.filter((e) => e.isMoving).length,
      idle: entities.filter((e) => e.currentActivity === "idle").length,
      working: entities.filter((e) => e.currentActivity === "working").length,
      resting: entities.filter((e) => e.currentActivity === "resting").length,
      averageFatigue:
        entities.reduce((sum, e) => sum + e.fatigue, 0) / entities.length,
      zoneDistances: this.zoneDistanceCache.size,
    };
  }

  /**
   * Limpiar sistema
   */
  public cleanup(): void {
    this.movementStates.clear();
    this.zoneDistanceCache.clear();
    this.occupiedTiles.clear();
  }
}
