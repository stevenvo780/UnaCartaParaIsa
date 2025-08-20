/**
 * World Renderer - Maneja todo el rendering visual del mundo
 * Ahora usa sistema profesional de tilemaps de Phaser
 */

import { GAME_BALANCE } from '../constants/gameBalance';
import type { GameState, MapElement, Zone } from '../types';
import { logAutopoiesis } from '../utils/logger';
import { BiomeAssetRenderer } from '../world/BiomeAssetRenderer';
import type { GeneratedWorld } from '../world/types';
import { AnimationManager } from './AnimationManager';

export class WorldRenderer {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private renderedObjects = new Map<string, Phaser.GameObjects.GameObject>();
  private zoneGraphics: Phaser.GameObjects.Graphics[] = [];
  private animationManager?: AnimationManager;
  private decorationSprites: Phaser.GameObjects.Sprite[] = [];
  private lastCullingUpdate = 0;
  private readonly CULLING_UPDATE_INTERVAL = 100; // Update every 100ms

  // Sistema simplificado de assets creativos
  private biomeAssetRenderer?: BiomeAssetRenderer;
  private useCreativeAssets = false; // Deshabilitado hasta resolver carga de assets

  // Sistema dinámico de assets
  private selectedAssets: Record<string, string[]> = {};
  private worldSeed: number = Math.floor(Math.random() * 1000000);
  private placedAssets: Array<{
    key: string;
    position: { x: number; y: number };
    category: string;
    sprite: Phaser.GameObjects.Image;
  }> = [];

  constructor(scene: Phaser.Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;

    // Crear renderizador de assets creativos
    this.biomeAssetRenderer = new BiomeAssetRenderer(scene);

    // Get animation manager from scene registry with type safety
    const animManager = scene.registry.get('animationManager');
    if (animManager && animManager instanceof AnimationManager) {
      this.animationManager = animManager;
      logAutopoiesis.info(
        'AnimationManager available in WorldRenderer, using animated decorations'
      );
    } else {
      this.animationManager = undefined;
      logAutopoiesis.warn(
        'AnimationManager not available in WorldRenderer, using static decorations'
      );
    }

    logAutopoiesis.info(
      'WorldRenderer inicializado con sistema de assets creativos'
    );
  }

  /**
   * Render the complete world - ahora con sistema de assets creativos
   */
  public async renderWorld(generatedWorld?: GeneratedWorld): Promise<void> {
    // Initialize dynamic asset selection system
    this.initializeDynamicAssets();

    if (this.useCreativeAssets && generatedWorld && this.biomeAssetRenderer) {
      // Usar sistema de assets creativos
      await this.renderWorldWithCreativeAssets(generatedWorld);
    } else {
      // Fallback al sistema anterior con assets dinámicos
      this.renderWorldLegacy();
    }

    logAutopoiesis.info('🌍 World rendered successfully with dynamic assets', {
      selectedAssetsCount: Object.values(this.selectedAssets).flat().length,
      placedAssetsCount: this.placedAssets.length,
      seed: this.worldSeed,
    });
  }

  /**
   * Renderiza el mundo usando assets creativos ultra-diversos
   */
  private async renderWorldWithCreativeAssets(
    world: GeneratedWorld
  ): Promise<void> {
    logAutopoiesis.info('🎨 Renderizando mundo con assets creativos reales');

    try {
      // Obtener nivel de progreso del jugador (simulado por ahora)
      const playerLevel = this.gameState.playerLevel || 1;

      // Intentar renderizar usando el nuevo sistema ultra-diverso
      await this.biomeAssetRenderer.renderDiverseWorld(world, playerLevel);

      // Verificar si algo se renderizó
      const stats = this.biomeAssetRenderer.getWorldStats();
      if (stats.totalRendered === 0) {
        logAutopoiesis.warn(
          '⚠️ Sistema creativo no renderizó nada, usando fallback'
        );
        throw new Error('No creative assets rendered');
      }

      // Renderizar zonas encima de los assets
      this.renderZones();

      // Renderizar elementos interactivos con diversidad
      this.renderMapElements();

      // Renderizar decoraciones animadas mejoradas
      this.renderAnimatedDecorations();

      // Renderizar estructuras y props para ambiente de zonas
      this.renderStructuresAndProps();

      // Mostrar estadísticas del mundo renderizado
      logAutopoiesis.info('📊 Estadísticas del mundo diverso:', stats);

      logAutopoiesis.info('✨ Mundo renderizado con diversidad creativa');
    } catch (error) {
      logAutopoiesis.error(
        '❌ Error renderizando con assets creativos, fallback a sistema anterior',
        error
      );

      // Limpiar cualquier renderizado parcial
      this.clearRenderedObjects();

      // Usar el sistema legacy como fallback
      this.renderWorldLegacy();
    }
  }

  /**
   * Renderiza el mundo usando el sistema anterior (fallback)
   */
  private renderWorldLegacy(): void {
    this.createWorldBackground();
    this.renderZones();
    this.renderMapElements();
    this.renderDecorations();
    this.renderStructuresAndProps();

    logAutopoiesis.info('World rendering completed', {
      zones: this.gameState.zones.length,
      elements: this.gameState.mapElements.length,
      objects: this.renderedObjects.size,
    });
  }

  /**
   * Create world background using real grass assets
   */
  private createWorldBackground(): void {
    const tileSize = GAME_BALANCE.VISUALS.TILE_SIZE;
    const worldWidth = this.gameState.worldSize.width;
    const worldHeight = this.gameState.worldSize.height;

    // Usar assets reales de césped disponibles según AssetManager
    const realGrassAssets = ['grass_1', 'grass_2', 'grass_3', 'grass_middle'];

    // Cargar assets si no existen
    this.preloadGrassAssets(realGrassAssets);

    for (let x = 0; x < worldWidth; x += tileSize) {
      for (let y = 0; y < worldHeight; y += tileSize) {
        // Selección inteligente basada en posición para crear patrones naturales
        const seed = (x * 73 + y * 137) % 1000;
        const assetIndex = seed % realGrassAssets.length;
        const selectedGrass = realGrassAssets[assetIndex];

        // Crear sprite con fallback
        let grassTile;
        if (this.scene.textures.exists(selectedGrass)) {
          grassTile = this.scene.add.image(
            x + tileSize / 2,
            y + tileSize / 2,
            selectedGrass
          );
        } else {
          // Fallback: crear texture simple si el asset no existe
          this.createFallbackGrassTexture(selectedGrass);
          grassTile = this.scene.add.image(
            x + tileSize / 2,
            y + tileSize / 2,
            selectedGrass
          );
        }

        grassTile.setDisplaySize(tileSize, tileSize);
        grassTile.setDepth(0);

        // Añadir variación visual sutil
        const variation = (seed % 100) / 100;
        grassTile.setTint(
          Phaser.Display.Color.GetColor(
            200 + Math.floor(variation * 55), // R: 200-255
            220 + Math.floor(variation * 35), // G: 220-255
            180 + Math.floor(variation * 35) // B: 180-215 (más verde)
          )
        );

        this.renderedObjects.set(`grass_${x}_${y}`, grassTile);
      }
    }

    logAutopoiesis.info('✅ World background created with real grass assets', {
      tileCount:
        Math.ceil(worldWidth / tileSize) * Math.ceil(worldHeight / tileSize),
      assetsUsed: realGrassAssets.length,
    });
  }

  /**
   * Precarga assets de césped reales - Los assets ya están definidos en AssetManager
   */
  private preloadGrassAssets(grassAssets: string[]): void {
    // Los assets ya deberían estar cargados por AssetManager
    // Solo verificamos que existan
    const missingAssets = grassAssets.filter(
      assetKey => !this.scene.textures.exists(assetKey)
    );

    if (missingAssets.length > 0) {
      logAutopoiesis.warn('Assets de césped faltantes:', missingAssets);

      // Cargar manualmente los que falten
      missingAssets.forEach(assetKey => {
        let assetPath = '';

        if (assetKey === 'grass_1') {
          assetPath = 'assets/terrain/base/cesped1.png';
        } else if (assetKey === 'grass_2') {
          assetPath = 'assets/terrain/base/cesped2.png';
        } else if (assetKey === 'grass_3') {
          assetPath = 'assets/terrain/base/cesped3.png';
        } else if (assetKey === 'grass_middle') {
          assetPath = 'assets/terrain/base/Grass_Middle.png';
        }

        if (assetPath) {
          try {
            this.scene.load.image(assetKey, assetPath);
          } catch (error) {
            logAutopoiesis.warn(`No se pudo cargar ${assetKey}:`, error);
          }
        }
      });

      // Iniciar carga si hay assets pendientes
      if (!this.scene.load.isLoading()) {
        this.scene.load.start();
      }
    }
  }

  /**
   * Crea texture de fallback para césped
   */
  private createFallbackGrassTexture(key: string): void {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x90ee90); // Verde césped
    graphics.fillRect(0, 0, 32, 32);

    // Añadir textura simple
    graphics.fillStyle(0x7ccd7c);
    for (let i = 0; i < 8; i++) {
      graphics.fillCircle(Math.random() * 32, Math.random() * 32, 2);
    }

    graphics.generateTexture(key, 32, 32);
    graphics.destroy();
  }

  /**
   * Render all zones visually with dynamic asset placement
   */
  private renderZones(): void {
    this.gameState.zones.forEach((zone, index) => {
      this.renderSingleZone(zone, index);
      this.placeAssetsInZone(zone, index);
    });
  }

  /**
   * Places selected assets intelligently within a zone
   */
  private placeAssetsInZone(zone: Zone, zoneIndex: number): void {
    const selectedAssets = this.getSelectedAssets();
    const zoneType = this.getZoneType(zone);

    // Determine which asset categories fit this zone type
    const suitableCategories = this.getSuitableCategoriesForZone(zoneType);

    // Place assets based on zone characteristics
    suitableCategories.forEach(category => {
      const assetsForCategory = selectedAssets[category] || [];
      const placementCount = this.getPlacementCountForCategory(category, zone);

      for (
        let i = 0;
        i < Math.min(placementCount, assetsForCategory.length);
        i++
      ) {
        const assetKey = assetsForCategory[i];
        const position = this.getValidPlacementPosition(
          zone,
          i,
          placementCount
        );

        if (position) {
          this.placeAsset(assetKey, position, category);
        }
      }
    });
  }

  /**
   * Determines zone type based on zone properties
   */
  private getZoneType(zone: Zone): string {
    // Analyze zone properties to determine type
    if (zone.type === 'social') return 'social';
    if (zone.type === 'work') return 'work';
    if (zone.type === 'rest') return 'rest';
    if (zone.type === 'food') return 'eating';
    if (zone.type === 'recreation') return 'entertainment';

    // Default classification based on size and position
    const size = zone.bounds.width * zone.bounds.height;
    if (size > 50000) return 'large_area';
    if (size > 20000) return 'medium_area';
    return 'small_area';
  }

  /**
   * Returns suitable asset categories for each zone type
   */
  private getSuitableCategoriesForZone(zoneType: string): string[] {
    const categoryMap: Record<string, string[]> = {
      social: ['structures', 'furniture', 'decorative'],
      work: ['structures', 'furniture', 'containers'],
      rest: ['structures', 'furniture', 'decorative'],
      eating: ['structures', 'furniture', 'containers'],
      entertainment: ['decorative', 'furniture', 'streetItems'],
      large_area: ['structures', 'streetItems', 'decorative'],
      medium_area: ['furniture', 'containers', 'decorative'],
      small_area: ['furniture', 'decorative', 'urban'],
    };

    return categoryMap[zoneType] || ['decorative'];
  }

  /**
   * Determines how many assets to place per category in a zone
   */
  private getPlacementCountForCategory(category: string, zone: Zone): number {
    const zoneSize = zone.bounds.width * zone.bounds.height;
    const baseDensity = zoneSize / 25000; // Base density factor

    const categoryMultipliers: Record<string, number> = {
      structures: 0.3, // Fewer large structures
      furniture: 0.8, // More furniture
      streetItems: 0.5, // Medium street items
      containers: 0.4, // Some containers
      decorative: 1.0, // Most decorative items
      urban: 0.6, // Some urban elements
    };

    const multiplier = categoryMultipliers[category] || 0.5;
    return Math.max(1, Math.floor(baseDensity * multiplier));
  }

  /**
   * Finds a valid position within a zone for asset placement
   */
  private getValidPlacementPosition(
    zone: Zone,
    assetIndex: number,
    totalAssets: number
  ): { x: number; y: number } | null {
    const margin = 50; // Margin from zone edges
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Use grid-based placement with some randomness
      const gridX =
        (assetIndex % Math.ceil(Math.sqrt(totalAssets))) /
        Math.ceil(Math.sqrt(totalAssets));
      const gridY =
        Math.floor(assetIndex / Math.ceil(Math.sqrt(totalAssets))) /
        Math.ceil(Math.sqrt(totalAssets));

      // Add randomness to grid position
      const randomOffsetX = (Math.random() - 0.5) * 0.3;
      const randomOffsetY = (Math.random() - 0.5) * 0.3;

      const x =
        zone.bounds.x +
        margin +
        (zone.bounds.width - 2 * margin) * (gridX + randomOffsetX);
      const y =
        zone.bounds.y +
        margin +
        (zone.bounds.height - 2 * margin) * (gridY + randomOffsetY);

      // Ensure position is within zone bounds
      if (
        x >= zone.bounds.x + margin &&
        x <= zone.bounds.x + zone.bounds.width - margin &&
        y >= zone.bounds.y + margin &&
        y <= zone.bounds.y + zone.bounds.height - margin
      ) {
        return { x, y };
      }
    }

    return null;
  }

  /**
   * Places an asset at the specified position
   */
  private placeAsset(
    assetKey: string,
    position: { x: number; y: number },
    category: string
  ): void {
    try {
      // Determine asset path based on category
      const assetPath = this.getAssetPath(assetKey, category);

      // Create the asset sprite
      const asset = this.scene.add.image(position.x, position.y, assetKey);

      // Set appropriate scale based on category
      const scale = this.getAssetScale(category);
      asset.setScale(scale);

      // Set depth based on category (structures in back, decorative in front)
      const depth = this.getAssetDepth(category);
      asset.setDepth(depth);

      // Add to tracking
      this.placedAssets.push({
        key: assetKey,
        position,
        category,
        sprite: asset,
      });

      logAutopoiesis.debug(
        `Asset placed: ${assetKey} at (${position.x}, ${position.y})`
      );
    } catch (error) {
      logAutopoiesis.warn(`Failed to place asset: ${assetKey}`, error);
    }
  }

  /**
   * Gets appropriate scale for asset category
   */
  private getAssetScale(category: string): number {
    const scaleMap: Record<string, number> = {
      structures: 1.0,
      furniture: 0.8,
      streetItems: 0.9,
      containers: 0.7,
      decorative: 0.6,
      urban: 0.5,
    };

    return scaleMap[category] || 0.8;
  }

  /**
   * Gets appropriate depth for asset category
   */
  private getAssetDepth(category: string): number {
    const depthMap: Record<string, number> = {
      structures: 1,
      furniture: 3,
      streetItems: 4,
      containers: 2,
      decorative: 5,
      urban: 2,
    };

    return depthMap[category] || 3;
  }

  /**
   * Render a single zone
   */
  private renderSingleZone(zone: Zone, _index: number): void {
    let colorValue: number = GAME_BALANCE.ZONES.SOCIAL_COLOR;
    if (zone.color.startsWith('rgba(')) {
      const rgbaMatch = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(zone.color);
      if (rgbaMatch) {
        const [, r, g, b] = rgbaMatch.map(Number);
        colorValue = (r << 16) | (g << 8) | b;
      }
    }

    const zoneRect = this.scene.add.rectangle(
      zone.bounds.x + zone.bounds.width / 2,
      zone.bounds.y + zone.bounds.height / 2,
      zone.bounds.width,
      zone.bounds.height,
      colorValue,
      GAME_BALANCE.ZONES.DEFAULT_ALPHA
    );
    zoneRect.setStrokeStyle(
      GAME_BALANCE.ZONES.STROKE_WIDTH,
      colorValue,
      GAME_BALANCE.ZONES.STROKE_ALPHA
    );
    zoneRect.setDepth(GAME_BALANCE.ZONES.DEPTH);

    const label = this.scene.add.text(
      zone.bounds.x + zone.bounds.width / 2,
      zone.bounds.y + zone.bounds.height / 2,
      zone.name,
      {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        align: 'center',
      }
    );
    label.setOrigin(0.5);
    label.setDepth(3);
    label.setStroke('#000000', 3);

    this.renderedObjects.set(`zone_${zone.id}`, zoneRect);
    this.renderedObjects.set(`zone_label_${zone.id}`, label);
  }

  /**
   * Render map elements
   */
  private renderMapElements(): void {
    this.gameState.mapElements.forEach((element, index) => {
      this.renderSingleMapElement(element, index);
    });
  }

  /**
   * Render a single map element
   */
  private renderSingleMapElement(element: MapElement, _index: number): void {
    const colorValue =
      typeof element.color === 'string'
        ? parseInt(element.color.replace('#', ''), 16)
        : element.color;

    const elementRect = this.scene.add.rectangle(
      element.position.x + element.size.width / 2,
      element.position.y + element.size.height / 2,
      element.size.width,
      element.size.height,
      colorValue,
      0.8
    );
    elementRect.setStrokeStyle(1, 0xffffff, 0.6);
    elementRect.setDepth(2);

    this.renderedObjects.set(`element_${element.id}`, elementRect);
  }

  /**
   * Renderiza estructuras y props para ambientar zonas
   */
  private renderStructuresAndProps(): void {
    this.renderVillageStructures();
    this.renderEnvironmentalProps();
    logAutopoiesis.info('Structures and props rendered for zone ambience');
  }

  /**
   * Obtiene la ruta correcta para un asset según su categoría
   */
  private getAssetPath(assetKey: string, category?: string): string {
    if (
      category === 'structures' ||
      assetKey.startsWith('Assets_source') ||
      assetKey.startsWith('House') ||
      assetKey.includes('Well') ||
      assetKey.includes('Gate') ||
      assetKey === 'Fences'
    ) {
      return `assets/structures/estructuras_completas/${assetKey}.png`;
    }

    // Todo lo demás está en props
    return `assets/props/${assetKey}.png`;
  }

  /**
   * Renderiza estructuras de pueblo cerca de zonas - SIMPLIFICADO
   */
  private renderVillageStructures(): void {
    // Solo renderizar una estructura por zona para mejorar rendimiento
    this.gameState.zones.slice(0, 3).forEach((zone, index) => {
      const centerX = zone.bounds.x + zone.bounds.width / 2;
      const centerY = zone.bounds.y + zone.bounds.height / 2;

      // Solo añadir una estructura principal por zona
      switch (index % 3) {
        case 0:
          this.addStructureNearZone(centerX + 80, centerY - 60, 'House', 1.0);
          break;
        case 1:
          this.addStructureNearZone(
            centerX - 80,
            centerY + 60,
            'House_Hay_1',
            1.0
          );
          break;
        case 2:
          this.addStructureNearZone(centerX, centerY + 80, 'House_Hay_2', 1.0);
          break;
      }
    });
  }

  /**
   * Renderiza props ambientales REDUCIDOS para mejor rendimiento
   */
  private renderEnvironmentalProps(): void {
    // Solo añadir algunos props básicos
    const basicProps = [
      { x: 200, y: 150, asset: 'LampPost_3', scale: 1.0 },
      { x: 600, y: 200, asset: 'Bench_1', scale: 1.0 },
      { x: 400, y: 450, asset: 'Sign_1', scale: 1.0 },
    ];

    basicProps.forEach((prop, index) => {
      this.addEnvironmentalProp(prop.x, prop.y, prop.asset, prop.scale, index);
    });
  }

  /**
   * Añade una estructura cerca de una zona
   */
  private addStructureNearZone(
    x: number,
    y: number,
    assetKey: string,
    scale: number
  ): void {
    if (this.scene.textures.exists(assetKey)) {
      const structure = this.scene.add.image(x, y, assetKey);
      structure.setScale(scale);
      structure.setDepth(4); // Structures en capa superior
      structure.setOrigin(0.5, 0.8); // Base en la parte inferior

      this.renderedObjects.set(`structure_${assetKey}_${x}_${y}`, structure);
    } else {
      // Fallback: crear placeholder visual
      this.createStructurePlaceholder(x, y, assetKey, scale);
    }
  }

  /**
   * Añade un prop cerca de una zona
   */
  private addPropNearZone(
    x: number,
    y: number,
    assetKey: string,
    scale: number
  ): void {
    if (this.scene.textures.exists(assetKey)) {
      const prop = this.scene.add.image(x, y, assetKey);
      prop.setScale(scale);
      prop.setDepth(3); // Props debajo de structures
      prop.setOrigin(0.5, 0.8);

      this.renderedObjects.set(`prop_${assetKey}_${x}_${y}`, prop);
    } else {
      this.createPropPlaceholder(x, y, assetKey, scale);
    }
  }

  /**
   * Añade un prop ambiental
   */
  private addEnvironmentalProp(
    x: number,
    y: number,
    assetKey: string,
    scale: number,
    index: number
  ): void {
    if (this.scene.textures.exists(assetKey)) {
      const prop = this.scene.add.image(x, y, assetKey);
      prop.setScale(scale);
      prop.setDepth(2.5); // Props ambientales debajo de zone props
      prop.setOrigin(0.5, 0.8);
      prop.setAlpha(0.9); // Ligeramente transparentes para no sobresalir

      this.renderedObjects.set(`env_prop_${index}`, prop);
    } else {
      this.createPropPlaceholder(x, y, assetKey, scale);
    }
  }

  /**
   * Crea placeholder para estructura no encontrada
   */
  private createStructurePlaceholder(
    x: number,
    y: number,
    name: string,
    scale: number
  ): void {
    const placeholder = this.scene.add.rectangle(
      x,
      y,
      60 * scale,
      80 * scale,
      0x8b4513,
      0.8
    );
    placeholder.setStrokeStyle(2, 0xdeb887);
    placeholder.setDepth(4);

    const label = this.scene.add.text(x, y, name.substring(0, 4), {
      fontSize: '10px',
      color: '#FFFFFF',
      fontFamily: 'Arial',
    });
    label.setOrigin(0.5);
    label.setDepth(4.1);

    this.renderedObjects.set(`structure_placeholder_${x}_${y}`, placeholder);
    this.renderedObjects.set(`structure_label_${x}_${y}`, label);
  }

  /**
   * Crea placeholder para prop no encontrado
   */
  private createPropPlaceholder(
    x: number,
    y: number,
    name: string,
    scale: number
  ): void {
    const placeholder = this.scene.add.circle(x, y, 15 * scale, 0x654321, 0.7);
    placeholder.setStrokeStyle(1, 0xdeb887);
    placeholder.setDepth(3);

    this.renderedObjects.set(`prop_placeholder_${x}_${y}`, placeholder);
  }

  /**
   * Renderiza decoraciones animadas mejoradas
   */
  private renderAnimatedDecorations(): void {
    if (!this.animationManager) {
      logAutopoiesis.warn(
        'AnimationManager no disponible, usando decoraciones estáticas'
      );
      this.renderDecorations();
      return;
    }

    const enhancedDecorations = [
      {
        x: 150,
        y: 120,
        animation: 'flowers_red_sway',
        fallbackSprite: 'flowers-red',
        scale: 1.2,
        tint: 0xff6b6b,
      },
      {
        x: 300,
        y: 180,
        animation: 'flowers_white_sway',
        fallbackSprite: 'flowers-white',
        scale: 1.1,
        tint: 0xf7f7f7,
      },
      {
        x: 500,
        y: 250,
        animation: 'campfire_burning',
        fallbackSprite: 'campfire',
        scale: 1.5,
        tint: 0xff7700,
        glow: true,
      },
      {
        x: 800,
        y: 400,
        animation: 'flag_wave',
        fallbackSprite: 'checkpoint-flag',
        scale: 1.3,
        tint: 0x4169e1,
      },
    ];

    enhancedDecorations.forEach((decoration, index) => {
      this.createEnhancedDecoration(decoration, index);
    });

    logAutopoiesis.info(
      `Animated decorations rendered {count: ${enhancedDecorations.length}, animated: true}`
    );
  }

  /**
   * Crea decoración mejorada con efectos especiales
   */
  private createEnhancedDecoration(decoration: any, index: number): void {
    const sprite = this.animationManager.createAnimatedSprite(
      decoration.x,
      decoration.y,
      decoration.animation,
      decoration.fallbackSprite
    );

    if (sprite) {
      sprite.setScale(decoration.scale || 1.0);
      sprite.setTint(decoration.tint || 0xffffff);
      sprite.setDepth(3 + index);

      // Añadir efecto de brillo para decoraciones especiales
      if (decoration.glow) {
        const glow = this.scene.add.circle(
          decoration.x,
          decoration.y,
          30,
          0xffffff,
          0.2
        );
        glow.setBlendMode(Phaser.BlendModes.ADD);
        glow.setDepth(2);
      }

      this.decorationSprites.push(sprite);
    }
  }

  /**
   * Create decorative elements (fallback method)
   */
  private renderDecorations(): void {
    const animatedDecorations = [
      {
        x: 150,
        y: 120,
        animation: 'flowers_red_sway',
        fallbackSprite: 'flowers-red',
      },
      {
        x: 300,
        y: 180,
        animation: 'flowers_white_sway',
        fallbackSprite: 'flowers-white',
      },
      {
        x: 500,
        y: 250,
        animation: 'campfire_burning',
        fallbackSprite: 'campfire',
      },
      {
        x: 650,
        y: 150,
        animation: 'flowers_red_sway',
        fallbackSprite: 'flowers-red',
      },
      {
        x: 800,
        y: 300,
        animation: 'flowers_white_sway',
        fallbackSprite: 'flowers-white',
      },
      {
        x: 200,
        y: 400,
        animation: 'campfire_burning',
        fallbackSprite: 'campfire',
      },
      {
        x: 750,
        y: 450,
        animation: 'flag_wave',
        fallbackSprite: 'checkpoint-flag',
      },
      {
        x: 600,
        y: 500,
        animation: 'flag_wave',
        fallbackSprite: 'checkpoint-flag',
      },
    ];

    animatedDecorations.forEach((deco, index) => {
      let decoration: Phaser.GameObjects.Sprite;

      // Try to create animated decoration with validation
      if (this.animationManager?.hasAnimation(deco.animation)) {
        const animatedSprite = this.animationManager.createAnimatedSprite(
          deco.x,
          deco.y,
          deco.animation,
          true
        );

        if (animatedSprite) {
          decoration = animatedSprite;
          logAutopoiesis.debug(
            `Created animated decoration: ${deco.animation}`,
            {
              x: deco.x,
              y: deco.y,
            }
          );
        } else {
          // Fallback to static sprite if animation creation failed
          decoration = this.createFallbackDecoration(deco);
        }
      } else {
        // No animation manager or animation not found, use static sprite
        decoration = this.createFallbackDecoration(deco);
      }

      // Set common properties
      decoration.setScale(GAME_BALANCE.DECORATIONS.CAMPFIRE_SCALE);
      decoration.setDepth(GAME_BALANCE.DECORATIONS.DECORATION_DEPTH);

      // Add random slight variations
      decoration.setRotation((Math.random() - 0.5) * 0.2);
      const scaleVariation = 0.8 + Math.random() * 0.4;
      decoration.setScale(
        GAME_BALANCE.DECORATIONS.CAMPFIRE_SCALE * scaleVariation
      );

      // Store decoration in both maps for tracking
      this.renderedObjects.set(`decoration_${index}`, decoration);
      this.decorationSprites.push(decoration);
    });

    logAutopoiesis.info('Animated decorations rendered', {
      count: animatedDecorations.length,
      animated: !!this.animationManager,
    });
  }

  /**
   * Create fallback decoration with validation
   */
  private createFallbackDecoration(deco: {
    x: number;
    y: number;
    fallbackSprite: string;
    animation: string;
  }): Phaser.GameObjects.Sprite {
    // Check if fallback sprite exists
    if (this.scene.textures.exists(deco.fallbackSprite)) {
      const decoration = this.scene.add.sprite(
        deco.x,
        deco.y,
        deco.fallbackSprite
      );
      logAutopoiesis.debug(
        `Created fallback decoration: ${deco.fallbackSprite}`,
        {
          x: deco.x,
          y: deco.y,
          originalAnimation: deco.animation,
        }
      );
      return decoration;
    } else {
      // Ultimate fallback - create a simple colored rectangle
      logAutopoiesis.warn(
        `Fallback sprite ${deco.fallbackSprite} not found, creating placeholder`
      );
      const placeholder = this.scene.add.sprite(deco.x, deco.y, '__DEFAULT');

      // Create a default texture if it doesn't exist
      if (!this.scene.textures.exists('__DEFAULT')) {
        this.scene.add
          .graphics()
          .fillStyle(0x8bc34a)
          .fillRect(0, 0, 16, 16)
          .generateTexture('__DEFAULT', 16, 16);
      }

      placeholder.setTexture('__DEFAULT');
      return placeholder;
    }
  }

  /**
   * Create activity zones with improved visuals
   */
  public createActivityZones(): void {
    const activityZones = [
      {
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        color: GAME_BALANCE.ZONES.FOOD_COLOR,
        name: 'Rest Zone',
      },
      {
        x: 400,
        y: 200,
        width: 180,
        height: 120,
        color: GAME_BALANCE.ZONES.REST_COLOR,
        name: 'Food Zone',
      },
      {
        x: 700,
        y: 300,
        width: 200,
        height: 160,
        color: GAME_BALANCE.ZONES.SOCIAL_COLOR,
        name: 'Social Zone',
      },
    ];

    activityZones.forEach((zone, index) => {
      const zoneRect = this.scene.add.rectangle(
        zone.x + zone.width / 2,
        zone.y + zone.height / 2,
        zone.width,
        zone.height,
        zone.color,
        GAME_BALANCE.ZONES.DEFAULT_ALPHA
      );
      zoneRect.setStrokeStyle(3, zone.color, 0.6);
      zoneRect.setDepth(2);

      const label = this.scene.add.text(
        zone.x + zone.width / 2,
        zone.y + zone.height / 2,
        zone.name,
        {
          fontSize: '16px',
          color: '#ffffff',
          fontFamily: 'Arial',
          fontStyle: 'bold',
        }
      );
      label.setOrigin(0.5);
      label.setDepth(3);
      label.setStroke('#000000', 2);

      this.renderedObjects.set(`activity_zone_${index}`, zoneRect);
      this.renderedObjects.set(`activity_label_${index}`, label);
    });
  }

  /**
   * Update visual elements that change over time including culling optimization
   */
  public updateVisuals(): void {
    const now = Date.now();

    // Perform culling optimization at regular intervals
    if (now - this.lastCullingUpdate > this.CULLING_UPDATE_INTERVAL) {
      this.performDecorationCulling();
      this.lastCullingUpdate = now;
    }
  }

  /**
   * Optimize decorations by culling off-screen sprites and pausing animations
   */
  private performDecorationCulling(): void {
    if (!this.scene.cameras?.main) {
      return;
    }

    const camera = this.scene.cameras.main;
    const cameraView = camera.worldView;

    // Add margin to prevent popping when sprites are just outside view
    const margin = 100;
    const extendedView = new Phaser.Geom.Rectangle(
      cameraView.x - margin,
      cameraView.y - margin,
      cameraView.width + margin * 2,
      cameraView.height + margin * 2
    );

    let visibleCount = 0;
    let pausedCount = 0;

    this.decorationSprites.forEach(decoration => {
      if (!decoration?.scene) {
        return; // Skip destroyed sprites
      }

      const inView = extendedView.contains(decoration.x, decoration.y);

      if (inView) {
        // Sprite is visible
        visibleCount++;

        if (!decoration.visible) {
          decoration.setVisible(true);
        }

        // Resume animation if it was paused
        if (decoration.anims && decoration.anims.isPaused) {
          decoration.anims.resume();
        }
      } else {
        // Sprite is off-screen
        if (decoration.visible) {
          decoration.setVisible(false);
        }

        // Pause animation to save performance
        if (decoration.anims && decoration.anims.isPlaying) {
          decoration.anims.pause();
          pausedCount++;
        }
      }
    });

    // Log culling stats occasionally
    if (Math.random() < 0.1) {
      // 10% chance to log
      logAutopoiesis.debug('Decoration culling performed', {
        totalDecorations: this.decorationSprites.length,
        visible: visibleCount,
        paused: pausedCount,
        cullingEfficiency: `${(
          ((this.decorationSprites.length - visibleCount) /
            this.decorationSprites.length) *
          100
        ).toFixed(1)}%`,
      });
    }
  }

  /**
   * Hide/show specific elements
   */
  public setElementVisibility(elementId: string, visible: boolean): void {
    const element = this.renderedObjects.get(elementId);
    if (element && 'setVisible' in element) {
      (element as any).setVisible(visible);
    }
  }

  /**
   * Change element tint
   */
  public setElementTint(elementId: string, tint: number): void {
    const element = this.renderedObjects.get(elementId);
    if (element && 'setTint' in element) {
      (element as any).setTint(tint);
    }
  }

  /**
   * Limpia objetos renderizados parcialmente para fallback
   */
  private clearRenderedObjects(): void {
    // Limpiar solo objetos del renderer creativo, no todo
    if (this.biomeAssetRenderer) {
      try {
        this.biomeAssetRenderer.cleanup();
      } catch (error) {
        logAutopoiesis.warn('Error cleaning biome renderer:', error);
      }
    }
  }

  /**
   * Cleanup all rendered objects including animated sprites
   */
  public destroy(): void {
    this.renderedObjects.forEach(obj => {
      if (obj && obj.destroy) {
        // For animated sprites, stop animations first
        if ('anims' in obj && obj.anims && typeof obj.anims === 'object') {
          const animState = obj.anims as any;
          if (animState.isPlaying && typeof animState.stop === 'function') {
            animState.stop();
          }
        }
        obj.destroy();
      }
    });

    this.zoneGraphics.forEach(graphic => {
      if (graphic && graphic.destroy) {
        graphic.destroy();
      }
    });

    this.renderedObjects.clear();
    this.zoneGraphics.length = 0;

    // Clear decoration tracking
    this.decorationSprites.length = 0;

    // Clear reference to animation manager
    this.animationManager = undefined;

    logAutopoiesis.info('WorldRenderer destroyed', {
      decorationsCleared: this.decorationSprites.length,
    });
  }

  /**
   * Initialize dynamic asset selection system
   */
  private initializeDynamicAssets(): void {
    const availableAssets = this.getAvailableAssets();
    this.selectedAssets = this.selectAssetsByCategory(availableAssets);
    this.preloadSelectedAssets();

    logAutopoiesis.info('🎨 Dynamic assets initialized', {
      categories: Object.keys(this.selectedAssets),
      totalSelected: Object.values(this.selectedAssets).flat().length,
      seed: this.worldSeed,
    });
  }

  /**
   * Cataloga todos los assets disponibles por categoría
   */
  private getAvailableAssets() {
    return {
      structures: [
        'Assets_source_002_001',
        'Assets_source_002_002',
        'Assets_source_002_003',
        'Assets_source_002_004',
        'Assets_source_002_005',
        'Assets_source_002_006',
        'Assets_source_002_007',
        'Assets_source_002_008',
        'Assets_source_002_009',
        'Assets_source_002_010',
        'Assets_source_002_011',
        'Assets_source_002_012',
        'Assets_source_002_013',
        'Assets_source_002_014',
        'Assets_source_002_015',
        'Assets_source_002_016',
        'Assets_source_002_017',
        'Assets_source_002_018',
        'Assets_source_002_019',
        'Assets_source_002_020',
        'House',
        'House_Hay_1',
        'House_Hay_2',
        'House_Log_1',
        'House_Log_2',
        'House_Stone_1',
        'House_Stone_2',
        'House_Wood_1',
        'House_Wood_2',
        'House_Wood_3',
      ],
      furniture: [
        'Bench_1',
        'Bench_3',
        'Table_Medium_1',
        'silla',
        'silla2',
        'silla3',
        'Bookshelf_1',
        'Bookshelf_2',
        'Bed_1',
        'Bed_2',
        'Chair_1',
        'Chair_2',
        'Desk_1',
        'Sofa_1',
        'Wardrobe_1',
        'mesa',
        'mesa2',
        'mesa3',
      ],
      streetItems: [
        'LampPost_3',
        'lamparas1',
        'lamparas2',
        'lamparas3',
        'Sign_1',
        'Sign_2',
        'Sign_3',
        'carteles1',
        'carteles2',
        'carteles3',
        'Fence_1',
        'Fence_2',
        'Gate_1',
        'Post_1',
      ],
      containers: [
        'Barrel_Small_Empty',
        'Basket_Empty',
        'Chest',
        'caja',
        'caja2',
        'caja3',
        'Pot_1',
        'Pot_2',
        'Bucket_1',
        'Container_1',
        'Storage_1',
      ],
      decorative: [
        'sombrilla1',
        'sombrilla2',
        'Plant_2',
        'plantas1',
        'plantas2',
        'plantas3',
        'Rock_1',
        'Rock_2',
        'Bush_1',
        'Bush_2',
        'Flower_1',
        'Flower_2',
        'Tree_Small_1',
        'Tree_Small_2',
        'piedras1',
        'piedras2',
      ],
      urban: [
        'basuras1',
        'basuras2',
        'botellas1',
        'botellas2',
        'papeles1',
        'papeles2',
        'Trash_Can_1',
        'Mailbox_1',
        'Hydrant_1',
        'Bench_Park_1',
      ],
    };
  }

  /**
   * Selecciona assets por categoría usando seed determinístico
   */
  private selectAssetsByCategory(
    availableAssets: any
  ): Record<string, string[]> {
    const selected: Record<string, string[]> = {};

    // Use deterministic selection based on seed
    const rng = this.createSeededRandom(this.worldSeed);

    selected.structures = this.selectFromCategory(
      availableAssets.structures,
      2,
      4,
      rng
    );
    selected.furniture = this.selectFromCategory(
      availableAssets.furniture,
      3,
      6,
      rng
    );
    selected.streetItems = this.selectFromCategory(
      availableAssets.streetItems,
      2,
      4,
      rng
    );
    selected.containers = this.selectFromCategory(
      availableAssets.containers,
      1,
      3,
      rng
    );
    selected.decorative = this.selectFromCategory(
      availableAssets.decorative,
      2,
      4,
      rng
    );
    selected.urban = this.selectFromCategory(availableAssets.urban, 1, 2, rng);

    return selected;
  }

  /**
   * Selecciona elementos de una categoría
   */
  private selectFromCategory(
    items: string[],
    min: number,
    max: number,
    rng: () => number
  ): string[] {
    const count = min + Math.floor(rng() * (max - min + 1));
    const selected: string[] = [];
    const shuffled = [...items].sort(() => rng() - 0.5);

    return shuffled.slice(0, Math.min(count, items.length));
  }

  /**
   * Crea generador de números aleatorios con seed
   */
  private createSeededRandom(seed: number): () => number {
    let currentSeed = seed;
    return () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }

  /**
   * Returns the currently selected assets
   */
  private getSelectedAssets(): Record<string, string[]> {
    return this.selectedAssets;
  }

  /**
   * Precarga los assets seleccionados
   */
  private preloadSelectedAssets(): void {
    Object.entries(this.selectedAssets).forEach(([category, assets]) => {
      assets.forEach(assetKey => {
        if (!this.scene.textures.exists(assetKey)) {
          try {
            const assetPath = this.getAssetPath(assetKey, category);
            this.scene.load.image(assetKey, assetPath);
          } catch (error) {
            logAutopoiesis.warn(`Failed to load asset: ${assetKey}`, error);
          }
        }
      });
    });

    if (!this.scene.load.isLoading()) {
      this.scene.load.start();
    }
  }

  /**
   * Get rendering statistics
   */
  public getStats(): {
    renderedObjects: number;
    zones: number;
    elements: number;
  } {
    return {
      renderedObjects: this.renderedObjects.size,
      zones: this.gameState.zones.length,
      elements: this.gameState.mapElements.length,
    };
  }
}
