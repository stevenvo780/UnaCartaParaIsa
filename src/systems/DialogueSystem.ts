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
  getDialogueStats
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
  private dialogueBubbles: Map<string, Phaser.GameObjects.Container> = new Map();
  private autoDialogueTimer?: Phaser.Time.TimerEvent;
  private isInitialized: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.conversationState = {
      isActive: false,
      participants: [],
      lastSpeaker: null,
      lastDialogue: null,
      startTime: 0
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
        stats: getDialogueStats()
      });
      
      console.log('✅ Sistema de diálogos inicializado con conversaciones reales');
    } catch (error) {
      console.error('❌ Error inicializando sistema de diálogos:', error);
      logAutopoiesis.error('Error en inicialización de DialogueSystem', { error: error?.toString() });
    }
  }

  /**
   * Configurar el sistema autónomo de diálogos
   */
  private setupAutoDialogueSystem(): void {
    if (!this.isInitialized) return;

    // Auto-diálogos cada 8-15 segundos
    const baseInterval = 8000;
    const variableInterval = Math.random() * 7000;
    
    this.autoDialogueTimer = this.scene.time.addEvent({
      delay: baseInterval + variableInterval,
      callback: () => this.evaluateAutoDialogue(),
      loop: true
    });

    logAutopoiesis.debug('Sistema autónomo de diálogos configurado', {
      baseInterval,
      nextDialogue: baseInterval + variableInterval
    });
  }

  /**
   * Evaluar si debe generar un diálogo automático
   */
  private evaluateAutoDialogue(): void {
    if (!this.isInitialized || this.conversationState.isActive) return;

    // Obtener entidades válidas para diálogo
    const entities = this.getAvailableEntities();
    if (entities.length === 0) return;

    // Seleccionar entidad aleatoria con distribución ponderada
    const selectedEntity = this.selectEntityForDialogue(entities);
    if (!selectedEntity) return;

    // Generar diálogo contextual
    this.generateContextualDialogue(selectedEntity);
  }

  /**
   * Obtener entidades disponibles para diálogo
   */
  private getAvailableEntities(): Entity[] {
    // Simular entidades del juego - en el juego real vendrían del GameState
    return [
      { id: 'isa_entity', x: 100, y: 100, activity: 'SOCIALIZING', emotion: 'NEUTRAL' },
      { id: 'stev_entity', x: 200, y: 150, activity: 'SOCIALIZING', emotion: 'CURIOUS' }
    ];
  }

  /**
   * Seleccionar entidad para diálogo con lógica ponderada
   */
  private selectEntityForDialogue(entities: Entity[]): Entity | null {
    if (entities.length === 0) return null;

    // Si hay un último hablante, priorizar respuesta
    if (this.conversationState.lastSpeaker) {
      const otherEntities = entities.filter(e => 
        getSpeakerForEntity(e.id) !== this.conversationState.lastSpeaker
      );
      
      if (otherEntities.length > 0) {
        return otherEntities[Math.floor(Math.random() * otherEntities.length)];
      }
    }

    // Selección aleatoria ponderada por tiempo sin hablar
    const now = Date.now();
    const weights = entities.map(entity => {
      const timeSinceLastInteraction = now - (entity.lastInteraction || 0);
      return Math.min(timeSinceLastInteraction / 10000, 2.0); // Max weight de 2.0
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
  private generateContextualDialogue(entity: Entity): void {
    const speaker = getSpeakerForEntity(entity.id);
    const emotion = entity.emotion || getEmotionForActivity(entity.activity || 'SOCIALIZING');
    
    let dialogue: DialogueEntry | null = null;

    // Si hay un diálogo previo, intentar generar respuesta contextual
    if (this.conversationState.lastDialogue && 
        this.conversationState.lastSpeaker !== speaker) {
      dialogue = getResponseWriter(speaker, this.conversationState.lastDialogue);
    }

    // Si no se pudo generar respuesta, obtener diálogo general
    if (!dialogue) {
      dialogue = getNextDialogue(speaker, emotion, entity.activity);
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

    // Crear contenedor de burbuja
    const bubbleContainer = this.scene.add.container(entity.x, entity.y - 60);

    // Crear fondo de burbuja
    const bubbleWidth = Math.min(dialogue.text.length * 8 + 40, 300);
    const bubbleHeight = 60;
    
    const bubble = this.scene.add.graphics();
    bubble.fillStyle(0xffffff, 0.9);
    bubble.lineStyle(2, 0x000000);
    bubble.fillRoundedRect(-bubbleWidth/2, -bubbleHeight/2, bubbleWidth, bubbleHeight, 15);
    bubble.strokeRoundedRect(-bubbleWidth/2, -bubbleHeight/2, bubbleWidth, bubbleHeight, 15);

    // Crear texto del diálogo
    const dialogueText = this.scene.add.text(0, 0, dialogue.text, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#000000',
      align: 'center',
      wordWrap: { width: bubbleWidth - 20 }
    }).setOrigin(0.5);

    // Indicador de speaker
    const speakerColor = dialogue.speaker === 'ISA' ? 0xff6b9d : 0x4ecdc4;
    const speakerIndicator = this.scene.add.circle(-bubbleWidth/2 + 15, -bubbleHeight/2 + 15, 8, speakerColor);

    // Ensamblar burbuja
    bubbleContainer.add([bubble, dialogueText, speakerIndicator]);

    // Animación de aparición
    bubbleContainer.setAlpha(0);
    bubbleContainer.setScale(0.5);
    
    this.scene.tweens.add({
      targets: bubbleContainer,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });

    // Guardar referencia
    this.dialogueBubbles.set(entityId, bubbleContainer);

    // Auto-remover después de duración calculada
    const displayDuration = Math.max(dialogue.text.length * 80, 3000);
    this.scene.time.delayedCall(displayDuration, () => {
      this.removeDialogueBubble(entityId);
    });

    // Actualizar estado de conversación
    this.conversationState.lastSpeaker = dialogue.speaker;
    this.conversationState.lastDialogue = dialogue;
    
    // Log para telemetría
    logAutopoiesis.info('Diálogo mostrado', {
      entityId,
      speaker: dialogue.speaker,
      emotion: dialogue.emotion,
      activity: dialogue.activity,
      textLength: dialogue.text.length
    });

    console.log(`💬 ${dialogue.speaker}: ${dialogue.text}`);
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
        }
      });
      this.dialogueBubbles.delete(entityId);
    }
  }

  /**
   * Manejar interacción del jugador con entidad
   */
  public handlePlayerInteraction(entityId: string, interactionType: string): void {
    if (!this.isInitialized) {
      console.warn('⚠️ Sistema de diálogos no inicializado');
      return;
    }

    const dialogue = getDialogueForInteraction(interactionType, entityId);
    if (dialogue) {
      this.showDialogue(entityId, dialogue);
      
      // Actualizar actividad de la entidad
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
      timestamp: this.conversationState.startTime
    });
  }

  /**
   * Finalizar conversación activa
   */
  public endConversation(): void {
    this.conversationState.isActive = false;
    this.conversationState.participants = [];
    
    // Limpiar todas las burbujas
    this.dialogueBubbles.forEach((_, entityId) => {
      this.removeDialogueBubble(entityId);
    });

    logAutopoiesis.info('Conversación finalizada', {
      duration: Date.now() - this.conversationState.startTime
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
      isInitialized: this.isInitialized
    };
  }

  /**
   * Limpiar recursos del sistema
   */
  public destroy(): void {
    if (this.autoDialogueTimer) {
      this.autoDialogueTimer.destroy();
    }

    this.dialogueBubbles.forEach((bubble) => {
      bubble.destroy();
    });
    this.dialogueBubbles.clear();

    logAutopoiesis.info('DialogueSystem destruido');
  }
}
