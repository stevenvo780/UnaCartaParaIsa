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
    }
    
    if (stev) {
      map.set("stev.health", Math.round(stev.stats.health));
      map.set("stev.energy", Math.round(stev.stats.energy));
      map.set("stev.hunger", Math.round(stev.stats.hunger));
      map.set("stev.thirst", Math.round(stev.stats.thirst || 0));
      map.set("stev.mentalHealth", Math.round(stev.stats.mentalHealth || 0));
    }
    
    this.statTexts.forEach((t) => {
      const key = t.getData("statKey") as string;
      const label = t.getData("label") as string;
      const val = map.get(key) ?? 0;
      
      // Colorear basado en el valor
      let color = "#ecf0f1"; // Color normal
      if (val < 20) {
        color = "#e74c3c"; // Rojo crítico
      } else if (val < 40) {
        color = "#f39c12"; // Naranja advertencia
      } else if (val < 60) {
        color = "#f1c40f"; // Amarillo cuidado
      }
      
      t.setText(`${label}: ${val}`);
      t.setColor(color);
    });
  }

  private build() {
    const mk = (x: number, y: number, label: string, key: string) => {
      const t = this.scene.add.text(x, y, `${label}: 0`, {
        fontSize: "10px",
        color: "#ecf0f1",
      });
      t.setData("statKey", key);
      t.setData("label", label);
      this.container.add(t);
      this.statTexts.push(t);
    };
    
    // Sección Isa
    const isaTitle = this.scene.add.text(0, 0, "👩 Isa", {
      fontSize: "12px",
      color: "#e91e63",
      fontStyle: "bold",
    });
    this.container.add(isaTitle);
    
    mk(0, 16, "Salud", "isa.health");
    mk(0, 30, "Energía", "isa.energy");
    mk(0, 44, "Hambre", "isa.hunger");
    mk(0, 58, "Sed", "isa.thirst");
    mk(0, 72, "Mental", "isa.mentalHealth");

    // Línea separadora
    const separator = this.scene.add.graphics();
    separator.lineStyle(1, 0x555555, 0.5);
    separator.lineBetween(170, 0, 170, 90);
    this.container.add(separator);

    // Sección Stev
    const stevTitle = this.scene.add.text(180, 0, "👨 Stev", {
      fontSize: "12px",
      color: "#3498db",
      fontStyle: "bold",
    });
    this.container.add(stevTitle);
    
    mk(180, 16, "Salud", "stev.health");
    mk(180, 30, "Energía", "stev.energy");
    mk(180, 44, "Hambre", "stev.hunger");
    mk(180, 58, "Sed", "stev.thirst");
    mk(180, 72, "Mental", "stev.mentalHealth");
  }
}
