import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private statsText!: Phaser.GameObjects.Text;
  private resonanceBar!: Phaser.GameObjects.Graphics;
  private cycleText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    console.log('🎨 Creating UI overlay');

    // Create UI background
    const uiBackground = this.add.graphics();
    uiBackground.fillStyle(0x000000, 0.7);
    uiBackground.fillRect(0, 0, 300, 120);
    uiBackground.setScrollFactor(0);

    // Stats display
    this.statsText = this.add.text(10, 10, 'Iniciando...', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setScrollFactor(0);

    // Cycle counter
    this.cycleText = this.add.text(10, 40, 'Ciclos: 0', {
      fontSize: '14px',
      color: '#ecf0f1',
      fontFamily: 'Arial'
    }).setScrollFactor(0);

    // Resonance bar
    this.resonanceBar = this.add.graphics();
    this.resonanceBar.setScrollFactor(0);
    this.updateResonanceBar(0);

    // Listen for game updates
    const mainScene = this.scene.get('MainScene');
    mainScene.events.on('gameLogicUpdate', this.updateUI, this);

    // Debug controls
    this.createDebugControls();

    console.log('✅ UI Scene created');
  }

  private updateUI(data: { cycles: number; resonance: number }) {
    this.cycleText.setText(`Ciclos: ${data.cycles}`);
    this.updateResonanceBar(data.resonance);
    
    // Update entity stats (placeholder for now)
    this.statsText.setText([
      `🌟 Una Carta Para Isa`,
      `Resonancia: ${data.resonance.toFixed(2)}`,
      `Estado: Simulando autopoiesis...`
    ].join('\n'));
  }

  private updateResonanceBar(resonance: number) {
    this.resonanceBar.clear();
    
    // Background bar
    this.resonanceBar.fillStyle(0x34495e, 0.8);
    this.resonanceBar.fillRect(10, 90, 200, 20);
    
    // Resonance fill
    const fillWidth = Math.max(0, Math.min(200, resonance * 2)); // Scale resonance to bar width
    const color = resonance > 50 ? 0x27ae60 : resonance > 25 ? 0xf39c12 : 0xe74c3c;
    
    this.resonanceBar.fillStyle(color, 0.9);
    this.resonanceBar.fillRect(10, 90, fillWidth, 20);
    
    // Border
    this.resonanceBar.lineStyle(2, 0xecf0f1, 0.8);
    this.resonanceBar.strokeRect(10, 90, 200, 20);
    
    // Label
    const resonanceLabel = this.add.text(220, 100, `${resonance.toFixed(1)}%`, {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0, 0.5).setScrollFactor(0);
    
    // Clean up old labels
    if (this.resonanceBar.getData('label')) {
      this.resonanceBar.getData('label').destroy();
    }
    this.resonanceBar.setData('label', resonanceLabel);
  }

  private createDebugControls() {
    const gameConfig = this.registry.get('gameConfig');
    
    if (gameConfig.debugMode) {
      // Speed controls
      this.add.text(10, 150, 'Velocidad del juego:', {
        fontSize: '12px',
        color: '#bdc3c7',
        fontFamily: 'Arial'
      }).setScrollFactor(0);

      const speeds = [0.5, 1.0, 2.0, 5.0, 10.0];
      speeds.forEach((speed, index) => {
        const button = this.add.text(10 + index * 40, 170, `${speed}x`, {
          fontSize: '11px',
          color: '#3498db',
          fontFamily: 'Arial'
        }).setScrollFactor(0);
        
        button.setInteractive();
        button.on('pointerdown', () => {
          console.log(`⚡ Setting game speed to ${speed}x`);
          // Here we would update the game speed
          button.setColor('#e74c3c');
          setTimeout(() => button.setColor('#3498db'), 200);
        });
      });

      console.log('🐛 Debug controls created');
    }
  }
}
