import Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
  }

  create() {
    console.log("MainScene básico creado");

    // Solo agregar un texto básico
    this.add
      .text(400, 300, "🎮 MainScene Ultra Básico", {
        fontSize: "24px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    console.log("Texto agregado exitosamente");
  }

  update() {
    // Vacío
  }
}
