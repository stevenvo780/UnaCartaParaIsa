/**
 * Componente UI para mostrar misiones activas
 * Usa los sistemas UI existentes de Phaser
 */

import type Phaser from 'phaser';
import { UIDesignSystem as DS } from '../config/uiDesignSystem';
import type { Quest } from '../types';
import { logAutopoiesis } from '../utils/logger';

export class QuestUI {
  private _scene: Phaser.Scene;
  private _container: Phaser.GameObjects.Container;
  private _questPanel: Phaser.GameObjects.Container;
  private _detailModal: Phaser.GameObjects.Container;
  private _isVisible = false;
  private _activeQuests: Quest[] = [];
  private _panelBackground: Phaser.GameObjects.Graphics;
  private _panelTitle: Phaser.GameObjects.Text;

  // Modern UI constants
  private readonly PANEL_WIDTH = 380;
  private readonly PANEL_MIN_HEIGHT = 120;
  private readonly PANEL_MAX_HEIGHT = 600;
  private readonly CARD_HEIGHT = 85;
  private readonly CARD_MARGIN = 12;
  private readonly ANIMATION_DURATION = 300;

  // Use centralized design system
  private readonly COLORS = DS.COLORS;

  public constructor(scene: Phaser.Scene) {
    this._scene = scene;

    // Position panel on the right side with responsive positioning
    const panelX = scene.cameras.main.width - this.PANEL_WIDTH - 20;
    const panelY = 80;

    this._container = scene.add.container(panelX, panelY);
    this._questPanel = scene.add.container(0, 0);
    this._detailModal = scene.add.container(0, 0);

    this._container.add([this._questPanel, this._detailModal]);
    this._container.setDepth(1000);

    this._setupModernQuestPanel();
    this._setupEventListeners();

    // Inicialmente oculto
    this._container.setVisible(false);
    this._container.setAlpha(0);
  }

  /**
   * Configura el panel moderno de misiones
   */
  private _setupModernQuestPanel(): void {
    // Crear fondo moderno con gradiente y sombra
    this._panelBackground = this._scene.add.graphics();
    this._updatePanelBackground(this.PANEL_MIN_HEIGHT);

    // Header con título moderno
    const headerContainer = this._scene.add.container(0, -this.PANEL_MIN_HEIGHT / 2 + 25);

    // Icono de misiones con animación sutil
    const questIcon = this._scene.add
      .text(-this.PANEL_WIDTH / 2 + 20, 0, '⚔️', {
        fontSize: '20px',
      })
      .setOrigin(0, 0.5);

    // Título elegante
    this._panelTitle = this._scene.add
      .text(-this.PANEL_WIDTH / 2 + 50, 0, 'MISIONES ACTIVAS', DS.getTextStyle('lg', DS.COLORS.text, 'bold'))
      .setOrigin(0, 0.5);

    // Botón de cierre moderno
    const closeButton = this._createCloseButton();
    closeButton.setPosition(this.PANEL_WIDTH / 2 - 25, 0);

    headerContainer.add([questIcon, this._panelTitle, closeButton]);
    this._questPanel.add([this._panelBackground, headerContainer]);

    // Animación sutil para el icono
    this._scene.tweens.add({
      targets: questIcon,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Actualiza el fondo del panel según el contenido
   */
  private _updatePanelBackground(height: number): void {
    if (!this._panelBackground) return;

    this._panelBackground.clear();

    // Usar el sistema de glassmorphism del design system
    DS.createGlassmorphismBackground(
      this._panelBackground,
      -this.PANEL_WIDTH / 2,
      -height / 2,
      this.PANEL_WIDTH,
      height,
      DS.RADIUS.lg,
      DS.COLORS.surface,
      0.95
    );

    // Línea de acento en el header
    this._panelBackground.lineStyle(3, this.COLORS.primary, 0.8);
    this._panelBackground.lineBetween(
      -this.PANEL_WIDTH / 2 + 10,
      -height / 2 + 50,
      this.PANEL_WIDTH / 2 - 10,
      -height / 2 + 50
    );
  }

  /**
   * Crea un botón de cierre moderno
   */
  private _createCloseButton(): Phaser.GameObjects.Container {
    const button = this._scene.add.container(0, 0);

    const buttonBg = this._scene.add.graphics();
    buttonBg.fillStyle(this.COLORS.danger, 0.8);
    buttonBg.fillCircle(0, 0, 12);
    buttonBg.lineStyle(1, this.COLORS.text, 0.3);
    buttonBg.strokeCircle(0, 0, 12);

    const closeIcon = this._scene.add
      .text(0, 0, '×', {
        fontSize: '16px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    button.add([buttonBg, closeIcon]);
    button.setSize(24, 24);
    button.setInteractive();

    // Efectos hover
    button.on('pointerover', () => {
      this._scene.tweens.add({
        targets: button,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 150,
        ease: 'Back.easeOut',
      });
    });

    button.on('pointerout', () => {
      this._scene.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Back.easeOut',
      });
    });

    button.on('pointerdown', () => {
      this.hideQuestPanel();
    });

    return button;
  }

  /**
   * Configura los event listeners
   */
  private _setupEventListeners(): void {
    // Tecla Q para toggle del panel de misiones
    this._scene.input.keyboard?.on('keydown-Q', () => {
      this.toggleQuestPanel();
    });

    // Escuchar eventos del sistema de misiones
    this._scene.events.on('quest_started', this._onQuestStarted, this);
    this._scene.events.on('quest_completed', this._onQuestCompleted, this);
    this._scene.events.on('objective_completed', this._onObjectiveCompleted, this);

    // Actualizar cada cierto tiempo
    this._scene.time.addEvent({
      delay: 2000,
      callback: this._updateQuestDisplay,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * Toggle del panel de misiones con animación
   */
  public toggleQuestPanel(): void {
    if (this._isVisible) {
      this.hideQuestPanel();
    } else {
      this.showQuestPanel();
    }
  }

  /**
   * Muestra el panel con animación suave
   */
  public showQuestPanel(): void {
    if (this._isVisible) return;

    this._isVisible = true;
    this._container.setVisible(true);

    // Animación de entrada elegante
    this._scene.tweens.add({
      targets: this._container,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      duration: this.ANIMATION_DURATION,
      ease: 'Back.easeOut',
      onComplete: () => {
        this._refreshQuestData();
        this._updateQuestDisplay();
      },
    });

    // Efecto de entrada escalonada para elementos
    this._scene.time.delayedCall(100, () => {
      this._scene.tweens.add({
        targets: this._panelTitle,
        alpha: { from: 0, to: 1 },
        x: { from: -this.PANEL_WIDTH / 2 + 30, to: -this.PANEL_WIDTH / 2 + 50 },
        duration: 300,
        ease: 'Power2.easeOut',
      });
    });

    logAutopoiesis.debug('Quest panel shown with animation');
  }

  /**
   * Oculta el panel con animación suave
   */
  public hideQuestPanel(): void {
    if (!this._isVisible) return;

    this._isVisible = false;

    // Animación de salida elegante
    this._scene.tweens.add({
      targets: this._container,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: this.ANIMATION_DURATION,
      ease: 'Back.easeIn',
      onComplete: () => {
        this._container.setVisible(false);
      },
    });

    logAutopoiesis.debug('Quest panel hidden with animation');
  }

  /**
   * Actualiza los datos de misiones desde el QuestSystem
   */
  private _refreshQuestData(): void {
    const questSystem = this._scene.registry.get('questSystem');
    if (questSystem) {
      this._activeQuests = questSystem.getActiveQuests();
    }
  }

  /**
   * Actualiza la visualización moderna de misiones
   */
  private _updateQuestDisplay(): void {
    if (!this._isVisible) return;

    // Limpiar contenido existente (excepto fondo y header)
    const itemsToRemove = this._questPanel.list.slice(2);
    itemsToRemove.forEach(item => {
      this._questPanel.remove(item);
      if (item.destroy) item.destroy();
    });

    if (this._activeQuests.length === 0) {
      this._renderEmptyState();
      return;
    }

    // Calcular altura dinámica basada en contenido
    const questsToShow = this._activeQuests.slice(0, 4);
    const contentHeight = this.PANEL_MIN_HEIGHT + questsToShow.length * (this.CARD_HEIGHT + this.CARD_MARGIN);
    const panelHeight = Math.min(contentHeight, this.PANEL_MAX_HEIGHT);

    this._updatePanelBackground(panelHeight);

    // Container para las tarjetas de misiones con scroll si es necesario
    const questContainer = this._scene.add.container(0, 30);

    questsToShow.forEach((quest, index) => {
      const yPos = index * (this.CARD_HEIGHT + this.CARD_MARGIN);
      const questCard = this._createModernQuestCard(quest, yPos, index);
      questContainer.add(questCard);
    });

    this._questPanel.add(questContainer);

    // Indicador de más misiones si es necesario
    if (this._activeQuests.length > 4) {
      const moreIndicator = this._createMoreIndicator(this._activeQuests.length - 4);
      moreIndicator.setY(panelHeight / 2 - 30);
      this._questPanel.add(moreIndicator);
    }

    logAutopoiesis.debug(`Quest display updated: ${questsToShow.length} quests shown`);
  }

  /**
   * Renderiza el estado vacío con estilo moderno
   */
  private _renderEmptyState(): void {
    const emptyContainer = this._scene.add.container(0, 20);

    // Icono de estado vacío
    const emptyIcon = this._scene.add
      .text(0, -20, '📋', {
        fontSize: '32px',
      })
      .setOrigin(0.5);

    // Texto explicativo
    const emptyText = this._scene.add
      .text(0, 15, 'No hay misiones activas', DS.getTextStyle('base', DS.COLORS.textSecondary))
      .setOrigin(0.5);

    const subText = this._scene.add
      .text(0, 35, 'Las nuevas misiones aparecerán aquí', DS.getTextStyle('sm', DS.COLORS.secondary))
      .setOrigin(0.5);

    emptyContainer.add([emptyIcon, emptyText, subText]);
    this._questPanel.add(emptyContainer);

    // Animación sutil para el icono vacío
    this._scene.tweens.add({
      targets: emptyIcon,
      alpha: { from: 0.6, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Crea el indicador de misiones adicionales
   */
  private _createMoreIndicator(additionalCount: number): Phaser.GameObjects.Container {
    const container = this._scene.add.container(0, 0);

    const bg = this._scene.add.graphics();
    bg.fillStyle(this.COLORS.backgroundLight, 0.8);
    bg.fillRoundedRect(-80, -15, 160, 30, 15);
    bg.lineStyle(1, this.COLORS.accent, 0.3);
    bg.strokeRoundedRect(-80, -15, 160, 30, 15);

    const text = this._scene.add
      .text(
        0,
        0,
        `+${additionalCount} misión${additionalCount > 1 ? 'es' : ''} más`,
        DS.getTextStyle('sm', DS.COLORS.secondary)
      )
      .setOrigin(0.5);

    container.add([bg, text]);

    // Efecto hover
    container.setInteractive(
      new (window as any).Phaser.Geom.Rectangle(-80, -15, 160, 30),
      (window as any).Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', () => {
      this._scene.tweens.add({
        targets: container,
        alpha: 0.8,
        duration: 150,
      });
    });

    container.on('pointerout', () => {
      this._scene.tweens.add({
        targets: container,
        alpha: 1,
        duration: 150,
      });
    });

    return container;
  }

  /**
   * Crea una tarjeta de misión moderna
   */
  private _createModernQuestCard(quest: Quest, yPos: number, index: number): Phaser.GameObjects.Container {
    const cardContainer = this._scene.add.container(0, yPos);

    // Fondo de la tarjeta con gradiente y sombra
    const cardBg = this._scene.add.graphics();

    // Sombra
    cardBg.fillStyle(0x000000, 0.2);
    cardBg.fillRoundedRect(
      -this.PANEL_WIDTH / 2 + 14 + 2,
      -this.CARD_HEIGHT / 2 + 2,
      this.PANEL_WIDTH - 28,
      this.CARD_HEIGHT,
      8
    );

    // Fondo principal
    cardBg.fillGradientStyle(
      this.COLORS.surfaceLight,
      this.COLORS.surfaceLight,
      this.COLORS.surface,
      this.COLORS.surface,
      0.9,
      0.9,
      0.95,
      0.95
    );
    cardBg.fillRoundedRect(
      -this.PANEL_WIDTH / 2 + 14,
      -this.CARD_HEIGHT / 2,
      this.PANEL_WIDTH - 28,
      this.CARD_HEIGHT,
      8
    );

    // Borde y línea de estado
    const statusColor = this._getQuestStatusColor(quest);
    cardBg.lineStyle(2, statusColor, 0.8);
    cardBg.strokeRoundedRect(
      -this.PANEL_WIDTH / 2 + 14,
      -this.CARD_HEIGHT / 2,
      this.PANEL_WIDTH - 28,
      this.CARD_HEIGHT,
      8
    );

    // Línea de estado lateral izquierda
    cardBg.lineStyle(4, statusColor, 1);
    cardBg.lineBetween(
      -this.PANEL_WIDTH / 2 + 14,
      -this.CARD_HEIGHT / 2 + 8,
      -this.PANEL_WIDTH / 2 + 14,
      this.CARD_HEIGHT / 2 - 8
    );

    cardContainer.add(cardBg);

    // Icono de dificultad
    const difficultyIcon = this._getDifficultyIcon(quest.difficulty);
    const iconText = this._scene.add
      .text(-this.PANEL_WIDTH / 2 + 30, -20, difficultyIcon, {
        fontSize: '16px',
      })
      .setOrigin(0, 0.5);

    // Título de la misión
    const questTitle = this._scene.add
      .text(-this.PANEL_WIDTH / 2 + 55, -20, quest.title, {
        ...DS.getTextStyle('base', DS.COLORS.text, 'bold'),
        wordWrap: { width: 220 },
      })
      .setOrigin(0, 0.5);

    // Progreso visual
    const progressContainer = this._createProgressBar(quest);
    progressContainer.setPosition(-this.PANEL_WIDTH / 2 + 55, -5);

    // Descripción del objetivo actual
    const currentObjective = quest.objectives.find(obj => !obj.isCompleted && !obj.isOptional);
    let objectiveText: Phaser.GameObjects.Text | null = null;

    if (currentObjective) {
      const shortDescription = this._truncateText(currentObjective.description, 35);
      objectiveText = this._scene.add
        .text(-this.PANEL_WIDTH / 2 + 55, 12, `• ${shortDescription}`, DS.getTextStyle('xs', DS.COLORS.textSecondary))
        .setOrigin(0, 0.5);
    }

    // Recompensa rápida (si existe)
    const rewardIcon = quest.rewards && quest.rewards.length > 0 ? this._getRewardIcon(quest.rewards[0]) : '';

    let rewardText: Phaser.GameObjects.Text | null = null;
    if (rewardIcon) {
      rewardText = this._scene.add
        .text(this.PANEL_WIDTH / 2 - 30, -5, rewardIcon, {
          fontSize: '14px',
        })
        .setOrigin(0.5, 0.5);
    }

    // Agregar todos los elementos
    const elements = [iconText, questTitle, progressContainer];
    if (objectiveText) elements.push(objectiveText);
    if (rewardText) elements.push(rewardText);

    cardContainer.add(elements);

    // Interactividad de la tarjeta
    cardContainer.setSize(this.PANEL_WIDTH - 28, this.CARD_HEIGHT);
    cardContainer.setInteractive();

    // Efectos hover
    cardContainer.on('pointerover', () => {
      this._scene.tweens.add({
        targets: cardContainer,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 200,
        ease: 'Back.easeOut',
      });

      // Brillo sutil en el fondo
      cardBg.clear();
      cardBg.fillStyle(0x000000, 0.2);
      cardBg.fillRoundedRect(
        -this.PANEL_WIDTH / 2 + 14 + 2,
        -this.CARD_HEIGHT / 2 + 2,
        this.PANEL_WIDTH - 28,
        this.CARD_HEIGHT,
        8
      );

      cardBg.fillGradientStyle(
        this.COLORS.primary,
        this.COLORS.primary,
        this.COLORS.surfaceLight,
        this.COLORS.surfaceLight,
        0.3,
        0.3,
        0.95,
        0.95
      );
      cardBg.fillRoundedRect(
        -this.PANEL_WIDTH / 2 + 14,
        -this.CARD_HEIGHT / 2,
        this.PANEL_WIDTH - 28,
        this.CARD_HEIGHT,
        8
      );

      cardBg.lineStyle(2, statusColor, 1);
      cardBg.strokeRoundedRect(
        -this.PANEL_WIDTH / 2 + 14,
        -this.CARD_HEIGHT / 2,
        this.PANEL_WIDTH - 28,
        this.CARD_HEIGHT,
        8
      );
    });

    cardContainer.on('pointerout', () => {
      this._scene.tweens.add({
        targets: cardContainer,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Back.easeOut',
      });

      // Restaurar fondo normal
      cardBg.clear();
      cardBg.fillStyle(0x000000, 0.2);
      cardBg.fillRoundedRect(
        -this.PANEL_WIDTH / 2 + 14 + 2,
        -this.CARD_HEIGHT / 2 + 2,
        this.PANEL_WIDTH - 28,
        this.CARD_HEIGHT,
        8
      );

      cardBg.fillGradientStyle(
        this.COLORS.surfaceLight,
        this.COLORS.surfaceLight,
        this.COLORS.surface,
        this.COLORS.surface,
        0.9,
        0.9,
        0.95,
        0.95
      );
      cardBg.fillRoundedRect(
        -this.PANEL_WIDTH / 2 + 14,
        -this.CARD_HEIGHT / 2,
        this.PANEL_WIDTH - 28,
        this.CARD_HEIGHT,
        8
      );

      cardBg.lineStyle(2, statusColor, 0.8);
      cardBg.strokeRoundedRect(
        -this.PANEL_WIDTH / 2 + 14,
        -this.CARD_HEIGHT / 2,
        this.PANEL_WIDTH - 28,
        this.CARD_HEIGHT,
        8
      );
    });

    cardContainer.on('pointerdown', () => {
      this._showQuestDetail(quest);
    });

    // Animación de entrada escalonada
    cardContainer.setAlpha(0);
    cardContainer.setY(yPos + 20);

    this._scene.tweens.add({
      targets: cardContainer,
      alpha: 1,
      y: yPos,
      duration: 400,
      delay: index * 100,
      ease: 'Back.easeOut',
    });

    return cardContainer;
  }

  /**
   * Crea una barra de progreso visual moderna
   */
  private _createProgressBar(quest: Quest): Phaser.GameObjects.Container {
    const container = this._scene.add.container(0, 0);

    const completedObjectives = quest.objectives.filter(obj => obj.isCompleted).length;
    const totalObjectives = quest.objectives.filter(obj => !obj.isOptional).length;
    const progress = totalObjectives > 0 ? completedObjectives / totalObjectives : 0;

    const barWidth = 180;
    const barHeight = 6;

    // Fondo de la barra
    const bgBar = this._scene.add.graphics();
    bgBar.fillStyle(this.COLORS.backgroundLight, 0.6);
    bgBar.fillRoundedRect(0, 0, barWidth, barHeight, 3);

    // Barra de progreso
    const progressBar = this._scene.add.graphics();
    const progressColor = progress === 1 ? this.COLORS.success : this.COLORS.secondary;
    progressBar.fillStyle(progressColor, 0.9);
    progressBar.fillRoundedRect(0, 0, barWidth * progress, barHeight, 3);

    // Texto de progreso
    const progressText = this._scene.add
      .text(
        barWidth + 10,
        barHeight / 2,
        `${completedObjectives}/${totalObjectives}`,
        DS.getTextStyle('xs', progress === 1 ? DS.COLORS.success : DS.COLORS.secondary, 'bold')
      )
      .setOrigin(0, 0.5);

    container.add([bgBar, progressBar, progressText]);

    // Animación sutil de la barra
    progressBar.setScale(0, 1);
    this._scene.tweens.add({
      targets: progressBar,
      scaleX: { to: 1 },
      duration: 800,
      delay: 200,
      ease: 'Power2.easeOut',
    });

    return container;
  }

  /**
   * Obtiene el icono de dificultad
   */
  private _getDifficultyIcon(difficulty: string): string {
    const icons = {
      easy: '⭐',
      medium: '⭐⭐',
      hard: '⭐⭐⭐',
      legendary: '💫',
    };
    return icons[difficulty as keyof typeof icons] || '⚡';
  }

  /**
   * Obtiene el icono de recompensa
   */
  private _getRewardIcon(reward: any): string {
    if (!reward) return '';

    switch (reward.type) {
      case 'money':
        return '💰';
      case 'stats':
        return '⚡';
      case 'food':
        return '🍎';
      case 'item':
        return '📦';
      default:
        return '🎁';
    }
  }

  /**
   * Obtiene el color de estado de la misión
   */
  private _getQuestStatusColor(quest: Quest): number {
    const completedObjectives = quest.objectives.filter(obj => obj.isCompleted).length;
    const totalObjectives = quest.objectives.filter(obj => !obj.isOptional).length;
    const progress = totalObjectives > 0 ? completedObjectives / totalObjectives : 0;

    if (progress === 1) return this.COLORS.success;
    if (progress > 0.5) return this.COLORS.secondary;
    if (progress > 0) return this.COLORS.warning;
    return this.COLORS.primary;
  }

  /**
   * Trunca texto para mostrar en las tarjetas
   */
  private _truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength - 3)}...`;
  }

  /**
   * Muestra el detalle completo de una misión
   */
  private _showQuestDetail(quest: Quest): void {
    logAutopoiesis.debug(`Showing quest detail for: ${quest.title}`);

    // TODO: Implementar modal de detalle de misión
    // Por ahora, mostrar información en consola
    console.group(`🎯 Misión: ${quest.title}`);
    console.log(`📝 Descripción: ${quest.description}`);
    console.log(`⭐ Dificultad: ${quest.difficulty}`);
    console.log('📋 Objetivos:');
    quest.objectives.forEach((obj, index) => {
      const status = obj.isCompleted ? '✅' : '⏳';
      console.log(`  ${status} ${index + 1}. ${obj.description}`);
    });
    if (quest.rewards && quest.rewards.length > 0) {
      console.log('🎁 Recompensas:');
      quest.rewards.forEach(reward => {
        console.log(`  - ${reward.type}: ${reward.amount || 'N/A'}`);
      });
    }
    console.groupEnd();
  }

  /**
   * Obtiene el color según la dificultad de la misión
   */
  private _getQuestColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy':
        return '#2ecc71';
      case 'medium':
        return '#f39c12';
      case 'hard':
        return '#e74c3c';
      case 'legendary':
        return '#9b59b6';
      default:
        return '#ecf0f1';
    }
  }

  /**
   * Maneja evento de misión iniciada
   */
  private _onQuestStarted(_event: unknown): void {
    this._refreshQuestData();
    if (this._isVisible) {
      this._updateQuestDisplay();
    }

    // Mostrar notificación
    this._showQuestNotification('🆕 Nueva misión iniciada', '#3498db');
  }

  /**
   * Maneja evento de misión completada
   */
  private _onQuestCompleted(_event: unknown): void {
    this._refreshQuestData();
    if (this._isVisible) {
      this._updateQuestDisplay();
    }

    // Mostrar notificación de completación
    this._showQuestNotification('✅ ¡Misión completada!', '#2ecc71');
  }

  /**
   * Maneja evento de objetivo completado
   */
  private _onObjectiveCompleted(_event: unknown): void {
    this._refreshQuestData();
    if (this._isVisible) {
      this._updateQuestDisplay();
    }

    // Mostrar notificación sutil de objetivo
    this._showQuestNotification('✓ Objetivo completado', '#f39c12');
  }

  /**
   * Muestra notificación de misión
   */
  private _showQuestNotification(text: string, color: string): void {
    const notification = this._scene.add.container(this._scene.cameras.main.width / 2, 100);

    const bg = this._scene.add.rectangle(0, 0, text.length * 8 + 40, 40, 0x1a1a2e, 0.9);
    bg.setStrokeStyle(2, parseInt(color.replace('#', '0x'), 16));

    const textObj = this._scene.add.text(0, 0, text, {
      fontSize: '14px',
      color: color,
      fontStyle: 'bold',
    });
    textObj.setOrigin(0.5);

    notification.add([bg, textObj]);
    notification.setDepth(1000);
    notification.setAlpha(0);

    // Animación de entrada
    this._scene.tweens.add({
      targets: notification,
      alpha: 1,
      y: 80,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Animación de salida
    this._scene.time.delayedCall(2500, () => {
      this._scene.tweens.add({
        targets: notification,
        alpha: 0,
        y: 60,
        duration: 300,
        ease: 'Power2',
        onComplete: () => notification.destroy(),
      });
    });
  }

  /**
   * Crea un panel detallado de misión (modal)
   */
  public showQuestDetails(questId: string): void {
    const quest = this._activeQuests.find(q => q.id === questId);
    if (!quest) return;

    // Crear modal semi-transparente
    const modal = this._scene.add.container(this._scene.cameras.main.width / 2, this._scene.cameras.main.height / 2);

    const overlay = this._scene.add.rectangle(
      0,
      0,
      this._scene.cameras.main.width,
      this._scene.cameras.main.height,
      0x000000,
      0.7
    );
    overlay.setInteractive();

    const panel = this._scene.add.rectangle(0, 0, 500, 400, 0x1a1a2e, 0.95);
    panel.setStrokeStyle(3, 0x16213e);

    // Título de la misión
    const title = this._scene.add.text(0, -150, quest.title, {
      fontSize: '20px',
      color: this._getQuestColor(quest.difficulty),
      fontStyle: 'bold',
      align: 'center',
    });
    title.setOrigin(0.5);

    // Descripción
    const description = this._scene.add.text(0, -100, quest.description, {
      fontSize: '14px',
      color: '#ecf0f1',
      align: 'center',
      wordWrap: { width: 450 },
    });
    description.setOrigin(0.5);

    // Lista de objetivos
    let objY = -50;
    quest.objectives.forEach(objective => {
      const status = objective.isCompleted ? '✅' : '⭕';
      const color = objective.isCompleted ? '#2ecc71' : '#ecf0f1';

      const objText = this._scene.add.text(-220, objY, `${status} ${objective.description}`, {
        fontSize: '12px',
        color: color,
        wordWrap: { width: 440 },
      });
      objText.setOrigin(0, 0.5);

      modal.add(objText);
      objY += 25;
    });

    // Botón cerrar
    const closeButton = this._scene.add.rectangle(0, 150, 100, 40, 0xe74c3c, 0.8);
    const closeText = this._scene.add.text(0, 150, 'Cerrar', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    closeText.setOrigin(0.5);

    closeButton.setInteractive();
    closeButton.on('pointerdown', () => {
      modal.destroy();
    });

    overlay.on('pointerdown', () => {
      modal.destroy();
    });

    modal.add([overlay, panel, title, description, closeButton, closeText]);
    modal.setDepth(1100);
    modal.setAlpha(0);

    // Animación de entrada
    this._scene.tweens.add({
      targets: modal,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });
  }

  /**
   * Muestra el panel de misiones disponibles
   */
  public showAvailableQuests(): void {
    const questSystem = this._scene.registry.get('questSystem');
    if (!questSystem) return;

    const availableQuests = questSystem.getAvailableQuests();

    // Crear UI similar al modal pero para misiones disponibles
    logAutopoiesis.info('Showing available quests', {
      count: availableQuests.length,
    });
  }

  /**
   * Limpieza del componente
   */
  public cleanup(): void {
    this._scene.events.off('quest_started', this._onQuestStarted, this);
    this._scene.events.off('quest_completed', this._onQuestCompleted, this);
    this._scene.events.off('objective_completed', this._onObjectiveCompleted, this);

    this._container.destroy();
  }
}
