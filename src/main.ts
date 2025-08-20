import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { MainScene } from './scenes/MainScene';
import { UIScene } from './scenes/UIScene';
import { productionOptimizer } from './utils/productionOptimizer';

// Obtener optimizaciones de producción
const phaserOptimizations = productionOptimizer.getPhaserOptimizations();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1200,
  height: 800,
  backgroundColor: '#2c3e50',
  parent: 'game-container',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 800,
      height: 600,
    },
    max: {
      width: 2560,
      height: 1440,
    },
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: gameConfig.debugMode,
      fps: gameConfig.targetFPS,
      ...(phaserOptimizations.physics?.arcade || {}),
    },
  },
  scene: [BootScene, MainScene, UIScene],
  // Aplicar optimizaciones de producción
  ...phaserOptimizations,
  callbacks: {
    postBoot(game) {
      game.registry.set('gameConfig', gameConfig);

      if (gameConfig.debugMode) {
        (
          window as unknown as Window & {
            game: Phaser.Game;
            scenes: Record<string, Phaser.Scene>;
          }
        ).game = game;
        (
          window as unknown as Window & {
            game: Phaser.Game;
            scenes: Record<string, Phaser.Scene>;
          }
        ).scenes = {
          boot: game.scene.getScene('BootScene'),
          main: game.scene.getScene('MainScene'),
          ui: game.scene.getScene('UIScene'),
        };
        // Solo en modo debug, usar console.log para información de desarrollo
        if (gameConfig.debugMode) {
          console.log('🎮 Una Carta Para Isa - Debug mode enabled');
          console.log('🔧 Access game object via window.game');
          console.log('🎭 Access scenes via window.scenes');
        }
      }
    },
  },
};

const game = new Phaser.Game(config);

export default game;
