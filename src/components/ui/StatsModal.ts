import Phaser from "phaser";
import type { GameLogicUpdateData } from "../../types";

export class StatsModalContent {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private statTexts: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = this.scene.add.container(0, 0);
    this.build();
  }

  getContainer() {
    return this.container;
  }

  update(data: GameLogicUpdateData) {
    const map = new Map<string, number>();
    const isa = data.entities?.find((e) => e.id === "isa");
    const stev = data.entities?.find((e) => e.id === "stev");

    if (isa) {
      map.set("isa.health", Math.round(isa.stats.health));
      map.set("isa.energy", Math.round(isa.stats.energy));
      map.set("isa.hunger", Math.round(isa.stats.hunger));
      map.set("isa.thirst", Math.round(isa.stats.thirst || 0));
      map.set("isa.mentalHealth", Math.round(isa.stats.mentalHealth || 0));
      map.set("isa.stamina", Math.round(isa.stats.stamina || 50));
      map.set("isa.intelligence", Math.round(isa.stats.intelligence || 50));
      map.set("isa.socialSkills", Math.round(isa.stats.socialSkills || 50));
    }

    if (stev) {
      map.set("stev.health", Math.round(stev.stats.health));
      map.set("stev.energy", Math.round(stev.stats.energy));
      map.set("stev.hunger", Math.round(stev.stats.hunger));
      map.set("stev.thirst", Math.round(stev.stats.thirst || 0));
      map.set("stev.mentalHealth", Math.round(stev.stats.mentalHealth || 0));
      map.set("stev.stamina", Math.round(stev.stats.stamina || 50));
      map.set("stev.intelligence", Math.round(stev.stats.intelligence || 50));
      map.set("stev.socialSkills", Math.round(stev.stats.socialSkills || 50));
    }

    this.statTexts.forEach((t) => {
      const key = t.getData("statKey") as string;
      const label = t.getData("label") as string;
      const icon = t.getData("icon") as string;
      const val = map.get(key) ?? 0;

      // Colorear basado en el valor con mejor paleta
      let color = "#ecf0f1"; // Color normal
      let statusIcon = "";

      if (val < 20) {
        color = "#ff4757"; // Rojo crítico
        statusIcon = " ⚠️";
      } else if (val < 40) {
        color = "#ff9ff3"; // Naranja advertencia
        statusIcon = " ⚠️";
      } else if (val < 60) {
        color = "#ffa502"; // Amarillo cuidado
        statusIcon = " ⚠️";
      } else if (val >= 80) {
        color = "#2ed573"; // Verde excelente
        statusIcon = " ✅";
      }

      // Mostrar con icono, label, valor y estado
      t.setText(`${icon} ${label}: ${val}%${statusIcon}`);
      t.setColor(color);
    });
  }

  private build() {
    const mk = (
      x: number,
      y: number,
      icon: string,
      label: string,
      key: string,
    ) => {
      const t = this.scene.add.text(x, y, `${icon} ${label}: 0`, {
        fontSize: "12px",
        color: "#ecf0f1",
        fontStyle: "normal",
      });
      t.setData("statKey", key);
      t.setData("label", label);
      t.setData("icon", icon);
      this.container.add(t);
      this.statTexts.push(t);
    };

    // Título del modal mejorado
    const modalTitle = this.scene.add.text(
      150,
      -10,
      "📊 ESTADÍSTICAS DETALLADAS",
      {
        fontSize: "14px",
        color: "#74b9ff",
        fontStyle: "bold",
        align: "center",
      },
    );
    modalTitle.setOrigin(0.5, 0);
    this.container.add(modalTitle);

    // Fondo para sección Isa
    const isaBg = this.scene.add.graphics();
    isaBg.fillStyle(0xe91e63, 0.1);
    isaBg.fillRoundedRect(-5, 10, 160, 155, 8);
    isaBg.lineStyle(2, 0xe91e63, 0.3);
    isaBg.strokeRoundedRect(-5, 10, 160, 155, 8);
    this.container.add(isaBg);

    // Sección Isa mejorada
    const isaTitle = this.scene.add.text(10, 20, "👩 Isa", {
      fontSize: "14px",
      color: "#e91e63",
      fontStyle: "bold",
    });
    this.container.add(isaTitle);

    mk(10, 40, "💚", "Salud", "isa.health");
    mk(10, 55, "⚡", "Energía", "isa.energy");
    mk(10, 70, "🍖", "Hambre", "isa.hunger");
    mk(10, 85, "💧", "Sed", "isa.thirst");
    mk(10, 100, "🧠", "Mental", "isa.mentalHealth");
    mk(10, 115, "🏃", "Resistencia", "isa.stamina");
    mk(10, 130, "🎓", "Inteligencia", "isa.intelligence");
    mk(10, 145, "👥", "Social", "isa.socialSkills");

    // Línea separadora mejorada
    const separator = this.scene.add.graphics();
    separator.lineStyle(2, 0x74b9ff, 0.6);
    separator.lineBetween(170, 15, 170, 160);
    // Puntos decorativos
    separator.fillStyle(0x74b9ff, 0.8);
    separator.fillCircle(170, 15, 3);
    separator.fillCircle(170, 85, 3);
    separator.fillCircle(170, 160, 3);
    this.container.add(separator);

    // Fondo para sección Stev
    const stevBg = this.scene.add.graphics();
    stevBg.fillStyle(0x3498db, 0.1);
    stevBg.fillRoundedRect(185, 10, 160, 155, 8);
    stevBg.lineStyle(2, 0x3498db, 0.3);
    stevBg.strokeRoundedRect(185, 10, 160, 155, 8);
    this.container.add(stevBg);

    // Sección Stev mejorada
    const stevTitle = this.scene.add.text(195, 20, "👨 Stev", {
      fontSize: "14px",
      color: "#3498db",
      fontStyle: "bold",
    });
    this.container.add(stevTitle);

    mk(195, 40, "💚", "Salud", "stev.health");
    mk(195, 55, "⚡", "Energía", "stev.energy");
    mk(195, 70, "🍖", "Hambre", "stev.hunger");
    mk(195, 85, "💧", "Sed", "stev.thirst");
    mk(195, 100, "🧠", "Mental", "stev.mentalHealth");
    mk(195, 115, "🏃", "Resistencia", "stev.stamina");
    mk(195, 130, "🎓", "Inteligencia", "stev.intelligence");
    mk(195, 145, "👥", "Social", "stev.socialSkills");
  }
}
