/**
 * Sistema de Diálogos para Una Carta Para Isa - Integrado con Phaser 3
 * Maneja diálogos contextuales, burbujas de diálogo y expresiones emocionales
 * Usa conversaciones reales entre Isa y Stev del archivo JSON original
 */

import type { DialogueEntry } from '../types';
import { logAutopoiesis } from '../utils/logger';
import {
  loadDialogueData,
  getNextDialogue,
  getResponseWriter,
  getDialogueForInteraction,
  getSpeakerForEntity,
  getEmotionForActivity,
  getDialogueStats,
} from '../utils/dialogueSelector';

interface ConversationState {
  isActive: boolean;
  participants: string[];
  lastSpeaker: string | null;
  lastDialogue: DialogueEntry | null;
  startTime: number;
}

interface Entity {
  id: string;
  x: number;
  y: number;
  activity?: string;
  emotion?: string;
  lastInteraction?: number;
}

export class DialogueSystem {
  private scene: Phaser.Scene;
  private conversationState: ConversationState;
  private dialogueBubbles = new Map<string, Phaser.GameObjects.Container>();
  private autoDialogueTimer?: Phaser.Time.TimerEvent;
  private isInitialized = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.conversationState = {
      isActive: false,
      participants: [],
      lastSpeaker: null,
      lastDialogue: null,
      startTime: 0,
    };

    this.initializeDialogueSystem();
  }

  /**
   * Inicializar el sistema cargando los diálogos reales
   */
  private async initializeDialogueSystem(): Promise<void> {
    try {
      await loadDialogueData();
      this.isInitialized = true;
      this.setupAutoDialogueSystem();

      logAutopoiesis.info('DialogueSystem inicializado con datos reales', {
        stats: getDialogueStats(),
      });

      logAutopoiesis.info('✅ Sistema de diálogos inicializado con conversaciones reales');
    } catch (error) {
      logAutopoiesis.error('❌ Error inicializando sistema de diálogos', {
        error: String(error),
      });
      logAutopoiesis.error('Error en inicialización de DialogueSystem', {
        error: error?.toString(),
      });
    }
  }

  /**
   * Configurar el sistema autónomo de diálogos
   */
  private setupAutoDialogueSystem(): void {
    if (!this.isInitialized) return;

    const baseInterval = 8000;
    const variableInterval = Math.random() * 7000;

    this.autoDialogueTimer = this.scene.time.addEvent({
      delay: baseInterval + variableInterval,
      callback: () => {
        this.evaluateAutoDialogue().catch(error => {
          logAutopoiesis.error('Error in auto dialogue evaluation:', error);
        });
      },
      loop: true,
    });

    logAutopoiesis.debug('Sistema autónomo de diálogos configurado', {
      baseInterval,
      nextDialogue: baseInterval + variableInterval,
    });
  }

  /**
   * Evaluar si debe generar un diálogo automático
   */
  private async evaluateAutoDialogue(): Promise<void> {
    if (!this.isInitialized || this.conversationState.isActive) return;

    const entities = this.getAvailableEntities();
    if (entities.length === 0) return;

    const selectedEntity = this.selectEntityForDialogue(entities);
    if (!selectedEntity) return;

    await this.generateContextualDialogue(selectedEntity);
  }

  /**
   * Obtener entidades disponibles para diálogo
   */
  private getAvailableEntities(): Entity[] {
    const entities: Entity[] = [];

    // Obtener entidades reales del MainScene
    const mainScene = this.scene.scene.get('MainScene') as Phaser.Scene & {
      isaEntity?: {
        active: boolean;
        getPosition(): { x: number; y: number };
        getCurrentActivity(): string;
        getMood(): string;
      };
      stevEntity?: {
        active: boolean;
        getPosition(): { x: number; y: number };
        getCurrentActivity(): string;
        getMood(): string;
      };
    };
    if (mainScene) {
      // Obtener Isa
      if (mainScene.isaEntity?.active) {
        const position = mainScene.isaEntity.getPosition();
        entities.push({
          id: 'isa_entity',
          x: position.x,
          y: position.y,
          activity: mainScene.isaEntity.getCurrentActivity() || 'SOCIALIZING',
          emotion: mainScene.isaEntity.getMood() || 'NEUTRAL',
        });
      }

      // Obtener Stev
      if (mainScene.stevEntity?.active) {
        const position = mainScene.stevEntity.getPosition();
        entities.push({
          id: 'stev_entity',
          x: position.x,
          y: position.y,
          activity: mainScene.stevEntity.getCurrentActivity() || 'SOCIALIZING',
          emotion: mainScene.stevEntity.getMood() || 'CURIOUS',
        });
      }
    }

    // Fallback en caso de que no se puedan obtener las entidades reales
    if (entities.length === 0) {
      return [
        {
          id: 'isa_entity',
          x: 100,
          y: 100,
          activity: 'SOCIALIZING',
          emotion: 'NEUTRAL',
        },
        {
          id: 'stev_entity',
          x: 200,
          y: 150,
          activity: 'SOCIALIZING',
          emotion: 'CURIOUS',
        },
      ];
    }

    return entities;
  }

  /**
   * Seleccionar entidad para diálogo con lógica ponderada
   */
  private selectEntityForDialogue(entities: Entity[]): Entity | null {
    if (entities.length === 0) return null;

    if (this.conversationState.lastSpeaker) {
      const otherEntities = entities.filter(e => getSpeakerForEntity(e.id) !== this.conversationState.lastSpeaker);

      if (otherEntities.length > 0) {
        return otherEntities[Math.floor(Math.random() * otherEntities.length)];
      }
    }

    const now = Date.now();
    const weights = entities.map(entity => {
      const timeSinceLastInteraction = now - (entity.lastInteraction || 0);
      return Math.min(timeSinceLastInteraction / 10000, 2.0);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) return entities[0];

    let random = Math.random() * totalWeight;
    for (let i = 0; i < entities.length; i++) {
      random -= weights[i];
      if (random <= 0) return entities[i];
    }

    return entities[entities.length - 1];
  }

  /**
   * Generar diálogo contextual para una entidad
   */
  private async generateContextualDialogue(entity: Entity): Promise<void> {
    const speaker = getSpeakerForEntity(entity.id);
    const emotion = entity.emotion || getEmotionForActivity(entity.activity || 'SOCIALIZING');

    let dialogue: DialogueEntry | null = null;

    if (this.conversationState.lastDialogue && this.conversationState.lastSpeaker !== speaker) {
      dialogue = await getResponseWriter(speaker, this.conversationState.lastDialogue);
    }

    if (!dialogue) {
      dialogue = await getNextDialogue(speaker, emotion, entity.activity);
    }

    if (dialogue) {
      this.showDialogue(entity.id, dialogue);
      entity.lastInteraction = Date.now();
    }
  }

  /**
   * Mostrar diálogo en burbuja visual
   */
  public showDialogue(entityId: string, dialogue: DialogueEntry): void {
    this.removeDialogueBubble(entityId);

    const entity = this.getAvailableEntities().find(e => e.id === entityId);
    if (!entity) return;

    // Posicionar burbuja sobre la entidad con un offset hacia arriba
    const bubbleOffsetY = -80; // Más arriba para mejor visibilidad
    const bubbleContainer = this.scene.add.container(entity.x, entity.y + bubbleOffsetY);

    // Ajustar tamaño de burbuja basado en el texto
    const textLines = Math.ceil(dialogue.text.length / 35);
    const bubbleWidth = Math.min(Math.max(dialogue.text.length * 7 + 40, 200), 320);
    const bubbleHeight = Math.max(textLines * 20 + 20, 50);

    // Crear burbuja con estilo mejorado
    const bubble = this.scene.add.graphics();

    // Gradiente de fondo más atractivo
    const bubbleColor = dialogue.speaker === 'ISA' ? 0xff6b9d : 0x4ecdc4;
    bubble.fillGradientStyle(0xffffff, 0xffffff, bubbleColor, bubbleColor, 0.95, 0.95, 0.1, 0.1);
    bubble.lineStyle(3, bubbleColor, 0.8);
    bubble.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 12);
    bubble.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 12);

    // Añadir "cola" de la burbuja apuntando al personaje
    const tailSize = 12;
    bubble.fillTriangle(
      0,
      bubbleHeight / 2,
      -tailSize,
      bubbleHeight / 2 + tailSize,
      tailSize,
      bubbleHeight / 2 + tailSize
    );
    bubble.lineStyle(3, bubbleColor, 0.8);
    bubble.strokeTriangle(
      0,
      bubbleHeight / 2,
      -tailSize,
      bubbleHeight / 2 + tailSize,
      tailSize,
      bubbleHeight / 2 + tailSize
    );

    // Texto del diálogo con mejor formato
    const dialogueText = this.scene.add
      .text(0, -5, dialogue.text, {
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        color: '#2c3e50',
        align: 'center',
        wordWrap: { width: bubbleWidth - 30 },
        lineSpacing: 2,
      })
      .setOrigin(0.5);

    // Indicador del hablante con emoji
    const speakerEmoji = dialogue.speaker === 'ISA' ? '👩' : '👨';
    const speakerIndicator = this.scene.add
      .text(-bubbleWidth / 2 + 15, -bubbleHeight / 2 + 15, speakerEmoji, {
        fontSize: '16px',
      })
      .setOrigin(0.5);

    // Nombre del hablante
    const speakerName = this.scene.add
      .text(bubbleWidth / 2 - 10, -bubbleHeight / 2 + 8, dialogue.speaker, {
        fontSize: '10px',
        fontFamily: 'Arial, sans-serif',
        color: `#${bubbleColor.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);

    // Añadir todos los elementos a la burbuja
    bubbleContainer.add([bubble, dialogueText, speakerIndicator, speakerName]);

    // Animación de aparición mejorada
    bubbleContainer.setAlpha(0);
    bubbleContainer.setScale(0.3);
    bubbleContainer.setRotation(-0.1);

    this.scene.tweens.add({
      targets: bubbleContainer,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      duration: 400,
      ease: 'Elastic.easeOut',
    });

    // Hacer que la burbuja siga a la entidad si se mueve
    this.dialogueBubbles.set(entityId, bubbleContainer);

    // Duración adaptativa según longitud del texto
    const displayDuration = Math.max(dialogue.text.length * 100, 4000);
    this.scene.time.delayedCall(displayDuration, () => {
      this.removeDialogueBubble(entityId);
    });

    // Actualizar estado de conversación
    this.conversationState.lastSpeaker = dialogue.speaker;
    this.conversationState.lastDialogue = dialogue;

    logAutopoiesis.info('Diálogo mostrado', {
      entityId,
      speaker: dialogue.speaker,
      emotion: dialogue.emotion,
      activity: dialogue.activity,
      textLength: dialogue.text.length,
      position: { x: entity.x, y: entity.y },
    });

    logAutopoiesis.info(`💬 ${dialogue.speaker}: ${dialogue.text}`);
  }

  /**
   * Remover burbuja de diálogo
   */
  private removeDialogueBubble(entityId: string): void {
    const existingBubble = this.dialogueBubbles.get(entityId);
    if (existingBubble) {
      this.scene.tweens.add({
        targets: existingBubble,
        alpha: 0,
        scaleX: 0.8,
        scaleY: 0.8,
        duration: 200,
        onComplete: () => {
          existingBubble.destroy();
        },
      });
      this.dialogueBubbles.delete(entityId);
    }
  }

  /**
   * Manejar interacción del jugador con entidad
   */
  public handlePlayerInteraction(entityId: string, interactionType: string): void {
    if (!this.isInitialized) {
      logAutopoiesis.warn('⚠️ Sistema de diálogos no inicializado');
      return;
    }

    const dialogue = getDialogueForInteraction(interactionType, entityId);
    if (dialogue) {
      this.showDialogue(entityId, dialogue);

      const entity = this.getAvailableEntities().find(e => e.id === entityId);
      if (entity) {
        entity.lastInteraction = Date.now();
        entity.activity = 'SOCIALIZING';
      }
    }
  }

  /**
   * Iniciar conversación entre entidades específicas
   */
  public startConversation(participants: string[]): void {
    this.conversationState.isActive = true;
    this.conversationState.participants = participants;
    this.conversationState.startTime = Date.now();

    logAutopoiesis.info('Conversación iniciada', {
      participants,
      timestamp: this.conversationState.startTime,
    });
  }

  /**
   * Finalizar conversación activa
   */
  public endConversation(): void {
    this.conversationState.isActive = false;
    this.conversationState.participants = [];

    this.dialogueBubbles.forEach((_, entityId) => {
      this.removeDialogueBubble(entityId);
    });

    logAutopoiesis.info('Conversación finalizada', {
      duration: Date.now() - this.conversationState.startTime,
    });
  }

  /**
   * Obtener estadísticas del sistema
   */
  public getSystemStats() {
    return {
      dialogueStats: getDialogueStats(),
      conversationState: this.conversationState,
      activeBubbles: this.dialogueBubbles.size,
      isInitialized: this.isInitialized,
    };
  }

  /**
   * Limpiar recursos del sistema
   */
  public destroy(): void {
    if (this.autoDialogueTimer) {
      this.autoDialogueTimer.destroy();
    }

    this.dialogueBubbles.forEach(bubble => {
      bubble.destroy();
    });
    this.dialogueBubbles.clear();

    logAutopoiesis.info('DialogueSystem destruido');
  }
}
