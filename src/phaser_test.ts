import Phaser from "phaser";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#2c3e50",
  parent: "game-container",
  scene: {
    create() {
      console.log("Test de Phaser funcionando");
      this.add
        .text(400, 300, "Test básico de Phaser", {
          fontSize: "32px",
          color: "#ffffff",
        })
        .setOrigin(0.5);
    },
  },
};

const game = new Phaser.Game(config);
console.log("Juego creado:", game);
