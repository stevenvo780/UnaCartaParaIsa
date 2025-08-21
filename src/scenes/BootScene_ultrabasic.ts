import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    console.log("BootScene ultra básico iniciando...");

    // Ocultar loading screen
    const loadingElement = document.getElementById("loading");
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
  }

  create() {
    console.log("BootScene -> MainScene");
    this.scene.start("MainScene");
  }
}
