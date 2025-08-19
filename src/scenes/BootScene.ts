import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Hide loading screen once boot is complete
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.classList.add('fade-out');
      setTimeout(() => {
        loadingElement.style.display = 'none';
      }, 500);
    }

    // Load entity sprites
    this.load.image('isa-happy', 'assets/animated_entities/entidad_circulo_happy_anim.png');
    this.load.image('isa-sad', 'assets/animated_entities/entidad_circulo_sad_anim.png');
    this.load.image('isa-dying', 'assets/animated_entities/entidad_circulo_dying_anim.png');
    this.load.image('stev-happy', 'assets/animated_entities/entidad_square_happy_anim.png');
    this.load.image('stev-sad', 'assets/animated_entities/entidad_square_sad_anim.png');
    this.load.image('stev-dying', 'assets/animated_entities/entidad_square_dying_anim.png');

    // Load person sprites as alternatives
    this.load.image('woman', 'assets/entities/ent_woman.png');
    this.load.image('man', 'assets/entities/ent_man.png');

    // Load environment assets
    this.load.image('campfire', 'assets/animated_entities/campfire.png');
    this.load.image('flowers-red', 'assets/animated_entities/flowers_red.png');
    this.load.image('flowers-white', 'assets/animated_entities/flowers_white.png');

    // Load terrain and background assets
    this.load.image('grass-1', 'assets/terrain/base/cesped1.png');
    this.load.image('grass-2', 'assets/terrain/base/cesped2.png');
    this.load.image('grass-3', 'assets/terrain/base/cesped3.png');
    this.load.image('grass-base', 'assets/terrain/base/Grass_Middle.png');

    // Progress indicator
    this.load.on('progress', (progress: number) => {
      console.log(`🔄 Loading assets: ${Math.round(progress * 100)}%`);
    });

    this.load.on('complete', () => {
      console.log('🚀 Boot complete, starting main scene');
      this.scene.start('MainScene');
      this.scene.launch('UIScene');
    });
  }

  create() {
    // Setup global events and initial state
    this.events.emit('bootComplete');
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
   * Get loading statistics
   */
  public getAssetStats() {
    return this.assetManager?.getLoadingStats() || { loaded: 0, failed: 0, fallbacks: 0 };
  }
}
