import Phaser from 'phaser';
import { UIElementPool, ResonanceLabel } from '../managers/UIElementPool';
import { GAME_BALANCE } from '../constants/gameBalance';
import { logAutopoiesis } from '../utils/logger';

export class UIScene extends Phaser.Scene {
  private statsText!: Phaser.GameObjects.Text;
  private resonanceBar!: Phaser.GameObjects.Graphics;
  private cycleText!: Phaser.GameObjects.Text;
  private resonanceLabelPool!: UIElementPool<ResonanceLabel>;
  private currentResonanceLabel?: ResonanceLabel;

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    console.log('🎨 Creating UI overlay');
    

    this.initializePools();


    const uiBackground = this.add.graphics();
    uiBackground.fillStyle(0x000000, GAME_BALANCE.UI.BACKGROUND_ALPHA);
    uiBackground.fillRect(0, 0, GAME_BALANCE.UI.PANEL_WIDTH, GAME_BALANCE.UI.PANEL_HEIGHT);
    uiBackground.setScrollFactor(0);


    this.statsText = this.add.text(GAME_BALANCE.UI.TEXT_MARGIN, GAME_BALANCE.UI.TEXT_MARGIN, 'Iniciando...', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setScrollFactor(0);


    this.cycleText = this.add.text(GAME_BALANCE.UI.TEXT_MARGIN, 40, 'Ciclos: 0', {
      fontSize: '14px',
      color: '#ecf0f1',
      fontFamily: 'Arial'
    }).setScrollFactor(0);


    this.resonanceBar = this.add.graphics();
    this.resonanceBar.setScrollFactor(0);
    this.updateResonanceBar(0);


    const mainScene = this.scene.get('MainScene');
    mainScene.events.on('gameLogicUpdate', this.updateUI, this);


    this.createDebugControls();


    this.events.on('shutdown', this.destroy, this);
    
    console.log('✅ UI Scene created');
  }

  /**
   * Inicializar pools de elementos UI
   */
  private initializePools(): void {
    this.resonanceLabelPool = new UIElementPool<ResonanceLabel>(
      () => new ResonanceLabel(this),
      'ResonanceLabel',
      3
    );
    
    logAutopoiesis.debug('UI element pools initialized');
  }

  /**
   * Actualizar label de resonancia usando pool
   */
  private updateResonanceLabel(x: number, y: number, resonance: number): void {

    if (this.currentResonanceLabel) {
      this.resonanceLabelPool.release(this.currentResonanceLabel);
    }
    

    this.currentResonanceLabel = this.resonanceLabelPool.acquire();
    this.currentResonanceLabel.setup(x, y, `${resonance.toFixed(1)}%`);
    this.currentResonanceLabel.gameObject.setOrigin(0, 0.5);
  }

  private updateUI(data: { cycles: number; resonance: number }) {
    this.cycleText.setText(`Ciclos: ${data.cycles}`);
    this.updateResonanceBar(data.resonance);
    

    this.statsText.setText([
      `🌟 Una Carta Para Isa`,
      `Resonancia: ${data.resonance.toFixed(2)}`,
      `Estado: Simulando autopoiesis...`
    ].join('\n'));
  }

  private updateResonanceBar(resonance: number) {
    this.resonanceBar.clear();
    
    const barX = GAME_BALANCE.UI.TEXT_MARGIN;
    const barY = 90;
    const barWidth = GAME_BALANCE.RESONANCE.BAR_WIDTH;
    const barHeight = GAME_BALANCE.RESONANCE.BAR_HEIGHT;
    

    this.resonanceBar.fillStyle(0x34495e, 0.8);
    this.resonanceBar.fillRect(barX, barY, barWidth, barHeight);
    

    const fillWidth = Math.max(0, Math.min(barWidth, resonance * GAME_BALANCE.RESONANCE.BAR_SCALE));
    const color = resonance > GAME_BALANCE.RESONANCE.THRESHOLD_HIGH ? 
      GAME_BALANCE.RESONANCE.COLOR_HIGH : 
      resonance > GAME_BALANCE.RESONANCE.THRESHOLD_MEDIUM ? 
      GAME_BALANCE.RESONANCE.COLOR_MEDIUM : 
      GAME_BALANCE.RESONANCE.COLOR_LOW;
    
    this.resonanceBar.fillStyle(color, 0.9);
    this.resonanceBar.fillRect(barX, barY, fillWidth, barHeight);
    

    this.resonanceBar.lineStyle(2, 0xecf0f1, 0.8);
    this.resonanceBar.strokeRect(barX, barY, barWidth, barHeight);
    

    this.updateResonanceLabel(barX + barWidth + 10, barY + barHeight / 2, resonance);
  }

  private createDebugControls() {
    const gameConfig = this.registry.get('gameConfig');
    
    if (gameConfig.debugMode) {

      this.add.text(GAME_BALANCE.UI.TEXT_MARGIN, 150, 'Velocidad del juego:', {
        fontSize: '12px',
        color: '#bdc3c7',
        fontFamily: 'Arial'
      }).setScrollFactor(0);

      GAME_BALANCE.UI.DEBUG_SPEEDS.forEach((speed, index) => {
        const button = this.add.text(
          GAME_BALANCE.UI.TEXT_MARGIN + index * GAME_BALANCE.UI.DEBUG_BUTTON_SPACING, 
          170, 
          `${speed}x`, {
          fontSize: '11px',
          color: '#3498db',
          fontFamily: 'Arial'
        }).setScrollFactor(0);
        
        button.setInteractive();
        button.on('pointerdown', () => {
          logAutopoiesis.info(`Game speed changed to ${speed}x`);
          button.setColor('#e74c3c');
          setTimeout(() => button.setColor('#3498db'), GAME_BALANCE.SPRITES.ANIMATION_DURATION);
        });
      });

      console.log('🐛 Debug controls created');
    }
  }

  /**
   * Limpieza al destruir la escena
   */
  destroy(): void {

    if (this.resonanceLabelPool) {
      this.resonanceLabelPool.destroy();
    }
    
    logAutopoiesis.debug('UIScene destroyed - pools cleaned up');
    super.destroy();
  }
}
