/**
 * Sistema de Diálogos Tipo Cartas para "Una Carta Para Isa"
 * Genera misiones dinámicas presentadas como cartas visuales
 */

import type { GameState } from "../types";
import type { NeedsSystem, EntityNeedsData } from "./NeedsSystem";
import type { AISystem } from "./AISystem";
import { logAutopoiesis } from "../utils/logger";

export interface DialogueCard {
  id: string;
  title: string;
  content: string;
  type: "mission" | "event" | "memory" | "reflection" | "interaction";
  priority: "low" | "medium" | "high" | "urgent";
  participants: string[];
  triggerCondition: string;
  choices?: DialogueChoice[];
  emotionalTone:
    | "happy"
    | "sad"
    | "worried"
    | "excited"
    | "contemplative"
    | "playful";
  duration: number; // Tiempo que permanece visible
  consequences?: Record<string, any>;
  timestamp: number;
  container?: Phaser.GameObjects.Container; // Container visual de la carta
}

export interface DialogueChoice {
  id: string;
  text: string;
  outcome: "positive" | "negative" | "neutral";
  effects: {
    needs?: Partial<Record<string, number>>;
    relationship?: number;
    unlocksMission?: string;
    moveTo?: string;
  };
}

export interface CardTemplate {
  id: string;
  title: string;
  contentVariations: string[];
  triggers: {
    needsBased?: Array<{
      need: string;
      threshold: number;
      operator: "below" | "above";
    }>;
    timeBased?: Array<{ time: string; frequency: "daily" | "weekly" | "once" }>;
    eventBased?: Array<{ event: string; conditions: Record<string, any> }>;
    relationshipBased?: Array<{ minLevel: number; entities: string[] }>;
  };
  choices: DialogueChoice[];
  emotionalTone: DialogueCard["emotionalTone"];
}

export class CardDialogueSystem {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private needsSystem: NeedsSystem;
  private aiSystem?: AISystem;

  // Sistema de cartas
  private activeCards = new Map<string, DialogueCard>();
  private cardHistory: DialogueCard[] = [];
  private cardTemplates: CardTemplate[] = [];
  private cardQueue: DialogueCard[] = [];

  // Configuración del sistema
  private readonly MAX_ACTIVE_CARDS = 3;
  private readonly CARD_GENERATION_INTERVAL = 15000; // 15 segundos
  private readonly MAX_CARD_HISTORY = 50;
  private lastCardGeneration = 0;

  // Estado emocional contextual
  private emotionalContext = {
    overallMood: 0.5, // -1 a 1
    recentEvents: [] as string[],
    relationshipLevel: 0.5, // 0 a 1
  };

  // Callback para cuando se genera una carta
  public onCardGenerated?: (card: DialogueCard) => void;

  // Timer tracking for cleanup
  private activeTimers = new Set<NodeJS.Timeout>();

  constructor(
    scene: Phaser.Scene,
    gameState: GameState,
    needsSystem: NeedsSystem,
  ) {
    this.scene = scene;
    this.gameState = gameState;
    this.needsSystem = needsSystem;

    this.initializeCardTemplates();
    this.setupEventListeners();

    logAutopoiesis.info("💌 Sistema de Cartas de Diálogo inicializado", {
      templates: this.cardTemplates.length,
      maxActiveCards: this.MAX_ACTIVE_CARDS,
    });
  }

  /**
   * Establecer referencia al sistema de IA
   */
  public setAISystem(aiSystem: AISystem): void {
    this.aiSystem = aiSystem;
  }

  /**
   * Inicializar plantillas de cartas
   */
  private initializeCardTemplates(): void {
    this.cardTemplates = [
      // CARTAS BASADAS EN NECESIDADES
      {
        id: "hunger_concern",
        title: "Preocupación por la Comida",
        contentVariations: [
          "Siento que mi estómago se queja... ¿Será hora de buscar algo de comer?",
          "He notado que {partner} también parece tener hambre. Quizás deberíamos buscar comida juntos.",
          "El aroma de algo delicioso viene del viento... ¿Habrá comida cerca?",
        ],
        triggers: {
          needsBased: [{ need: "hunger", threshold: 40, operator: "below" }],
        },
        choices: [
          {
            id: "search_food",
            text: "Buscar comida inmediatamente",
            outcome: "positive",
            effects: { moveTo: "food_zone" },
          },
          {
            id: "wait_longer",
            text: "Esperar un poco más",
            outcome: "neutral",
            effects: { needs: { hunger: -5 } },
          },
        ],
        emotionalTone: "worried",
      },

      {
        id: "social_longing",
        title: "Necesidad de Compañía",
        contentVariations: [
          "Me siento un poco solo... Me pregunto qué estará haciendo {partner}.",
          "Sería lindo pasar tiempo con {partner}, hace rato que no hablamos.",
          "La soledad a veces pesa... ¿Será que {partner} también se siente así?",
        ],
        triggers: {
          needsBased: [
            { need: "mentalHealth", threshold: 30, operator: "below" },
          ],
        },
        choices: [
          {
            id: "seek_company",
            text: "Buscar a mi compañero",
            outcome: "positive",
            effects: { needs: { mentalHealth: 10 }, relationship: 5 },
          },
          {
            id: "reflect_alone",
            text: "Reflexionar en soledad",
            outcome: "neutral",
            effects: { needs: { mentalHealth: 2 } },
          },
        ],
        emotionalTone: "sad",
      },

      // CARTAS DE EVENTOS EMERGENTES
      {
        id: "discovery_moment",
        title: "Un Descubrimiento",
        contentVariations: [
          "¡Qué interesante! He encontrado algo nuevo en este lugar...",
          "Nunca antes había visto esto aquí. Me pregunto qué significará.",
          "Este lugar tiene secretos que aún no he descubierto completamente.",
        ],
        triggers: {
          eventBased: [
            { event: "zone_exploration", conditions: { newZone: true } },
          ],
        },
        choices: [
          {
            id: "investigate",
            text: "Investigar más a fondo",
            outcome: "positive",
            effects: {
              needs: { mentalHealth: 5 },
              unlocksMission: "exploration_quest",
            },
          },
          {
            id: "remember_later",
            text: "Recordar para después",
            outcome: "neutral",
            effects: {},
          },
        ],
        emotionalTone: "excited",
      },

      // CARTAS DE REFLEXIÓN Y MEMORIA
      {
        id: "memory_reflection",
        title: "Recordando Momentos",
        contentVariations: [
          "Recuerdo cuando {partner} y yo compartimos aquel momento especial...",
          "Los recuerdos de tiempos más simples me traen nostalgia.",
          "¿Cómo llegamos hasta aquí? El tiempo pasa tan rápido...",
        ],
        triggers: {
          relationshipBased: [{ minLevel: 0.3, entities: ["isa", "stev"] }],
        },
        choices: [
          {
            id: "cherish_memory",
            text: "Atesorar el recuerdo",
            outcome: "positive",
            effects: { needs: { mentalHealth: 8 }, relationship: 3 },
          },
          {
            id: "move_forward",
            text: "Mirar hacia el futuro",
            outcome: "positive",
            effects: { needs: { energy: 5 } },
          },
        ],
        emotionalTone: "contemplative",
      },

      // CARTAS DE INTERACCIÓN DIRECTA
      {
        id: "partnership_moment",
        title: "Momento de Colaboración",
        contentVariations: [
          "{partner} y yo podríamos trabajar juntos en esto...",
          "Siento que {partner} necesita mi ayuda ahora mismo.",
          "Juntos somos más fuertes. ¿Qué podríamos lograr colaborando?",
        ],
        triggers: {
          needsBased: [
            { need: "energy", threshold: 60, operator: "above" },
            { need: "mentalHealth", threshold: 50, operator: "above" },
          ],
        },
        choices: [
          {
            id: "collaborate",
            text: "Proponer colaboración",
            outcome: "positive",
            effects: {
              needs: { mentalHealth: 10, energy: -5 },
              relationship: 8,
            },
          },
          {
            id: "work_independently",
            text: "Trabajar independientemente",
            outcome: "neutral",
            effects: { needs: { energy: 3 } },
          },
        ],
        emotionalTone: "playful",
      },

      // CARTAS DE EMERGENCIA
      {
        id: "critical_situation",
        title: "Situación Crítica",
        contentVariations: [
          "¡Esto se está volviendo realmente urgente! Necesito actuar ya.",
          "La situación es más seria de lo que pensé...",
          "No puedo seguir ignorando esto por más tiempo.",
        ],
        triggers: {
          needsBased: [
            { need: "hunger", threshold: 15, operator: "below" },
            { need: "thirst", threshold: 15, operator: "below" },
          ],
        },
        choices: [
          {
            id: "emergency_action",
            text: "Acción inmediata",
            outcome: "positive",
            effects: { moveTo: "nearest_resource" },
          },
          {
            id: "seek_help",
            text: "Buscar ayuda de {partner}",
            outcome: "positive",
            effects: { relationship: 5, unlocksMission: "rescue_mission" },
          },
        ],
        emotionalTone: "worried",
      },
    ];
  }

  /**
   * Actualizar sistema de cartas
   */
  public update(): void {
    const now = Date.now();

    // Generar nuevas cartas periódicamente
    if (now - this.lastCardGeneration > this.CARD_GENERATION_INTERVAL) {
      this.generateContextualCards();
      this.lastCardGeneration = now;
    }

    // Procesar cola de cartas
    this.processCardQueue();

    // Verificar cartas expiradas
    this.checkExpiredCards();

    // Actualizar contexto emocional
    this.updateEmotionalContext();
  }

  /**
   * Generar cartas basadas en el contexto actual
   */
  private generateContextualCards(): void {
    if (this.activeCards.size >= this.MAX_ACTIVE_CARDS) return;

    const entities = ["isa", "stev"];

    entities.forEach((entityId) => {
      const entityNeeds = this.needsSystem.getEntityNeeds(entityId);
      if (!entityNeeds) return;

      // Buscar templates que coincidan con las condiciones actuales
      const matchingTemplates = this.cardTemplates.filter((template) =>
        this.evaluateCardTriggers(template, entityNeeds, entityId),
      );

      if (matchingTemplates.length > 0) {
        // Seleccionar template basado en prioridad y aleatoriedad
        const selectedTemplate = this.selectBestTemplate(
          matchingTemplates,
          entityNeeds,
        );

        if (selectedTemplate) {
          const card = this.createCardFromTemplate(
            selectedTemplate,
            entityId,
            entityNeeds,
          );
          this.cardQueue.push(card);
        }
      }
    });
  }

  /**
   * Evaluar si un template cumple las condiciones de activación
   */
  private evaluateCardTriggers(
    template: CardTemplate,
    entityNeeds: EntityNeedsData,
    entityId: string,
  ): boolean {
    const { triggers } = template;

    // Verificar triggers basados en necesidades
    if (triggers.needsBased) {
      const needsMatch = triggers.needsBased.some((trigger) => {
        const needValue = entityNeeds.needs[
          trigger.need as keyof typeof entityNeeds.needs
        ] as number;

        if (trigger.operator === "below") {
          return needValue < trigger.threshold;
        } else {
          return needValue > trigger.threshold;
        }
      });

      if (needsMatch) return true;
    }

    // Verificar triggers basados en relaciones
    if (triggers.relationshipBased) {
      const relationshipMatch = triggers.relationshipBased.some((trigger) => {
        return (
          this.emotionalContext.relationshipLevel >= trigger.minLevel &&
          trigger.entities.includes(entityId)
        );
      });

      if (relationshipMatch) return true;
    }

    // Verificar triggers basados en eventos
    if (triggers.eventBased) {
      const eventMatch = triggers.eventBased.some((trigger) => {
        return this.emotionalContext.recentEvents.includes(trigger.event);
      });

      if (eventMatch) return true;
    }

    return false;
  }

  /**
   * Seleccionar el mejor template basado en el contexto
   */
  private selectBestTemplate(
    templates: CardTemplate[],
    entityNeeds: EntityNeedsData,
  ): CardTemplate | null {
    if (templates.length === 0) return null;

    // Calcular puntuaciones basadas en urgencia y contexto
    const scoredTemplates = templates.map((template) => {
      let score = Math.random() * 0.3; // Factor aleatorio base

      // Aumentar puntuación por urgencia de necesidades
      if (template.triggers.needsBased) {
        template.triggers.needsBased.forEach((trigger) => {
          const needValue = entityNeeds.needs[
            trigger.need as keyof typeof entityNeeds.needs
          ] as number;

          if (trigger.operator === "below" && needValue < 20) {
            score += 0.8; // Muy urgente
          } else if (trigger.operator === "below" && needValue < 40) {
            score += 0.5; // Moderadamente urgente
          }
        });
      }

      // Bonus por contexto emocional
      if (
        template.emotionalTone === "worried" &&
        this.emotionalContext.overallMood < 0.3
      ) {
        score += 0.3;
      }

      return { template, score };
    });

    // Seleccionar el template con mayor puntuación
    scoredTemplates.sort((a, b) => b.score - a.score);
    return scoredTemplates[0]?.template || null;
  }

  /**
   * Crear carta desde template
   */
  private createCardFromTemplate(
    template: CardTemplate,
    entityId: string,
    entityNeeds: EntityNeedsData,
  ): DialogueCard {
    const partnerId = entityId === "isa" ? "stev" : "isa";

    // Seleccionar variación de contenido aleatoria
    const contentVariation =
      template.contentVariations[
        Math.floor(Math.random() * template.contentVariations.length)
      ];

    // Reemplazar placeholders
    const content = contentVariation.replace(/{partner}/g, partnerId);

    // Determinar prioridad basada en las necesidades
    const priority = this.calculateCardPriority(entityNeeds);

    const card: DialogueCard = {
      id: `${template.id}_${entityId}_${Date.now()}`,
      title: template.title,
      content,
      type: "mission",
      priority,
      participants: [entityId, partnerId],
      triggerCondition: template.id,
      choices: [...template.choices],
      emotionalTone: template.emotionalTone,
      duration: this.calculateCardDuration(priority),
      timestamp: Date.now(),
    };

    return card;
  }

  /**
   * Calcular prioridad de carta basada en necesidades
   */
  private calculateCardPriority(
    entityNeeds: EntityNeedsData,
  ): DialogueCard["priority"] {
    const { needs } = entityNeeds;

    // Verificar necesidades críticas
    if (needs.hunger < 15 || needs.thirst < 15) return "urgent";
    if (needs.hunger < 30 || needs.thirst < 25 || needs.energy < 20)
      return "high";
    if (needs.mentalHealth < 40) return "medium";

    return "low";
  }

  /**
   * Calcular duración de carta
   */
  private calculateCardDuration(priority: DialogueCard["priority"]): number {
    const durations = {
      urgent: 30000, // 30 segundos
      high: 45000, // 45 segundos
      medium: 60000, // 1 minuto
      low: 90000, // 1.5 minutos
    };

    return durations[priority];
  }

  /**
   * Procesar cola de cartas
   */
  private processCardQueue(): void {
    while (
      this.cardQueue.length > 0 &&
      this.activeCards.size < this.MAX_ACTIVE_CARDS
    ) {
      const card = this.cardQueue.shift()!;
      this.displayCard(card);
    }
  }

  /**
   * Mostrar carta y activarla
   */
  private displayCard(card: DialogueCard): void {
    this.activeCards.set(card.id, card);

    // Notificar al UI para mostrar la carta
    if (this.onCardGenerated) {
      this.onCardGenerated(card);
    }

    // Emitir evento para DialogueCardUI
    this.scene.events.emit("showDialogueCard", card);

    logAutopoiesis.info("💌 Carta mostrada", {
      cardId: card.id,
      title: card.title,
      type: card.type,
      priority: card.priority,
      participants: card.participants,
    });

    // Programar expiración automática
    const timer = setTimeout(() => {
      if (this.activeCards.has(card.id)) {
        this.expireCard(card.id);
      }
      this.activeTimers.delete(timer);
    }, card.duration);

    this.activeTimers.add(timer);
  }

  /**
   * Expirar carta específica
   */
  private expireCard(cardId: string): void {
    const card = this.activeCards.get(cardId);
    if (card) {
      // Limpiar UI container si existe
      if (card.container) {
        card.container.destroy();
        card.container = undefined;
      }

      this.activeCards.delete(cardId);
      this.addToHistory(card);

      // Notificar que la carta expiró
      this.scene.events.emit("cardExpired", cardId);

      // Emitir evento para DialogueCardUI
      this.scene.events.emit("hideDialogueCard", cardId);

      logAutopoiesis.info("⏰ Carta expirada", {
        cardId: card.id,
        title: card.title,
      });
    }
  }

  /**
   * Verificar cartas expiradas
   */
  private checkExpiredCards(): void {
    const now = Date.now();

    this.activeCards.forEach((card, cardId) => {
      if (now - card.timestamp > card.duration) {
        this.expireCard(cardId);
      }
    });
  }

  /**
   * Responder a una carta (cuando el jugador elige una opción)
   */
  public respondToCard(cardId: string, choiceId: string): void {
    const card = this.activeCards.get(cardId);
    if (!card) return;

    const choice = card.choices?.find((c) => c.id === choiceId);
    if (!choice) return;

    // Aplicar efectos de la elección
    this.applyChoiceEffects(card, choice);

    // Limpiar UI container si existe
    if (card.container) {
      card.container.destroy();
      card.container = undefined;
    }

    // Remover carta activa
    this.activeCards.delete(cardId);
    this.addToHistory(card);

    // Emitir evento de respuesta
    this.scene.events.emit("cardResponded", { card, choice });

    // Emitir evento para QuestSystem
    this.scene.events.emit("dialogue_completed", {
      cardId,
      choiceId,
      participants: card.participants,
      outcome: choice.outcome,
      effects: choice.effects,
    });

    // Emitir evento para DialogueCardUI (ocultar carta respondida)
    this.scene.events.emit("hideDialogueCard", cardId);

    logAutopoiesis.info(`✨ Respuesta a carta: ${card.title}`, {
      choice: choice.text,
      outcome: choice.outcome,
    });
  }

  /**
   * Aplicar efectos de una elección
   */
  private applyChoiceEffects(card: DialogueCard, choice: DialogueChoice): void {
    const entityId = card.participants[0];
    const entityNeeds = this.needsSystem.getEntityNeeds(entityId);

    if (!entityNeeds) return;

    // Aplicar efectos en necesidades
    if (choice.effects.needs) {
      Object.entries(choice.effects.needs).forEach(([need, value]) => {
        this.needsSystem.satisfyNeed(entityNeeds, need as any, value);
      });
    }

    // Actualizar relación
    if (choice.effects.relationship) {
      this.emotionalContext.relationshipLevel = Math.max(
        0,
        Math.min(
          1,
          this.emotionalContext.relationshipLevel +
            choice.effects.relationship / 100,
        ),
      );
    }

    // Movimiento a zona específica
    if (choice.effects.moveTo && this.aiSystem) {
      if (choice.effects.moveTo === "nearest_resource") {
        // Lógica para encontrar el recurso más cercano
        const targetZone = this.findNearestResourceZone(entityId);
        if (targetZone) {
          // El sistema de IA manejará el movimiento
          logAutopoiesis.info(
            `🎯 ${entityId} dirigiéndose a zona de recursos: ${targetZone}`,
          );
        }
      } else {
        // Zona específica
        logAutopoiesis.info(
          `🎯 ${entityId} dirigiéndose a: ${choice.effects.moveTo}`,
        );
      }
    }

    // Actualizar contexto emocional
    this.updateEmotionalContextFromChoice(choice);
  }

  /**
   * Encontrar zona de recursos más cercana
   */
  private findNearestResourceZone(entityId: string): string | null {
    // Simplificado: devolver primera zona de comida o agua
    const resourceZones = this.gameState.zones.filter(
      (zone) => zone.type === "food" || zone.type === "water",
    );

    return resourceZones[0]?.id || null;
  }

  /**
   * Actualizar contexto emocional
   */
  private updateEmotionalContext(): void {
    // Calcular humor general basado en necesidades promedio
    const entities = ["isa", "stev"];
    let totalMood = 0;
    let entityCount = 0;

    entities.forEach((entityId) => {
      const entityNeeds = this.needsSystem.getEntityNeeds(entityId);
      if (entityNeeds) {
        const { needs } = entityNeeds;
        const avgNeeds =
          (needs.hunger + needs.thirst + needs.energy + needs.mentalHealth) / 4;
        totalMood += (avgNeeds / 100) * 2 - 1; // Convertir a rango -1 a 1
        entityCount++;
      }
    });

    if (entityCount > 0) {
      this.emotionalContext.overallMood = totalMood / entityCount;
    }

    // Limpiar eventos antiguos
    const cutoffTime = Date.now() - 60000; // 1 minuto
    this.emotionalContext.recentEvents =
      this.emotionalContext.recentEvents.filter(
        (event) => parseInt(event.split("_").pop() || "0") > cutoffTime,
      );
  }

  /**
   * Actualizar contexto desde elección
   */
  private updateEmotionalContextFromChoice(choice: DialogueChoice): void {
    const moodChange = {
      positive: 0.1,
      neutral: 0,
      negative: -0.1,
    };

    this.emotionalContext.overallMood = Math.max(
      -1,
      Math.min(
        1,
        this.emotionalContext.overallMood + moodChange[choice.outcome],
      ),
    );
  }

  /**
   * Agregar carta al historial
   */
  private addToHistory(card: DialogueCard): void {
    this.cardHistory.unshift(card);

    // Mantener límite del historial
    if (this.cardHistory.length > this.MAX_CARD_HISTORY) {
      this.cardHistory = this.cardHistory.slice(0, this.MAX_CARD_HISTORY);
    }
  }

  /**
   * Obtener cartas activas
   */
  public getActiveCards(): DialogueCard[] {
    return Array.from(this.activeCards.values());
  }

  /**
   * Obtener historial de cartas
   */
  public getCardHistory(): DialogueCard[] {
    return [...this.cardHistory];
  }

  /**
   * Manejar elección de carta
   */
  public handleChoice(cardId: string, choice: DialogueChoice): void {
    const card = this.activeCards.get(cardId);
    if (!card) return;

    // Actualizar contexto emocional
    this.updateEmotionalContextFromChoice(choice);

    // Agregar evento al contexto
    this.emotionalContext.recentEvents.push(
      `choice_${choice.outcome}_${Date.now()}`,
    );

    // Si la carta debe cerrarse después de la elección
    if (choice.outcome !== "neutral" || card.type !== "reflection") {
      // Limpiar UI container si existe
      if (card.container) {
        card.container.destroy();
        card.container = undefined;
      }

      this.activeCards.delete(cardId);
      this.addToHistory(card);
    }

    logAutopoiesis.info("Card choice processed", {
      cardId,
      choiceId: choice.id,
      outcome: choice.outcome,
      moodChange: this.emotionalContext.overallMood,
    });
  }

  /**
   * Activar carta por evento específico
   */
  public triggerEventCard(eventType: string, participants: string[]): void {
    // Buscar template apropiado para el evento
    const eventTemplates = this.cardTemplates.filter((template) =>
      template.triggers.eventBased?.some(
        (trigger) => trigger.event === eventType,
      ),
    );

    if (eventTemplates.length === 0) {
      // Crear carta de evento genérica
      this.createGenericEventCard(eventType, participants);
      return;
    }

    // Seleccionar template basado en contexto actual
    const selectedTemplate =
      eventTemplates[Math.floor(Math.random() * eventTemplates.length)];

    // Obtener necesidades de la primera entidad para contexto
    const primaryEntity = participants[0];
    const entityNeeds = this.needsSystem.getEntityNeeds(primaryEntity);

    if (entityNeeds) {
      const card = this.createCardFromTemplate(
        selectedTemplate,
        primaryEntity,
        entityNeeds,
      );
      this.addCardToQueue(card);
    }
  }

  /**
   * Crear carta de evento genérica
   */
  private createGenericEventCard(
    eventType: string,
    participants: string[],
  ): void {
    const eventMessages = {
      first_meeting: {
        title: "Primer Encuentro",
        content: "Nos encontramos por primera vez en este lugar extraño...",
        tone: "contemplative" as const,
      },
      close_interaction: {
        title: "Momento Cercano",
        content: "Estamos muy cerca. Puedo sentir la presencia de {partner}...",
        tone: "playful" as const,
      },
      player_action: {
        title: "Reflexión Personal",
        content: "Algo cambió cuando tomé esa decisión...",
        tone: "contemplative" as const,
      },
      hunger_crisis: {
        title: "¡Hambre Extrema!",
        content:
          "¡Necesito encontrar comida urgentemente! Mi estómago duele...",
        tone: "worried" as const,
      },
      thirst_crisis: {
        title: "Sed Desesperante",
        content: "Mi boca está seca... necesito agua ahora mismo.",
        tone: "worried" as const,
      },
      exhaustion: {
        title: "Agotamiento Total",
        content: "Mis fuerzas se desvanecen... necesito descansar.",
        tone: "sad" as const,
      },
      mental_health_concern: {
        title: "Pensamientos Oscuros",
        content: "Mi mente está nublada... todo parece más difícil.",
        tone: "sad" as const,
      },
      feeling_great: {
        title: "¡Me Siento Increíble!",
        content: "Todo está saliendo bien. Me siento lleno de energía.",
        tone: "happy" as const,
      },
    };

    const eventData = eventMessages[
      eventType as keyof typeof eventMessages
    ] || {
      title: "Evento Inesperado",
      content: "Algo interesante está pasando...",
      tone: "contemplative" as const,
    };

    const card: DialogueCard = {
      id: `event_${eventType}_${Date.now()}`,
      title: eventData.title,
      content: eventData.content.replace(
        "{partner}",
        participants[1] || "mi compañero",
      ),
      type: "event",
      priority: eventType.includes("crisis") ? "urgent" : "medium",
      participants,
      triggerCondition: `event:${eventType}`,
      emotionalTone: eventData.tone,
      duration: 8000,
      timestamp: Date.now(),
      choices: this.createGenericChoices(eventType),
    };

    this.addCardToQueue(card);
  }

  /**
   * Crear opciones genéricas basadas en el tipo de evento
   */
  private createGenericChoices(eventType: string): DialogueChoice[] {
    const crisisChoices: DialogueChoice[] = [
      {
        id: "seek_help",
        text: "Buscar ayuda",
        outcome: "positive",
        effects: { needs: { mentalHealth: 5 }, relationship: 3 },
      },
      {
        id: "handle_alone",
        text: "Manejar solo",
        outcome: "neutral",
        effects: { needs: { energy: -2 } },
      },
    ];

    const positiveChoices: DialogueChoice[] = [
      {
        id: "share_joy",
        text: "Compartir la alegría",
        outcome: "positive",
        effects: { needs: { mentalHealth: 8 }, relationship: 5 },
      },
      {
        id: "keep_quiet",
        text: "Mantenerlo privado",
        outcome: "neutral",
        effects: { needs: { energy: 2 } },
      },
    ];

    const neutralChoices: DialogueChoice[] = [
      {
        id: "reflect",
        text: "Reflexionar",
        outcome: "positive",
        effects: { needs: { mentalHealth: 3 } },
      },
      {
        id: "continue",
        text: "Continuar",
        outcome: "neutral",
        effects: {},
      },
    ];

    if (eventType.includes("crisis") || eventType.includes("concern")) {
      return crisisChoices;
    }

    if (eventType.includes("great") || eventType.includes("meeting")) {
      return positiveChoices;
    }

    return neutralChoices;
  }

  /**
   * Agregar carta a la cola y notificar
   */
  private addCardToQueue(card: DialogueCard): void {
    this.cardQueue.push(card);

    // Procesar inmediatamente si hay espacio
    if (this.activeCards.size < this.MAX_ACTIVE_CARDS) {
      this.processCardQueue();
    }
  }

  /**
   * Obtener estadísticas del sistema
   */
  public getSystemStats() {
    return {
      activeCards: this.activeCards.size,
      queuedCards: this.cardQueue.length,
      totalHistory: this.cardHistory.length,
      emotionalContext: { ...this.emotionalContext },
      templates: this.cardTemplates.length,
    };
  }

  /**
   * Configurar listeners de eventos
   */
  private setupEventListeners(): void {
    // Escuchar respuestas del usuario desde DialogueCardUI
    this.scene.events.on("dialogueChoiceSelected", (eventData: any) => {
      this.respondToCard(eventData.cardId, eventData.choice.id);
    });
  }

  /**
   * Generar carta de emergencia basada en necesidades críticas
   */
  public triggerEmergencyCard(entityId: string, needType: string): void {
    const emergencyCards: Record<string, any> = {
      hunger: {
        title: "¡Hambre crítica!",
        content: `${entityId} tiene hambre extrema y necesita comida urgentemente.`,
        type: "event" as const,
        priority: "urgent" as const,
        emotionalTone: "worried" as const,
        choices: [
          {
            id: "find_food",
            text: "Buscar comida",
            outcome: "search_food",
            effects: { needs: { hunger: 30 } },
          },
          {
            id: "ignore",
            text: "Ignorar",
            outcome: "ignored",
            effects: {},
          },
        ],
      },
      thirst: {
        title: "¡Sed crítica!",
        content: `${entityId} está deshidratado y necesita agua inmediatamente.`,
        type: "event" as const,
        priority: "urgent" as const,
        emotionalTone: "worried" as const,
        choices: [
          {
            id: "find_water",
            text: "Buscar agua",
            outcome: "search_water",
            effects: { needs: { thirst: 40 } },
          },
          {
            id: "rest",
            text: "Descansar un poco",
            outcome: "rest",
            effects: { needs: { energy: 10 } },
          },
        ],
      },
      energy: {
        title: "Agotamiento extremo",
        content: `${entityId} está completamente agotado y no puede continuar.`,
        type: "event" as const,
        priority: "high" as const,
        emotionalTone: "sad" as const,
        choices: [
          {
            id: "rest_now",
            text: "Descansar ahora",
            outcome: "emergency_rest",
            effects: { needs: { energy: 50 } },
          },
        ],
      },
    };

    const cardTemplate = emergencyCards[needType];
    if (!cardTemplate) return;

    const emergencyCard: DialogueCard = {
      id: `emergency_${needType}_${Date.now()}`,
      ...cardTemplate,
      participants: [entityId],
      timestamp: Date.now(),
      duration: 30000,
      sourceEntityId: entityId,
    };

    this.addCardToQueue(emergencyCard);

    logAutopoiesis.warn("🚨 Carta de emergencia generada", {
      entityId,
      needType,
      cardId: emergencyCard.id,
    });
  }

  /**
   * Limpiar sistema
   */
  public cleanup(): void {
    // Limpiar todos los timers activos
    this.activeTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.activeTimers.clear();

    // Limpiar tarjetas activas
    this.activeCards.forEach((card) => {
      if (card.container) {
        card.container.destroy();
      }
    });
    this.activeCards.clear();

    // Limpiar cola
    this.cardQueue = [];
    this.cardHistory = [];

    // Remover listeners
    this.scene.events.off("cardDialogue:show");
    this.scene.events.off("cardDialogue:dismiss");
    this.scene.events.off("dialogueChoiceSelected");

    logAutopoiesis.info("🧹 CardDialogueSystem limpiado");
  }
}
