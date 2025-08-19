/**
 * Sistema de Diálogos para Una Carta Para Isa
 * Adaptado al motor Phaser - Integra con el sistema de autopoiesis
 */

import type { ConversationState, Entity } from '../types';
import { dialogues, getRandomDialogue } from '../utils/dialogues';
import { gameConfig } from '../config/gameConfig';
import { logAutopoiesis } from '../utils/logger';

export class DialogueSystem {
  private scene: Phaser.Scene;
  private conversationState: ConversationState;
  private dialogueBubbles: Map<string, Phaser.GameObjects.Container> = new Map();
  private autoDialogueTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.conversationState = {
      isActive: false,
      participants: [],
      lastSpeaker: null,
      lastDialogue: null,
      startTime: 0
    };

    this.setupAutoDialogueSystem();
  }

  /**
   * Configurar el sistema autónomo de diálogos
   */
  private setupAutoDialogueSystem() {
    // Auto-iniciar conversaciones cada cierto tiempo
    this.autoDialogueTimer = this.scene.time.addEvent({
      delay: 8000, // Cada 8 segundos evalúa si iniciar diálogo
      callback: this.evaluateAutoDialogue,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Evalúa si debe iniciar un diálogo automático basado en contexto de entidades
   */
  private evaluateAutoDialogue() {
    if (this.conversationState.isActive) return;
    if (Math.random() > gameConfig.ui.dialogueInitiationChance) return;

    const entities = this.getActiveEntities();
    if (entities.length < 2) return;

    // Seleccionar entidad iniciadora basada en estado emocional
    const initiator = this.selectDialogueInitiator(entities);
    if (!initiator) return;

    this.initiateContextualDialogue(initiator);
  }

  /**
   * Obtiene entidades activas que pueden participar en diálogos
   */
  private getActiveEntities(): Entity[] {
    const gameState = this.scene.registry.get('gameState');
    return gameState?.entities?.filter((entity: Entity) => 
      !entity.isDead && 
      entity.stats.energy > 20 &&
      entity.activity !== 'WORKING'
    ) || [];
  }

  /**
   * Selecciona la entidad que debería iniciar un diálogo
   */
  private selectDialogueInitiator(entities: Entity[]): Entity | null {
    // Priorizar entidades con estados emocionales que favorecen comunicación
    const socialMoods = ['😊', '😌', '🤩', '😔'];
    
    const socialEntities = entities.filter(e => socialMoods.includes(e.mood));
    if (socialEntities.length > 0) {
      return socialEntities[Math.floor(Math.random() * socialEntities.length)];
    }

    // Si no hay entidades sociales, cualquier entidad activa
    return entities[Math.floor(Math.random() * entities.length)];
  }

  /**
   * Inicia un diálogo contextual basado en el estado de la entidad
   */
  public initiateContextualDialogue(entity: Entity) {
    const dialogueType = this.getDialogueTypeFromContext(entity);
    const message = getRandomDialogue(dialogueType);

    if (!message) return;

    this.startConversation([entity.id]);
    this.showDialogueBubble(entity, message, this.getSpeakerFromEntity(entity.id));

    logAutopoiesis.info(`Diálogo contextual iniciado`, {
      entity: entity.id,
      type: dialogueType,
      mood: entity.mood,
      activity: entity.activity
    });
  }

  /**
   * Determina el tipo de diálogo basado en el contexto de la entidad
   */
  private getDialogueTypeFromContext(entity: Entity): keyof typeof dialogues {
    // Mapeo de estados a tipos de diálogo
    const statePriorities = [
      { condition: () => entity.stats.hunger < 30, type: 'hungry' as const },
      { condition: () => entity.stats.sleepiness < 25, type: 'tired' as const },
      { condition: () => entity.stats.loneliness < 30, type: 'lonely' as const },
      { condition: () => entity.stats.happiness > 75, type: 'happy' as const },
      { condition: () => entity.activity === 'MEDITATING', type: 'meditation' as const },
      { condition: () => entity.activity === 'WRITING', type: 'writing' as const },
      { condition: () => entity.mood === '😢', type: 'comforting' as const },
      { condition: () => entity.mood === '🤩', type: 'playing' as const }
    ];

    // Encontrar el primer estado que coincida
    for (const priority of statePriorities) {
      if (priority.condition()) {
        return priority.type;
      }
    }

    // Fallback a diálogo general de felicidad
    return 'happy';
  }

  /**
   * Muestra una burbuja de diálogo sobre una entidad
   */
  public showDialogueBubble(
    entity: Entity, 
    message: string, 
    speaker: 'ISA' | 'STEV',
    duration: number = 4000
  ) {
    const bubbleId = `${entity.id}-${Date.now()}`;
    
    // Crear contenedor para la burbuja
    const bubble = this.scene.add.container(entity.position.x, entity.position.y - 60);
    
    // Background de la burbuja con estilo mejorado
    const bgColor = speaker === 'ISA' ? 0x8e44ad : 0x2980b9;
    const background = this.scene.add.graphics();
    background.fillStyle(bgColor, 0.9);
    background.lineStyle(2, 0xffffff, 0.8);
    background.fillRoundedRect(-120, -30, 240, 60, 10);
    background.strokeRoundedRect(-120, -30, 240, 60, 10);
    
    // Texto del diálogo con mejores estilos
    const text = this.scene.add.text(0, 0, this.truncateMessage(message), {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      align: 'center',
      wordWrap: { width: 220 },
      fontStyle: 'bold'
    });
    text.setOrigin(0.5);
    
    // Etiqueta del hablante
    const speakerLabel = this.scene.add.text(0, -20, speaker === 'ISA' ? '💜 Isa' : '💙 Stev', {
      fontSize: '10px',
      color: '#ecf0f1',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'italic'
    });
    speakerLabel.setOrigin(0.5);
    
    // Cola de la burbuja
    const tail = this.scene.add.graphics();
    tail.fillStyle(bgColor, 0.9);
    tail.fillTriangle(0, 30, -8, 40, 8, 40);
    
    // Ensamblar burbuja
    bubble.add([background, tail, speakerLabel, text]);
    bubble.setDepth(1000);
    
    // Animación de entrada
    bubble.setScale(0);
    this.scene.tweens.add({
      targets: bubble,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    // Guardar referencia
    this.dialogueBubbles.set(bubbleId, bubble);
    
    // Auto-destruir después del tiempo especificado
    this.scene.time.delayedCall(duration, () => {
      this.hideDialogueBubble(bubbleId);
    });

    return bubbleId;
  }

  /**
   * Oculta una burbuja de diálogo específica
   */
  public hideDialogueBubble(bubbleId: string) {
    const bubble = this.dialogueBubbles.get(bubbleId);
    if (!bubble) return;

    // Animación de salida
    this.scene.tweens.add({
      targets: bubble,
      scale: 0,
      alpha: 0,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        bubble.destroy();
        this.dialogueBubbles.delete(bubbleId);
      }
    });
  }

  /**
   * Maneja diálogos de interacción del jugador
   */
  public handleInteractionDialogue(
    entityId: string, 
    interactionType: string
  ) {
    const entity = this.getActiveEntities().find(e => e.id === entityId);
    if (!entity) return;

    // Mapeo de interacciones a tipos de diálogo
    const interactionMap: Record<string, keyof typeof dialogues> = {
      'FEED': 'feeding',
      'PLAY': 'playing', 
      'COMFORT': 'comforting',
      'DISTURB': 'disturbing',
      'NOURISH': 'post-nutrition'
    };

    const dialogueType = interactionMap[interactionType];
    if (!dialogueType) return;

    const message = getRandomDialogue(dialogueType);
    const speaker = this.getSpeakerFromEntity(entityId);
    
    this.showDialogueBubble(entity, message, speaker, 3500);

    logAutopoiesis.info(`Diálogo de interacción`, {
      entity: entityId,
      interaction: interactionType,
      type: dialogueType
    });
  }

  /**
   * Trunca mensajes muy largos para la burbuja
   */
  private truncateMessage(message: string, maxLength: number = 80): string {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength - 3) + '...';
  }

  /**
   * Convierte ID de entidad a speaker
   */
  private getSpeakerFromEntity(entityId: string): 'ISA' | 'STEV' {
    return entityId.toLowerCase().includes('isa') ? 'ISA' : 'STEV';
  }

  /**
   * Inicia una conversación
   */
  public startConversation(participants: string[]) {
    this.conversationState = {
      isActive: true,
      participants,
      lastSpeaker: null,
      lastDialogue: null,
      startTime: Date.now()
    };
  }

  /**
   * Finaliza la conversación actual
   */
  public endConversation() {
    this.conversationState = {
      isActive: false,
      participants: [],
      lastSpeaker: null,
      lastDialogue: null,
      startTime: 0
    };
  }

  /**
   * Limpia el sistema al destruir la escena
   */
  public destroy() {
    if (this.autoDialogueTimer) {
      this.autoDialogueTimer.destroy();
    }
    
    // Limpiar todas las burbujas activas
    this.dialogueBubbles.forEach(bubble => bubble.destroy());
    this.dialogueBubbles.clear();
  }

  /**
   * Obtiene el estado actual de la conversación
   */
  public getConversationState(): ConversationState {
    return { ...this.conversationState };
  }
}