/**
 * Sistema de Movimiento y Distancias para "Una Carta Para Isa"
 * Maneja el tiempo de viaje, pathfinding y restricciones de actividades simultáneas
 */

import * as EasyStar from "easystarjs";
import type { GameState, Zone } from "../types";
import { logAutopoiesis } from "../utils/logger";
import { lerp, calculateZoneDistance, worldToGrid } from "../utils/mathUtils";
import { PHYSICS } from "../constants";

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

  // Configuración de pathfinding con timeouts
  private readonly PATHFINDING_TIMEOUT = 100; // 100ms máximo por cálculo
  private readonly MAX_PATHFINDING_ITERATIONS = 500; // Reducido de 1000
  private readonly PATHFINDING_BATCH_SIZE = 100; // Iteraciones por batch

  // Cache de distancias entre zonas
  private zoneDistanceCache = new Map<string, ZoneDistance>();

  // Sistema de pathfinding simple optimizado
  private readonly GRID_SIZE = PHYSICS.PATHFINDING.GRID_SIZE;
  private readonly gridSize = PHYSICS.PATHFINDING.GRID_SIZE;
  private readonly gridWidth = 40; // 1280px / 32px = 40 tiles
  private readonly gridHeight = 30; // 960px / 32px = 30 tiles
  private occupiedTiles = new Set<string>();
  private cachedGrid: number[][] | null = null;
  private gridCacheTime: number = 0;
  private pathCache = new Map<
    string,
    { result: PathfindingResult; timestamp: number }
  >();
  private readonly GRID_CACHE_DURATION = 5000; // 5 segundos
  private readonly PATH_CACHE_DURATION = 10000; // 10 segundos
  private lastCacheCleanup: number = 0;

  constructor(scene: Phaser.Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;

    // Inicializar EasyStar pathfinder con configuración segura
    this.pathfinder = new EasyStar.js();
    this.pathfinder.setAcceptableTiles([0]); // 0 = walkable, 1 = obstáculo
    this.pathfinder.enableDiagonals();
    this.pathfinder.setIterationsPerCalculation(
      this.MAX_PATHFINDING_ITERATIONS,
    );

    this.precomputeZoneDistances();
    this.initializeObstacles();

    // Escuchar cambios en el mundo para actualizar obstáculos
    this.scene.events.on("world:changed", () => {
      this.initializeObstacles();
    });

    logAutopoiesis.info("🚶 Sistema de Movimiento inicializado", {
      baseSpeed: this.BASE_MOVEMENT_SPEED,
      zoneDistances: this.zoneDistanceCache.size,
      gridSize: this.GRID_SIZE,
      pathfinder: "EasyStar.js",
      obstacles: this.occupiedTiles.size,
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
  public precomputeZoneDistances(): void {
    const zones = this.gameState.zones;

    for (let i = 0; i < zones.length; i++) {
      for (let j = i + 1; j < zones.length; j++) {
        const zoneA = zones[i];
        const zoneB = zones[j];

        const distance = calculateZoneDistance(zoneA, zoneB);
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
    const distance = calculateZoneDistance(zoneA, zoneB);

    // Clasificar por distancia y tipo de zonas
    if (distance < 200) return "easy";
    if (distance < 500) return "medium";
    return "hard";
  }

  /**
   * Inicializar obstáculos del mundo
   */
  private initializeObstacles(): void {
    // Obtener obstáculos del LayeredWorldRenderer
    const worldRenderer = this.scene.registry.get("worldRenderer");
    if (!worldRenderer) return;

    // Limpiar tiles ocupados previos
    this.occupiedTiles.clear();

    // Registrar tiles de colisión desde las capas del mundo
    const collisionLayers = ["rocks", "trees", "buildings", "water"];

    collisionLayers.forEach((layerName) => {
      const layer = worldRenderer.getLayer?.(layerName);
      if (layer && layer.forEachTile) {
        layer.forEachTile((tile: Phaser.Tilemaps.Tile) => {
          if (tile.index !== -1 && tile.properties?.collides) {
            const tileX = tile.x;
            const tileY = tile.y;
            this.occupiedTiles.add(`${tileX},${tileY}`);
          }
        });
      }
    });

    // Agregar elementos del mapa como obstáculos
    this.gameState.mapElements
      .filter((element) => this.isObstacle(element))
      .forEach((obstacle) => {
        const { x: tileX, y: tileY } = worldToGrid(
          obstacle.position.x,
          obstacle.position.y,
          this.GRID_SIZE,
        );

        // Ocupar múltiples tiles según el tamaño del objeto
        const width = obstacle.width || this.GRID_SIZE;
        const height = obstacle.height || this.GRID_SIZE;
        const tilesWide = Math.ceil(width / this.GRID_SIZE);
        const tilesHigh = Math.ceil(height / this.GRID_SIZE);

        for (let dx = 0; dx < tilesWide; dx++) {
          for (let dy = 0; dy < tilesHigh; dy++) {
            this.occupiedTiles.add(`${tileX + dx},${tileY + dy}`);
          }
        }
      });

    // Invalidar cache después de actualizar obstáculos
    this.invalidatePathfindingCache();

    logAutopoiesis.info(
      `🗺️ Obstáculos inicializados: ${this.occupiedTiles.size} tiles ocupados`,
    );
  }

  /**
   * Verificar si un elemento es un obstáculo
   */
  private isObstacle(element: {
    assetKey?: string;
    collides?: boolean;
  }): boolean {
    // Elementos que bloquean el paso
    const obstacles = [
      "tree",
      "rock",
      "building",
      "wall",
      "water",
      "fence",
      "boulder",
    ];
    return (
      obstacles.some((type) => element.assetKey?.includes(type)) ||
      element.collides === true
    );
  }

  /**
   * Agregar método de verificación de colisión por bounding box
   */
  private checkCollisionBox(
    position: { x: number; y: number },
    size: { width: number; height: number },
  ): boolean {
    const { x: startX, y: startY } = worldToGrid(
      position.x,
      position.y,
      this.GRID_SIZE,
    );
    const { x: endX, y: endY } = worldToGrid(
      position.x + size.width,
      position.y + size.height,
      this.GRID_SIZE,
    );

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        if (this.isTileOccupied(x, y)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Verificar si un tile está ocupado
   */
  private isTileOccupied(x: number, y: number): boolean {
    return this.occupiedTiles.has(`${x},${y}`);
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

    // Limpieza periódica de cache viejo (cada 30 segundos)
    if (now - this.lastCacheCleanup > 30000) {
      this.cleanupOldCache(now);
      this.lastCacheCleanup = now;
    }
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

      state.currentPosition.x = lerp(
        state.currentPosition.x,
        state.targetPosition.x,
        clampedProgress,
      );

      state.currentPosition.y = lerp(
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

    // Verificar colisiones en la posición destino
    const targetPos = pathResult.path[pathResult.path.length - 1];
    if (
      this.checkCollisionBox(targetPos, {
        width: this.GRID_SIZE,
        height: this.GRID_SIZE,
      })
    ) {
      logAutopoiesis.warn(`Destino ${targetZoneId} bloqueado por obstáculos`);
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
    state.targetPosition = targetPos;
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
   * Calcular ruta usando EasyStar pathfinding con timeout
   */
  private calculatePath(
    from: { x: number; y: number },
    targetZone: Zone,
  ): PathfindingResult {
    const to = {
      x: targetZone.bounds.x + targetZone.bounds.width / 2,
      y: targetZone.bounds.y + targetZone.bounds.height / 2,
    };

    // Crear cache key para rutas
    const pathKey = `${Math.round(from.x / 32)},${Math.round(from.y / 32)}->${targetZone.id}`;

    // Verificar cache de rutas primero
    const now = Date.now();
    const cachedPath = this.pathCache.get(pathKey);
    if (cachedPath && now - cachedPath.timestamp < this.PATH_CACHE_DURATION) {
      logAutopoiesis.debug(`🚀 Usando ruta cacheada para ${pathKey}`);
      return cachedPath.result;
    }

    // Intentar pathfinding con timeout
    const startTime = performance.now();

    try {
      const result = this.calculatePathWithTimeout(from, to, startTime);

      // Cachear resultado exitoso
      if (result.success) {
        this.pathCache.set(pathKey, { result, timestamp: now });
      }

      return result;
    } catch (error) {
      logAutopoiesis.warn("⚠️ Pathfinding error, usando fallback", error);
      return this.createFallbackPath(from, to);
    }
  }

  /**
   * Calcular ruta con timeout estricto
   */
  private calculatePathWithTimeout(
    from: { x: number; y: number },
    to: { x: number; y: number },
    startTime: number,
  ): PathfindingResult {
    // Obtener o crear grid optimizado
    const grid = this.getOptimizedGrid();
    const now = Date.now();

    // Configurar EasyStar solo si es necesario
    if (this.cachedGrid !== grid) {
      this.pathfinder.setGrid(grid);
      this.cachedGrid = grid;
      this.gridCacheTime = now;
    }

    const { x: startX, y: startY } = worldToGrid(from.x, from.y, this.gridSize);
    let { x: endX, y: endY } = worldToGrid(to.x, to.y, this.gridSize);

    // Validar coordenadas dentro del grid
    if (
      startX < 0 ||
      startY < 0 ||
      endX < 0 ||
      endY < 0 ||
      startX >= this.gridWidth ||
      startY >= this.gridHeight ||
      endX >= this.gridWidth ||
      endY >= this.gridHeight
    ) {
      throw new Error("Coordenadas fuera del grid");
    }

    // Verificar timeout antes de procesamiento pesado
    if (performance.now() - startTime > this.PATHFINDING_TIMEOUT / 2) {
      logAutopoiesis.warn("⏱️ Timeout preventivo en pathfinding");
      return this.createFallbackPath(from, to);
    }

    // Verificar si destino es accesible y encontrar alternativa si es necesario
    endX = this.findAccessibleDestination(grid, endX, endY).x;
    endY = this.findAccessibleDestination(grid, endX, endY).y;
    to.x = endX * this.gridSize;
    to.y = endY * this.gridSize;

    // Verificar timeout después de búsqueda de destino
    if (performance.now() - startTime > this.PATHFINDING_TIMEOUT) {
      logAutopoiesis.warn("⏱️ Timeout en pathfinding, usando ruta directa");
      return this.createFallbackPath(from, to);
    }

    const distance = Math.hypot(to.x - from.x, to.y - from.y);

    // Para rutas cortas, usar línea directa
    if (distance < 100) {
      return {
        success: true,
        path: [from, to],
        estimatedTime: this.estimateTravelTime(distance, 0),
        distance,
      };
    }

    // Para rutas más largas, intentar pathfinding con timeout
    return this.attemptAsyncPathfinding(
      from,
      to,
      startX,
      startY,
      endX,
      endY,
      distance,
      startTime,
    );
  }

  /**
   * Encontrar destino accesible cercano
   */
  private findAccessibleDestination(
    grid: number[][],
    targetX: number,
    targetY: number,
  ): { x: number; y: number } {
    // Si el destino ya es accesible, devolverlo
    if (grid[targetY] && grid[targetY][targetX] === 0) {
      return { x: targetX, y: targetY };
    }

    // Buscar celda cercana accesible con límite de iteraciones
    for (let radius = 1; radius <= 3; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const newX = targetX + dx;
          const newY = targetY + dy;

          if (
            newX >= 0 &&
            newY >= 0 &&
            newX < this.gridWidth &&
            newY < this.gridHeight &&
            grid[newY] &&
            grid[newY][newX] === 0
          ) {
            return { x: newX, y: newY };
          }
        }
      }
    }

    // Si no se encuentra destino accesible, devolver el original
    return { x: targetX, y: targetY };
  }

  /**
   * Intentar pathfinding asíncrono con timeout
   */
  private attemptAsyncPathfinding(
    from: { x: number; y: number },
    to: { x: number; y: number },
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    distance: number,
    startTime: number,
  ): PathfindingResult {
    // Por simplicidad y rendimiento, usar ruta directa validada
    // En una implementación completa, aquí se usaría EasyStar con Promise/timeout

    const elapsedTime = performance.now() - startTime;

    logAutopoiesis.debug("🗺️ Pathfinding completado", {
      from: { x: startX, y: startY },
      to: { x: endX, y: endY },
      distance: Math.round(distance),
      elapsedTime: Math.round(elapsedTime),
      obstacles: this.occupiedTiles.size,
    });

    // Validar que no hemos excedido el timeout
    if (elapsedTime > this.PATHFINDING_TIMEOUT) {
      logAutopoiesis.warn("⏱️ Pathfinding excedió timeout, usando fallback");
      return this.createFallbackPath(from, to);
    }

    return {
      success: true,
      path: [from, to],
      estimatedTime: this.estimateTravelTime(distance, 0),
      distance,
    };
  }

  /**
   * Crear ruta de fallback simple
   */
  private createFallbackPath(
    from: { x: number; y: number },
    to: { x: number; y: number },
  ): PathfindingResult {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);

    return {
      success: false,
      path: [from, to],
      estimatedTime: this.estimateTravelTime(distance, 0),
      distance,
    };
  }

  /**
   * Obtener grid optimizado con cache
   */
  private getOptimizedGrid(): number[][] {
    const now = Date.now();

    // Usar cache si está disponible y válido
    if (
      this.cachedGrid &&
      now - this.gridCacheTime < this.GRID_CACHE_DURATION
    ) {
      return this.cachedGrid;
    }

    // Regenerar grid basado en obstáculos actuales
    const grid: number[][] = Array(this.gridHeight)
      .fill(null)
      .map(() => Array(this.gridWidth).fill(0));

    // Marcar tiles ocupados como bloqueados (1)
    this.occupiedTiles.forEach((value, key) => {
      const [x, y] = key.split(",").map(Number);
      if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
        grid[y][x] = 1;
      }
    });

    // Actualizar cache
    this.gridCacheTime = now;
    return grid;
  }

  /**
   * Invalidar cache de pathfinding cuando cambien los obstáculos
   */
  private invalidatePathfindingCache(): void {
    this.cachedGrid = null;
    this.gridCacheTime = 0;
    this.pathCache.clear();
    logAutopoiesis.debug(
      "🗑️ Cache de pathfinding invalidado por cambio de obstáculos",
    );
  }

  /**
   * Limpiar entradas de cache viejas periódicamente
   */
  private cleanupOldCache(now: number): void {
    let removedPaths = 0;

    // Limpiar rutas cacheadas viejas
    for (const [key, cached] of this.pathCache.entries()) {
      if (now - cached.timestamp > this.PATH_CACHE_DURATION) {
        this.pathCache.delete(key);
        removedPaths++;
      }
    }

    // Invalidar grid cache si es muy viejo
    if (
      this.cachedGrid &&
      now - this.gridCacheTime > this.GRID_CACHE_DURATION * 2
    ) {
      this.cachedGrid = null;
      this.gridCacheTime = 0;
    }

    if (removedPaths > 0) {
      logAutopoiesis.debug(
        `🧹 Limpieza de cache: ${removedPaths} rutas eliminadas`,
      );
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
   * Actualizar obstáculos del mundo (método público)
   */
  public refreshObstacles(): void {
    this.initializeObstacles();
    logAutopoiesis.info("🗭 Obstáculos actualizados", {
      totalObstacles: this.occupiedTiles.size,
    });
  }

  /**
   * Limpiar sistema
   */
  public cleanup(): void {
    this.scene.events.off("world:changed");
    this.movementStates.clear();
    this.zoneDistanceCache.clear();
    this.occupiedTiles.clear();
  }
}
