/**
 * UI para mostrar el estado de sistemas críticos del juego
 */

import { DayNightSystem } from "../systems/DayNightSystem";
import { EmergenceSystem } from "../systems/EmergenceSystem";

interface SystemStatus {
  name: string;
  status: "active" | "inactive" | "warning" | "error";
  details?: string;
  color: number;
}

export class SystemStatusUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private statusIndicators: Map<string, Phaser.GameObjects.Group> = new Map();
  private isVisible = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createUI();
  }

  private createUI(): void {
    // Crear contenedor en esquina inferior izquierda
    this.container = this.scene.add.container(
      20,
      this.scene.cameras.main.height - 150,
    );
    this.container.setScrollFactor(0);
    this.container.setDepth(999);

    // Fondo semi-transparente
    const background = this.scene.add.graphics();
    background.fillStyle(0x000000, 0.6);
    background.fillRoundedRect(0, 0, 200, 130, 8);
    this.container.add(background);

    // Título
    const title = this.scene.add.text(10, 10, "SISTEMAS", {
      fontSize: "12px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    this.container.add(title);

    // Inicializar indicadores de sistemas
    this.initializeSystemIndicators();

    // Hacer cliqueable para ocultar/mostrar
    background.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 200, 130),
      Phaser.Geom.Rectangle.Contains,
    );

    background.on("pointerdown", () => {
      this.toggleVisibility();
    });
  }

  private initializeSystemIndicators(): void {
    const systems = [
      {
        name: "World",
        status: "active",
        details: "Biomas generados",
        color: 0x27ae60,
      },
      {
        name: "AI",
        status: "active",
        details: "Entidades pensando",
        color: 0x3498db,
      },
      {
        name: "Needs",
        status: "warning",
        details: "Monitoreo activo",
        color: 0xf39c12,
      },
      {
        name: "Movement",
        status: "active",
        details: "Pathfinding OK",
        color: 0x2ecc71,
      },
      {
        name: "Dialogue",
        status: "active",
        details: "Cartas disponibles",
        color: 0x9b59b6,
      },
    ];

    systems.forEach((system, index) => {
      const yPos = 35 + index * 18;

      // Indicador de estado (círculo)
      const statusCircle = this.scene.add.circle(15, yPos, 4, system.color);

      // Nombre del sistema
      const systemName = this.scene.add.text(25, yPos - 6, system.name, {
        fontSize: "10px",
        color: "#ffffff",
      });

      // Detalles del sistema
      const systemDetails = this.scene.add.text(80, yPos - 6, system.details, {
        fontSize: "9px",
        color: "#aaaaaa",
      });

      const group = this.scene.add.group([
        statusCircle,
        systemName,
        systemDetails,
      ]);
      this.statusIndicators.set(system.name, group);
      this.container.add([statusCircle, systemName, systemDetails]);
    });
  }

  public updateSystemStatus(systemName: string, status: SystemStatus): void {
    const group = this.statusIndicators.get(systemName);
    if (!group) return;

    const children = group.getChildren();
    const statusCircle = children[0] as Phaser.GameObjects.Shape;
    const systemDetails = children[2] as Phaser.GameObjects.Text;

    // Actualizar color del indicador
    statusCircle.fillColor = status.color;

    // Actualizar detalles
    if (status.details) {
      systemDetails.setText(status.details);
    }

    // Efecto de parpadeo para warnings y errores
    if (status.status === "warning" || status.status === "error") {
      this.scene.tweens.add({
        targets: statusCircle,
        alpha: { from: 1, to: 0.3 },
        duration: 500,
        yoyo: true,
        repeat: 2,
        ease: "Power2.easeInOut",
      });
    }
  }

  public updateEmergenceStatus(emergenceSystem: EmergenceSystem): void {
    // Obtener estadísticas del sistema de emergencia
    const stats = emergenceSystem.getSystemStats();

    let status: SystemStatus;
    if (stats.patterns > 5) {
      status = {
        name: "Emergence",
        status: "active",
        details: `${stats.patterns} patrones`,
        color: 0x27ae60,
      };
    } else if (stats.patterns > 2) {
      status = {
        name: "Emergence",
        status: "warning",
        details: `${stats.patterns} patrones`,
        color: 0xf39c12,
      };
    } else {
      status = {
        name: "Emergence",
        status: "inactive",
        details: "Analizando...",
        color: 0x95a5a6,
      };
    }

    this.updateSystemStatus("AI", status);
  }

  public updateDayNightStatus(dayNightSystem: DayNightSystem): void {
    const timeInfo = dayNightSystem.getCurrentTimeInfo();

    const status: SystemStatus = {
      name: "Time",
      status: "active",
      details: `${timeInfo.phase} ${String(timeInfo.hour).padStart(2, "0")}:${String(timeInfo.minute).padStart(2, "0")}`,
      color:
        timeInfo.phase === "morning" ||
        timeInfo.phase === "midday" ||
        timeInfo.phase === "afternoon"
          ? 0xf1c40f
          : 0x2c3e50,
    };

    // Agregar indicador de tiempo si no existe
    if (!this.statusIndicators.has("Time")) {
      const yPos = 35 + this.statusIndicators.size * 18;

      const statusCircle = this.scene.add.circle(15, yPos, 4, status.color);
      const systemName = this.scene.add.text(25, yPos - 6, "Time", {
        fontSize: "10px",
        color: "#ffffff",
      });
      const systemDetails = this.scene.add.text(80, yPos - 6, status.details!, {
        fontSize: "9px",
        color: "#aaaaaa",
      });

      const group = this.scene.add.group([
        statusCircle,
        systemName,
        systemDetails,
      ]);
      this.statusIndicators.set("Time", group);
      this.container.add([statusCircle, systemName, systemDetails]);

      // Expandir fondo
      const background = this.container.list[0] as Phaser.GameObjects.Graphics;
      background.clear();
      background.fillStyle(0x000000, 0.6);
      background.fillRoundedRect(0, 0, 200, 150, 8);
    }

    this.updateSystemStatus("Time", status);
  }

  public updateNeedsStatus(criticalCount: number, warningCount: number): void {
    let status: SystemStatus;

    if (criticalCount > 0) {
      status = {
        name: "Needs",
        status: "error",
        details: `${criticalCount} críticos`,
        color: 0xe74c3c,
      };
    } else if (warningCount > 0) {
      status = {
        name: "Needs",
        status: "warning",
        details: `${warningCount} advertencias`,
        color: 0xf39c12,
      };
    } else {
      status = {
        name: "Needs",
        status: "active",
        details: "Estado normal",
        color: 0x27ae60,
      };
    }

    this.updateSystemStatus("Needs", status);
  }

  public showSystemEvent(
    message: string,
    type: "info" | "warning" | "error" = "info",
  ): void {
    const colors = {
      info: 0x3498db,
      warning: 0xf39c12,
      error: 0xe74c3c,
    };

    // Crear notificación flotante
    const notification = this.scene.add.container(
      this.container.x + 210,
      this.container.y + 50,
    );
    notification.setDepth(1001);

    const bg = this.scene.add.graphics();
    bg.fillStyle(colors[type], 0.9);
    bg.fillRoundedRect(-5, -5, message.length * 6 + 10, 25, 4);

    const text = this.scene.add.text(0, 0, message, {
      fontSize: "10px",
      color: "#ffffff",
    });

    notification.add([bg, text]);

    // Animación de entrada y salida
    notification.setAlpha(0);
    notification.setScale(0.8);

    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: "Back.easeOut",
      onComplete: () => {
        this.scene.time.delayedCall(3000, () => {
          this.scene.tweens.add({
            targets: notification,
            alpha: 0,
            scaleX: 0.8,
            scaleY: 0.8,
            duration: 300,
            ease: "Power2.easeIn",
            onComplete: () => {
              notification.destroy();
            },
          });
        });
      },
    });
  }

  public toggleVisibility(): void {
    this.isVisible = !this.isVisible;
    this.container.setVisible(this.isVisible);
  }

  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.container.setVisible(visible);
  }

  public destroy(): void {
    if (this.container) {
      this.container.destroy();
    }
    this.statusIndicators.clear();
  }
}
