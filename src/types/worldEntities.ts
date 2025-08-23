/**
 * Tipos para entidades del mundo
 */

export interface WorldEntity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  assetKey?: string;
  scale?: number;
  rotation?: number;
  depth?: number;
  metadata?: Record<string, string | number | boolean>;
}

export type EntityType =
  | "campfire"
  | "woman"
  | "man"
  | "woman_walk"
  | "man_walk"
  | "store"
  | "food_store"
  | "structure"
  | "house"
  | "building"
  | "tree"
  | "oak"
  | "pine"
  | "vegetation"
  | "bush"
  | "shrub"
  | "ruin"
  | "wildlife"
  | "special"
  | "decoration"
  | "flower_meadows"
  | "campfire_sites"
  | "ancient_groves"
  | "mystical_circles"
  | "sacred_springs"
  | "crystal_formations"
  | "ruins_ancient";
