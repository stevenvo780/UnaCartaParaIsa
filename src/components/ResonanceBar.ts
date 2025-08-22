import { logAutopoiesis } from "../utils/logger";

/**
 * Barra de resonancia emocional/energética
 * Muestra el estado actual del mundo y las entidades
 */
export class ResonanceBar extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private progressBar: Phaser.GameObjects.Graphics;
  private resonanceLabel: Phaser.GameObjects.Text;
  private resonanceValue: Phaser.GameObjects.Text;

  private currentResonance = 0.5; // 0-1
  private targetResonance = 0.5;
  private readonly barWidth = 200;
  private readonly barHeight = 12;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.createBackground();
    this.createProgressBar();
    this.createLabels();

    scene.add.existing(this);

    logAutopoiesis.info("🎵 ResonanceBar creada", { x, y });
  }

  private createBackground(): void {
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x2a2a2a, 0.8);
    this.background.fillRoundedRect(
      -this.barWidth / 2,
      -this.barHeight / 2,
      this.barWidth,
      this.barHeight,
      6,
    );
    this.background.lineStyle(1, 0x4a4a4a, 1);
    this.background.strokeRoundedRect(
      -this.barWidth / 2,
      -this.barHeight / 2,
      this.barWidth,
      this.barHeight,
      6,
    );
    this.add(this.background);
  }

  private createProgressBar(): void {
    this.progressBar = this.scene.add.graphics();
    this.add(this.progressBar);
  }

  private createLabels(): void {
    this.resonanceLabel = this.scene.add.text(
      -this.barWidth / 2 - 60,
      0,
      "Resonancia:",
      {
        fontSize: "12px",
        color: "#ffffff",
        fontFamily: "Arial",
      },
    );
    this.resonanceLabel.setOrigin(1, 0.5);
    this.add(this.resonanceLabel);

    this.resonanceValue = this.scene.add.text(
      this.barWidth / 2 + 10,
      0,
      "50%",
      {
        fontSize: "12px",
        color: "#ffffff",
        fontFamily: "Arial",
      },
    );
    this.resonanceValue.setOrigin(0, 0.5);
    this.add(this.resonanceValue);
  }

  private updateProgressBar(): void {
    this.progressBar.clear();

    const progress = this.currentResonance;
    const progressWidth = (this.barWidth - 4) * progress;

    // Determinar color según nivel de resonancia
    let color = 0x4caf50; // Verde por defecto
    if (progress < 0.3) {
      color = 0xf44336; // Rojo
    } else if (progress < 0.6) {
      color = 0xff9800; // Naranja
    } else if (progress > 0.8) {
      color = 0x9c27b0; // Púrpura (alta resonancia)
    }

    // Barra de progreso con gradiente sutil
    this.progressBar.fillGradientStyle(
      color,
      color,
      color & 0x888888,
      color & 0x888888,
      1,
    );
    this.progressBar.fillRoundedRect(
      -this.barWidth / 2 + 2,
      -this.barHeight / 2 + 2,
      progressWidth,
      this.barHeight - 4,
      4,
    );

    // Efecto de brillo si resonancia alta
    if (progress > 0.7) {
      this.progressBar.lineStyle(1, 0xffffff, 0.3);
      this.progressBar.strokeRoundedRect(
        -this.barWidth / 2 + 2,
        -this.barHeight / 2 + 2,
        progressWidth,
        this.barHeight - 4,
        4,
      );
    }
  }

  /**
   * Actualiza la resonancia objetivo (animación suave)
   */
  public setResonance(value: number): void {
    this.targetResonance = Phaser.Math.Clamp(value, 0, 1);
  }

  /**
   * Actualiza la resonancia basada en estado del juego
   */
  public updateFromGameState(gameState: Record<string, unknown>): void {
    if (!gameState) return;

    let resonance = 0.5; // Base neutral

    // Factores que afectan la resonancia
    if (gameState.entities && typeof gameState.entities === "object") {
      const entities = Object.values(gameState.entities) as Record<
        string,
        unknown
      >[];

      // Bienestar promedio de entidades
      const avgWellbeing =
        entities.reduce((sum: number, entity: Record<string, unknown>) => {
          const needs = (entity.needs as Record<string, number>) || {};
          const needsSum = Object.values(needs).reduce(
            (s: number, n: number) => s + n,
            0,
          );
          return sum + (needsSum / Object.keys(needs).length || 0.5);
        }, 0) / (entities.length || 1);

      resonance = avgWellbeing;
    }

    // Factor de tiempo (día/noche)
    const dayNightCycle = gameState.dayNightCycle as Record<string, unknown>;
    if (
      dayNightCycle?.timeOfDay &&
      typeof dayNightCycle.timeOfDay === "number"
    ) {
      const timeOfDay = dayNightCycle.timeOfDay;
      // Amanecer y atardecer tienen resonancia más alta
      if (
        (timeOfDay > 0.2 && timeOfDay < 0.4) ||
        (timeOfDay > 0.7 && timeOfDay < 0.9)
      ) {
        resonance += 0.1;
      }
    }

    this.setResonance(resonance);
  }

  /**
   * Update loop - animar hacia el valor objetivo
   */
  public update(): void {
    // Interpolación suave hacia el objetivo
    const diff = this.targetResonance - this.currentResonance;
    if (Math.abs(diff) > 0.001) {
      this.currentResonance += diff * 0.05; // 5% por frame
      this.updateProgressBar();

      // Actualizar texto
      const percentage = Math.round(this.currentResonance * 100);
      this.resonanceValue.setText(`${percentage}%`);
    }
  }

  /**
   * Establecer visibilidad de la barra
   */
  public setBarVisible(visible: boolean): void {
    this.setVisible(visible);
  }

  /**
   * Obtener valor actual de resonancia
   */
  public getCurrentResonance(): number {
    return this.currentResonance;
  }
}
