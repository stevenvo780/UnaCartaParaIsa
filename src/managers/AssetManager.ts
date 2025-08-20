/**
 * Asset Manager para "Una Carta Para Isa"
 * Gestiona la carga de assets con validación, fallbacks y reporting de errores
 */

import { logAutopoiesis } from "../utils/logger";

export interface AssetDefinition {
  key: string;
  path: string;
  type: "image" | "audio" | "json" | "tilemap" | "spritesheet";
  fallback?: string;
  required?: boolean;
  frameWidth?: number; // For spritesheets
  frameHeight?: number; // For spritesheets
  spriteConfig?: {
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

export class AssetManager {
  private scene: Phaser.Scene;
  private loadedAssets = new Set<string>();
  private failedAssets = new Set<string>();
  private fallbacksUsed = new Map<string, string>();

  private static readonly ASSET_DEFINITIONS: AssetDefinition[] = [
    // Entity sprites now handled by AnimationManager spritesheets
    // Removed duplicate static images: isa-happy, isa-sad, isa-dying, stev-happy, stev-sad, stev-dying

    // Character animations converted to spritesheets
    {
      key: "woman_anim",
      path: "assets/entities/animated/characters/whomen1.png",
      type: "spritesheet",
      frameWidth: 16,
      frameHeight: 32,
    },
    {
      key: "man_anim",
      path: "assets/entities/animated/characters/man1.png",
      type: "spritesheet",
      frameWidth: 16,
      frameHeight: 32,
    },

    {
      key: "campfire",
      path: "assets/animated_entities/campfire.png",
      type: "image",
      fallback: "default-decoration",
    },
    {
      key: "flowers-red",
      path: "assets/animated_entities/flowers_red.png",
      type: "image",
      fallback: "default-decoration",
    },
    {
      key: "flowers-white",
      path: "assets/animated_entities/flowers_white.png",
      type: "image",
      fallback: "default-decoration",
    },
    {
      key: "checkpoint-flag",
      path: "assets/animated_entities/checkpoint_flag_idle1.png",
      type: "image",
      fallback: "default-decoration",
    },

    // Terrain base assets
    {
      key: "grass_1",
      path: "assets/terrain/base/cesped1.png",
      type: "image",
      fallback: "grass_middle",
    },
    {
      key: "grass_2",
      path: "assets/terrain/base/cesped2.png",
      type: "image",
      fallback: "grass_middle",
    },
    {
      key: "grass_3",
      path: "assets/terrain/base/cesped3.png",
      type: "image",
      fallback: "grass_middle",
    },
    {
      key: "grass_middle",
      path: "assets/terrain/base/Grass_Middle.png",
      type: "image",
      required: true,
      fallback: "default-terrain",
    },
    {
      key: "textured_grass",
      path: "assets/terrain/base/TexturedGrass.png",
      type: "image",
      fallback: "grass_middle",
    },

    {
      key: "dialogues",
      path: "dialogs/dialogos_chat_isa.lite.censored_plus.json",
      type: "json",
    },

    // 🎭 PERSONAJES PRINCIPALES - ISA (mujer) y STEV (hombre) con animaciones
    {
      key: "isa_happy_anim",
      path: "assets/entities/animated/characters/whomen1.png",
      type: "spritesheet",
      frameWidth: 16,
      frameHeight: 32,
      required: true,
    },
    {
      key: "isa_sad_anim",
      path: "assets/entities/animated/characters/whomen1.png",
      type: "spritesheet",
      frameWidth: 16,
      frameHeight: 32,
      required: true,
    },
    {
      key: "isa_dying_anim",
      path: "assets/entities/animated/characters/whomen1.png",
      type: "spritesheet",
      frameWidth: 16,
      frameHeight: 32,
      fallback: "isa_sad_anim",
    },
    {
      key: "stev_happy_anim",
      path: "assets/entities/animated/characters/man1.png",
      type: "spritesheet",
      frameWidth: 16,
      frameHeight: 32,
      required: true,
    },
    {
      key: "stev_sad_anim",
      path: "assets/entities/animated/characters/man1.png",
      type: "spritesheet",
      frameWidth: 16,
      frameHeight: 32,
      required: true,
    },
    {
      key: "stev_dying_anim",
      path: "assets/entities/animated/characters/man1.png",
      type: "spritesheet",
      frameWidth: 16,
      frameHeight: 32,
      required: true,
    },
    {
      key: "campfire_anim",
      path: "assets/animated_entities/campfire.png",
      type: "spritesheet",
      spriteConfig: { frameWidth: 32, frameHeight: 32, endFrame: 7 },
    },
    {
      key: "flag_idle_anim",
      path: "assets/animated_entities/checkpoint_flag_idle1.png",
      type: "spritesheet",
      spriteConfig: { frameWidth: 32, frameHeight: 32, endFrame: 6 },
    },
    {
      key: "chicken_anim",
      path: "assets/animated_entities/chicken.png",
      type: "spritesheet",
      spriteConfig: { frameWidth: 32, frameHeight: 32, endFrame: 3 },
    },
    {
      key: "flowers_red_anim",
      path: "assets/animated_entities/flowers_red.png",
      type: "spritesheet",
      spriteConfig: { frameWidth: 32, frameHeight: 32, endFrame: 3 },
    },
    {
      key: "flowers_white_anim",
      path: "assets/animated_entities/flowers_white.png",
      type: "spritesheet",
      spriteConfig: { frameWidth: 32, frameHeight: 32, endFrame: 3 },
    },

    // 🏠 CASAS Y ESTRUCTURAS REALES
    {
      key: "house_hay",
      path: "assets/structures/estructuras_completas/House_Hay_1.png",
      type: "image",
      fallback: "food_store",
    },
    {
      key: "house_stone",
      path: "assets/structures/estructuras_completas/Assets_source_002_007.png",
      type: "image",
      fallback: "food_store",
    },
    {
      key: "house_wood",
      path: "assets/structures/estructuras_completas/Assets_source_002_009.png",
      type: "image",
      fallback: "food_store",
    },
    {
      key: "well",
      path: "assets/structures/estructuras_completas/Well_Hay_1.png",
      type: "image",
      fallback: "food_store",
    },

    // 🌳 ÁRBOLES REALES
    {
      key: "tree_emerald",
      path: "assets/foliage/trees/tree_emerald_1.png",
      type: "image",
      fallback: "campfire",
    },
    {
      key: "tree_swirling",
      path: "assets/foliage/trees/swirling_tree1.png",
      type: "image",
      fallback: "campfire",
    },
    {
      key: "tree_white",
      path: "assets/foliage/trees/white_tree2.png",
      type: "image",
      fallback: "campfire",
    },
    {
      key: "tree_willow",
      path: "assets/foliage/trees/willow3.png",
      type: "image",
      fallback: "campfire",
    },
    {
      key: "tree_mega",
      path: "assets/foliage/trees/mega_tree2.png",
      type: "image",
      fallback: "campfire",
    },

    // 🌿 VEGETACIÓN Y ARBUSTOS
    {
      key: "bush_emerald",
      path: "assets/foliage/shrubs/bush_emerald_3.png",
      type: "image",
      fallback: "flowers-red",
    },
    {
      key: "living_gazebo",
      path: "assets/foliage/shrubs/living_gazebo1.png",
      type: "image",
      fallback: "flowers-white",
    },

    // 🏠 INTERIORES Y MUEBLES
    {
      key: "wooden_floor",
      path: "assets/structures/interiores/wooden.png",
      type: "image",
      fallback: "food_store",
    },
    {
      key: "wall_brick",
      path: "assets/structures/interiores/muros1.png",
      type: "image",
      fallback: "food_store",
    },
    {
      key: "wall_stone",
      path: "assets/structures/interiores/muros3.png",
      type: "image",
      fallback: "food_store",
    },
    {
      key: "roof_tile",
      path: "assets/structures/interiores/tile_0542_tejado.png",
      type: "image",
      fallback: "food_store",
    },

    // 📚 PROPS Y MOBILIARIO
    {
      key: "lamp_interior",
      path: "assets/props/lamparas1.png",
      type: "image",
      fallback: "campfire",
    },
    {
      key: "chair_interior",
      path: "assets/props/sillas2.png",
      type: "image",
      fallback: "woman",
    },
    {
      key: "chest_treasure",
      path: "assets/props/Chests_002.png",
      type: "image",
      fallback: "food_store",
    },
    {
      key: "bookshelf",
      path: "assets/props/cajas3.png",
      type: "image",
      fallback: "food_store",
    },
    {
      key: "window_interior",
      path: "assets/props/ventana1.png",
      type: "image",
      fallback: "food_store",
    },
    {
      key: "sign_interior",
      path: "assets/props/Sign_1.png",
      type: "image",
      fallback: "food_store",
    },
  ];

  private static readonly FALLBACK_ASSETS: Record<
    string,
    () => HTMLCanvasElement
  > = {
    "default-entity": () => AssetManager.createDefaultEntitySprite(),
    "default-terrain": () => AssetManager.createDefaultTerrain(),
    "default-decoration": () => AssetManager.createDefaultDecoration(),
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Valida que todos los assets existan antes de cargarlos
   */
  public async validateAssets(): Promise<string[]> {
    const missingAssets: string[] = [];
    const validationPromises = AssetManager.ASSET_DEFINITIONS.map(
      async (asset) => {
        try {
          const response = await fetch(asset.path, { method: "HEAD" });
          if (!response.ok) {
            missingAssets.push(asset.key);
            logAutopoiesis.warn(
              `Asset no encontrado: ${asset.key} en ${asset.path}`,
            );
          }
        } catch (error) {
          missingAssets.push(asset.key);
          logAutopoiesis.error(`Error validando asset: ${asset.key}`, {
            error: String(error),
          });
        }
      },
    );

    await Promise.all(validationPromises);

    if (missingAssets.length > 0) {
      logAutopoiesis.warn(
        `Validation complete - ${missingAssets.length} assets missing`,
        {
          missingAssets,
        },
      );
    } else {
      logAutopoiesis.info("✅ All assets validated successfully");
    }

    return missingAssets;
  }

  /**
   * Carga todos los assets con manejo de errores y fallbacks
   */
  public async loadAllAssets(): Promise<AssetLoadResult> {
    const result: AssetLoadResult = {
      success: true,
      loadedAssets: [],
      failedAssets: [],
      fallbacksUsed: [],
    };

    this.createFallbackAssets();

    this.scene.load.on("filecomplete", (key: string) => {
      this.loadedAssets.add(key);
      result.loadedAssets.push(key);
    });

    this.scene.load.on("loaderror", (file: any) => {
      const asset = AssetManager.ASSET_DEFINITIONS.find(
        (a) => a.key === file.key,
      );
      this.handleAssetError(asset, result);
    });

    for (const asset of AssetManager.ASSET_DEFINITIONS) {
      this.loadAssetSafely(asset);
    }

    return new Promise((resolve) => {
      this.scene.load.on("complete", () => {
        const criticalAssetsFailed = result.failedAssets.filter((key) => {
          const asset = AssetManager.ASSET_DEFINITIONS.find(
            (a) => a.key === key,
          );
          return asset?.required;
        });

        if (criticalAssetsFailed.length > 0) {
          result.success = false;
          logAutopoiesis.error("Critical assets failed to load", {
            criticalAssetsFailed,
          });
        }

        logAutopoiesis.info("Asset loading complete", {
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

  /**
   * Carga un asset individual de forma segura
   */
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
          if (asset.spriteConfig) {
            this.scene.load.spritesheet(
              asset.key,
              asset.path,
              asset.spriteConfig,
            );
          } else if (asset.frameWidth && asset.frameHeight) {
            this.scene.load.spritesheet(asset.key, asset.path, {
              frameWidth: asset.frameWidth,
              frameHeight: asset.frameHeight,
            });
          } else {
            logAutopoiesis.warn(`Spritesheet ${asset.key} missing config`);
          }
          break;
        default:
          logAutopoiesis.warn(
            `Unknown asset type: ${asset.type} for ${asset.key}`,
          );
      }
    } catch (error) {
      logAutopoiesis.error(`Error queuing asset: ${asset.key}`, {
        error: String(error),
      });
      this.failedAssets.add(asset.key);
    }
  }

  /**
   * Maneja errores de carga de assets
   */
  private handleAssetError(
    asset: AssetDefinition | undefined,
    result: AssetLoadResult,
  ): void {
    if (!asset) return;

    this.failedAssets.add(asset.key);
    result.failedAssets.push(asset.key);

    if (asset.fallback) {
      const fallbackAsset = AssetManager.ASSET_DEFINITIONS.find(
        (a) => a.key === asset.fallback,
      );
      if (fallbackAsset && !this.failedAssets.has(asset.fallback)) {
        this.fallbacksUsed.set(asset.key, asset.fallback);
        result.fallbacksUsed.push(`${asset.key} -> ${asset.fallback}`);
        logAutopoiesis.info(
          `Using fallback for ${asset.key}: ${asset.fallback}`,
        );
      }
    } else if (asset.required) {
      this.createProgrammaticFallback(asset.key);
      result.fallbacksUsed.push(`${asset.key} -> programmatic`);
      logAutopoiesis.warn(
        `Created programmatic fallback for critical asset: ${asset.key}`,
      );
    }
  }

  /**
   * Crea assets de fallback programáticamente
   */
  private createFallbackAssets(): void {
    Object.entries(AssetManager.FALLBACK_ASSETS).forEach(([key, generator]) => {
      const canvas = generator();
      this.scene.textures.addCanvas(key, canvas);
    });
  }

  /**
   * Crea un fallback programático para un asset específico
   */
  private createProgrammaticFallback(assetKey: string): void {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    if (assetKey.includes("isa")) {
      this.drawCircleEntity(
        ctx,
        "#e91e63",
        assetKey.includes("happy") ? "😊" : "😢",
      );
    } else if (assetKey.includes("stev")) {
      this.drawSquareEntity(
        ctx,
        "#2196f3",
        assetKey.includes("happy") ? "😊" : "😢",
      );
    } else if (assetKey.includes("grass")) {
      this.drawGrassTile(ctx);
    } else {
      this.drawDefaultSprite(ctx, assetKey);
    }

    this.scene.textures.addCanvas(assetKey, canvas);
  }

  /**
   * Verifica si un asset está cargado
   */
  public isAssetLoaded(key: string): boolean {
    return this.loadedAssets.has(key) || this.scene.textures.exists(key);
  }

  /**
   * Obtiene estadísticas de carga de assets
   */
  public getLoadingStats(): {
    loaded: number;
    failed: number;
    fallbacks: number;
  } {
    return {
      loaded: this.loadedAssets.size,
      failed: this.failedAssets.size,
      fallbacks: this.fallbacksUsed.size,
    };
  }

  private static createDefaultEntitySprite(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#95a5a6";
    ctx.beginPath();
    ctx.arc(16, 16, 12, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  }

  private static createDefaultTerrain(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(0, 0, 64, 64);

    return canvas;
  }

  private static createDefaultDecoration(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  }

  private drawCircleEntity(
    ctx: CanvasRenderingContext2D,
    color: string,
    emoji: string,
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(16, 16, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(emoji, 16, 22);
  }

  private drawSquareEntity(
    ctx: CanvasRenderingContext2D,
    color: string,
    emoji: string,
  ): void {
    ctx.fillStyle = color;
    ctx.fillRect(4, 4, 24, 24);

    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(emoji, 16, 22);
  }

  private drawGrassTile(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = "#27ae60";
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * 32;
      const y = Math.random() * 32;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  private drawDefaultSprite(ctx: CanvasRenderingContext2D, name: string): void {
    ctx.fillStyle = "#95a5a6";
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = "#2c3e50";
    ctx.font = "8px Arial";
    ctx.textAlign = "center";
    ctx.fillText(name.substring(0, 4), 16, 18);
  }
}
