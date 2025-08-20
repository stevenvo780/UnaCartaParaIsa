/**
 * BiomeAssetRenderer - Sistema ultra-diverso que aprovecha todos los assets disponibles
 */

import Phaser from "phaser";
import { logAutopoiesis } from "../utils/logger";
import { CreativeAssetLoader, type AssetInfo } from "./CreativeAssetLoader";
import { BiomeType, type GeneratedWorld } from "./types";

interface BiomeVisualConfig {
  terrainAssets: AssetInfo[];
  decorationAssets: AssetInfo[];
  structureAssets: AssetInfo[];
  propAssets: AssetInfo[];
  probability: {
    decoration: number;
    structure: number;
    prop: number;
  };
  tintColor: number;
  scale: { min: number; max: number };
}

/**
 * Renderizador ultra-diverso que aprovecha todos los assets creativos
 */
export class BiomeAssetRenderer {
  private scene: Phaser.Scene;
  private creativeLoader: CreativeAssetLoader;
  private biomeConfigs = new Map<BiomeType, BiomeVisualConfig>();
  private worldContainer!: Phaser.GameObjects.Container;
  private decorationContainer!: Phaser.GameObjects.Container;
  private structureContainer!: Phaser.GameObjects.Container;
  private propContainer!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.creativeLoader = new CreativeAssetLoader(scene);
    this.initializeBiomeConfigs();
    this.createContainers();
  }

  /**
   * Crea contenedores para organizar el renderizado por capas
   */
  private createContainers(): void {
    this.worldContainer = this.scene.add.container(0, 0);
    this.decorationContainer = this.scene.add.container(0, 0);
    this.structureContainer = this.scene.add.container(0, 0);
    this.propContainer = this.scene.add.container(0, 0);

    // Establecer profundidad de capas
    this.worldContainer.setDepth(0);
    this.decorationContainer.setDepth(1);
    this.structureContainer.setDepth(2);
    this.propContainer.setDepth(3);
  }

  /**
   * Inicializa configuraciones visuales ultra-diversas para cada bioma
   */
  private initializeBiomeConfigs(): void {
    // GRASSLAND - Praderas verdes con variedad natural
    this.biomeConfigs.set(BiomeType.GRASSLAND, {
      terrainAssets: [], // Se llenarán dinámicamente
      decorationAssets: [],
      structureAssets: [],
      propAssets: [],
      probability: { decoration: 0.15, structure: 0.02, prop: 0.08 },
      tintColor: 0x90ee90,
      scale: { min: 0.9, max: 1.1 },
    });

    // FOREST - Bosques densos con árboles mágicos
    this.biomeConfigs.set(BiomeType.FOREST, {
      terrainAssets: [],
      decorationAssets: [],
      structureAssets: [],
      propAssets: [],
      probability: { decoration: 0.35, structure: 0.01, prop: 0.05 },
      tintColor: 0x228b22,
      scale: { min: 0.85, max: 1.15 },
    });

    // WETLAND - Pantanos con agua y vegetación acuática
    this.biomeConfigs.set(BiomeType.WETLAND, {
      terrainAssets: [],
      decorationAssets: [],
      structureAssets: [],
      propAssets: [],
      probability: { decoration: 0.25, structure: 0.005, prop: 0.03 },
      tintColor: 0x4682b4,
      scale: { min: 0.95, max: 1.05 },
    });

    // VILLAGE - Pueblos con casas y mobiliario
    this.biomeConfigs.set(BiomeType.VILLAGE, {
      terrainAssets: [],
      decorationAssets: [],
      structureAssets: [],
      propAssets: [],
      probability: { decoration: 0.1, structure: 0.08, prop: 0.25 },
      tintColor: 0xd2b48c,
      scale: { min: 0.95, max: 1.05 },
    });

    // MOUNTAINOUS - Montañas rocosas con ruinas
    this.biomeConfigs.set(BiomeType.MOUNTAINOUS, {
      terrainAssets: [],
      decorationAssets: [],
      structureAssets: [],
      propAssets: [],
      probability: { decoration: 0.2, structure: 0.03, prop: 0.02 },
      tintColor: 0x8b7355,
      scale: { min: 0.8, max: 1.2 },
    });

    // MYSTICAL - Bioma mágico con árboles luminosos
    this.biomeConfigs.set(BiomeType.MYSTICAL, {
      terrainAssets: [],
      decorationAssets: [],
      structureAssets: [],
      propAssets: [],
      probability: { decoration: 0.4, structure: 0.015, prop: 0.04 },
      tintColor: 0xdda0dd,
      scale: { min: 0.9, max: 1.3 },
    });
  }

  /**
   * Asigna assets específicos a cada bioma basado en temática
   */
  private async assignAssetsToBlomes(): Promise<void> {
    const allAssets = this.creativeLoader;

    // GRASSLAND - Praderas verdes naturales
    const grasslandConfig = this.biomeConfigs.get(BiomeType.GRASSLAND);
    grasslandConfig.terrainAssets = allAssets.getAssetsByBiome("grassland");
    grasslandConfig.decorationAssets = [
      ...allAssets
        .getAssetsByBiome("forest")
        .filter((a) => a.type === "foliage"),
      ...allAssets
        .getAssetsByBiome("forest")
        .filter((a) => a.type === "mushroom"),
    ];
    grasslandConfig.structureAssets = allAssets
      .getAssetsByBiome("village")
      .filter((a) => a.rarity === "common");
    grasslandConfig.propAssets = allAssets
      .getAssetsByBiome("village")
      .filter((a) => a.type === "prop" && a.rarity === "common");

    // FOREST - Bosques mágicos diversos
    const forestConfig = this.biomeConfigs.get(BiomeType.FOREST);
    forestConfig.terrainAssets = allAssets.getAssetsByBiome("grassland");
    forestConfig.decorationAssets = [
      ...allAssets.getAssetsByBiome("forest"),
      ...allAssets.getAssetsByBiome("mystical"),
      ...allAssets.getAssetsByBiome("magical"),
    ];
    forestConfig.structureAssets = allAssets
      .getAssetsByBiome("village")
      .filter((a) => a.rarity !== "epic");
    forestConfig.propAssets = allAssets
      .getAssetsByBiome("village")
      .filter((a) => a.type === "prop");

    // WETLAND - Pantanos y humedales
    const wetlandConfig = this.biomeConfigs.get(BiomeType.WETLAND);
    wetlandConfig.terrainAssets = allAssets.getAssetsByBiome("wetland");
    wetlandConfig.decorationAssets = [
      ...allAssets.getAssetsByBiome("wetland"),
      ...allAssets
        .getAssetsByBiome("forest")
        .filter((a) => a.key.includes("willow")),
    ];
    wetlandConfig.structureAssets = allAssets
      .getAssetsByBiome("wetland")
      .filter((a) => a.type === "ruin");
    wetlandConfig.propAssets = [];

    // VILLAGE - Pueblos con arquitectura
    const villageConfig = this.biomeConfigs.get(BiomeType.VILLAGE);
    villageConfig.terrainAssets = allAssets.getAssetsByBiome("village");
    villageConfig.decorationAssets = allAssets
      .getAssetsByBiome("village")
      .filter((a) => a.type === "foliage");
    villageConfig.structureAssets = allAssets
      .getAssetsByBiome("village")
      .filter((a) => a.type === "structure");
    villageConfig.propAssets = allAssets
      .getAssetsByBiome("village")
      .filter((a) => a.type === "prop");

    // MOUNTAINOUS - Montañas rocosas con ruinas
    const mountainConfig = this.biomeConfigs.get(BiomeType.MOUNTAINOUS);
    mountainConfig.terrainAssets = allAssets.getAssetsByBiome("mountain");
    mountainConfig.decorationAssets = [
      ...allAssets.getAssetsByBiome("mountain"),
      ...allAssets.getAssetsByBiome("desert"),
    ];
    mountainConfig.structureAssets = [
      ...allAssets.getAssetsByBiome("ancient"),
      ...allAssets.getAssetsByBiome("desert"),
    ];
    mountainConfig.propAssets = allAssets
      .getAssetsByBiome("village")
      .filter((a) => a.rarity === "uncommon");

    // MYSTICAL - Bioma mágico épico
    const mysticalConfig = this.biomeConfigs.get(BiomeType.MYSTICAL);
    mysticalConfig.terrainAssets = allAssets.getAssetsByBiome("grassland");
    mysticalConfig.decorationAssets = [
      ...allAssets.getAssetsByBiome("mystical"),
      ...allAssets.getAssetsByBiome("luminous"),
      ...allAssets.getAssetsByBiome("ethereal"),
      ...allAssets.getAssetsByBiome("sacred"),
    ];
    mysticalConfig.structureAssets = [
      ...allAssets.getAssetsByBiome("sacred"),
      ...allAssets.getAssetsByBiome("ethereal"),
    ];
    mysticalConfig.propAssets = allAssets
      .getAssetsByBiome("village")
      .filter((a) => a.rarity === "rare");
  }

  /**
   * Carga y renderiza mundo ultra-diverso
   */
  async renderDiverseWorld(
    world: GeneratedWorld,
    playerLevel: number = 1,
  ): Promise<void> {
    logAutopoiesis.info("🌍 Renderizando mundo con assets creativos reales");

    // 1. Cargar todos los assets
    await this.creativeLoader.loadAllAssets();

    // 2. Asignar assets a biomas
    await this.assignAssetsToBlomes();

    // 3. Renderizar el mundo por capas
    await this.renderTerrainLayer(world);
    await this.renderDecorationLayer(world, playerLevel);
    await this.renderStructureLayer(world, playerLevel);
    await this.renderPropLayer(world, playerLevel);

    logAutopoiesis.info(
      "✅ Mundo renderizado exitosamente con assets creativos",
    );
  }

  /**
   * Renderiza la capa base de terreno con máxima diversidad
   */
  private async renderTerrainLayer(world: GeneratedWorld): Promise<void> {
    const tileSize = 32;

    for (let y = 0; y < world.terrain.length; y++) {
      for (let x = 0; x < world.terrain[y].length; x++) {
        const tile = world.terrain[y][x];
        const config = this.biomeConfigs.get(tile.biome);

        if (!config || config.terrainAssets.length === 0) continue;

        // Selección inteligente de terreno
        const assetIndex = this.getVariedIndex(
          x,
          y,
          tile.biomeStrength,
          config.terrainAssets.length,
        );
        const selectedAsset = config.terrainAssets[assetIndex];

        if (selectedAsset && this.scene.textures.exists(selectedAsset.key)) {
          const sprite = this.scene.add.image(
            x * tileSize + tileSize / 2,
            y * tileSize + tileSize / 2,
            selectedAsset.key,
          );

          sprite.setDisplaySize(tileSize, tileSize);

          // Aplicar variaciones visuales
          this.applyBiomeVariations(
            sprite,
            tile.biome,
            tile.biomeStrength,
            config,
          );

          this.worldContainer.add(sprite);
        }
      }
    }
  }

  /**
   * Renderiza decoraciones naturales (árboles, rocas, hongos)
   */
  private async renderDecorationLayer(
    world: GeneratedWorld,
    playerLevel: number,
  ): Promise<void> {
    const tileSize = 32;

    for (let y = 0; y < world.terrain.length; y++) {
      for (let x = 0; x < world.terrain[y].length; x++) {
        const tile = world.terrain[y][x];
        const config = this.biomeConfigs.get(tile.biome);

        if (!config || config.decorationAssets.length === 0) continue;

        // Probabilidad de decoración basada en bioma y fuerza
        const decorationChance =
          config.probability.decoration * tile.biomeStrength;
        const random = this.getSeededRandom(x, y, 1);

        if (random < decorationChance) {
          // Filtrar por nivel del jugador
          const availableDecorations = config.decorationAssets.filter(
            (asset) => (asset.unlockLevel ?? 0) <= playerLevel,
          );

          if (availableDecorations.length > 0) {
            const assetIndex = this.getVariedIndex(
              x,
              y,
              tile.biomeStrength,
              availableDecorations.length,
            );
            const selectedAsset = availableDecorations[assetIndex];

            if (
              selectedAsset &&
              this.scene.textures.exists(selectedAsset.key)
            ) {
              const sprite = this.scene.add.image(
                x * tileSize + tileSize / 2,
                y * tileSize + tileSize / 2,
                selectedAsset.key,
              );

              // Tamaño basado en rareza
              const baseSize = this.getSizeByRarity(selectedAsset.rarity);
              sprite.setDisplaySize(baseSize, baseSize);

              // Variaciones creativas
              this.applyDecorationVariations(
                sprite,
                selectedAsset,
                tile.biomeStrength,
              );

              this.decorationContainer.add(sprite);
            }
          }
        }
      }
    }
  }

  /**
   * Renderiza estructuras (casas, ruinas, edificios)
   */
  private async renderStructureLayer(
    world: GeneratedWorld,
    playerLevel: number,
  ): Promise<void> {
    const tileSize = 32;

    for (let y = 0; y < world.terrain.length; y++) {
      for (let x = 0; x < world.terrain[y].length; x++) {
        const tile = world.terrain[y][x];
        const config = this.biomeConfigs.get(tile.biome);

        if (!config || config.structureAssets.length === 0) continue;

        const structureChance =
          config.probability.structure * tile.biomeStrength;
        const random = this.getSeededRandom(x, y, 2);

        if (random < structureChance) {
          const availableStructures = config.structureAssets.filter(
            (asset) => (asset.unlockLevel ?? 0) <= playerLevel,
          );

          if (availableStructures.length > 0) {
            const assetIndex = this.getVariedIndex(
              x,
              y,
              tile.biomeStrength,
              availableStructures.length,
            );
            const selectedAsset = availableStructures[assetIndex];

            if (
              selectedAsset &&
              this.scene.textures.exists(selectedAsset.key)
            ) {
              const sprite = this.scene.add.image(
                x * tileSize + tileSize / 2,
                y * tileSize + tileSize / 2 - 16, // Offset hacia arriba
                selectedAsset.key,
              );

              const structureSize = tileSize * 2; // Estructuras más grandes
              sprite.setDisplaySize(structureSize, structureSize);

              this.applyStructureVariations(
                sprite,
                selectedAsset,
                tile.biomeStrength,
              );

              this.structureContainer.add(sprite);
            }
          }
        }
      }
    }
  }

  /**
   * Renderiza props pequeños (mobiliario, objetos)
   */
  private async renderPropLayer(
    world: GeneratedWorld,
    playerLevel: number,
  ): Promise<void> {
    const tileSize = 32;

    for (let y = 0; y < world.terrain.length; y++) {
      for (let x = 0; x < world.terrain[y].length; x++) {
        const tile = world.terrain[y][x];
        const config = this.biomeConfigs.get(tile.biome);

        if (!config || config.propAssets.length === 0) continue;

        const propChance = config.probability.prop * tile.biomeStrength;
        const random = this.getSeededRandom(x, y, 3);

        if (random < propChance) {
          const availableProps = config.propAssets.filter(
            (asset) => (asset.unlockLevel ?? 0) <= playerLevel,
          );

          if (availableProps.length > 0) {
            const assetIndex = this.getVariedIndex(
              x,
              y,
              tile.biomeStrength,
              availableProps.length,
            );
            const selectedAsset = availableProps[assetIndex];

            if (
              selectedAsset &&
              this.scene.textures.exists(selectedAsset.key)
            ) {
              const sprite = this.scene.add.image(
                x * tileSize + tileSize / 2,
                y * tileSize + tileSize / 2,
                selectedAsset.key,
              );

              const propSize = tileSize * 0.75; // Props más pequeños
              sprite.setDisplaySize(propSize, propSize);

              this.applyPropVariations(
                sprite,
                selectedAsset,
                tile.biomeStrength,
              );

              this.propContainer.add(sprite);
            }
          }
        }
      }
    }
  }

  /**
   * Aplica variaciones visuales basadas en bioma
   */
  private applyBiomeVariations(
    sprite: Phaser.GameObjects.Image,
    biome: BiomeType,
    strength: number,
    config: BiomeVisualConfig,
  ): void {
    // Tinte del bioma
    sprite.setTint(config.tintColor);

    // Escala variable
    const scaleRange = config.scale.max - config.scale.min;
    const scale = config.scale.min + strength * scaleRange;
    sprite.setScale(scale);

    // Rotación sutil
    const rotation = (strength - 0.5) * 0.1;
    sprite.setRotation(rotation);

    // Alpha variation para profundidad
    const alpha = 0.85 + strength * 0.15;
    sprite.setAlpha(alpha);
  }

  /**
   * Aplica variaciones creativas a decoraciones
   */
  private applyDecorationVariations(
    sprite: Phaser.GameObjects.Image,
    asset: AssetInfo,
    strength: number,
  ): void {
    // Variaciones por rareza
    switch (asset.rarity) {
      case "epic":
        sprite.setTint(0xffd700); // Dorado
        sprite.setScale(1.5 + strength * 0.5);
        break;
      case "rare":
        sprite.setTint(0x9932cc); // Púrpura
        sprite.setScale(1.2 + strength * 0.3);
        break;
      case "uncommon":
        sprite.setTint(0x1e90ff); // Azul
        sprite.setScale(1.0 + strength * 0.2);
        break;
      default:
        sprite.setScale(0.8 + strength * 0.4);
    }

    // Efectos especiales para assets épicos
    if (asset.rarity === "epic") {
      this.addGlowEffect(sprite);
    }
  }

  /**
   * Aplica variaciones a estructuras
   */
  private applyStructureVariations(
    sprite: Phaser.GameObjects.Image,
    asset: AssetInfo,
    strength: number,
  ): void {
    sprite.setScale(1.5 + strength * 0.5);

    if (asset.rarity === "rare" || asset.rarity === "epic") {
      sprite.setTint(0xfff8dc); // Color marfil para estructuras especiales
    }
  }

  /**
   * Aplica variaciones a props
   */
  private applyPropVariations(
    sprite: Phaser.GameObjects.Image,
    asset: AssetInfo,
    strength: number,
  ): void {
    sprite.setScale(0.5 + strength * 0.5);

    // Rotación aleatoria para props
    const rotation = strength * Math.PI * 2;
    sprite.setRotation(rotation);
  }

  /**
   * Añade efecto de brillo para assets épicos
   */
  private addGlowEffect(sprite: Phaser.GameObjects.Image): void {
    const glow = this.scene.add.circle(sprite.x, sprite.y, 20, 0xffffff, 0.3);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    this.decorationContainer.add(glow);
  }

  /**
   * Obtiene tamaño basado en rareza
   */
  private getSizeByRarity(rarity?: string): number {
    switch (rarity) {
      case "epic":
        return 64;
      case "rare":
        return 48;
      case "uncommon":
        return 40;
      default:
        return 32;
    }
  }

  /**
   * Genera índice variado basado en posición y fuerza
   */
  private getVariedIndex(
    x: number,
    y: number,
    strength: number,
    arrayLength: number,
  ): number {
    const seed = (x * 73 + y * 137 + Math.floor(strength * 100)) % 1000;
    return seed % arrayLength;
  }

  /**
   * Genera número pseudo-aleatorio basado en semilla
   */
  private getSeededRandom(x: number, y: number, salt: number): number {
    const seed = (x * 73 + y * 137 + salt * 199) % 1000;
    return seed / 1000;
  }

  /**
   * Obtiene estadísticas del mundo renderizado
   */
  getWorldStats(): { totalRendered: number; [key: string]: number } {
    const terrainCount = this.worldContainer?.list?.length || 0;
    const decorationCount = this.decorationContainer?.list?.length || 0;
    const structureCount = this.structureContainer?.list?.length || 0;
    const propCount = this.propContainer?.list?.length || 0;

    const assetStats = this.creativeLoader.getAssetStats();
    const totalAssets = Object.values(assetStats).reduce(
      (sum, count) => sum + count,
      0,
    );

    return {
      totalAssets,
      terrainSprites: terrainCount,
      decorationSprites: decorationCount,
      structureSprites: structureCount,
      propSprites: propCount,
      totalRendered:
        terrainCount + decorationCount + structureCount + propCount,
    };
  }

  /**
   * Limpia todos los contenedores renderizados
   */
  cleanup(): void {
    try {
      if (this.worldContainer) {
        this.worldContainer.removeAll(true);
      }
      if (this.decorationContainer) {
        this.decorationContainer.removeAll(true);
      }
      if (this.structureContainer) {
        this.structureContainer.removeAll(true);
      }
      if (this.propContainer) {
        this.propContainer.removeAll(true);
      }
      logAutopoiesis.info("🧹 BiomeAssetRenderer limpiado exitosamente");
    } catch (error) {
      logAutopoiesis.error("Error limpiando BiomeAssetRenderer:", error);
    }
  }
}
