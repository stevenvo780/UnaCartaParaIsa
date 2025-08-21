import Phaser from "phaser";
import BootScene from "./scenes/BootScene_ultrabasic";
import MainScene from "./scenes/MainScene_ultrabasic";

// Configuración mínima de Phaser sin imports complejos
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1200,
  height: 800,
  backgroundColor: "#2c3e50",
  parent: "game-container",
  pixelArt: true,
  roundPixels: true,
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
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
      fps: 60,
    },
  },
  scene: [BootScene, MainScene],
};

const game = new Phaser.Game(config);

export default game;
