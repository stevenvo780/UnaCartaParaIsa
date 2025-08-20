/**
 * UnifiedAssetManager - Gestor consolidado de assets
 * Combina AssetManager, AssetLazyLoader, FoodAssetManager y CreativeAssetLoader
 */

import type Phaser from "phaser";
import { FoodCatalog } from "../data/FoodCatalog";
import { randomInt } from "../utils/deterministicRandom";
import { logAutopoiesis } from "../utils/logger";

export interface AssetDefinition {
  key: string;
  path: string;
  type: "image" | "audio" | "json" | "tilemap" | "spritesheet";
  fallback?: string;
  required?: boolean;
  priority?: "critical" | "high" | "medium" | "low";
  category?:
    | "character"
    | "terrain"
    | "food"
    | "structure"
    | "decoration"
    | "animation";
  biome?: string;
  frameConfig?: {
    frameWidth: number;
    frameHeight: number;
    endFrame?: number;
  };
}

export interface AssetLoadResult {
  success: boolean;
  loadedAssets: string[];
  failedAssets: string[];
  fallbacksUsed: string[];
}

export interface AssetGroup {
  name: string;
  assets: AssetDefinition[];
  preload?: boolean;
}

export interface AssetInfo {
  key: string;
  path: string;
  type: string;
  biome?: string;
  variant?: number;
  rarity?: "common" | "uncommon" | "rare";
}

export class UnifiedAssetManager {
  private scene: Phaser.Scene;
  private loadedAssets = new Set<string>();
  private failedAssets = new Set<string>();
  private fallbacksUsed = new Map<string, string>();
  private loadingPromises = new Map<string, Promise<void>>();
  private assetGroups = new Map<string, AssetGroup>();
  private assetsByType = new Map<string, AssetInfo[]>();
  private loadQueue = new Map<string, AssetDefinition>();
  private loadingAssets = new Set<string>();
  private currentLoads = 0;

  private readonly MAX_CONCURRENT_LOADS = 4;
  private readonly LOAD_TIMEOUT = 10000;

  // Asset definitions consolidadas
  private static readonly CORE_ASSETS: AssetDefinition[] = [
    // ==========================================
    // PERSONAJES CRÍTICOS
    // ==========================================
    {
      key: "isa_happy",
      path: "/assets/entities/animated/characters/whomen1.png",
      type: "image",
      required: true,
      priority: "critical",
      category: "character",
    },
    {
      key: "isa_sad",
      path: "/assets/entities/animated/characters/whomen1.png",
      type: "image",
      required: true,
      priority: "critical",
      category: "character",
    },
    {
      key: "stev_happy",
      path: "/assets/entities/animated/characters/man1.png",
      type: "image",
      required: true,
      priority: "critical",
      category: "character",
    },
    {
      key: "stev_sad",
      path: "/assets/entities/animated/characters/man1.png",
      type: "image",
      required: true,
      priority: "critical",
      category: "character",
    },

    // ==========================================
    // TERRENO BÁSICO
    // ==========================================
    {
      key: "grass_middle",
      path: "/assets/terrain/base/Grass_Middle.png",
      type: "image",
      required: true,
      priority: "high",
      category: "terrain",
      fallback: "default-terrain",
    },
    {
      key: "grass_1",
      path: "/assets/terrain/base/cesped1.png",
      type: "image",
      priority: "medium",
      category: "terrain",
      fallback: "grass_middle",
    },
    {
      key: "grass_2",
      path: "/assets/terrain/base/cesped2.png",
      type: "image",
      priority: "medium",
      category: "terrain",
      fallback: "grass_middle",
    },
    {
      key: "grass_3",
      path: "/assets/terrain/base/cesped3.png",
      type: "image",
      priority: "medium",
      category: "terrain",
      fallback: "grass_middle",
    },

    // ==========================================
    // DATOS DEL JUEGO
    // ==========================================
    {
      key: "dialogues",
      path: "dialogs/dialogos_chat_isa.lite.censored_plus.json",
      type: "json",
      required: true,
      priority: "critical",
    },

    // ==========================================
    // ANIMACIONES BÁSICAS
    // ==========================================
    {
      key: "campfire_anim",
      path: "/assets/animated_entities/campfire.png",
      type: "spritesheet",
      priority: "medium",
      category: "animation",
      frameConfig: { frameWidth: 32, frameHeight: 32, endFrame: 7 },
    },
    {
      key: "flowers_red_anim",
      path: "/assets/animated_entities/flowers_red.png",
      type: "spritesheet",
      priority: "low",
      category: "animation",
      frameConfig: { frameWidth: 32, frameHeight: 32, endFrame: 3 },
    },
  ];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupAssetGroups();
    this.initializeFallbacks();
  }

  // ==========================================
  // INICIALIZACIÓN Y CONFIGURACIÓN
  // ==========================================

  private setupAssetGroups(): void {
    // Grupo crítico
    this.defineAssetGroup(
      "critical",
      UnifiedAssetManager.CORE_ASSETS.filter((a) => a.priority === "critical"),
      true,
    );

    // Grupo de terreno
    this.defineAssetGroup(
      "terrain",
      UnifiedAssetManager.CORE_ASSETS.filter((a) => a.category === "terrain"),
    );

    // Grupo de animaciones
    this.defineAssetGroup(
      "animations",
      UnifiedAssetManager.CORE_ASSETS.filter((a) => a.category === "animation"),
    );

    logAutopoiesis.info("Asset groups configurados", {
      totalGroups: this.assetGroups.size,
      groupNames: Array.from(this.assetGroups.keys()),
    });
  }

  private defineAssetGroup(
    name: string,
    assets: AssetDefinition[],
    preload = false,
  ): void {
    this.assetGroups.set(name, { name, assets, preload });

    // Añadir assets al queue
    assets.forEach((asset) => {
      this.loadQueue.set(asset.key, asset);
    });
  }

  private initializeFallbacks(): void {
    const fallbackGenerators = {
      "default-terrain": () => this.createDefaultTerrain(),
      "default-entity": () => this.createDefaultEntity(),
      "default-decoration": () => this.createDefaultDecoration(),
    };

    Object.entries(fallbackGenerators).forEach(([key, generator]) => {
      const canvas = generator();
      this.scene.textures.addCanvas(key, canvas);
    });
  }

  // ==========================================
  // CARGA DE ASSETS CRÍTICOS
  // ==========================================

  public async loadCriticalAssets(): Promise<void> {
    logAutopoiesis.info("Cargando assets críticos...");

    const criticalGroup = this.assetGroups.get("critical");
    if (!criticalGroup) return;

    await this.loadAssetGroup("critical");

    logAutopoiesis.info("Assets críticos cargados", {
      loaded: criticalGroup.assets.length,
    });
  }

  public async loadAllAssets(): Promise<AssetLoadResult> {
    const result: AssetLoadResult = {
      success: true,
      loadedAssets: [],
      failedAssets: [],
      fallbacksUsed: [],
    };

    // Configurar event handlers
    this.scene.load.on("filecomplete", (key: string) => {
      this.loadedAssets.add(key);
      result.loadedAssets.push(key);
    });

    this.scene.load.on("loaderror", (file: any) => {
      const asset = Array.from(this.loadQueue.values()).find(
        (a) => a.key === file.key,
      );
      this.handleAssetError(asset, result);
    });

    // Cargar todos los assets core
    for (const asset of UnifiedAssetManager.CORE_ASSETS) {
      this.loadAssetSafely(asset);
    }

    return new Promise((resolve) => {
      this.scene.load.on("complete", () => {
        const criticalAssetsFailed = result.failedAssets.filter((key) => {
          const asset = Array.from(this.loadQueue.values()).find(
            (a) => a.key === key,
          );
          return asset?.required;
        });

        if (criticalAssetsFailed.length > 0) {
          result.success = false;
          logAutopoiesis.error("Assets críticos fallaron", {
            criticalAssetsFailed,
          });
        }

        logAutopoiesis.info("Carga de assets completada", {
          loaded: result.loadedAssets.length,
          failed: result.failedAssets.length,
          fallbacks: result.fallbacksUsed.length,
          success: result.success,
        });

        resolve(result);
      });

      this.scene.load.start();
    });
  }

  // ==========================================
  // CARGA BAJO DEMANDA
  // ==========================================

  public async loadAssetGroup(groupName: string): Promise<void> {
    const group = this.assetGroups.get(groupName);
    if (!group) {
      logAutopoiesis.warn(`Grupo de assets no encontrado: ${groupName}`);
      return;
    }

    const loadPromises = group.assets
      .filter((asset) => !this.isAssetLoaded(asset.key))
      .map((asset) => this.loadAsset(asset.key));

    try {
      await Promise.all(loadPromises);
      logAutopoiesis.info(`Grupo de assets cargado: ${groupName}`, {
        assetsCount: group.assets.length,
      });
    } catch (error) {
      logAutopoiesis.error(`Error cargando grupo ${groupName}`, {
        error: String(error),
      });
    }
  }

  public async loadAsset(key: string): Promise<void> {
    if (this.isAssetLoaded(key) || this.isAssetLoading(key)) {
      return this.loadingPromises.get(key) || Promise.resolve();
    }

    const config = this.loadQueue.get(key);
    if (!config) {
      logAutopoiesis.warn(`Asset no encontrado en queue: ${key}`);
      return;
    }

    const loadPromise = this.doLoadAsset(config);
    this.loadingPromises.set(key, loadPromise);

    try {
      await loadPromise;
    } finally {
      this.loadingPromises.delete(key);
    }
  }

  private async doLoadAsset(config: AssetDefinition): Promise<void> {
    // Control de concurrencia
    while (this.currentLoads >= this.MAX_CONCURRENT_LOADS) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.currentLoads++;
    this.loadingAssets.add(config.key);

    try {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Asset load timeout: ${config.key}`));
        }, this.LOAD_TIMEOUT);

        const onComplete = () => {
          clearTimeout(timeout);
          this.loadedAssets.add(config.key);
          this.loadingAssets.delete(config.key);
          this.currentLoads--;

          logAutopoiesis.debug(`Asset cargado: ${config.key}`, {
            type: config.type,
            path: config.path,
          });

          resolve();
        };

        const onError = (error: any) => {
          clearTimeout(timeout);
          this.loadingAssets.delete(config.key);
          this.currentLoads--;

          logAutopoiesis.error(`Error cargando asset: ${config.key}`, {
            error: String(error),
            path: config.path,
          });

          reject(error);
        };

        // Cargar según tipo
        switch (config.type) {
          case "image":
            this.scene.load.image(config.key, config.path);
            break;
          case "spritesheet":
            if (config.frameConfig) {
              this.scene.load.spritesheet(
                config.key,
                config.path,
                config.frameConfig,
              );
            } else {
              this.scene.load.image(config.key, config.path);
            }
            break;
          case "audio":
            this.scene.load.audio(config.key, config.path);
            break;
          case "json":
            this.scene.load.json(config.key, config.path);
            break;
          default:
            onError(new Error(`Tipo de asset desconocido: ${config.type}`));
            return;
        }

        this.scene.load.once("complete", onComplete);
        this.scene.load.once("loaderror", onError);
        this.scene.load.start();
      });
    } catch (error) {
      this.loadingAssets.delete(config.key);
      this.currentLoads--;
      throw error;
    }
  }

  // ==========================================
  // SISTEMA DE COMIDA (Food Assets)
  // ==========================================

  public async loadEssentialFoodAssets(): Promise<void> {
    // Mapeo de nombres lógicos a archivos reales
    const essentialFoods = [
      { key: "bread", file: "07_bread.png" },
      { key: "burger", file: "15_burger.png" },
      { key: "apple_pie", file: "05_apple_pie.png" },
      { key: "icecream", file: "57_icecream.png" },
      { key: "sandwich", file: "92_sandwich.png" },
      { key: "pizza", file: "81_pizza.png" },
    ];

    logAutopoiesis.info("Cargando assets esenciales de comida", {
      count: essentialFoods.length,
    });

    // Generar definiciones dinámicas para comida
    const foodAssets = essentialFoods.map(({ key, file }) => ({
      key,
      path: `assets/consumable_items/food/${file}`,
      type: "image" as const,
      priority: "medium" as const,
      category: "food" as const,
      fallback: "default-food",
    }));

    // Cargar assets de comida
    const loadPromises = foodAssets.map((asset) => {
      this.loadQueue.set(asset.key, asset);
      return this.loadAsset(asset.key);
    });

    await Promise.all(loadPromises);
    logAutopoiesis.info("Assets esenciales de comida cargados");
  }

  public async loadFoodCategory(category: string): Promise<void> {
    const categoryFoods = FoodCatalog.getFoodsByCategory(category as any);
    const foodIds = categoryFoods.map((food) => food.id);

    logAutopoiesis.info("Cargando categoría de comida", {
      category,
      count: foodIds.length,
    });

    const loadPromises = foodIds.map((foodId) => {
      const asset: AssetDefinition = {
        key: foodId,
        path: `assets/consumable_items/${foodId}.png`,
        type: "image",
        priority: "low",
        category: "food",
      };
      this.loadQueue.set(asset.key, asset);
      return this.loadAsset(asset.key);
    });

    await Promise.all(loadPromises);
  }

  // ==========================================
  // SISTEMA CREATIVO (Dynamic Assets)
  // ==========================================

  public async loadBiomeAssets(biome: string): Promise<AssetInfo[]> {
    const biomeAssets: AssetInfo[] = [];

    switch (biome) {
      case "forest":
        biomeAssets.push(...(await this.generateTreeAssets()));
        biomeAssets.push(...(await this.generateRockAssets()));
        break;
      case "village":
        biomeAssets.push(...(await this.generateStructureAssets()));
        biomeAssets.push(...(await this.generatePropAssets()));
        break;
      case "wetland":
        biomeAssets.push(...(await this.generateWaterAssets()));
        break;
    }

    // Cargar assets generados
    const loadPromises = biomeAssets.map((asset) => {
      const assetDef: AssetDefinition = {
        key: asset.key,
        path: asset.path,
        type: "image",
        priority: "low",
        biome: asset.biome,
      };
      this.loadQueue.set(asset.key, assetDef);
      return this.loadAsset(asset.key);
    });

    await Promise.all(loadPromises);
    this.assetsByType.set(biome, biomeAssets);

    return biomeAssets;
  }

  private async generateTreeAssets(): Promise<AssetInfo[]> {
    const treeAssets: AssetInfo[] = [];
    const treeTypes = [
      { name: "tree_emerald", count: 3, rarity: "common" },
      { name: "tree_willow", count: 3, rarity: "uncommon" },
      { name: "tree_white", count: 2, rarity: "rare" },
    ];

    for (const tree of treeTypes) {
      for (let i = 1; i <= tree.count; i++) {
        treeAssets.push({
          key: `${tree.name}_${i}`,
          path: `assets/foliage/trees/${tree.name}${i}.png`,
          type: "tree",
          biome: "forest",
          variant: i,
          rarity: tree.rarity as any,
        });
      }
    }

    return treeAssets;
  }

  private async generateRockAssets(): Promise<AssetInfo[]> {
    const rockAssets: AssetInfo[] = [];
    const rockTypes = [
      { name: "rock_1", count: 5, rarity: "common" },
      { name: "rock_moss", count: 3, rarity: "uncommon" },
    ];

    for (const rock of rockTypes) {
      for (let i = 1; i <= rock.count; i++) {
        rockAssets.push({
          key: `${rock.name}_${i}`,
          path: `assets/rocks/${rock.name}_${i}.png`,
          type: "rock",
          biome: "forest",
          variant: i,
          rarity: rock.rarity as any,
        });
      }
    }

    return rockAssets;
  }

  private async generateStructureAssets(): Promise<AssetInfo[]> {
    const structures: AssetInfo[] = [];
    const structureTypes = [
      { name: "house_hay", count: 2 },
      { name: "house_stone", count: 1 },
      { name: "well", count: 1 },
    ];

    for (const structure of structureTypes) {
      for (let i = 1; i <= structure.count; i++) {
        structures.push({
          key: `${structure.name}_${i}`,
          path: `assets/structures/estructuras_completas/${structure.name}_${i}.png`,
          type: "structure",
          biome: "village",
          variant: i,
          rarity: "uncommon",
        });
      }
    }

    return structures;
  }

  private async generatePropAssets(): Promise<AssetInfo[]> {
    const props: AssetInfo[] = [];
    const propTypes = [
      { name: "silla", count: 6 },
      { name: "lampara", count: 3 },
      { name: "ventana", count: 5 },
    ];

    for (const prop of propTypes) {
      for (let i = 1; i <= prop.count; i++) {
        props.push({
          key: `${prop.name}_${i}`,
          path: `assets/props/${prop.name}${i}.png`,
          type: "prop",
          biome: "village",
          variant: i,
          rarity: "common",
        });
      }
    }

    return props;
  }

  private async generateWaterAssets(): Promise<AssetInfo[]> {
    const waterAssets: AssetInfo[] = [];

    // Tiles básicos de agua
    for (let x = 1; x <= 4; x++) {
      for (let y = 1; y <= 4; y++) {
        waterAssets.push({
          key: `water_${x}_${y}`,
          path: `assets/water/tile_0${x}_0${y}.png`,
          type: "water",
          biome: "wetland",
          variant: x * 10 + y,
          rarity: "common",
        });
      }
    }

    return waterAssets;
  }

  // ==========================================
  // UTILIDADES Y HELPERS
  // ==========================================

  public isAssetLoaded(key: string): boolean {
    return this.loadedAssets.has(key) || this.scene.textures.exists(key);
  }

  public isAssetLoading(key: string): boolean {
    return this.loadingAssets.has(key);
  }

  private loadAssetSafely(asset: AssetDefinition): void {
    try {
      switch (asset.type) {
        case "image":
          this.scene.load.image(asset.key, asset.path);
          break;
        case "json":
          this.scene.load.json(asset.key, asset.path);
          break;
        case "audio":
          this.scene.load.audio(asset.key, asset.path);
          break;
        case "spritesheet":
          if (asset.frameConfig) {
            this.scene.load.spritesheet(
              asset.key,
              asset.path,
              asset.frameConfig,
            );
          } else {
            logAutopoiesis.warn(`Spritesheet ${asset.key} missing frameConfig`);
          }
          break;
        default:
          logAutopoiesis.warn(
            `Tipo de asset desconocido: ${asset.type} para ${asset.key}`,
          );
      }
    } catch (error) {
      logAutopoiesis.error(`Error añadiendo asset al queue: ${asset.key}`, {
        error: String(error),
      });
      this.failedAssets.add(asset.key);
    }
  }

  private handleAssetError(
    asset: AssetDefinition | undefined,
    result: AssetLoadResult,
  ): void {
    if (!asset) return;

    this.failedAssets.add(asset.key);
    result.failedAssets.push(asset.key);

    if (asset.fallback) {
      const fallbackAsset = Array.from(this.loadQueue.values()).find(
        (a) => a.key === asset.fallback,
      );
      if (fallbackAsset && !this.failedAssets.has(asset.fallback)) {
        this.fallbacksUsed.set(asset.key, asset.fallback);
        result.fallbacksUsed.push(`${asset.key} -> ${asset.fallback}`);
        logAutopoiesis.info(
          `Usando fallback para ${asset.key}: ${asset.fallback}`,
        );
      }
    } else if (asset.required) {
      this.createProgrammaticFallback(asset.key);
      result.fallbacksUsed.push(`${asset.key} -> programmatic`);
      logAutopoiesis.warn(
        `Fallback programático creado para asset crítico: ${asset.key}`,
      );
    }
  }

  private createProgrammaticFallback(assetKey: string): void {
    let canvas: HTMLCanvasElement;

    if (assetKey.includes("isa")) {
      canvas = this.createCharacterFallback("#e91e63", "👩");
    } else if (assetKey.includes("stev")) {
      canvas = this.createCharacterFallback("#2196f3", "👨");
    } else if (assetKey.includes("grass")) {
      canvas = this.createDefaultTerrain();
    } else {
      canvas = this.createDefaultEntity();
    }

    this.scene.textures.addCanvas(assetKey, canvas);
  }

  // ==========================================
  // GENERADORES DE FALLBACKS
  // ==========================================

  private createDefaultTerrain(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(0, 0, 32, 32);

    // Textura de césped simple
    ctx.fillStyle = "#388E3C";
    for (let i = 0; i < 8; i++) {
      const x = randomInt(0, 30);
      const y = randomInt(0, 30);
      ctx.fillRect(x, y, 2, 1);
    }

    return canvas;
  }

  private createDefaultEntity(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#95a5a6";
    ctx.beginPath();
    ctx.arc(16, 16, 12, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  }

  private createDefaultDecoration(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#9C27B0";
    ctx.beginPath();
    ctx.arc(16, 16, 8, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  }

  private createCharacterFallback(
    color: string,
    emoji: string,
  ): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(16, 24, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(emoji, 16, 20);

    return canvas;
  }

  // ==========================================
  // ESTADÍSTICAS Y LIMPIEZA
  // ==========================================

  public getLoadingStats(): {
    totalAssets: number;
    loadedAssets: number;
    loadingAssets: number;
    pendingAssets: number;
    loadProgress: number;
  } {
    const totalAssets = this.loadQueue.size;
    const loadedCount = this.loadedAssets.size;
    const loadingCount = this.loadingAssets.size;
    const pendingCount = totalAssets - loadedCount - loadingCount;

    return {
      totalAssets,
      loadedAssets: loadedCount,
      loadingAssets: loadingCount,
      pendingAssets: pendingCount,
      loadProgress: totalAssets > 0 ? (loadedCount / totalAssets) * 100 : 100,
    };
  }

  public cleanupUnusedAssets(keepKeys: string[] = []): number {
    let cleanedCount = 0;

    const keepSet = new Set([
      ...keepKeys,
      "isa_happy",
      "stev_happy",
      "isa_sad",
      "stev_sad", // críticos
      "grass_middle",
      "dialogues", // esenciales
    ]);

    this.loadedAssets.forEach((key) => {
      if (!keepSet.has(key)) {
        if (this.scene.textures.exists(key)) {
          this.scene.textures.remove(key);
          this.loadedAssets.delete(key);
          cleanedCount++;
        }
      }
    });

    if (cleanedCount > 0) {
      logAutopoiesis.info("Assets no utilizados limpiados", {
        cleaned: cleanedCount,
        remaining: this.loadedAssets.size,
      });
    }

    return cleanedCount;
  }

  public destroy(): void {
    this.loadedAssets.clear();
    this.failedAssets.clear();
    this.fallbacksUsed.clear();
    this.loadingPromises.clear();
    this.assetGroups.clear();
    this.assetsByType.clear();
    this.loadQueue.clear();
    this.loadingAssets.clear();
  }
}
