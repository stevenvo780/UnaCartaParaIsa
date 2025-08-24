/**
 * Asset Loader creativo que carga dinámicamente assets para crear mundos diversos
 */

import type Phaser from "phaser";
import { logAutopoiesis } from "../utils/logger";

export interface AssetInfo {
  key: string;
  path: string;
  type:
    | "terrain"
    | "water"
    | "road"
    | "autotile"
    | "decoration"
    | "tree"
    | "rock"
    | "structure"
    | "prop"
    | "mushroom"
    | "ruin"
    | "foliage";
  biome?: string;
  variant?: number;
  rarity?: "common" | "uncommon" | "rare" | "epic";
  unlockLevel?: number;
}

/**
 * Cargador creativo de assets que organiza y carga recursos dinámicamente
 */
export class CreativeAssetLoader {
  private scene: Phaser.Scene;
  private loadedAssets = new Map<string, AssetInfo>();
  private assetsByType = new Map<string, AssetInfo[]>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeAssetCategories();
  }

  /**
   * Inicializa las categorías de assets disponibles
   */
  private initializeAssetCategories(): void {
    this.assetsByType.set("terrain", []);
    this.assetsByType.set("water", []);
    this.assetsByType.set("roads", []);
    this.assetsByType.set("autotiles", []);
    this.assetsByType.set("decorations", []);
    this.assetsByType.set("trees", []);
    this.assetsByType.set("rocks", []);
    this.assetsByType.set("structures", []);
    this.assetsByType.set("props", []);
    this.assetsByType.set("mushrooms", []);
    this.assetsByType.set("ruins", []);
    this.assetsByType.set("foliage", []);
  }

  /**
   * Carga creativamente todos los assets de terrain organizados
   */
  async loadTerrainAssets(): Promise<AssetInfo[]> {
    const terrainAssets: AssetInfo[] = [];

    // Cargar todas las variaciones de césped (31 disponibles)
    for (let i = 1; i <= 31; i++) {
      const assetInfo: AssetInfo = {
        key: `cesped${i}`,
        path: `assets/terrain/base/cesped${i}.png`,
        type: "terrain",
        biome: "grassland",
        variant: i,
      };
      terrainAssets.push(assetInfo);
      this.loadedAssets.set(assetInfo.key, assetInfo);
    }

    // Cargar assets base especiales
    const baseAssets = [
      {
        key: "grass_middle",
        path: "assets/terrain/base/Grass_Middle.png",
        biome: "grassland",
      },
      {
        key: "textured_grass",
        path: "assets/terrain/base/TexturedGrass.png",
        biome: "grassland",
      },
    ];

    for (const asset of baseAssets) {
      const assetInfo: AssetInfo = {
        key: asset.key,
        path: asset.path,
        type: "terrain",
        biome: asset.biome,
      };
      terrainAssets.push(assetInfo);
      this.loadedAssets.set(assetInfo.key, assetInfo);
    }

    this.assetsByType.set("terrain", terrainAssets);
    return terrainAssets;
  }

  /**
   * Carga creativamente todos los assets de agua organizados
   */
  async loadWaterAssets(): Promise<AssetInfo[]> {
    const waterAssets: AssetInfo[] = [];

    // Cargar tile base de agua
    const waterBase: AssetInfo = {
      key: "water_middle",
      path: "assets/water/Water_Middle.png",
      type: "water",
      biome: "wetland",
    };
    waterAssets.push(waterBase);
    this.loadedAssets.set(waterBase.key, waterBase);

    // Cargar tiles organizados de agua (patrón tile_XX_YY)
    const waterTilePatterns = [
      "00_02",
      "00_03",
      "00_04",
      "00_05",
      "00_06",
      "00_07",
      "00_08",
      "00_09",
      "00_10",
      "00_11",
      "01_00",
      "01_01",
      "01_02",
      "01_03",
      "01_04",
      "01_05",
      "01_06",
      "01_07",
      "01_08",
      "01_09",
      "01_10",
      "01_11",
      "02_00",
      "02_01",
      "02_02",
      "02_03",
      "02_04",
      "02_05",
      "02_06",
      "02_07",
      "02_08",
      "02_09",
      "02_10",
      "02_11",
      "03_00",
      "03_01",
      "03_02",
      "03_03",
      "03_04",
      "03_05",
      "03_06",
      "03_07",
      "03_08",
      "03_09",
      "03_10",
      "03_11",
      "04_00",
      "04_01",
      "04_02",
      "04_03",
      "04_04",
      "04_05",
      "04_06",
      "04_07",
      "04_08",
      "04_09",
      "04_10",
      "04_11",
      "05_00",
      "05_01",
      "05_02",
      "05_03",
      "05_04",
      "05_05",
      "05_06",
      "05_07",
      "05_08",
      "05_09",
      "05_10",
      "05_11",
      "09_00",
      "09_01",
      "09_02",
      "09_03",
      "09_04",
      "09_05",
      "09_06",
      "09_07",
      "09_08",
      "09_09",
      "09_10",
      "09_11",
    ];

    for (const pattern of waterTilePatterns) {
      const assetInfo: AssetInfo = {
        key: `water_tile_${pattern}`,
        path: `assets/water/tile_${pattern}.png`,
        type: "water",
        biome: "wetland",
        variant: parseInt(pattern.replace("_", ""), 10),
      };
      waterAssets.push(assetInfo);
      this.loadedAssets.set(assetInfo.key, assetInfo);
    }

    // Cargar tiles especiales
    const specialWater = [
      { key: "water_0198", path: "assets/water/tile_0198.png" },
      { key: "water_0230", path: "assets/water/tile_0230.png" },
    ];

    for (const special of specialWater) {
      const assetInfo: AssetInfo = {
        key: special.key,
        path: special.path,
        type: "water",
        biome: "wetland",
      };
      waterAssets.push(assetInfo);
      this.loadedAssets.set(assetInfo.key, assetInfo);
    }

    this.assetsByType.set("water", waterAssets);
    return waterAssets;
  }

  /**
   * Carga creativamente todos los assets de roads organizados
   */
  async loadRoadAssets(): Promise<AssetInfo[]> {
    const roadAssets: AssetInfo[] = [];

    const roadTypes = [
      {
        key: "road_cross",
        path: "assets/roads/road_path_cross.png",
        type: "intersection",
      },
      {
        key: "road_curve_ne",
        path: "assets/roads/road_path_curve_ne.png",
        type: "curve",
      },
      {
        key: "road_curve_nw",
        path: "assets/roads/road_path_curve_nw.png",
        type: "curve",
      },
      {
        key: "road_curve_se",
        path: "assets/roads/road_path_curve_se.png",
        type: "curve",
      },
      {
        key: "road_curve_sw",
        path: "assets/roads/road_path_curve_sw.png",
        type: "curve",
      },
      {
        key: "road_end_e",
        path: "assets/roads/road_path_end_e.png",
        type: "end",
      },
      {
        key: "road_end_n",
        path: "assets/roads/road_path_end_n.png",
        type: "end",
      },
      {
        key: "road_end_s",
        path: "assets/roads/road_path_end_s.png",
        type: "end",
      },
      {
        key: "road_end_w",
        path: "assets/roads/road_path_end_w.png",
        type: "end",
      },
      {
        key: "road_straight_h",
        path: "assets/roads/road_path_straight_h.png",
        type: "straight",
      },
      {
        key: "road_straight_v",
        path: "assets/roads/road_path_straight_v.png",
        type: "straight",
      },
      {
        key: "road_t",
        path: "assets/roads/road_path_t.png",
        type: "t_junction",
      },
      {
        key: "road_t_e",
        path: "assets/roads/road_path_t_e.png",
        type: "t_junction",
      },
      {
        key: "road_t_s",
        path: "assets/roads/road_path_t_s.png",
        type: "t_junction",
      },
      {
        key: "road_t_w",
        path: "assets/roads/road_path_t_w.png",
        type: "t_junction",
      },
    ];

    for (const road of roadTypes) {
      const assetInfo: AssetInfo = {
        key: road.key,
        path: road.path,
        type: "road",
        biome: "village",
      };
      roadAssets.push(assetInfo);
      this.loadedAssets.set(assetInfo.key, assetInfo);
    }

    this.assetsByType.set("roads", roadAssets);
    return roadAssets;
  }

  /**
   * Carga creativamente todos los autotiles para transiciones
   */
  async loadAutotileAssets(): Promise<AssetInfo[]> {
    const autotileAssets: AssetInfo[] = [];

    const autotileTypes = [
      // Grass edges
      {
        key: "grass_edge_n",
        path: "assets/terrain/autotiles/grass_edge_n.png",
        from: "grassland",
        to: "other",
      },
      {
        key: "grass_edge_s",
        path: "assets/terrain/autotiles/grass_edge_s.png",
        from: "grassland",
        to: "other",
      },
      {
        key: "grass_edge_e",
        path: "assets/terrain/autotiles/grass_edge_e.png",
        from: "grassland",
        to: "other",
      },
      {
        key: "grass_edge_w",
        path: "assets/terrain/autotiles/grass_edge_w.png",
        from: "grassland",
        to: "other",
      },

      // Water edges
      {
        key: "water_edge_n",
        path: "assets/terrain/autotiles/water_edge_n.png",
        from: "wetland",
        to: "other",
      },
      {
        key: "water_edge_s",
        path: "assets/terrain/autotiles/water_edge_s.png",
        from: "wetland",
        to: "other",
      },
      {
        key: "water_edge_e",
        path: "assets/terrain/autotiles/water_edge_e.png",
        from: "wetland",
        to: "other",
      },
      {
        key: "water_edge_w",
        path: "assets/terrain/autotiles/water_edge_w.png",
        from: "wetland",
        to: "other",
      },

      // Water corners
      {
        key: "water_corner_ne",
        path: "assets/terrain/autotiles/water_corner_ne.png",
        from: "wetland",
        to: "other",
      },
      {
        key: "water_corner_nw",
        path: "assets/terrain/autotiles/water_corner_nw.png",
        from: "wetland",
        to: "other",
      },
      {
        key: "water_corner_se",
        path: "assets/terrain/autotiles/water_corner_se.png",
        from: "wetland",
        to: "other",
      },
      {
        key: "water_corner_sw",
        path: "assets/terrain/autotiles/water_corner_sw.png",
        from: "wetland",
        to: "other",
      },
    ];

    for (const autotile of autotileTypes) {
      const assetInfo: AssetInfo = {
        key: autotile.key,
        path: autotile.path,
        type: "autotile",
        biome: autotile.from,
      };
      autotileAssets.push(assetInfo);
      this.loadedAssets.set(assetInfo.key, assetInfo);
    }

    this.assetsByType.set("autotiles", autotileAssets);
    return autotileAssets;
  }

  /**
   * Carga todos los assets de forma asíncrona
   */
  async loadAllAssets(): Promise<void> {
    logAutopoiesis.info("🎨 Cargando assets creativamente...");

    try {
      // Cargar en paralelo para mejor performance
      await Promise.all([
        this.loadTerrainAssets(),
        this.loadWaterAssets(),
        this.loadRoadAssets(),
        this.loadAutotileAssets(),
        this.loadTreeAssets(),
        this.loadRockAssets(),
        this.loadStructureAssets(),
        this.loadPropAssets(),
        this.loadMushroomAssets(),
        this.loadRuinAssets(),
        this.loadFoliageAssets(),
      ]);

      // Verificar que se cargaron assets
      const totalAssets = this.loadedAssets.size;
      if (totalAssets === 0) {
        logAutopoiesis.warn("⚠️ No se cargaron assets, usando fallbacks");
        this.createFallbackAssets();
      }

      // Cargar en Phaser
      await this.loadAssetsInPhaser();

      logAutopoiesis.info(
        `✅ Cargados ${this.loadedAssets.size} assets únicos organizados en categorías`,
      );
    } catch (error) {
      logAutopoiesis.error("Error cargando assets", String(error));
      this.createFallbackAssets();
    }
  }

  /**
   * Carga los assets en el cache de Phaser
   */
  private async loadAssetsInPhaser(): Promise<void> {
    return new Promise((resolve) => {
      let loadedCount = 0;
      const totalAssets = this.loadedAssets.size;

      logAutopoiesis.debug(
        `🎯 loadAssetsInPhaser: Found ${totalAssets} assets to load`,
      );
      logAutopoiesis.debug(
        "🎯 Assets to load:",
        Array.from(this.loadedAssets.keys()).slice(0, 10),
      );

      if (totalAssets === 0) {
        logAutopoiesis.warn("⚠️ No assets found to load, using fallbacks");
        logAutopoiesis.debug(
          "🎯 loadAssetsInPhaser: No assets, resolving immediately",
        );
        resolve();
        return;
      }

      this.scene.load.on("filecomplete", (key: string) => {
        loadedCount++;
        logAutopoiesis.debug(`✅ Loaded ${loadedCount}/${totalAssets}: ${key}`);
        if (loadedCount >= totalAssets) {
          logAutopoiesis.debug("🎉 All assets loaded successfully!");
          clearTimeout(timeoutId);
          resolve();
        }
      });

      this.scene.load.on("loaderror", (file: { key: string }) => {
        logAutopoiesis.warn(`Failed to load asset: ${file.key}`);
        logAutopoiesis.debug(
          `❌ Error loading ${loadedCount + 1}/${totalAssets}: ${file.key}`,
        );
        loadedCount++;
        if (loadedCount >= totalAssets) {
          logAutopoiesis.debug("🎯 Asset loading completed (with some errors)");
          clearTimeout(timeoutId);
          resolve();
        }
      });

      // Add timeout to prevent infinite hanging
      const timeoutId = setTimeout(() => {
        logAutopoiesis.warn(
          `⏰ Asset loading timeout after 30s. Loaded ${loadedCount}/${totalAssets}`,
        );
        resolve();
      }, 30000);

      // Load assets in Phaser
      for (const asset of this.loadedAssets.values()) {
        this.scene.load.image(asset.key, asset.path);
      }

      this.scene.load.start();

      // Original code commented out to prevent hanging:
      // if (totalAssets === 0) {
      //   logAutopoiesis.warn("⚠️ No assets found to load, skipping Phaser loading");
      //   logAutopoiesis.debug("🎯 loadAssetsInPhaser: No assets, resolving immediately");
      //   resolve();
      //   return;
      // }
      // this.scene.load.on("filecomplete", () => {
      //   loadedCount++;
      //   if (loadedCount >= totalAssets) {
      //     resolve();
      //   }
      // });
      // for (const asset of this.loadedAssets.values()) {
      //   this.scene.load.image(asset.key, asset.path);
      // }
      // this.scene.load.start();
    });
  }

  /**
   * Obtiene assets por bioma de forma creativa
   */
  getAssetsByBiome(biome: string): AssetInfo[] {
    const assets: AssetInfo[] = [];

    for (const asset of this.loadedAssets.values()) {
      if (asset.biome === biome) {
        assets.push(asset);
      }
    }

    return assets;
  }

  /**
   * Obtiene asset aleatorio de un tipo/bioma específico
   */
  getRandomAsset(type: string, biome?: string): AssetInfo | null {
    const typeAssets = this.assetsByType.get(type) || [];
    const filteredAssets = biome
      ? typeAssets.filter((a) => a.biome === biome)
      : typeAssets;

    if (filteredAssets.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * filteredAssets.length);
    return filteredAssets[randomIndex];
  }

  /**
   * Obtiene variación específica de césped
   */
  getGrassVariant(variant: number): AssetInfo | null {
    return this.loadedAssets.get(`cesped${variant}`) || null;
  }

  /**
   * Obtiene tile de agua específico
   */
  getWaterTile(row: number, col: number): AssetInfo | null {
    const key = `water_tile_${row.toString().padStart(2, "0")}_${col.toString().padStart(2, "0")}`;
    return this.loadedAssets.get(key) || null;
  }

  /**
   * Obtiene autotile apropiado para transición
   */
  getAutotileForTransition(
    fromBiome: string,
    direction: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw",
  ): AssetInfo | null {
    const key = `${fromBiome}_${direction.includes("corner") ? "corner" : "edge"}_${direction}`;
    return this.loadedAssets.get(key) || null;
  }

  /**
   * Genera tileset diverso y creativo
   */
  generateCreativeTileset(biomes: string[]): AssetInfo[] {
    const tileset: AssetInfo[] = [];

    for (const biome of biomes) {
      const biomeAssets = this.getAssetsByBiome(biome);

      // Añadir variedad seleccionando múltiples assets por bioma
      const selectedAssets = this.selectDiverseAssets(biomeAssets, 5); // 5 variantes por bioma
      tileset.push(...selectedAssets);
    }

    return tileset;
  }

  /**
   * Selecciona assets diversos para crear variación
   */
  private selectDiverseAssets(assets: AssetInfo[], count: number): AssetInfo[] {
    if (assets.length <= count) return assets;

    const selected: AssetInfo[] = [];
    const step = Math.floor(assets.length / count);

    for (let i = 0; i < count; i++) {
      const index = (i * step) % assets.length;
      selected.push(assets[index]);
    }

    return selected;
  }

  /**
   * Carga creativamente todos los assets de árboles
   */
  async loadTreeAssets(): Promise<AssetInfo[]> {
    const treeAssets: AssetInfo[] = [];

    const treeDefinitions = [
      // Árboles mágicos
      {
        name: "blue-green_balls_tree",
        count: 3,
        biome: "magical",
        rarity: "uncommon",
      },
      { name: "curved_tree", count: 3, biome: "mystical", rarity: "rare" },
      { name: "light_balls_tree", count: 3, biome: "luminous", rarity: "epic" },
      { name: "luminous_tree", count: 4, biome: "luminous", rarity: "epic" },
      { name: "mega_tree", count: 2, biome: "ancient", rarity: "rare" },
      { name: "swirling_tree", count: 3, biome: "mystical", rarity: "rare" },
      { name: "white_tree", count: 2, biome: "ethereal", rarity: "uncommon" },

      // Árboles naturales
      { name: "tree_emerald", count: 4, biome: "forest", rarity: "common" },
      { name: "willow", count: 3, biome: "wetland", rarity: "common" },
      { name: "oak_tree", count: 1, biome: "forest", rarity: "common" },

      // Árboles tótem
      { name: "tree_idol_deer", count: 1, biome: "sacred", rarity: "epic" },
      { name: "tree_idol_dragon", count: 1, biome: "sacred", rarity: "epic" },
      { name: "tree_idol_human", count: 1, biome: "sacred", rarity: "epic" },
      { name: "tree_idol_wolf", count: 1, biome: "sacred", rarity: "epic" },
    ];

    for (const treeDef of treeDefinitions) {
      for (let i = 1; i <= treeDef.count; i++) {
        // Some assets use underscores, others don't - handle both patterns
        let assetPath: string;
        if (treeDef.name.includes("tree_emerald")) {
          assetPath = `assets/foliage/trees/${treeDef.name}_${i}.png`;
        } else if (treeDef.name.includes("tree_idol")) {
          assetPath = `assets/foliage/trees/${treeDef.name}.png`;
        } else if (treeDef.name === "oak_tree") {
          assetPath = "assets/foliage/trees/oak_tree.png";
        } else if (treeDef.name === "tree_willow") {
          assetPath = `assets/foliage/trees/willow${i}.png`; // Corregir path para willows
        } else if (treeDef.name === "tree_white") {
          assetPath = `assets/foliage/trees/white_tree${i}.png`; // Corregir path para white trees
        } else {
          assetPath = `assets/foliage/trees/${treeDef.name}${i}.png`;
        }

        const assetInfo: AssetInfo = {
          key: `${treeDef.name}${i}`,
          path: assetPath,
          type: "tree",
          biome: treeDef.biome,
          variant: i,
          rarity: treeDef.rarity as any,
        };
        treeAssets.push(assetInfo);
        this.loadedAssets.set(assetInfo.key, assetInfo);
      }
    }

    this.assetsByType.set("trees", treeAssets);
    return treeAssets;
  }

  /**
   * Carga creativamente todos los assets de rocas
   */
  async loadRockAssets(): Promise<AssetInfo[]> {
    const rockAssets: AssetInfo[] = [];

    // Rocas con diferentes sombras y estilos
    for (let rockType = 1; rockType <= 8; rockType++) {
      for (let variant = 1; variant <= 5; variant++) {
        // Rocas normales
        const rockInfo: AssetInfo = {
          key: `rock${rockType}_${variant}`,
          path: `assets/rocks/rock${rockType}_${variant}.png`,
          type: "rock",
          biome: "mountain",
          variant,
          rarity: "common",
        };
        rockAssets.push(rockInfo);
        this.loadedAssets.set(rockInfo.key, rockInfo);

        // Rocas sin sombra
        const rockNoShadow: AssetInfo = {
          key: `rock${rockType}_${variant}_no_shadow`,
          path: `assets/rocks/rock${rockType}_${variant}_no_shadow.png`,
          type: "rock",
          biome: "mountain",
          variant,
          rarity: "common",
        };
        rockAssets.push(rockNoShadow);
        this.loadedAssets.set(rockNoShadow.key, rockNoShadow);
      }
    }

    // Rocas especiales
    const specialRocks = [
      { name: "rock_brown_1", biome: "desert" },
      { name: "rock_brown_2", biome: "desert" },
      { name: "rock_brown_4", biome: "desert" },
      { name: "rock_brown_6", biome: "desert" },
      { name: "rock_brown_9", biome: "desert" },
    ];

    for (const rock of specialRocks) {
      const assetInfo: AssetInfo = {
        key: rock.name,
        path: `assets/rocks/${rock.name}.png`,
        type: "rock",
        biome: rock.biome,
        rarity: "uncommon",
      };
      rockAssets.push(assetInfo);
      this.loadedAssets.set(assetInfo.key, assetInfo);
    }

    this.assetsByType.set("rocks", rockAssets);
    return rockAssets;
  }

  /**
   * Carga creativamente todos los assets de estructuras
   */
  async loadStructureAssets(): Promise<AssetInfo[]> {
    const structureAssets: AssetInfo[] = [];

    const structures = [
      // Casas y edificios (ahora compatibles con biomas generados)
      {
        key: "house",
        path: "assets/structures/estructuras_completas/House.png",
        biome: "grassland", // Cambio: de "village" a "grassland"
        rarity: "uncommon",
      },
      {
        key: "house_hay_1",
        path: "assets/structures/estructuras_completas/House_Hay_1.png",
        biome: "grassland", // Cambio: aparecen en praderas
        rarity: "common",
      },
      {
        key: "house_hay_2",
        path: "assets/structures/estructuras_completas/House_Hay_2.png",
        biome: "forest", // Cambio: casas en bosques también
        rarity: "common",
      },
      {
        key: "house_hay_3",
        path: "assets/structures/estructuras_completas/House_Hay_3.png",
        biome: "grassland",
        rarity: "common",
      },
      {
        key: "house_hay_4_purple",
        path: "assets/structures/estructuras_completas/House_Hay_4_Purple.png",
        biome: "mystical", // Cambio: la casa púrpura va en biomas místicos
        rarity: "rare",
      },

      // Otras estructuras (compatibles con biomas generados)
      {
        key: "well_hay_1",
        path: "assets/structures/estructuras_completas/Well_Hay_1.png",
        biome: "grassland", // Cambio: pozos en praderas
        rarity: "uncommon",
      },
      {
        key: "city_wall_gate_1",
        path: "assets/structures/estructuras_completas/CityWall_Gate_1.png",
        biome: "mountainous", // Cambio: muros en montañas
        rarity: "rare",
      },
      {
        key: "fences",
        path: "assets/structures/estructuras_completas/Fences.png",
        biome: "forest", // Cambio: cercas en bosques
        rarity: "common",
      },
    ];

    // Assets numerados (distribución variada por biomas)
    const biomes = [
      "grassland",
      "forest",
      "mystical",
      "wetland",
      "mountainous",
    ];
    for (let i = 1; i <= 11; i++) {
      const assetInfo: AssetInfo = {
        key: `structure_${i.toString().padStart(3, "0")}`,
        path: `assets/structures/estructuras_completas/Assets_source_002_${i.toString().padStart(3, "0")}.png`,
        type: "structure",
        biome: biomes[(i - 1) % biomes.length], // Rotar entre todos los biomas
        variant: i,
        rarity: "common",
      };
      structureAssets.push(assetInfo);
      this.loadedAssets.set(assetInfo.key, assetInfo);
    }

    for (const structure of structures) {
      const assetInfo: AssetInfo = {
        key: structure.key,
        path: structure.path,
        type: "structure",
        biome: structure.biome,
        rarity: structure.rarity as any,
      };
      structureAssets.push(assetInfo);
      this.loadedAssets.set(assetInfo.key, assetInfo);
    }

    this.assetsByType.set("structures", structureAssets);
    return structureAssets;
  }

  /**
   * Carga creativamente todos los assets de props
   */
  async loadPropAssets(): Promise<AssetInfo[]> {
    const propAssets: AssetInfo[] = [];

    const propCategories = [
      // Sillas (existen muchas variaciones)
      { prefix: "sillas", count: 6, biome: "village" },
      { prefix: "sillas_de_calle", count: 4, biome: "city" },

      // Ventanas
      { prefix: "ventana", count: 13, biome: "city" },

      // Iluminación
      { prefix: "lamparas", count: 3, biome: "city" },
      { prefix: "poste", count: 4, biome: "city" },

      // Basura y objetos urbanos
      { prefix: "basuras", count: 4, biome: "city" },
      { prefix: "basuras_calle", count: 6, biome: "city" },
      { prefix: "botellas", count: 3, biome: "city" },
      { prefix: "cajas", count: 3, biome: "village" },

      // Decoraciones
      { prefix: "sombrilla", count: 3, biome: "village" },
      { prefix: "ropas_tendidas", count: 3, biome: "village" },
    ];

    for (const category of propCategories) {
      for (let i = 1; i <= category.count; i++) {
        const assetInfo: AssetInfo = {
          key: `${category.prefix}${i}`,
          path: `assets/props/${category.prefix}${i}.png`,
          type: "prop",
          biome: category.biome,
          variant: i,
          rarity: "common",
        };
        propAssets.push(assetInfo);
        this.loadedAssets.set(assetInfo.key, assetInfo);
      }
    }

    // Props especiales expandidos con biomas compatibles
    const specialProps = [
      // Props básicos
      {
        key: "barrel_small_empty",
        path: "assets/props/Barrel_Small_Empty.png",
        biome: "grassland",
      },
      {
        key: "basket_empty",
        path: "assets/props/Basket_Empty.png",
        biome: "grassland",
      },
      { key: "bench_1", path: "assets/props/Bench_1.png", biome: "grassland" },
      { key: "bench_3", path: "assets/props/Bench_3.png", biome: "forest" },
      { key: "chest", path: "assets/props/Chest.png", biome: "grassland" },
      {
        key: "fireplace_1",
        path: "assets/props/Fireplace_1.png",
        biome: "mystical",
      },
      {
        key: "lamp_post_3",
        path: "assets/props/LampPost_3.png",
        biome: "mountainous",
      },
      {
        key: "table_medium_1",
        path: "assets/props/Table_Medium_1.png",
        biome: "grassland",
      },

      // Sillas masivas (tienes muchas!)
      {
        key: "furn_silla",
        path: "assets/props/furn_silla.png",
        biome: "grassland",
      },
      { key: "silla", path: "assets/props/silla.png", biome: "forest" },
      { key: "silla2", path: "assets/props/silla2.png", biome: "grassland" },
      { key: "silla3", path: "assets/props/silla3.png", biome: "wetland" },
      { key: "silla5", path: "assets/props/silla5.png", biome: "mystical" },

      // Grupos de sillas
      { key: "sillas1", path: "assets/props/sillas1.png", biome: "grassland" },
      { key: "sillas2", path: "assets/props/sillas2.png", biome: "forest" },
      { key: "sillas3", path: "assets/props/sillas3.png", biome: "grassland" },
      { key: "sillas4", path: "assets/props/sillas4.png", biome: "wetland" },
      {
        key: "sillas5",
        path: "assets/props/sillas5.png",
        biome: "mountainous",
      },
      { key: "sillas6", path: "assets/props/sillas6.png", biome: "mystical" },

      // Sillas de calle
      {
        key: "sillas_de_calle1",
        path: "assets/props/sillas_de_calle1.png",
        biome: "grassland",
      },
      {
        key: "sillas_de_calle2",
        path: "assets/props/sillas_de_calle2.png",
        biome: "forest",
      },
      {
        key: "sillas_de_calle3",
        path: "assets/props/sillas_de_calle3.png",
        biome: "mountainous",
      },
      {
        key: "sillas_de_calle4",
        path: "assets/props/sillas_de_calle4.png",
        biome: "wetland",
      },

      // Ventanas (13 tipos!)
      {
        key: "ventana1",
        path: "assets/props/ventana1.png",
        biome: "grassland",
      },
      { key: "ventana2", path: "assets/props/ventana2.png", biome: "forest" },
      { key: "ventana3", path: "assets/props/ventana3.png", biome: "mystical" },
      { key: "ventana4", path: "assets/props/ventana4.png", biome: "wetland" },
      {
        key: "ventana5",
        path: "assets/props/ventana5.png",
        biome: "mountainous",
      },
      {
        key: "ventana6",
        path: "assets/props/ventana6.png",
        biome: "grassland",
      },
      { key: "ventana7", path: "assets/props/ventana7.png", biome: "forest" },
      { key: "ventana8", path: "assets/props/ventana8.png", biome: "mystical" },
      { key: "ventana9", path: "assets/props/ventana9.png", biome: "wetland" },
      {
        key: "ventana10",
        path: "assets/props/ventana10.png",
        biome: "mountainous",
      },
      {
        key: "ventana11",
        path: "assets/props/ventana11.png",
        biome: "grassland",
      },
      { key: "ventana12", path: "assets/props/ventana12.png", biome: "forest" },
      {
        key: "ventana13",
        path: "assets/props/ventana13.png",
        biome: "mystical",
      },

      // Decoraciones urbanas
      {
        key: "sombrilla1",
        path: "assets/props/sombrilla1.png",
        biome: "grassland",
      },
      {
        key: "sombrilla2",
        path: "assets/props/sombrilla2.png",
        biome: "forest",
      },
      {
        key: "sombrilla3",
        path: "assets/props/sombrilla3.png",
        biome: "wetland",
      },

      // Lámparas
      {
        key: "lamparas1",
        path: "assets/props/lamparas1.png",
        biome: "mystical",
      },
      {
        key: "lamparas2",
        path: "assets/props/lamparas2.png",
        biome: "grassland",
      },
      {
        key: "lamparas3",
        path: "assets/props/lamparas3.png",
        biome: "mountainous",
      },

      // Postes
      { key: "poste1", path: "assets/props/poste1.png", biome: "grassland" },
      { key: "poste2", path: "assets/props/poste2.png", biome: "forest" },
      { key: "poste3", path: "assets/props/poste3.png", biome: "wetland" },
      { key: "poste4", path: "assets/props/poste4.png", biome: "mountainous" },

      // Cajas y contenedores
      { key: "cajas1", path: "assets/props/cajas1.png", biome: "grassland" },
      { key: "cajas2", path: "assets/props/cajas2.png", biome: "forest" },
      { key: "cajas3", path: "assets/props/cajas3.png", biome: "mountainous" },

      // Botellas decorativas
      {
        key: "botellas1",
        path: "assets/props/botellas1.png",
        biome: "grassland",
      },
      {
        key: "botellas2",
        path: "assets/props/botellas2.png",
        biome: "wetland",
      },
      {
        key: "botellas3",
        path: "assets/props/botellas3.png",
        biome: "mystical",
      },

      // Ropa tendida
      {
        key: "ropas_tendidas1",
        path: "assets/props/ropas_tendidas1.png",
        biome: "grassland",
      },
      {
        key: "ropas_tendidas2",
        path: "assets/props/ropas_tendidas2.png",
        biome: "forest",
      },
      {
        key: "ropas_tendidas3",
        path: "assets/props/ropas_tendidas3.png",
        biome: "wetland",
      },
    ];

    for (const prop of specialProps) {
      const assetInfo: AssetInfo = {
        key: prop.key,
        path: prop.path,
        type: "prop",
        biome: prop.biome,
        rarity: "uncommon",
      };
      propAssets.push(assetInfo);
      this.loadedAssets.set(assetInfo.key, assetInfo);
    }

    this.assetsByType.set("props", propAssets);
    return propAssets;
  }

  /**
   * Carga creativamente todos los assets de hongos
   */
  async loadMushroomAssets(): Promise<AssetInfo[]> {
    const mushroomAssets: AssetInfo[] = [];

    const mushroomTypes = [
      { prefix: "beige_green_mushroom", count: 3, biome: "forest" },
      { prefix: "chanterelles", count: 3, biome: "forest" },
      { prefix: "white-red_mushroom", count: 3, biome: "mystical" },
    ];

    for (const mushroomType of mushroomTypes) {
      for (let i = 1; i <= mushroomType.count; i++) {
        const assetInfo: AssetInfo = {
          key: `${mushroomType.prefix}${i}`,
          path: `assets/mushrooms/${mushroomType.prefix}${i}.png`,
          type: "mushroom",
          biome: mushroomType.biome,
          variant: i,
          rarity: "uncommon",
        };
        mushroomAssets.push(assetInfo);
        this.loadedAssets.set(assetInfo.key, assetInfo);
      }
    }

    this.assetsByType.set("mushrooms", mushroomAssets);
    return mushroomAssets;
  }

  /**
   * Carga creativamente todos los assets de ruinas
   */
  async loadRuinAssets(): Promise<AssetInfo[]> {
    const ruinAssets: AssetInfo[] = [];

    const ruinTypes = [
      { prefix: "blue-gray_ruins", count: 5, biome: "ancient" },
      { prefix: "brown-gray_ruins", count: 5, biome: "ancient" },
      { prefix: "brown_ruins", count: 5, biome: "desert" },
      { prefix: "sand_ruins", count: 5, biome: "desert" },
      { prefix: "snow_ruins", count: 5, biome: "frozen" },
      { prefix: "water_ruins", count: 5, biome: "wetland" },
      { prefix: "white_ruins", count: 5, biome: "ethereal" },
      { prefix: "yellow_ruins", count: 5, biome: "ancient" },
    ];

    for (const ruinType of ruinTypes) {
      for (let i = 1; i <= ruinType.count; i++) {
        const assetInfo: AssetInfo = {
          key: `${ruinType.prefix}${i}`,
          path: `assets/ruins/${ruinType.prefix}${i}.png`,
          type: "ruin",
          biome: ruinType.biome,
          variant: i,
          rarity: "rare",
        };
        ruinAssets.push(assetInfo);
        this.loadedAssets.set(assetInfo.key, assetInfo);
      }
    }

    this.assetsByType.set("ruins", ruinAssets);
    return ruinAssets;
  }

  /**
   * Carga creativamente todos los assets de follaje
   */
  async loadFoliageAssets(): Promise<AssetInfo[]> {
    const foliageAssets: AssetInfo[] = [];

    const shrubTypes = [
      { prefix: "bush_emerald_", count: 7, biome: "forest" },
      { prefix: "troncos", count: 3, biome: "forest" },
      { prefix: "living_gazebo", count: 2, biome: "mystical" },
    ];

    for (const shrubType of shrubTypes) {
      for (let i = 1; i <= shrubType.count; i++) {
        const assetInfo: AssetInfo = {
          key: `${shrubType.prefix}${i}`,
          path: `assets/foliage/shrubs/${shrubType.prefix}${i}.png`,
          type: "foliage",
          biome: shrubType.biome,
          variant: i,
          rarity: "common",
        };
        foliageAssets.push(assetInfo);
        this.loadedAssets.set(assetInfo.key, assetInfo);
      }
    }

    this.assetsByType.set("foliage", foliageAssets);
    return foliageAssets;
  }

  /**
   * Obtiene assets por rareza y nivel de desbloqueo
   */
  getAssetsByRarity(
    rarity: "common" | "uncommon" | "rare" | "epic",
    unlockLevel: number = 0,
  ): AssetInfo[] {
    const assets: AssetInfo[] = [];

    for (const asset of this.loadedAssets.values()) {
      if (asset.rarity === rarity && (asset.unlockLevel ?? 0) <= unlockLevel) {
        assets.push(asset);
      }
    }

    return assets;
  }

  /**
   * Genera mundo diverso basado en progreso del jugador
   */
  generateProgressiveWorld(
    playerLevel: number,
    biomeDiversity: number,
  ): AssetInfo[] {
    const worldAssets: AssetInfo[] = [];

    // Assets básicos siempre disponibles
    worldAssets.push(...this.getAssetsByRarity("common", playerLevel));

    // Aplicar diversidad de bioma - más diversidad = más variedad de assets
    const diversityMultiplier = Math.max(0.3, Math.min(2.0, biomeDiversity));
    const extraAssetCount = Math.floor(diversityMultiplier * 3);

    // Assets desbloqueables por nivel con variación por diversidad
    if (playerLevel >= 5) {
      const uncommonAssets = this.getAssetsByRarity("uncommon", playerLevel);
      worldAssets.push(
        ...uncommonAssets.slice(0, uncommonAssets.length + extraAssetCount),
      );
    }
    if (playerLevel >= 15) {
      const rareAssets = this.getAssetsByRarity("rare", playerLevel);
      const rareCount = Math.floor(rareAssets.length * diversityMultiplier);
      worldAssets.push(
        ...rareAssets.slice(0, Math.min(rareAssets.length, rareCount)),
      );
    }
    if (playerLevel >= 30) {
      const epicAssets = this.getAssetsByRarity("epic", playerLevel);
      // Alta diversidad permite más assets épicos
      if (biomeDiversity > 0.7) {
        worldAssets.push(...epicAssets);
      } else {
        worldAssets.push(
          ...epicAssets.slice(
            0,
            Math.max(1, Math.floor(epicAssets.length / 2)),
          ),
        );
      }
    }

    // Agregar assets únicos épicos basados en alta diversidad
    if (biomeDiversity > 0.8 && playerLevel >= 20) {
      const extraEpicAssets = this.getAssetsByRarity("epic", playerLevel);
      if (extraEpicAssets.length > 0) {
        // Solo agregar uno adicional para alta diversidad
        const additionalEpic = extraEpicAssets.slice(-1); // Tomar el último (más raro)
        worldAssets.push(...additionalEpic);
      }
    }

    return worldAssets;
  }

  /**
   * Obtiene estadísticas de assets cargados
   */
  getAssetStats(): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const [type, assets] of this.assetsByType) {
      stats[type] = assets.length;
    }

    return stats;
  }

  /**
   * Obtiene todos los assets cargados
   */
  getAllAssets(): AssetInfo[] {
    return Array.from(this.loadedAssets.values());
  }

  /**
   * Obtiene el total de assets cargados
   */
  getTotalAssetsCount(): number {
    return this.loadedAssets.size;
  }

  /**
   * Crea assets de fallback procedurales para garantizar algo visible
   */
  private createFallbackAssets(): void {
    logAutopoiesis.info("🎨 Creando assets de fallback procedurales...");

    try {
      // Verificar que Phaser esté completamente inicializado
      if (!this.scene.add || !this.scene.cameras.main) {
        logAutopoiesis.warn(
          "⚠️ Scene no está lista para crear fallback assets",
        );
        return;
      }

      const graphics = this.scene.add.graphics();

      // Terreno básico
      graphics.fillStyle(0x4a7c4a);
      graphics.fillRect(0, 0, 32, 32);
      graphics.generateTexture("fallback_grass", 32, 32);

      // Árbol básico
      graphics.clear();
      graphics.fillStyle(0x228b22);
      graphics.fillCircle(16, 12, 10);
      graphics.fillStyle(0x8b4513);
      graphics.fillRect(14, 18, 4, 10);
      graphics.generateTexture("fallback_tree", 32, 32);

      // Roca básica
      graphics.clear();
      graphics.fillStyle(0x696969);
      graphics.fillCircle(16, 20, 8);
      graphics.fillStyle(0x808080);
      graphics.fillCircle(16, 18, 6);
      graphics.generateTexture("fallback_rock", 32, 32);

      // Agua básica
      graphics.clear();
      graphics.fillStyle(0x4169e1);
      graphics.fillRect(0, 0, 32, 32);
      graphics.generateTexture("fallback_water", 32, 32);

      // Estructura básica
      graphics.clear();
      graphics.fillStyle(0x8b4513);
      graphics.fillRect(0, 16, 32, 16);
      graphics.fillStyle(0xdc143c);
      graphics.fillTriangle(16, 0, 0, 16, 32, 16);
      graphics.generateTexture("fallback_house", 32, 32);

      graphics.destroy();
    } catch (error) {
      logAutopoiesis.error("❌ Error creando fallback assets:", error);
    }

    // Registrar como assets disponibles
    const fallbackAssets: AssetInfo[] = [
      {
        key: "fallback_grass",
        path: "generated",
        type: "terrain",
        biome: "grassland",
        rarity: "common",
      },
      {
        key: "fallback_tree",
        path: "generated",
        type: "tree",
        biome: "forest",
        rarity: "common",
      },
      {
        key: "fallback_rock",
        path: "generated",
        type: "rock",
        biome: "mountainous",
        rarity: "common",
      },
      {
        key: "fallback_water",
        path: "generated",
        type: "water",
        biome: "wetland",
        rarity: "common",
      },
      {
        key: "fallback_house",
        path: "generated",
        type: "structure",
        biome: "village",
        rarity: "common",
      },
    ];

    // Registrar fallbacks en el sistema
    for (const asset of fallbackAssets) {
      this.loadedAssets.set(asset.key, asset);

      const typeAssets = this.assetsByType.get(asset.type) || [];
      typeAssets.push(asset);
      this.assetsByType.set(asset.type, typeAssets);
    }

    logAutopoiesis.info("✅ Assets de fallback creados", {
      total: fallbackAssets.length,
      tipos: fallbackAssets.map((a) => a.type),
    });
  }
}
