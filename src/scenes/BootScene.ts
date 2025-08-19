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
}
