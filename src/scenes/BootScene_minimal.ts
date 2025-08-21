import Phaser from "phaser";
import { logAutopoiesis } from "../utils/logger";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  async preload() {
    logAutopoiesis.info("🚀 BootScene minimal iniciando...");

    // Completamente básico - solo pasar a MainScene
    this.hideLoadingScreen();

    logAutopoiesis.info("✅ BootScene minimal completado");
  }

  create() {
    logAutopoiesis.info("🔄 Cambiando a MainScene...");
    this.scene.start("MainScene");
  }

  private hideLoadingScreen() {
    const loadingElement = document.getElementById("loading-screen");
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
  }
}
