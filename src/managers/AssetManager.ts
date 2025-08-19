/**
 * Asset Manager para "Una Carta Para Isa"
 * Gestiona la carga de assets con validación, fallbacks y reporting de errores
 */

import { logAutopoiesis } from '../utils/logger';

export interface AssetDefinition {
  key: string;
  path: string;
  type: 'image' | 'audio' | 'json' | 'tilemap';
  fallback?: string;
  required?: boolean;
}

export interface AssetLoadResult {
  success: boolean;
  loadedAssets: string[];
  failedAssets: string[];
  fallbacksUsed: string[];
}

export class AssetManager {
  private scene: Phaser.Scene;
  private loadedAssets: Set<string> = new Set();
  private failedAssets: Set<string> = new Set();
  private fallbacksUsed: Map<string, string> = new Map();

  // Definición de todos los assets del juego
  private static readonly ASSET_DEFINITIONS: AssetDefinition[] = [
    // Sprites de entidades
    { key: 'isa-happy', path: 'assets/animated_entities/entidad_circulo_happy_anim.png', type: 'image', required: true },
    { key: 'isa-sad', path: 'assets/animated_entities/entidad_circulo_sad_anim.png', type: 'image', required: true },
    { key: 'isa-dying', path: 'assets/animated_entities/entidad_circulo_dying_anim.png', type: 'image', required: true },
    { key: 'stev-happy', path: 'assets/animated_entities/entidad_square_happy_anim.png', type: 'image', required: true },
    { key: 'stev-sad', path: 'assets/animated_entities/entidad_square_sad_anim.png', type: 'image', required: true },
    { key: 'stev-dying', path: 'assets/animated_entities/entidad_square_dying_anim.png', type: 'image', required: true },

    // Sprites alternativos como fallback
    { key: 'woman', path: 'assets/entities/ent_woman.png', type: 'image' },
    { key: 'man', path: 'assets/entities/ent_man.png', type: 'image' },

    // Assets de ambiente
    { key: 'campfire', path: 'assets/animated_entities/campfire.png', type: 'image' },
    { key: 'flowers-red', path: 'assets/animated_entities/flowers_red.png', type: 'image' },
    { key: 'flowers-white', path: 'assets/animated_entities/flowers_white.png', type: 'image' },

    // Terrenos con fallbacks
    { key: 'grass-1', path: 'assets/terrain/base/cesped1.png', type: 'image', fallback: 'grass-base' },
    { key: 'grass-2', path: 'assets/terrain/base/cesped2.png', type: 'image', fallback: 'grass-base' },
    { key: 'grass-3', path: 'assets/terrain/base/cesped3.png', type: 'image', fallback: 'grass-base' },
    { key: 'grass-base', path: 'assets/terrain/base/Grass_Middle.png', type: 'image', required: true },

    // Diálogos
    { key: 'dialogues', path: 'dialogs/dialogos_chat_isa.lite.censored_plus.json', type: 'json' }
  ];

  // Assets de fallback generados programáticamente
  private static readonly FALLBACK_ASSETS: Record<string, () => HTMLCanvasElement> = {
    'default-entity': () => AssetManager.createDefaultEntitySprite(),
    'default-terrain': () => AssetManager.createDefaultTerrain(),
    'default-decoration': () => AssetManager.createDefaultDecoration()
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Valida que todos los assets existan antes de cargarlos
   */
  public async validateAssets(): Promise<string[]> {
    const missingAssets: string[] = [];
    const validationPromises = AssetManager.ASSET_DEFINITIONS.map(async (asset) => {
      try {
        const response = await fetch(asset.path, { method: 'HEAD' });
        if (!response.ok) {
          missingAssets.push(asset.key);
          logAutopoiesis.warn(`Asset no encontrado: ${asset.key} en ${asset.path}`);
        }
      } catch (error) {
        missingAssets.push(asset.key);
        logAutopoiesis.error(`Error validando asset: ${asset.key}`, { error: error.toString() });
      }
    });

    await Promise.all(validationPromises);
    
    if (missingAssets.length > 0) {
      logAutopoiesis.warn(`Validation complete - ${missingAssets.length} assets missing`, { missingAssets });
    } else {
      logAutopoiesis.info('✅ All assets validated successfully');
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
      fallbacksUsed: []
    };

    // Crear fallback assets programáticamente
    this.createFallbackAssets();

    // Configurar listeners de carga
    this.scene.load.on('filecomplete', (key: string) => {
      this.loadedAssets.add(key);
      result.loadedAssets.push(key);
    });

    this.scene.load.on('loaderror', (file: any) => {
      const asset = AssetManager.ASSET_DEFINITIONS.find(a => a.key === file.key);
      this.handleAssetError(asset, result);
    });

    // Cargar assets definidos
    for (const asset of AssetManager.ASSET_DEFINITIONS) {
      this.loadAssetSafely(asset);
    }

    return new Promise((resolve) => {
      this.scene.load.on('complete', () => {
        // Verificar assets críticos
        const criticalAssetsFailed = result.failedAssets.filter(key => {
          const asset = AssetManager.ASSET_DEFINITIONS.find(a => a.key === key);
          return asset?.required;
        });

        if (criticalAssetsFailed.length > 0) {
          result.success = false;
          logAutopoiesis.error('Critical assets failed to load', { criticalAssetsFailed });
        }

        logAutopoiesis.info('Asset loading complete', {
          loaded: result.loadedAssets.length,
          failed: result.failedAssets.length,
          fallbacks: result.fallbacksUsed.length,
          success: result.success
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
        case 'image':
          this.scene.load.image(asset.key, asset.path);
          break;
        case 'json':
          this.scene.load.json(asset.key, asset.path);
          break;
        case 'audio':
          this.scene.load.audio(asset.key, asset.path);
          break;
        default:
          logAutopoiesis.warn(`Unknown asset type: ${asset.type} for ${asset.key}`);
      }
    } catch (error) {
      logAutopoiesis.error(`Error queuing asset: ${asset.key}`, { error: error.toString() });
      this.failedAssets.add(asset.key);
    }
  }

  /**
   * Maneja errores de carga de assets
   */
  private handleAssetError(asset: AssetDefinition | undefined, result: AssetLoadResult): void {
    if (!asset) return;

    this.failedAssets.add(asset.key);
    result.failedAssets.push(asset.key);

    // Intentar usar fallback si está disponible
    if (asset.fallback) {
      const fallbackAsset = AssetManager.ASSET_DEFINITIONS.find(a => a.key === asset.fallback);
      if (fallbackAsset && !this.failedAssets.has(asset.fallback!)) {
        this.fallbacksUsed.set(asset.key, asset.fallback);
        result.fallbacksUsed.push(`${asset.key} -> ${asset.fallback}`);
        logAutopoiesis.info(`Using fallback for ${asset.key}: ${asset.fallback}`);
      }
    } else if (asset.required) {
      // Para assets críticos, crear fallback programático
      this.createProgrammaticFallback(asset.key);
      result.fallbacksUsed.push(`${asset.key} -> programmatic`);
      logAutopoiesis.warn(`Created programmatic fallback for critical asset: ${asset.key}`);
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
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    // Diferentes tipos de fallbacks según el tipo de asset
    if (assetKey.includes('isa')) {
      this.drawCircleEntity(ctx, '#e91e63', assetKey.includes('happy') ? '😊' : '😢');
    } else if (assetKey.includes('stev')) {
      this.drawSquareEntity(ctx, '#2196f3', assetKey.includes('happy') ? '😊' : '😢');
    } else if (assetKey.includes('grass')) {
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
  public getLoadingStats(): { loaded: number; failed: number; fallbacks: number } {
    return {
      loaded: this.loadedAssets.size,
      failed: this.failedAssets.size,
      fallbacks: this.fallbacksUsed.size
    };
  }

  // Métodos estáticos para crear sprites de fallback
  private static createDefaultEntitySprite(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#95a5a6';
    ctx.beginPath();
    ctx.arc(16, 16, 12, 0, Math.PI * 2);
    ctx.fill();
    
    return canvas;
  }

  private static createDefaultTerrain(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(0, 0, 64, 64);
    
    return canvas;
  }

  private static createDefaultDecoration(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    
    return canvas;
  }

  // Helpers para dibujar diferentes tipos de entities
  private drawCircleEntity(ctx: CanvasRenderingContext2D, color: string, emoji: string): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(16, 16, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(emoji, 16, 22);
  }

  private drawSquareEntity(ctx: CanvasRenderingContext2D, color: string, emoji: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(4, 4, 24, 24);
    
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(emoji, 16, 22);
  }

  private drawGrassTile(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(0, 0, 32, 32);
    
    // Añadir textura simple
    ctx.fillStyle = '#27ae60';
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * 32;
      const y = Math.random() * 32;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  private drawDefaultSprite(ctx: CanvasRenderingContext2D, name: string): void {
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(0, 0, 32, 32);
    
    ctx.fillStyle = '#2c3e50';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name.substring(0, 4), 16, 18);
  }
}