/**
 * ExplorationUI - UI mejorada que muestra la diversidad del mundo y progreso de exploración
 */

import type Phaser from 'phaser';
import { logAutopoiesis } from '../utils/logger';

export interface ExplorationStats {
  totalAssets: number;
  discoveredAssets: number;
  biomesExplored: number;
  rarityBreakdown: Record<string, number>;
  currentBiome?: string;
}

export class ExplorationUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private statsPanel: Phaser.GameObjects.Container;
  private biomesPanel: Phaser.GameObjects.Container;
  private assetsPanel: Phaser.GameObjects.Container;
  private isVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(1000); // Top layer
    this.createUI();
  }

  /**
   * Crea la interfaz de exploración
   */
  private createUI(): void {
    // Panel principal
    const background = this.scene.add.rectangle(0, 0, 400, 600, 0x2c3e50, 0.95);
    background.setStrokeStyle(2, 0x3498db);
    this.container.add(background);

    // Título
    const title = this.scene.add.text(0, -280, '🗺️ Atlas de Exploración', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ecf0f1',
      fontStyle: 'bold',
      align: 'center',
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // Crear paneles
    this.createStatsPanel();
    this.createBiomesPanel();
    this.createAssetsPanel();

    // Botón de cerrar
    const closeButton = this.scene.add.text(180, -280, '✕', {
      fontSize: '20px',
      color: '#e74c3c',
      fontStyle: 'bold',
    });
    closeButton.setOrigin(0.5);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on('pointerdown', () => this.hide());
    this.container.add(closeButton);

    // Posicionar en la esquina superior derecha
    this.container.setPosition(this.scene.scale.width - 220, 320);
    this.container.setVisible(false);
  }

  /**
   * Crea panel de estadísticas generales
   */
  private createStatsPanel(): void {
    this.statsPanel = this.scene.add.container(0, -200);

    const panelBg = this.scene.add.rectangle(0, 0, 360, 120, 0x34495e, 0.8);
    panelBg.setStrokeStyle(1, 0x7fb3d3);
    this.statsPanel.add(panelBg);

    const panelTitle = this.scene.add.text(0, -40, '📊 Estadísticas', {
      fontSize: '16px',
      color: '#3498db',
      fontStyle: 'bold',
      align: 'center',
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

    const panelBg = this.scene.add.rectangle(0, 0, 360, 140, 0x27ae60, 0.3);
    panelBg.setStrokeStyle(1, 0x2ecc71);
    this.biomesPanel.add(panelBg);

    const panelTitle = this.scene.add.text(0, -55, '🌍 Biomas Descubiertos', {
      fontSize: '16px',
      color: '#2ecc71',
      fontStyle: 'bold',
      align: 'center',
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

    const panelBg = this.scene.add.rectangle(0, 0, 360, 160, 0x8e44ad, 0.3);
    panelBg.setStrokeStyle(1, 0x9b59b6);
    this.assetsPanel.add(panelBg);

    const panelTitle = this.scene.add.text(0, -65, '🎨 Assets Desbloqueados', {
      fontSize: '16px',
      color: '#9b59b6',
      fontStyle: 'bold',
      align: 'center',
    });
    panelTitle.setOrigin(0.5);
    this.assetsPanel.add(panelTitle);

    this.container.add(this.assetsPanel);
  }

  private lastStatsHash = '';

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

    logAutopoiesis.info('🗺️ UI de exploración actualizada', stats);
  }

  /**
   * Actualiza contenido del panel de estadísticas
   */
  private updateStatsContent(stats: ExplorationStats): void {
    const discoveryPercentage = Math.round((stats.discoveredAssets / stats.totalAssets) * 100);

    const lines = [
      `Assets descubiertos: ${stats.discoveredAssets}/${stats.totalAssets} (${discoveryPercentage}%)`,
      `Biomas explorados: ${stats.biomesExplored}/6`,
      `Bioma actual: ${stats.currentBiome || 'Desconocido'}`,
    ];

    lines.forEach((line, index) => {
      const text = this.scene.add.text(0, -10 + index * 20, line, {
        fontSize: '14px',
        color: '#ecf0f1',
        align: 'center',
      });
      text.setOrigin(0.5);
      this.statsPanel.add(text);
    });

    // Barra de progreso
    const progressBg = this.scene.add.rectangle(0, 35, 200, 12, 0x34495e);
    const progressFill = this.scene.add.rectangle(
      -100 + discoveryPercentage * 2,
      35,
      discoveryPercentage * 2,
      12,
      0x3498db
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
      { name: 'Praderas', icon: '🌱', color: '#2ecc71' },
      { name: 'Bosques', icon: '🌲', color: '#27ae60' },
      { name: 'Pantanos', icon: '🌊', color: '#3498db' },
      { name: 'Pueblos', icon: '🏘️', color: '#f39c12' },
      { name: 'Montañas', icon: '⛰️', color: '#95a5a6' },
      { name: 'Místico', icon: '✨', color: '#9b59b6' },
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
          fontSize: '20px',
        });
        biomeIcon.setOrigin(0.5);
        biomeIcon.setAlpha(alpha);

        const biomeName = this.scene.add.text(x, y + 15, biome.name, {
          fontSize: '10px',
          color: biome.color,
          align: 'center',
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
        name: 'Común',
        color: '#95a5a6',
        count: stats.rarityBreakdown.common || 0,
      },
      {
        name: 'Poco común',
        color: '#3498db',
        count: stats.rarityBreakdown.uncommon || 0,
      },
      {
        name: 'Raro',
        color: '#9b59b6',
        count: stats.rarityBreakdown.rare || 0,
      },
      {
        name: 'Épico',
        color: '#f1c40f',
        count: stats.rarityBreakdown.epic || 0,
      },
    ];

    rarities.forEach((rarity, index) => {
      const y = -35 + index * 25;

      const rarityText = this.scene.add.text(-80, y, rarity.name, {
        fontSize: '14px',
        color: rarity.color,
        fontStyle: 'bold',
      });
      rarityText.setOrigin(0, 0.5);

      const countText = this.scene.add.text(80, y, rarity.count.toString(), {
        fontSize: '14px',
        color: '#ecf0f1',
        align: 'right',
      });
      countText.setOrigin(1, 0.5);

      // Indicador visual por rareza
      const indicator = this.scene.add.circle(-100, y, 4, rarity.color as any);

      this.assetsPanel.add(rarityText);
      this.assetsPanel.add(countText);
      this.assetsPanel.add(indicator);
    });
  }

  /**
   * Limpia el contenido de los paneles
   */
  private clearPanelContent(): void {
    // Mantener solo los elementos base (títulos y fondos)
    [this.statsPanel, this.biomesPanel, this.assetsPanel].forEach(panel => {
      const children = [...panel.list];
      children.slice(2).forEach(child => {
        panel.remove(child);
        child.destroy();
      });
    });
  }

  /**
   * Muestra la UI
   */
  show(): void {
    this.isVisible = true;
    this.container.setVisible(true);

    // Animación de entrada
    this.scene.tweens.add({
      targets: this.container,
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Oculta la UI
   */
  hide(): void {
    this.isVisible = false;

    this.scene.tweens.add({
      targets: this.container,
      scaleX: 0.8,
      scaleY: 0.8,
      alpha: 0,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.container.setVisible(false);
      },
    });
  }

  /**
   * Alterna la visibilidad
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Actualiza la posición según el tamaño de pantalla
   */
  updatePosition(): void {
    this.container.setPosition(this.scene.scale.width - 220, 320);
  }

  /**
   * Limpia recursos
   */
  cleanup(): void {
    this.container.destroy();
  }
}
