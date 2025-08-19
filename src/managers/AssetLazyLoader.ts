/**
 * Sistema de Lazy Loading para Assets
 * Carga assets bajo demanda para optimizar rendimiento inicial
 */

import { logAutopoiesis } from '../utils/logger';

export interface AssetLoadRequest {
  key: string;
  path: string;
  type: 'image' | 'spritesheet' | 'audio';
  priority: 'high' | 'medium' | 'low';
  frameConfig?: { frameWidth: number; frameHeight: number };
}

export interface AssetGroup {
  name: string;
  assets: AssetLoadRequest[];
  preload?: boolean;
}

export class AssetLazyLoader {
  private scene: Phaser.Scene;
  private loadQueue = new Map<string, AssetLoadRequest>();
  private loadedAssets = new Set<string>();
  private loadingAssets = new Set<string>();
  private assetGroups = new Map<string, AssetGroup>();
  private loadPromises = new Map<string, Promise<void>>();

  // Configuración de rendimiento
  private readonly MAX_CONCURRENT_LOADS = 3;
  private readonly LOAD_TIMEOUT = 10000; // 10 segundos
  private currentLoads = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupAssetGroups();
  }

  /**
   * Configurar grupos de assets organizados por categorías
   */
  private setupAssetGroups(): void {
    // Assets críticos - cargar inmediatamente
    this.defineAssetGroup(
      'critical',
      [
        {
          key: 'isa_happy_anim',
          path: '/assets/animated_entities/entidad_circulo_happy_anim.png',
          type: 'spritesheet',
          priority: 'high',
          frameConfig: { frameWidth: 32, frameHeight: 32 },
        },
        {
          key: 'stev_happy_anim',
          path: '/assets/animated_entities/entidad_square_happy_anim.png',
          type: 'spritesheet',
          priority: 'high',
          frameConfig: { frameWidth: 32, frameHeight: 32 },
        },
        {
          key: 'isa_sad_anim',
          path: '/assets/animated_entities/entidad_circulo_sad_anim.png',
          type: 'spritesheet',
          priority: 'high',
          frameConfig: { frameWidth: 32, frameHeight: 32 },
        },
        {
          key: 'stev_sad_anim',
          path: '/assets/animated_entities/entidad_square_sad_anim.png',
          type: 'spritesheet',
          priority: 'high',
          frameConfig: { frameWidth: 32, frameHeight: 32 },
        },
      ],
      true
    );

    // Terreno básico - prioridad media
    this.defineAssetGroup('terrain_basic', [
      {
        key: 'grass_1',
        path: '/assets/terrain/grass_1.png',
        type: 'image',
        priority: 'medium',
      },
      {
        key: 'grass_2',
        path: '/assets/terrain/grass_2.png',
        type: 'image',
        priority: 'medium',
      },
      {
        key: 'water_tile',
        path: '/assets/water/tile_01_01.png',
        type: 'image',
        priority: 'medium',
      },
    ]);

    // Props y decoraciones - prioridad baja
    this.defineAssetGroup('decorations', [
      {
        key: 'campfire',
        path: '/assets/animated_entities/campfire.png',
        type: 'image',
        priority: 'low',
      },
      {
        key: 'flowers_red',
        path: '/assets/animated_entities/flowers_red.png',
        type: 'image',
        priority: 'low',
      },
      {
        key: 'tree_emerald_1',
        path: '/assets/foliage/trees/tree_emerald_1.png',
        type: 'image',
        priority: 'low',
      },
    ]);

    // Efectos visuales - cargar según necesidad
    this.defineAssetGroup('effects', [
      {
        key: 'checkpoint_flag',
        path: '/assets/animated_entities/checkpoint_flag_idle1.png',
        type: 'image',
        priority: 'low',
      },
      {
        key: 'fire_effect',
        path: '/assets/animated_entities/fire1.png',
        type: 'image',
        priority: 'low',
      },
    ]);

    // Estructuras y buildings
    this.defineAssetGroup('structures', [
      {
        key: 'house_basic',
        path: '/assets/structures/estructuras_completas/House.png',
        type: 'image',
        priority: 'low',
      },
      {
        key: 'well',
        path: '/assets/structures/estructuras_completas/Well_Hay_1.png',
        type: 'image',
        priority: 'low',
      },
    ]);

    logAutopoiesis.info('Asset groups configured', {
      totalGroups: this.assetGroups.size,
      groupNames: Array.from(this.assetGroups.keys()),
    });
  }

  /**
   * Definir un grupo de assets
   */
  private defineAssetGroup(name: string, assets: AssetLoadRequest[], preload = false): void {
    this.assetGroups.set(name, { name, assets, preload });

    // Añadir assets al queue
    assets.forEach(asset => {
      this.loadQueue.set(asset.key, asset);
    });
  }

  /**
   * Cargar assets críticos al inicio
   */
  public async loadCriticalAssets(): Promise<void> {
    logAutopoiesis.info('Cargando assets críticos...');

    const criticalGroup = this.assetGroups.get('critical');
    if (!criticalGroup) return;

    await this.loadAssetGroup('critical');

    logAutopoiesis.info('Assets críticos cargados', {
      loaded: criticalGroup.assets.length,
    });
  }

  /**
   * Cargar grupo específico de assets
   */
  public async loadAssetGroup(groupName: string): Promise<void> {
    const group = this.assetGroups.get(groupName);
    if (!group) {
      logAutopoiesis.warn(`Grupo de assets no encontrado: ${groupName}`);
      return;
    }

    const loadPromises = group.assets
      .filter(asset => !this.isAssetLoaded(asset.key))
      .map(asset => this.loadAsset(asset.key));

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

  /**
   * Cargar asset individual bajo demanda
   */
  public async loadAsset(key: string): Promise<void> {
    // Verificar si ya está cargado
    if (this.isAssetLoaded(key)) {
      return;
    }

    // Verificar si ya se está cargando
    const existingPromise = this.loadPromises.get(key);
    if (existingPromise) {
      return existingPromise;
    }

    // Obtener configuración del asset
    const assetConfig = this.loadQueue.get(key);
    if (!assetConfig) {
      throw new Error(`Asset configuration not found: ${key}`);
    }

    // Crear nueva promesa de carga
    const loadPromise = this.doLoadAsset(assetConfig);
    this.loadPromises.set(key, loadPromise);

    try {
      await loadPromise;
    } finally {
      this.loadPromises.delete(key);
    }
  }

  /**
   * Realizar la carga real del asset
   */
  private async doLoadAsset(config: AssetLoadRequest): Promise<void> {
    // Control de concurrencia
    while (this.currentLoads >= this.MAX_CONCURRENT_LOADS) {
      await new Promise(resolve => setTimeout(resolve, 100));
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

          logAutopoiesis.debug(`Asset loaded: ${config.key}`, {
            type: config.type,
            path: config.path,
          });

          resolve();
        };

        const onError = (error: any) => {
          clearTimeout(timeout);
          this.loadingAssets.delete(config.key);
          this.currentLoads--;

          logAutopoiesis.error(`Failed to load asset: ${config.key}`, {
            error: String(error),
            path: config.path,
          });

          reject(error);
        };

        // Cargar según tipo de asset
        switch (config.type) {
          case 'image':
            this.scene.load.image(config.key, config.path);
            break;

          case 'spritesheet':
            if (config.frameConfig) {
              this.scene.load.spritesheet(config.key, config.path, config.frameConfig);
            } else {
              this.scene.load.image(config.key, config.path);
            }
            break;

          case 'audio':
            this.scene.load.audio(config.key, config.path);
            break;

          default:
            onError(new Error(`Unknown asset type: ${config.type}`));
            return;
        }

        // Configurar eventos de carga
        this.scene.load.once('complete', onComplete);
        this.scene.load.once('loaderror', onError);

        // Iniciar carga
        this.scene.load.start();
      });
    } catch (error) {
      this.loadingAssets.delete(config.key);
      this.currentLoads--;
      throw error;
    }
  }

  /**
   * Verificar si un asset está cargado
   */
  public isAssetLoaded(key: string): boolean {
    return this.loadedAssets.has(key) || this.scene.textures.exists(key);
  }

  /**
   * Verificar si un asset se está cargando
   */
  public isAssetLoading(key: string): boolean {
    return this.loadingAssets.has(key);
  }

  /**
   * Precargar assets por proximidad (para mundo abierto)
   */
  public async preloadAssetsNear(_x: number, _y: number, _radius = 200): Promise<void> {
    // Lógica simplificada - en un juego real, mapearía coordenadas a assets
    const nearbyGroups = ['terrain_basic'];

    if (Math.random() > 0.7) {
      // 30% chance de necesitar decoraciones
      nearbyGroups.push('decorations');
    }

    const loadPromises = nearbyGroups.map(group => this.loadAssetGroup(group));
    await Promise.all(loadPromises);
  }

  /**
   * Cargar assets por prioridad
   */
  public async loadAssetsByPriority(priority: 'high' | 'medium' | 'low'): Promise<void> {
    const assetsToLoad = Array.from(this.loadQueue.values()).filter(
      asset => asset.priority === priority && !this.isAssetLoaded(asset.key)
    );

    const loadPromises = assetsToLoad.map(asset => this.loadAsset(asset.key));

    try {
      await Promise.all(loadPromises);
      logAutopoiesis.info(`Assets cargados por prioridad: ${priority}`, {
        count: assetsToLoad.length,
      });
    } catch (error) {
      logAutopoiesis.error(`Error cargando assets de prioridad ${priority}`, {
        error: String(error),
      });
    }
  }

  /**
   * Obtener estadísticas de carga
   */
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

  /**
   * Limpiar assets no utilizados para liberar memoria
   */
  public cleanupUnusedAssets(keepKeys: string[] = []): void {
    let cleanedCount = 0;

    // Mantener assets críticos y especificados
    const keepSet = new Set([
      ...keepKeys,
      'isa_happy_anim',
      'stev_happy_anim',
      'isa_sad_anim',
      'stev_sad_anim', // críticos
    ]);

    this.loadedAssets.forEach(key => {
      if (!keepSet.has(key)) {
        if (this.scene.textures.exists(key)) {
          this.scene.textures.remove(key);
          this.loadedAssets.delete(key);
          cleanedCount++;
        }
      }
    });

    if (cleanedCount > 0) {
      logAutopoiesis.info('Assets no utilizados limpiados', {
        cleaned: cleanedCount,
        remaining: this.loadedAssets.size,
      });
    }
  }

  /**
   * Destruir loader y limpiar recursos
   */
  public destroy(): void {
    // Limpiar promises pendientes
    this.loadPromises.clear();

    // Limpiar sets y maps
    this.loadQueue.clear();
    this.loadedAssets.clear();
    this.loadingAssets.clear();
    this.assetGroups.clear();

    logAutopoiesis.info('AssetLazyLoader destroyed');
  }
}
