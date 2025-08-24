/**
 * LoadingProgressManager - Gestiona el progreso de carga global del juego
 * Coordina todas las fases de carga: assets, generación de mundo, renderizado
 */

import { logAutopoiesis } from "./logger";

export interface LoadingPhase {
  name: string;
  weight: number; // Peso relativo en el progreso total (0-1)
  progress: number; // Progreso actual de esta fase (0-1)
  status: "pending" | "loading" | "completed" | "error";
  message?: string;
}

export class LoadingProgressManager {
  private phases: Map<string, LoadingPhase> = new Map();
  private scene: Phaser.Scene;
  private progressBar?: Phaser.GameObjects.Graphics;
  private progressBox?: Phaser.GameObjects.Graphics;
  private loadingText?: Phaser.GameObjects.Text;
  private percentText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  public isVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializePhases();
  }

  private initializePhases(): void {
    // Definir todas las fases de carga con sus pesos relativos
    this.phases.set("boot", {
      name: "Cargando assets básicos...",
      weight: 0.1, // 10% del progreso total
      progress: 0,
      status: "pending",
    });

    this.phases.set("assets", {
      name: "Cargando assets ambientales...",
      weight: 0.3, // 30% del progreso total
      progress: 0,
      status: "pending",
    });

    this.phases.set("world_generation", {
      name: "Mundo simple cargando...",
      weight: 0.15, // 15% del progreso total
      progress: 0,
      status: "pending",
    });

    this.phases.set("world_composition", {
      name: "Componiendo biomas y assets...",
      weight: 0.25, // 25% del progreso total
      progress: 0,
      status: "pending",
    });

    this.phases.set("world_rendering", {
      name: "Renderizando mundo (1200+ assets)...",
      weight: 0.15, // 15% del progreso total
      progress: 0,
      status: "pending",
    });

    this.phases.set("entities", {
      name: "Inicializando entidades y lógica...",
      weight: 0.05, // 5% del progreso total
      progress: 0,
      status: "pending",
    });

    logAutopoiesis.info("🎯 LoadingProgressManager inicializado con fases:", {
      totalPhases: this.phases.size,
      phases: Array.from(this.phases.keys()),
    });
  }

  /**
   * Muestra la barra de progreso
   */
  showProgressBar(): void {
    if (this.isVisible) return;

    // Siempre usar HTML fallback durante las primeras fases de carga para evitar errores de contexto
    logAutopoiesis.info(
      "📊 Usando barra de progreso HTML durante carga inicial",
    );
    this.createHTMLProgressBar();
    return;

    // TODO: La barra Phaser se puede implementar más tarde cuando el contexto esté completamente estable
    /*
    try {
      // Verificar que Phaser esté completamente inicializado antes de crear graphics
      if (!this.scene || !this.scene.add || !this.scene.cameras?.main || !this.scene.renderer) {
        logAutopoiesis.warn("⚠️ Phaser no está completamente inicializado, usando fallback HTML");
        this.createHTMLProgressBar();
        return;
      }

      // Usar dimensiones por defecto si las cámaras no están inicializadas
      const width =
        this.scene.cameras.main?.width || this.scene.scale.gameSize?.width || 800;
      const height =
        this.scene.cameras.main?.height ||
        this.scene.scale.gameSize?.height ||
        600;

    // Fondo de carga mejorado
    this.progressBox = this.scene.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.9);
    this.progressBox.fillRect(width / 4, height / 2 - 60, width / 2, 120);

    // Borde elegante
    this.progressBox.lineStyle(2, 0x6c5ce7, 1);
    this.progressBox.strokeRect(width / 4, height / 2 - 60, width / 2, 120);

    // Barra de progreso
    this.progressBar = this.scene.add.graphics();

    // Texto principal de carga
    this.loadingText = this.scene.add.text(
      width / 2,
      height / 2 - 40,
      "Cargando Una Carta Para Isa...",
      {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        fontStyle: "bold",
      },
    );
    this.loadingText.setOrigin(0.5, 0.5);

    // Texto de porcentaje
    this.percentText = this.scene.add.text(width / 2, height / 2, "0%", {
      fontSize: "20px",
      color: "#6c5ce7",
      fontFamily: "Arial, sans-serif",
      fontStyle: "bold",
    });
    this.percentText.setOrigin(0.5, 0.5);

    // Texto de estado actual
    this.statusText = this.scene.add.text(
      width / 2,
      height / 2 + 25,
      "Preparando carga...",
      {
        fontSize: "14px",
        color: "#cccccc",
        fontFamily: "Arial, sans-serif",
      },
    );
    this.statusText.setOrigin(0.5, 0.5);

    this.isVisible = true;
    logAutopoiesis.info("📊 Barra de progreso mostrada");
    
    } catch (error) {
      logAutopoiesis.error("❌ Error creando barra de progreso:", error);
      // Marcar como visible para evitar reintentos infinitos
      this.isVisible = true;
    }
    */
  }

  /**
   * Actualiza el progreso de una fase específica
   */
  updatePhase(phaseKey: string, progress: number, message?: string): void {
    const phase = this.phases.get(phaseKey);
    if (!phase) {
      logAutopoiesis.warn(`⚠️ Fase desconocida: ${phaseKey}`);
      return;
    }

    phase.progress = Math.max(0, Math.min(1, progress));
    phase.status = progress >= 1 ? "completed" : "loading";
    if (message) {
      phase.message = message;
    }

    this.updateDisplay();

    logAutopoiesis.debug(
      `📈 Fase ${phaseKey}: ${Math.round(progress * 100)}%`,
      {
        message: message || phase.name,
      },
    );
  }

  /**
   * Marca una fase como iniciada
   */
  startPhase(phaseKey: string, message?: string): void {
    const phase = this.phases.get(phaseKey);
    if (!phase) return;

    phase.status = "loading";
    phase.progress = 0;
    if (message) {
      phase.message = message;
    }

    this.updateDisplay();
    logAutopoiesis.info(`🚀 Iniciando fase: ${phaseKey}`, {
      message: message || phase.name,
    });
  }

  /**
   * Marca una fase como completada
   */
  completePhase(phaseKey: string, message?: string): void {
    this.updatePhase(phaseKey, 1, message);
    logAutopoiesis.info(`✅ Fase completada: ${phaseKey}`);
  }

  /**
   * Calcula el progreso total basado en todas las fases
   */
  private calculateTotalProgress(): number {
    let totalProgress = 0;

    for (const phase of this.phases.values()) {
      totalProgress += phase.progress * phase.weight;
    }

    return Math.max(0, Math.min(1, totalProgress));
  }

  /**
   * Obtiene el mensaje de estado actual
   */
  private getCurrentStatusMessage(): string {
    // Buscar la primera fase que esté cargando
    for (const phase of this.phases.values()) {
      if (phase.status === "loading") {
        return phase.message || phase.name;
      }
    }

    // Si no hay ninguna cargando, buscar la primera pendiente
    for (const phase of this.phases.values()) {
      if (phase.status === "pending") {
        return phase.message || phase.name;
      }
    }

    return "Completando carga...";
  }

  /**
   * Actualiza la visualización de la barra de progreso
   */
  private updateDisplay(): void {
    const totalProgress = this.calculateTotalProgress();
    const percentage = Math.round(totalProgress * 100);
    const statusMessage = this.getCurrentStatusMessage();

    // Actualizar barra HTML si existe
    const htmlProgressBar = document.getElementById("html-progress-bar");
    const htmlPercentText = document.getElementById("html-percent-text");
    const htmlStatusText = document.getElementById("html-status-text");

    if (htmlProgressBar && htmlPercentText && htmlStatusText) {
      htmlProgressBar.style.width = `${percentage}%`;
      htmlPercentText.textContent = `${percentage}%`;
      htmlStatusText.textContent = statusMessage;
    }

    // Actualizar barra Phaser si existe
    if (
      !this.isVisible ||
      !this.progressBar ||
      !this.percentText ||
      !this.statusText
    ) {
      return;
    }

    // Usar dimensiones por defecto si las cámaras no están inicializadas
    const width =
      this.scene.cameras.main?.width || this.scene.scale.gameSize?.width || 800;
    const height =
      this.scene.cameras.main?.height ||
      this.scene.scale.gameSize?.height ||
      600;

    // Actualizar barra de progreso con gradiente
    this.progressBar.clear();

    // Fondo de la barra
    this.progressBar.fillStyle(0x444444, 0.8);
    this.progressBar.fillRect(
      width / 4 + 10,
      height / 2 - 15,
      width / 2 - 20,
      30,
    );

    // Progreso actual con gradiente de color según el porcentaje
    let barColor = 0x6c5ce7; // Púrpura base
    if (percentage > 75) {
      barColor = 0x00b894; // Verde cuando está casi completo
    } else if (percentage > 50) {
      barColor = 0xfdcb6e; // Amarillo a mitad
    }

    this.progressBar.fillStyle(barColor, 1);
    this.progressBar.fillRect(
      width / 4 + 10,
      height / 2 - 15,
      (width / 2 - 20) * totalProgress,
      30,
    );

    // Brillo en la barra
    this.progressBar.fillStyle(0xffffff, 0.3);
    this.progressBar.fillRect(
      width / 4 + 10,
      height / 2 - 15,
      (width / 2 - 20) * totalProgress,
      8,
    );

    // Actualizar textos
    this.percentText.setText(`${percentage}%`);
    this.statusText.setText(this.getCurrentStatusMessage());

    // Efecto de parpadeo sutil en el texto de estado
    if (percentage < 100) {
      this.statusText.setAlpha(0.8 + Math.sin(Date.now() * 0.005) * 0.2);
    } else {
      this.statusText.setAlpha(1);
    }
  }

  /**
   * Oculta la barra de progreso cuando la carga está completa
   */
  hideProgressBar(): void {
    if (!this.isVisible) return;

    // Remover barra HTML si existe
    const htmlOverlay = document.getElementById("loading-overlay");
    if (htmlOverlay) {
      htmlOverlay.style.opacity = "0";
      htmlOverlay.style.transition = "opacity 0.5s ease-out";
      setTimeout(() => {
        htmlOverlay.remove();
      }, 500);
      logAutopoiesis.info("📊 Barra de progreso HTML removida");
    }

    // Ocultar barra Phaser si existe
    if (this.progressBar || this.progressBox || this.loadingText) {
      this.scene.tweens.add({
        targets: [
          this.progressBar,
          this.progressBox,
          this.loadingText,
          this.percentText,
          this.statusText,
        ],
        alpha: 0,
        duration: 500,
        ease: "Power2.easeInOut",
        onComplete: () => {
          this.progressBar?.destroy();
          this.progressBox?.destroy();
          this.loadingText?.destroy();
          this.percentText?.destroy();
          this.statusText?.destroy();

          this.progressBar = undefined;
          this.progressBox = undefined;
          this.loadingText = undefined;
          this.percentText = undefined;
          this.statusText = undefined;

          logAutopoiesis.info("📊 Barra de progreso Phaser ocultada");
        },
      });
    }

    this.isVisible = false;
    logAutopoiesis.info("📊 Barra de progreso completamente ocultada");
  }

  /**
   * Crea una barra de progreso HTML como fallback
   */
  private createHTMLProgressBar(): void {
    // Crear elementos HTML para la barra de progreso
    const overlay = document.createElement("div");
    overlay.id = "loading-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;

    const title = document.createElement("h2");
    title.textContent = "Cargando Una Carta Para Isa...";
    title.style.cssText = `
      color: white;
      margin-bottom: 20px;
      font-size: 24px;
    `;

    const progressContainer = document.createElement("div");
    progressContainer.style.cssText = `
      width: 400px;
      height: 20px;
      background: #333;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 10px;
    `;

    const progressBar = document.createElement("div");
    progressBar.id = "html-progress-bar";
    progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #6c5ce7, #a29bfe);
      transition: width 0.3s ease;
    `;

    const statusText = document.createElement("p");
    statusText.id = "html-status-text";
    statusText.textContent = "Preparando carga...";
    statusText.style.cssText = `
      color: #ccc;
      margin: 0;
      font-size: 14px;
    `;

    const percentText = document.createElement("p");
    percentText.id = "html-percent-text";
    percentText.textContent = "0%";
    percentText.style.cssText = `
      color: #6c5ce7;
      margin: 5px 0 0 0;
      font-size: 18px;
      font-weight: bold;
    `;

    progressContainer.appendChild(progressBar);
    overlay.appendChild(title);
    overlay.appendChild(progressContainer);
    overlay.appendChild(percentText);
    overlay.appendChild(statusText);

    document.body.appendChild(overlay);

    this.isVisible = true;
    logAutopoiesis.info("📊 Barra de progreso HTML creada");
  }

  /**
   * Verifica si todas las fases están completadas
   */
  isComplete(): boolean {
    return Array.from(this.phases.values()).every(
      (phase) => phase.status === "completed",
    );
  }

  /**
   * Obtiene estadísticas del progreso actual
   */
  getStats() {
    const phases = Array.from(this.phases.values());
    return {
      totalProgress: this.calculateTotalProgress(),
      completedPhases: phases.filter((p) => p.status === "completed").length,
      totalPhases: phases.length,
      currentPhase:
        phases.find((p) => p.status === "loading")?.name || "Completado",
      isComplete: this.isComplete(),
    };
  }
}
