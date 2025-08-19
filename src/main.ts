import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { BootScene } from './scenes/BootScene.ts';
import { MainScene } from './scenes/MainScene.ts';
import { UIScene } from './scenes/UIScene.ts';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1200,
  height: 800,
  backgroundColor: '#2c3e50',
  parent: 'game-container',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 800,
      height: 600
    },
    max: {
      width: 1920,
      height: 1080
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: gameConfig.debugMode,
      fps: gameConfig.targetFPS
    }
  },
  scene: [BootScene, MainScene, UIScene],
  callbacks: {
    postBoot: function (game) {

      game.registry.set('gameConfig', gameConfig);
      

      if (gameConfig.debugMode) {
        (window as any).game = game;
        (window as any).scenes = {
          boot: game.scene.getScene('BootScene'),
          main: game.scene.getScene('MainScene'),
          ui: game.scene.getScene('UIScene')
        };
        console.log('🎮 Una Carta Para Isa - Debug mode enabled');
        console.log('🔧 Access game object via window.game');
        console.log('🎭 Access scenes via window.scenes');
      }
    }
  }
};


const game = new Phaser.Game(config);

export default game;
