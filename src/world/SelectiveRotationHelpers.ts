/**
 * Sistema de Rotación Selectiva
 * Aplica rotaciones solo a tipos de assets apropiados
 */

// Feature flags para control granular
export interface RotationFlags {
  SELECTIVE_ROTATION: boolean;
  SAFE_OFFSETS: boolean;
  ASSET_GUARDS: boolean;
  HUD_RECOVERY: boolean;
}

export const ROTATION_FEATURE_FLAGS: RotationFlags = {
  SELECTIVE_ROTATION: true,
  SAFE_OFFSETS: true,
  ASSET_GUARDS: true,
  HUD_RECOVERY: true,
};

// Tipos que NO deben rotar NUNCA
const NON_ROTATABLE_TYPES = [
  "structure",
  "building",
  "house",
  "door",
  "sign",
  "ui",
  "text",
  "banner",
  "flag",
  "post",
  "lamp",
  "well",
  "gate",
  "fence",
  "wall",
  "tower",
  "barn",
];

// Palabras clave que indican assets no-rotables
const NON_ROTATABLE_KEYWORDS = [
  "house",
  "well",
  "sign",
  "door",
  "lamp",
  "post",
  "banner",
  "gate",
  "fence",
  "wall",
  "tower",
  "barn",
  "ruins", // Ruinas también deben mantener orientación
  "structure",
];

// Tipos que SÍ pueden rotar libremente
const ROTATABLE_TYPES = [
  "terrain",
  "vegetation",
  "foliage",
  "tree", // Solo algunos árboles
  "rock",
  "debris",
  "mushroom",
  "grass",
  "flowers",
  "decoration", // Decoraciones menores
];

/**
 * Determina si un asset puede rotar basado en su tipo y clave
 */
export function canAssetRotate(assetType: string, assetKey: string): boolean {
  if (!ROTATION_FEATURE_FLAGS.SELECTIVE_ROTATION) {
    // Si el flag está desactivado, usar comportamiento original
    return true;
  }

  // Verificar tipo exacto
  if (NON_ROTATABLE_TYPES.includes(assetType.toLowerCase())) {
    return false;
  }

  // Verificar palabras clave en la key del asset
  const keyLower = assetKey.toLowerCase();
  if (NON_ROTATABLE_KEYWORDS.some((keyword) => keyLower.includes(keyword))) {
    return false;
  }

  // Verificar si es explícitamente rotable
  if (ROTATABLE_TYPES.includes(assetType.toLowerCase())) {
    return true;
  }

  // Por defecto, ser conservador: NO rotar
  return false;
}

/**
 * Obtiene rotación selectiva para un asset
 */
export function getSelectiveRotation(
  assetType: string,
  assetKey: string,
): number {
  if (!canAssetRotate(assetType, assetKey)) {
    return 0; // Sin rotación
  }

  // Rotación según tipo
  switch (assetType.toLowerCase()) {
    case "terrain":
      // Terreno puede rotar en increments de 90°
      return [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2][
        Math.floor(Math.random() * 4)
      ];

    case "rock":
    case "debris":
    case "mushroom":
      // Elementos naturales pueden rotar libremente
      return Math.random() * Math.PI * 2;

    case "vegetation":
    case "foliage":
    case "tree":
      // Vegetación con rotación más sutil
      if (assetKey.includes("tree_idol") || assetKey.includes("sacred")) {
        return 0; // Árboles sagrados/totems no rotan
      }
      return Math.random() * Math.PI * 2;

    case "decoration":
      // Decoraciones menores pueden rotar
      return Math.random() * Math.PI * 2;

    default:
      return 0; // Por defecto no rotar
  }
}

/**
 * Obtiene offset orgánico acotado según tipo
 */
export function getOrganicOffset(
  tileSize: number,
  assetType: string,
  assetKey: string,
): { x: number; y: number } {
  if (!ROTATION_FEATURE_FLAGS.SAFE_OFFSETS) {
    // Comportamiento original si flag desactivado
    return {
      x: (Math.random() - 0.5) * tileSize * 0.8,
      y: (Math.random() - 0.5) * tileSize * 0.8,
    };
  }

  // Sin offset para tipos estructurales
  if (!canAssetRotate(assetType, assetKey)) {
    return { x: 0, y: 0 }; // Snap perfecto a grid
  }

  // Offset reducido para elementos orgánicos
  const maxOffset = tileSize * 0.2; // Máximo 20% del tile

  switch (assetType.toLowerCase()) {
    case "terrain":
      // Terreno con offset mínimo para naturalidad
      return {
        x: (Math.random() - 0.5) * tileSize * 0.1, // ±5%
        y: (Math.random() - 0.5) * tileSize * 0.1,
      };

    case "vegetation":
    case "foliage":
    case "tree":
      // Vegetación con offset moderado
      return {
        x: (Math.random() - 0.5) * maxOffset,
        y: (Math.random() - 0.5) * maxOffset,
      };

    case "rock":
    case "debris":
    case "decoration":
      // Elementos menores con offset completo
      return {
        x: (Math.random() - 0.5) * maxOffset,
        y: (Math.random() - 0.5) * maxOffset,
      };

    default:
      return { x: 0, y: 0 };
  }
}

/**
 * Verifica si un asset existe antes de crear sprite
 */
export function assetExistsOrFallback(
  scene: Phaser.Scene,
  assetKey: string,
  assetType: string,
): string | null {
  if (!ROTATION_FEATURE_FLAGS.ASSET_GUARDS) {
    return assetKey; // Sin verificación si flag desactivado
  }

  // Verificar si existe
  if (scene.textures.exists(assetKey)) {
    return assetKey;
  }

  // Buscar fallback apropiado
  const fallbacks = getFallbackAssetKey(assetType);

  for (const fallback of fallbacks) {
    if (scene.textures.exists(fallback)) {
      return fallback;
    }
  }

  // Si no hay fallbacks disponibles, devolver null (no crear sprite)
  console.warn(
    `⚠️ No se encontró asset ni fallback para: ${assetKey} (${assetType})`,
  );
  return null;
}

/**
 * Obtiene claves de fallback por tipo
 */
function getFallbackAssetKey(assetType: string): string[] {
  const fallbacks: Record<string, string[]> = {
    terrain: ["terrain-grass", "cesped1", "grass_middle"],
    tree: ["oak_tree1", "tree_emerald_1"],
    rock: ["rock1_1", "rock_brown_1"],
    water: ["water_middle"],
    structure: ["house", "fallback_house"],
    prop: ["chest", "barrel_small_empty"],
    decoration: ["bush_emerald_1"],
    mushroom: ["beige_green_mushroom1"],
    ruin: ["blue-gray_ruins1"],
    foliage: ["bush_emerald_1"],
    vegetation: ["bush_emerald_1", "oak_tree1"],
  };

  return fallbacks[assetType.toLowerCase()] || ["terrain-grass"];
}

/**
 * Configura elementos HUD/UI para máxima visibilidad
 */
export function configureHUDVisibility(
  sprite: Phaser.GameObjects.Sprite,
  isHUD: boolean = false,
): void {
  if (!ROTATION_FEATURE_FLAGS.HUD_RECOVERY || !isHUD) {
    return;
  }

  // Configuración para máxima visibilidad de elementos HUD
  sprite.setScrollFactor(0); // No se mueve con cámara
  sprite.setDepth(1000); // Por encima de todo
  sprite.setAlpha(1); // Completamente opaco

  // Añadir overlay de contraste si es necesario
  if (sprite.scene && sprite.scene.add) {
    const bg = sprite.scene.add.circle(sprite.x, sprite.y, 24, 0x000000, 0.3);
    bg.setScrollFactor(0);
    bg.setDepth(999);
  }
}

/**
 * Métricas para auditoría
 */
export interface RotationMetrics {
  totalAssets: number;
  rotatedAssets: number;
  nonRotatableRotated: number;
  misalignedAssets: number;
  missingAssets: number;
}

export function calculateRotationMetrics(assets: any[]): RotationMetrics {
  const metrics: RotationMetrics = {
    totalAssets: assets.length,
    rotatedAssets: 0,
    nonRotatableRotated: 0,
    misalignedAssets: 0,
    missingAssets: 0,
  };

  for (const asset of assets) {
    // Contar rotaciones
    if (Math.abs(asset.rotation) > 0.01) {
      // Threshold para floating point
      metrics.rotatedAssets++;

      // Verificar si no debería rotar
      if (!canAssetRotate(asset.type || "", asset.key || "")) {
        metrics.nonRotatableRotated++;
      }
    }

    // Contar desalineaciones (offsets excesivos)
    if (
      asset.offset &&
      (Math.abs(asset.offset.x) > 10 || Math.abs(asset.offset.y) > 10)
    ) {
      metrics.misalignedAssets++;
    }
  }

  return metrics;
}

/**
 * Validar configuración de flags
 */
export function validateFeatureFlags(): boolean {
  const flags = ROTATION_FEATURE_FLAGS;

  // Advertir sobre combinaciones problemáticas
  if (flags.SELECTIVE_ROTATION && !flags.ASSET_GUARDS) {
    console.warn(
      "⚠️ SELECTIVE_ROTATION activado sin ASSET_GUARDS puede causar sprites faltantes",
    );
  }

  if (flags.SAFE_OFFSETS && !flags.SELECTIVE_ROTATION) {
    console.warn("⚠️ SAFE_OFFSETS recomendado junto con SELECTIVE_ROTATION");
  }

  return true;
}

// Validar flags al cargar el módulo
validateFeatureFlags();
