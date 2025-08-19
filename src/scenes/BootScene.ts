import Phaser from 'phaser';
import { AssetManager } from '../managers/AssetManager';
import { AnimationManager } from '../managers/AnimationManager';
import { logAutopoiesis } from '../utils/logger';

export class BootScene extends Phaser.Scene {
  private assetManager!: AssetManager;
  private animationManager!: AnimationManager;

  constructor() {
    super({ key: 'BootScene' });
  }

  async preload() {
    // Initialize managers
    this.assetManager = new AssetManager(this);
    this.animationManager = new AnimationManager(this);

    // Hide loading screen
    this.hideLoadingScreen();
    
    try {
      // Validate assets first
      const missingAssets = await this.assetManager.validateAssets();
      if (missingAssets.length > 0) {
singAssets.length} assets, will use fallbacks`);
      }
      
      // Load sprite sheets for animations
adAllSpriteSheets();
      
      // Load all assets with fallbacks
      const loadResult = await this.assetManager.loadAllAssets();
      

        logAutopoiesis.error('Critical asset loading failure', loadResult);
        this.showAssetError(loadResult.failedAssets);
        return;
      }
      
tions after assets are loaded
      this.animationManager.createAllAnimations();
      
      // Store animation manager globally for other scenes
      this.registry.set('animationManager', this.animationManager);
      
      logAutopoiesis.info('Boot completed successfully', {
        assets: {
          loaded: loadResult.loadedAssets.length,
          fallbacks: loadResult.fallbacksUsed.length
        },
        animations: this.animationManager.getStats()
      });

      // Proceed to main scenes
      console.log('🚀 Boot complete with animations, starting main scene');
      this.scene.start('MainScene');
      this.scene.launch('UIScene');
      
    } catch (error) {
      logAutopoiesis.error('Boot scene critical error', { error: error.toString() });
      this.showCriticalError(error);
    }
  }

  create() {
    // Setup global events and initial state
    this.events.emit('bootComplete');
    
    // Test animation system
    if (this.animationManager) {
      const stats = this.animationManager.getStats();
      const animations = this.animationManager.getAnimationsByCategory();
      
      logAutopoiesis.info('Animation system ready', {
        stats,
        categories: {
          entities: animations.entities.length,
          environment: animations.environment.length,
          ui: animations.ui.length,
          animals: animations.animals.length
        }
      });
    }
  }
  
  /**
   * Hide the loading screen with fade effect
   */
  private hideLoadingScreen(): void {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.classList.add('fade-out');
      setTimeout(() => {
        loadingElement.style.display = 'none';
      }, 500);
    }
  }
  
  /**
   * Show error message for failed assets
   */
  private showAssetError(failedAssets: string[]): void {
    const errorText = this.add.text(400, 300, [
      '⚠️ Error cargando algunos recursos',
      `Falló la carga de: ${failedAssets.slice(0, 3).join(', ')}`,
      failedAssets.length > 3 ? `y ${failedAssets.length - 3} más...` : '',
      '',
      'Presiona cualquier tecla para continuar con fallbacks'
    ].filter(Boolean).join('\n'), {
      fontSize: '16px',
      color: '#e74c3c',
      align: 'center',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    this.input.keyboard?.once('keydown', () => {
      errorText.destroy();
      this.scene.start('MainScene');
      this.scene.launch('UIScene');
    });
  }
  
  /**
   * Show critical error that prevents game from starting
   */
  private showCriticalError(error: any): void {
    this.add.text(400, 300, [
      '💀 Error crítico en el juego',
      'No es posible iniciar el juego',
      '',
      `Error: ${error.message || error}`,
      '',
      'Recarga la página para intentar de nuevo'
    ].join('\n'), {
      fontSize: '14px',
      color: '#c0392b',
      align: 'center',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }
  
  /**
   * Get loading statistics including animations
   */
  public getBootStats() {
    return {
      assets: this.assetManager?.getLoadingStats() || { loaded: 0, failed: 0, fallbacks: 0 },
      animations: this.animationManager?.getStats() || { createdAnimations: 0, loadedSpriteSheets: 0 }
    };
  }
}