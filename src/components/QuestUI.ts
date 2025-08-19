/**
 * Componente UI para mostrar misiones activas
 * Usa los sistemas UI existentes de Phaser
 */

import type Phaser from 'phaser';
import type { Quest, QuestObjective } from '../types';
import { logAutopoiesis } from '../utils/logger';

export class QuestUI {
  private _scene: Phaser.Scene;
  private _container: Phaser.GameObjects.Container;
  private _questPanel: Phaser.GameObjects.Container;
  private _isVisible = false;
  private _activeQuests: Quest[] = [];

  public constructor(scene: Phaser.Scene) {
    this._scene = scene;
    this._container = scene.add.container(20, 20);
    this._questPanel = scene.add.container(0, 0);
    
    this._container.add(this._questPanel);
    this._container.setDepth(900); // Debajo del UI principal pero visible
    
    this._setupQuestPanel();
    this._setupEventListeners();
    
    // Inicialmente oculto
    this._container.setVisible(false);
  }

  /**
   * Configura el panel base de misiones
   */
  private _setupQuestPanel(): void {
    // Fondo semi-transparente
    const background = this._scene.add.rectangle(0, 0, 320, 200, 0x1a1a2e, 0.85);
    background.setStrokeStyle(2, 0x16213e);
    
    // Título del panel
    const title = this._scene.add.text(-150, -85, '⚔️ MISIONES', {
      fontSize: '16px',
      color: '#eee8aa',
      fontWeight: 'bold'
    });
    
    this._questPanel.add([background, title]);
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
      loop: true
    });
  }

  /**
   * Toggle del panel de misiones
   */
  public toggleQuestPanel(): void {
    this._isVisible = !this._isVisible;
    this._container.setVisible(this._isVisible);
    
    if (this._isVisible) {
      this._refreshQuestData();
      this._updateQuestDisplay();
    }
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
   * Actualiza la visualización de misiones
   */
  private _updateQuestDisplay(): void {
    if (!this._isVisible) return;
    
    // Limpiar contenido existente (excepto fondo y título)
    const itemsToRemove = this._questPanel.list.slice(2);
    itemsToRemove.forEach(item => {
      this._questPanel.remove(item);
      item.destroy();
    });

    if (this._activeQuests.length === 0) {
      const emptyText = this._scene.add.text(0, -20, 'No hay misiones activas', {
        fontSize: '14px',
        color: '#888888',
        align: 'center'
      });
      emptyText.setOrigin(0.5);
      this._questPanel.add(emptyText);
      return;
    }

    // Mostrar hasta 3 misiones activas
    const questsToShow = this._activeQuests.slice(0, 3);
    
    questsToShow.forEach((quest, index) => {
      const yPos = -40 + index * 50;
      this._renderQuestItem(quest, yPos);
    });

    // Mostrar contador si hay más misiones
    if (this._activeQuests.length > 3) {
      const moreText = this._scene.add.text(0, 80, `+${this._activeQuests.length - 3} más...`, {
        fontSize: '12px',
        color: '#aaaaaa',
        align: 'center'
      });
      moreText.setOrigin(0.5);
      this._questPanel.add(moreText);
    }
  }

  /**
   * Renderiza un item de misión individual
   */
  private _renderQuestItem(quest: Quest, yPos: number): void {
    // Título de la misión
    const questTitle = this._scene.add.text(-150, yPos, quest.title, {
      fontSize: '13px',
      color: this._getQuestColor(quest.difficulty),
      fontWeight: 'bold'
    });
    questTitle.setOrigin(0, 0.5);

    // Progreso de objetivos
    const completedObjectives = quest.objectives.filter(obj => obj.isCompleted).length;
    const totalObjectives = quest.objectives.filter(obj => !obj.isOptional).length;
    
    const progressText = this._scene.add.text(140, yPos, `${completedObjectives}/${totalObjectives}`, {
      fontSize: '12px',
      color: completedObjectives === totalObjectives ? '#2ecc71' : '#f39c12'
    });
    progressText.setOrigin(1, 0.5);

    // Descripción del objetivo actual
    const currentObjective = quest.objectives.find(obj => !obj.isCompleted && !obj.isOptional);
    if (currentObjective) {
      const objectiveText = this._scene.add.text(-150, yPos + 15, `• ${currentObjective.description}`, {
        fontSize: '11px',
        color: '#cccccc',
        wordWrap: { width: 280 }
      });
      objectiveText.setOrigin(0, 0.5);
      this._questPanel.add(objectiveText);
    }

    this._questPanel.add([questTitle, progressText]);
  }

  /**
   * Obtiene el color según la dificultad de la misión
   */
  private _getQuestColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return '#2ecc71';
      case 'medium': return '#f39c12';
      case 'hard': return '#e74c3c';
      case 'legendary': return '#9b59b6';
      default: return '#ecf0f1';
    }
  }

  /**
   * Maneja evento de misión iniciada
   */
  private _onQuestStarted(event: any): void {
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
  private _onQuestCompleted(event: any): void {
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
  private _onObjectiveCompleted(event: any): void {
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
    const notification = this._scene.add.container(
      this._scene.cameras.main.width / 2,
      100
    );

    const bg = this._scene.add.rectangle(0, 0, text.length * 8 + 40, 40, 0x1a1a2e, 0.9);
    bg.setStrokeStyle(2, parseInt(color.replace('#', '0x')));

    const textObj = this._scene.add.text(0, 0, text, {
      fontSize: '14px',
      color: color,
      fontWeight: 'bold'
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
      ease: 'Back.easeOut'
    });

    // Animación de salida
    this._scene.time.delayedCall(2500, () => {
      this._scene.tweens.add({
        targets: notification,
        alpha: 0,
        y: 60,
        duration: 300,
        ease: 'Power2',
        onComplete: () => notification.destroy()
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
    const modal = this._scene.add.container(
      this._scene.cameras.main.width / 2,
      this._scene.cameras.main.height / 2
    );

    const overlay = this._scene.add.rectangle(
      0, 0,
      this._scene.cameras.main.width,
      this._scene.cameras.main.height,
      0x000000, 0.7
    );
    overlay.setInteractive();

    const panel = this._scene.add.rectangle(0, 0, 500, 400, 0x1a1a2e, 0.95);
    panel.setStrokeStyle(3, 0x16213e);

    // Título de la misión
    const title = this._scene.add.text(0, -150, quest.title, {
      fontSize: '20px',
      color: this._getQuestColor(quest.difficulty),
      fontWeight: 'bold',
      align: 'center'
    });
    title.setOrigin(0.5);

    // Descripción
    const description = this._scene.add.text(0, -100, quest.description, {
      fontSize: '14px',
      color: '#ecf0f1',
      align: 'center',
      wordWrap: { width: 450 }
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
        wordWrap: { width: 440 }
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
      fontWeight: 'bold'
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
      ease: 'Power2'
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
    logAutopoiesis.info('Showing available quests', { count: availableQuests.length });
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