/**
 * ExplorationUI - UI mejorada que muestra la diversidad del mundo y progreso de exploración
 */

import Phaser from "phaser";
import { UIDesignSystem as DS } from "../config/uiDesignSystem";
import { createUIPill } from "./ui/UIPill";
import { logAutopoiesis } from "../utils/logger";
import { BaseUIComponent, UIComponentConfig } from "./BaseUIComponent";

export interface ExplorationStats {
  totalAssets: number;
  discoveredAssets: number;
  biomesExplored: number;
  rarityBreakdown: Record<string, number>;
  currentBiome?: string;
}

export class ExplorationUI extends BaseUIComponent {
    private statsPanel: Phaser.GameObjects.Container;
    private biomesPanel: Phaser.GameObjects.Container;
    private assetsPanel: Phaser.GameObjects.Container;
    private lastStatsHash = "";

    constructor(scene: Phaser.Scene) {
        const config: UIComponentConfig = {
            width: 400,
            height: 600,
            title: "Atlas de Exploración",
            icon: "🗺️",
            position: { x: scene.scale.width - 220, y: 320 },
            closable: true,
            modal: false,
        };

        super(scene, config);
        this.createPanels();
    }

    /**
   * Crea los paneles específicos de exploración
   */
    private createPanels(): void {
        this.createStatsPanel();
        this.createBiomesPanel();
        this.createAssetsPanel();
    }

    /**
   * Crea panel de estadísticas generales
   */
    private createStatsPanel(): void {
        this.statsPanel = this.scene.add.container(0, -200);

        const panelBg = this.scene.add.rectangle(
            0,
            0,
            360,
            120,
            DS.COLORS.surface,
            0.8,
        );
        panelBg.setStrokeStyle(1, DS.COLORS.secondary);
        this.statsPanel.add(panelBg);

        const panelTitle = this.scene.add.text(0, -40, "📊 Estadísticas", {
            ...DS.getTextStyle("lg", DS.COLORS.secondary, "bold"),
            align: "center" as any,
        });
        panelTitle.setOrigin(0.5);
        this.statsPanel.add(panelTitle);

        this.container.add(this.statsPanel);
    }

    /**
   * Crea panel de biomas
   */
    private createBiomesPanel(): void {
        this.biomesPanel = this.scene.add.container(0, -60);

        const panelBg = this.scene.add.rectangle(
            0,
            0,
            360,
            140,
            DS.COLORS.success,
            0.2,
        );
        panelBg.setStrokeStyle(1, DS.COLORS.success);
        this.biomesPanel.add(panelBg);

        const panelTitle = this.scene.add.text(0, -55, "🌍 Biomas Descubiertos", {
            ...DS.getTextStyle("lg", DS.COLORS.success, "bold"),
            align: "center" as any,
        });
        panelTitle.setOrigin(0.5);
        this.biomesPanel.add(panelTitle);

        this.container.add(this.biomesPanel);
    }

    /**
   * Crea panel de assets
   */
    private createAssetsPanel(): void {
        this.assetsPanel = this.scene.add.container(0, 100);

        const panelBg = this.scene.add.rectangle(
            0,
            0,
            360,
            160,
            DS.COLORS.primary,
            0.2,
        );
        panelBg.setStrokeStyle(1, DS.COLORS.primary);
        this.assetsPanel.add(panelBg);

        const panelTitle = this.scene.add.text(0, -65, "🎨 Assets Desbloqueados", {
            ...DS.getTextStyle("lg", DS.COLORS.primary, "bold"),
            align: "center" as any,
        });
        panelTitle.setOrigin(0.5);
        this.assetsPanel.add(panelTitle);

        this.container.add(this.assetsPanel);
    }

    /**
   * Implementación requerida por BaseUIComponent
   */
    protected onShow(): void {
    // Lógica específica al mostrar
    }

    protected onHide(): void {
    // Lógica específica al ocultar
    }

    public updateContent(stats: ExplorationStats): void {
        this.updateStats(stats);
    }

    /**
   * Actualiza la UI con nuevas estadísticas solo si han cambiado
   */
    updateStats(stats: ExplorationStats): void {
    // Crear hash de las estadísticas para evitar actualizaciones innecesarias
        const statsHash = `${stats.totalAssets}-${stats.discoveredAssets}-${stats.biomesExplored}`;

        if (statsHash === this.lastStatsHash) {
            return; // No hay cambios, no actualizar
        }

        this.lastStatsHash = statsHash;

        // Limpiar contenido anterior
        this.clearPanelContent();

        // Actualizar estadísticas generales
        this.updateStatsContent(stats);

        // Actualizar biomas
        this.updateBiomesContent(stats);

        // Actualizar assets
        this.updateAssetsContent(stats);

        logAutopoiesis.info("🗺️ UI de exploración actualizada", {
            totalAssets: stats.totalAssets,
            discoveredAssets: stats.discoveredAssets,
            biomesExplored: stats.biomesExplored,
            currentBiome: stats.currentBiome,
            rarityBreakdown: stats.rarityBreakdown,
        });
    }

    /**
   * Actualiza contenido del panel de estadísticas
   */
    private updateStatsContent(stats: ExplorationStats): void {
        const discoveryPercentage = Math.round(
            (stats.discoveredAssets / stats.totalAssets) * 100,
        );

        const lines = [
            `Assets descubiertos: ${stats.discoveredAssets}/${stats.totalAssets} (${discoveryPercentage}%)`,
            `Biomas explorados: ${stats.biomesExplored}/6`,
            `Bioma actual: ${stats.currentBiome || "Desconocido"}`,
        ];

        lines.forEach((line, index) => {
            const text = this.scene.add.text(0, -10 + index * 20, line, {
                ...DS.getTextStyle("lg", DS.COLORS.text),
                align: "center" as any,
            });
            text.setOrigin(0.5);
            this.statsPanel.add(text);
        });

        // Barra de progreso
        const progressBg = this.scene.add.rectangle(
            0,
            35,
            200,
            12,
            DS.COLORS.surfaceLight,
        );
        const progressFill = this.scene.add.rectangle(
            -100 + discoveryPercentage * 2,
            35,
            discoveryPercentage * 2,
            12,
            DS.COLORS.secondary,
        );
        progressFill.setOrigin(0, 0.5);

        this.statsPanel.add(progressBg);
        this.statsPanel.add(progressFill);
    }

    /**
   * Actualiza contenido del panel de biomas
   */
    private updateBiomesContent(stats: ExplorationStats): void {
        const biomes = [
            { name: "Praderas", icon: "🌱", color: "#2ecc71" },
            { name: "Bosques", icon: "🌲", color: "#27ae60" },
            { name: "Pantanos", icon: "🌊", color: "#3498db" },
            { name: "Pueblos", icon: "🏘️", color: "#f39c12" },
            { name: "Montañas", icon: "⛰️", color: "#95a5a6" },
            { name: "Místico", icon: "✨", color: "#9b59b6" },
        ];

        const rows = [];
        for (let i = 0; i < biomes.length; i += 3) {
            rows.push(biomes.slice(i, i + 3));
        }

        rows.forEach((row, rowIndex) => {
            row.forEach((biome, colIndex) => {
                const x = -120 + colIndex * 120;
                const y = -25 + rowIndex * 40;

                const isExplored = Math.random() > 0.3; // Simulado por ahora
                const alpha = isExplored ? 1.0 : 0.3;

                const biomeIcon = this.scene.add.text(x, y, biome.icon, {
                    fontSize: "20px",
                });
                biomeIcon.setOrigin(0.5);
                biomeIcon.setAlpha(alpha);

                const biomeName = this.scene.add.text(x, y + 15, biome.name, {
                    ...DS.getTextStyle(
                        "sm",
            Phaser.Display.Color.HexStringToColor(biome.color).color as any,
                    ),
                    align: "center" as any,
                });
                biomeName.setOrigin(0.5);
                biomeName.setAlpha(alpha);

                this.biomesPanel.add(biomeIcon);
                this.biomesPanel.add(biomeName);
            });
        });
    }

    /**
   * Actualiza contenido del panel de assets
   */
    private updateAssetsContent(stats: ExplorationStats): void {
        const rarities = [
            {
                name: "Común",
                color: "#95a5a6",
                count: stats.rarityBreakdown.common || 0,
            },
            {
                name: "Poco común",
                color: "#3498db",
                count: stats.rarityBreakdown.uncommon || 0,
            },
            {
                name: "Raro",
                color: "#9b59b6",
                count: stats.rarityBreakdown.rare || 0,
            },
            {
                name: "Épico",
                color: "#f1c40f",
                count: stats.rarityBreakdown.epic || 0,
            },
        ];

        rarities.forEach((rarity, index) => {
            const y = -35 + index * 25;

            const pill = createUIPill(
                this.scene,
                -110,
                y,
                rarity.name,
        Phaser.Display.Color.HexStringToColor(rarity.color).color as any,
            );
            pill.setScale(0.9);
            const countText = this.scene.add.text(80, y, rarity.count.toString(), {
                ...DS.getTextStyle("lg", DS.COLORS.text),
                align: "right" as any,
            });
            countText.setOrigin(1, 0.5);
            this.assetsPanel.add(pill);
            this.assetsPanel.add(countText);
        });
    }

    /**
   * Limpia el contenido de los paneles
   */
    private clearPanelContent(): void {
    // Mantener solo los elementos base (títulos y fondos)
        [this.statsPanel, this.biomesPanel, this.assetsPanel].forEach((panel) => {
            const children = [...panel.list];
            children.slice(2).forEach((child) => {
                panel.remove(child);
                child.destroy();
            });
        });
    }
}
