import Phaser from "phaser";
import type { GameLogicUpdateData } from "../../types";
import { ENTITY_STATS, UI_CONFIG } from "../../constants/WorldConfig";

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

    // Llenar mapa con TODAS las estadísticas usando las constantes centralizadas
    const entities = [
      { id: "isa", entity: isa },
      { id: "stev", entity: stev }
    ];

    entities.forEach(({ id, entity }) => {
      if (entity) {
        ENTITY_STATS.ALL.forEach(stat => {
          const value = entity.stats[stat.key as keyof typeof entity.stats] ?? 50;
          map.set(`${id}.${stat.key}`, Math.round(value));
        });
      }
    });

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
    const config = UI_CONFIG.STATS_MODAL;
    
    const mk = (
      x: number,
      y: number,
      icon: string,
      label: string,
      key: string,
    ) => {
      const t = this.scene.add.text(x, y, `${icon} ${label}: 0`, {
        fontSize: config.FONT_SIZE,
        color: "#ecf0f1",
        fontStyle: "normal",
      });
      t.setData("statKey", key);
      t.setData("label", label);
      t.setData("icon", icon);
      this.container.add(t);
      this.statTexts.push(t);
    };

    // Título del modal
    const modalTitle = this.scene.add.text(
      config.TOTAL_WIDTH / 2,
      -10,
      `📊 ESTADÍSTICAS COMPLETAS (${ENTITY_STATS.ALL.length} STATS)`,
      {
        fontSize: "13px",
        color: "#74b9ff",
        fontStyle: "bold",
        align: "center",
      },
    );
    modalTitle.setOrigin(0.5, 0);
    this.container.add(modalTitle);

    // Función para crear sección de estadísticas
    const createStatsSection = (
      entityId: string,
      title: string,
      color: number,
      xOffset: number
    ) => {
      // Fondo de la sección
      const bg = this.scene.add.graphics();
      bg.fillStyle(color, 0.08);
      bg.fillRoundedRect(xOffset - 5, 15, config.SECTION_WIDTH, config.SECTION_HEIGHT, 8);
      bg.lineStyle(2, color, 0.3);
      bg.strokeRoundedRect(xOffset - 5, 15, config.SECTION_WIDTH, config.SECTION_HEIGHT, 8);
      this.container.add(bg);

      // Título de la sección
      const sectionTitle = this.scene.add.text(xOffset + 10, 25, title, {
        fontSize: "12px",
        color: `#${color.toString(16).padStart(6, '0')}`,
        fontStyle: "bold",
      });
      this.container.add(sectionTitle);

      // Crear estadísticas organizadas por categoría
      let yPos = 50;
      const colWidth = 120;
      
      // Físicas
      ENTITY_STATS.PHYSICAL.forEach((stat, index) => {
        const x = xOffset + 10 + (Math.floor(index / 6) * colWidth);
        const y = yPos + (index % 6) * config.LINE_HEIGHT;
        mk(x, y, stat.icon, stat.label, `${entityId}.${stat.key}`);
      });

      yPos += 100; // Espacio para próxima categoría

      // Mentales
      ENTITY_STATS.MENTAL.forEach((stat, index) => {
        const x = xOffset + 10 + (Math.floor(index / 6) * colWidth);
        const y = yPos + (index % 6) * config.LINE_HEIGHT;
        mk(x, y, stat.icon, stat.label, `${entityId}.${stat.key}`);
      });

      yPos += 100; // Espacio para próxima categoría

      // Sociales
      ENTITY_STATS.SOCIAL.forEach((stat, index) => {
        const x = xOffset + 10 + (Math.floor(index / 6) * colWidth);
        const y = yPos + (index % 6) * config.LINE_HEIGHT;
        mk(x, y, stat.icon, stat.label, `${entityId}.${stat.key}`);
      });
    };

    // Crear secciones
    createStatsSection("isa", "👩 ISA - Estadísticas Completas", 0xe91e63, 0);
    createStatsSection("stev", "👨 STEV - Estadísticas Completas", 0x3498db, config.SECTION_WIDTH + 20);

    // Separador central
    const separator = this.scene.add.graphics();
    separator.lineStyle(2, 0x74b9ff, 0.6);
    const sepX = config.SECTION_WIDTH + 10;
    separator.lineBetween(sepX, 20, sepX, config.SECTION_HEIGHT + 10);
    separator.fillStyle(0x74b9ff, 0.8);
    separator.fillCircle(sepX, 20, 3);
    separator.fillCircle(sepX, config.SECTION_HEIGHT / 2, 3);
    separator.fillCircle(sepX, config.SECTION_HEIGHT + 10, 3);
    this.container.add(separator);
  }
}
