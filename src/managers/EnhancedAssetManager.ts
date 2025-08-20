/**
 * Enhanced Asset Manager para "Una Carta Para Isa"
 * Gestiona la carga de todos los assets mejorados: personajes, estructuras, ruinas, y vida animal
 */

import { logAutopoiesis } from "../utils/logger";
import { AssetManager, type AssetDefinition } from "./AssetManager";

/**
 * Enhanced Asset Manager que extiende AssetManager con nuevos assets visuales
 */
export class EnhancedAssetManager extends AssetManager {
  private static readonly ENHANCED_ASSET_DEFINITIONS: AssetDefinition[] = [
    // Personajes mejorados ya incluidos en AssetManager base

    // === ESTRUCTURAS COMPLETAS ===
    {
      key: "house_basic",
      path: "assets/structures/estructuras_completas/House.png",
      type: "image",
      required: false,
    },
    {
      key: "house_hay_1",
      path: "assets/structures/estructuras_completas/House_Hay_1.png",
      type: "image",
      required: false,
    },
    {
      key: "house_hay_2",
      path: "assets/structures/estructuras_completas/House_Hay_2.png",
      type: "image",
      required: false,
    },
    {
      key: "house_hay_3",
      path: "assets/structures/estructuras_completas/House_Hay_3.png",
      type: "image",
      required: false,
    },
    {
      key: "house_hay_purple",
      path: "assets/structures/estructuras_completas/House_Hay_4_Purple.png",
      type: "image",
      required: false,
    },
    {
      key: "well_hay",
      path: "assets/structures/estructuras_completas/Well_Hay_1.png",
      type: "image",
      required: false,
    },
    {
      key: "fences",
      path: "assets/structures/estructuras_completas/Fences.png",
      type: "image",
      required: false,
    },
    {
      key: "city_wall_gate",
      path: "assets/structures/estructuras_completas/CityWall_Gate_1.png",
      type: "image",
      required: false,
    },

    // === RUINAS POR TIPO DE TERRENO ===
    // Ruinas de arena (desierto/playa)
    {
      key: "sand_ruins_1",
      path: "assets/ruins/sand_ruins1.png",
      type: "image",
      required: false,
    },
    {
      key: "sand_ruins_2",
      path: "assets/ruins/sand_ruins2.png",
      type: "image",
      required: false,
    },
    {
      key: "sand_ruins_3",
      path: "assets/ruins/sand_ruins3.png",
      type: "image",
      required: false,
    },
    {
      key: "sand_ruins_4",
      path: "assets/ruins/sand_ruins4.png",
      type: "image",
      required: false,
    },
    {
      key: "sand_ruins_5",
      path: "assets/ruins/sand_ruins5.png",
      type: "image",
      required: false,
    },

    // Ruinas marrones (bosque/pradera)
    {
      key: "brown_ruins_1",
      path: "assets/ruins/brown_ruins1.png",
      type: "image",
      required: false,
    },
    {
      key: "brown_ruins_2",
      path: "assets/ruins/brown_ruins2.png",
      type: "image",
      required: false,
    },
    {
      key: "brown_ruins_3",
      path: "assets/ruins/brown_ruins3.png",
      type: "image",
      required: false,
    },
    {
      key: "brown_ruins_4",
      path: "assets/ruins/brown_ruins4.png",
      type: "image",
      required: false,
    },
    {
      key: "brown_ruins_5",
      path: "assets/ruins/brown_ruins5.png",
      type: "image",
      required: false,
    },

    // Ruinas azul-grises (místicas)
    {
      key: "blue_gray_ruins_1",
      path: "assets/ruins/blue-gray_ruins1.png",
      type: "image",
      required: false,
    },
    {
      key: "blue_gray_ruins_2",
      path: "assets/ruins/blue-gray_ruins2.png",
      type: "image",
      required: false,
    },
    {
      key: "blue_gray_ruins_3",
      path: "assets/ruins/blue-gray_ruins3.png",
      type: "image",
      required: false,
    },
    {
      key: "blue_gray_ruins_4",
      path: "assets/ruins/blue-gray_ruins4.png",
      type: "image",
      required: false,
    },
    {
      key: "blue_gray_ruins_5",
      path: "assets/ruins/blue-gray_ruins5.png",
      type: "image",
      required: false,
    },

    // Ruinas de agua (pantanos)
    {
      key: "water_ruins_1",
      path: "assets/ruins/water_ruins1.png",
      type: "image",
      required: false,
    },
    {
      key: "water_ruins_2",
      path: "assets/ruins/water_ruins2.png",
      type: "image",
      required: false,
    },
    {
      key: "water_ruins_3",
      path: "assets/ruins/water_ruins3.png",
      type: "image",
      required: false,
    },
    {
      key: "water_ruins_4",
      path: "assets/ruins/water_ruins4.png",
      type: "image",
      required: false,
    },
    {
      key: "water_ruins_5",
      path: "assets/ruins/water_ruins5.png",
      type: "image",
      required: false,
    },

    // Ruinas de nieve (montañas)
    {
      key: "snow_ruins_1",
      path: "assets/ruins/snow_ruins1.png",
      type: "image",
      required: false,
    },
    {
      key: "snow_ruins_2",
      path: "assets/ruins/snow_ruins2.png",
      type: "image",
      required: false,
    },
    {
      key: "snow_ruins_3",
      path: "assets/ruins/snow_ruins3.png",
      type: "image",
      required: false,
    },
    {
      key: "snow_ruins_4",
      path: "assets/ruins/snow_ruins4.png",
      type: "image",
      required: false,
    },
    {
      key: "snow_ruins_5",
      path: "assets/ruins/snow_ruins5.png",
      type: "image",
      required: false,
    },

    // Ruinas blancas (clásicas)
    {
      key: "white_ruins_1",
      path: "assets/ruins/white_ruins1.png",
      type: "image",
      required: false,
    },
    {
      key: "white_ruins_2",
      path: "assets/ruins/white_ruins2.png",
      type: "image",
      required: false,
    },
    {
      key: "white_ruins_3",
      path: "assets/ruins/white_ruins3.png",
      type: "image",
      required: false,
    },
    {
      key: "white_ruins_4",
      path: "assets/ruins/white_ruins4.png",
      type: "image",
      required: false,
    },
    {
      key: "white_ruins_5",
      path: "assets/ruins/white_ruins5.png",
      type: "image",
      required: false,
    },

    // === VIDA ANIMAL ===
    // Animales como imágenes estáticas para poblado del mundo
    {
      key: "animal_chicken",
      path: "assets/animated_entities/chicken.png",
      type: "image",
      required: false,
    },
    {
      key: "animal_pig",
      path: "assets/animated_entities/pig.png",
      type: "image",
      required: false,
    },
    {
      key: "animal_boar",
      path: "assets/animated_entities/boar.png",
      type: "image",
      required: false,
    },
    {
      key: "animal_sheep",
      path: "assets/animated_entities/sheep.png",
      type: "image",
      required: false,
    },
    {
      key: "animal_horse",
      path: "assets/animated_entities/horse32x32.png",
      type: "image",
      required: false,
    },
    {
      key: "animal_cow_brown_female",
      path: "assets/animated_entities/female_cow_brown.png",
      type: "image",
      required: false,
    },
    {
      key: "animal_cow_brown_male",
      path: "assets/animated_entities/male_cow_brown.png",
      type: "image",
      required: false,
    },

    // === DECORACIONES Y ELEMENTOS AMBIENTE ===
    {
      key: "decoration_campfire",
      path: "assets/animated_entities/campfire.png",
      type: "image",
      required: false,
    },
    {
      key: "decoration_flowers_red",
      path: "assets/animated_entities/flowers_red.png",
      type: "image",
      required: false,
    },
    {
      key: "decoration_flowers_white",
      path: "assets/animated_entities/flowers_white.png",
      type: "image",
      required: false,
    },
    {
      key: "decoration_flag_checkpoint",
      path: "assets/animated_entities/checkpoint_flag_idle1.png",
      type: "image",
      required: false,
    },
  ];

  /**
   * Obtiene todas las definiciones de assets (base + mejoradas)
   */
  protected static getAllAssetDefinitions(): AssetDefinition[] {
    // Combinar assets base con assets mejorados
    return [
      ...(AssetManager as any).ASSET_DEFINITIONS, // Assets del AssetManager base
      ...EnhancedAssetManager.ENHANCED_ASSET_DEFINITIONS,
    ];
  }

  /**
   * Carga todos los assets mejorados
   */
  public async loadEnhancedAssets(): Promise<void> {
    logAutopoiesis.info("🚀 Cargando assets mejorados...");

    // Usar el sistema de carga del AssetManager base
    const result = await this.loadAllAssets();

    if (result.success) {
      logAutopoiesis.info("✅ Assets mejorados cargados exitosamente", {
        totalLoaded: result.loadedAssets.length,
        failed: result.failedAssets.length,
        fallbacks: result.fallbacksUsed.length,
      });
    } else {
      logAutopoiesis.warn("⚠️ Algunos assets mejorados fallaron en cargar", {
        failed: result.failedAssets,
      });
    }
  }

  /**
   * Obtiene assets por categoría para facilitar su uso
   */
  public getAssetsByCategory(): {
    structures: string[];
    ruins: string[];
    animals: string[];
    decorations: string[];
  } {
    const loadedAssets = this.getLoadingStats();
    const allAssets = EnhancedAssetManager.getAllAssetDefinitions();

    const structures = allAssets
      .filter(
        (asset) =>
          asset.key.startsWith("house_") ||
          asset.key.includes("well") ||
          asset.key.includes("wall") ||
          asset.key.includes("fence"),
      )
      .map((asset) => asset.key);

    const ruins = allAssets
      .filter((asset) => asset.key.includes("ruins"))
      .map((asset) => asset.key);

    const animals = allAssets
      .filter((asset) => asset.key.startsWith("animal_"))
      .map((asset) => asset.key);

    const decorations = allAssets
      .filter((asset) => asset.key.startsWith("decoration_"))
      .map((asset) => asset.key);

    return {
      structures,
      ruins,
      animals,
      decorations,
    };
  }

  /**
   * Obtiene ruinas específicas por tipo de bioma
   */
  public getRuinsByBiome(biomeType: string): string[] {
    const biomeMap: Record<string, string> = {
      grassland: "brown",
      forest: "brown",
      mystical: "blue_gray",
      wetland: "water",
      mountainous: "snow",
      village: "white",
      desert: "sand",
    };

    const ruinPrefix = biomeMap[biomeType] || "brown";
    return this.getAssetsByCategory().ruins.filter((ruin) =>
      ruin.includes(ruinPrefix),
    );
  }

  /**
   * Obtiene estructuras apropiadas para un tipo de bioma
   */
  public getStructuresByBiome(biomeType: string): string[] {
    const { structures } = this.getAssetsByCategory();

    // Todas las estructuras son apropiadas para pueblos
    if (biomeType === "village") {
      return structures;
    }

    // Para otros biomas, solo estructuras básicas
    return structures.filter(
      (structure) =>
        structure.includes("house_basic") ||
        structure.includes("well") ||
        structure.includes("fence"),
    );
  }

  /**
   * Obtiene animales apropiados para un tipo de bioma
   */
  public getAnimalsByBiome(biomeType: string): string[] {
    const { animals } = this.getAssetsByCategory();

    const biomeAnimals: Record<string, string[]> = {
      grassland: ["chicken", "sheep", "pig", "cow"],
      forest: ["boar", "horse", "chicken"],
      mystical: ["horse"], // Solo caballos místicos
      wetland: ["pig", "chicken"],
      mountainous: ["horse", "sheep"],
      village: ["chicken", "pig", "sheep", "cow"],
    };

    const allowedAnimals = biomeAnimals[biomeType] || [];
    return animals.filter((animal) =>
      allowedAnimals.some((allowed) => animal.includes(allowed)),
    );
  }

  /**
   * Valida que todos los assets mejorados estén disponibles
   */
  public async validateEnhancedAssets(): Promise<{
    available: string[];
    missing: string[];
    total: number;
  }> {
    const allAssets = EnhancedAssetManager.ENHANCED_ASSET_DEFINITIONS;
    const available: string[] = [];
    const missing: string[] = [];

    for (const asset of allAssets) {
      if (this.isAssetLoaded(asset.key)) {
        available.push(asset.key);
      } else {
        missing.push(asset.key);
      }
    }

    logAutopoiesis.info("🔍 Validación de assets mejorados completada", {
      available: available.length,
      missing: missing.length,
      total: allAssets.length,
      missingAssets: missing.length > 0 ? missing.slice(0, 5) : [], // Solo mostrar primeros 5
    });

    return {
      available,
      missing,
      total: allAssets.length,
    };
  }

  /**
   * Obtiene estadísticas detalladas de los assets mejorados
   */
  public getEnhancedAssetStats(): {
    byCategory: Record<string, number>;
    byBiome: Record<string, number>;
    loadingSuccess: number;
  } {
    const { structures, ruins, animals, decorations } =
      this.getAssetsByCategory();
    const baseStats = this.getLoadingStats();

    const byCategory = {
      structures: structures.length,
      ruins: ruins.length,
      animals: animals.length,
      decorations: decorations.length,
    };

    const byBiome = {
      grassland:
        this.getRuinsByBiome("grassland").length +
        this.getAnimalsByBiome("grassland").length,
      forest:
        this.getRuinsByBiome("forest").length +
        this.getAnimalsByBiome("forest").length,
      mystical:
        this.getRuinsByBiome("mystical").length +
        this.getAnimalsByBiome("mystical").length,
      wetland:
        this.getRuinsByBiome("wetland").length +
        this.getAnimalsByBiome("wetland").length,
      mountainous:
        this.getRuinsByBiome("mountainous").length +
        this.getAnimalsByBiome("mountainous").length,
      village:
        this.getStructuresByBiome("village").length +
        this.getAnimalsByBiome("village").length,
    };

    return {
      byCategory,
      byBiome,
      loadingSuccess:
        (baseStats.loaded / (baseStats.loaded + baseStats.failed)) * 100,
    };
  }
}
