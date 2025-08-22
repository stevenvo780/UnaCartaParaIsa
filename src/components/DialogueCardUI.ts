/**
 * DialogueCardUI - Visual component for displaying dialogue cards
 * Creates an elegant card-based interface for emergent storytelling
 */

import Phaser from "phaser";
import type {
    DialogueCard,
    DialogueChoice,
} from "../systems/CardDialogueSystem";
import { logAutopoiesis } from "../utils/logger";

export interface CardUIConfig {
  width: number;
  height: number;
  padding: number;
  cardSpacing: number;
  maxCardsVisible: number;
  animationDuration: number;
}

export class DialogueCardUI {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private config: CardUIConfig;
    private activeCards: Map<string, DialogueCardVisual> = new Map();
    private isVisible: boolean = true;
    private cardQueue: DialogueCard[] = [];

    constructor(scene: Phaser.Scene, x: number = 50, y: number = 50) {
        this.scene = scene;

        this.config = {
            width: 320,
            height: 180,
            padding: 16,
            cardSpacing: 12,
            maxCardsVisible: 3,
            animationDuration: 500,
        };

        this.container = this.scene.add.container(x, y);
        // Asegurar que NO se escale con el zoom de la cámara
        this.container.setScrollFactor(0);
        // Colocar por encima de las barras para máxima prioridad visual y de input
        this.container.setDepth(1002);

        // Subscribe to card system events
        this.setupEventListeners();

        logAutopoiesis.info("DialogueCardUI initialized", {
            position: { x, y },
            config: this.config,
        });
    }

    // Exponer el contenedor para cálculo de bounds y control de input en la UIScene
    public getContainer(): Phaser.GameObjects.Container {
        return this.container;
    }

    /**
   * Setup event listeners for dialogue cards
   */
    private setupEventListeners(): void {
        this.scene.events.on("showDialogueCard", (card: DialogueCard) => {
            this.showCard(card);
        });

        this.scene.events.on("hideDialogueCard", (cardId: string) => {
            this.hideCard(cardId);
        });

        this.scene.events.on("clearDialogueCards", () => {
            this.clearAllCards();
        });

        // Toggle visibility with 'M' key (Messages)
        this.scene.input.keyboard?.on("keydown-M", () => {
            this.toggleVisibility();
        });

        // Close all cards with Escape key
        this.scene.input.keyboard?.on("keydown-ESC", () => {
            this.clearAllCards();
        });
    }

    /**
   * Show a dialogue card with animation
   */
    public showCard(card: DialogueCard): void {
        if (this.activeCards.has(card.id)) {
            // Card already showing, update content
            const existingCard = this.activeCards.get(card.id);
            if (existingCard) {
                existingCard.updateContent(card);
            }
            return;
        }

        // Check if we need to queue the card
        if (this.activeCards.size >= this.config.maxCardsVisible) {
            this.cardQueue.push(card);
            logAutopoiesis.info("Card queued", {
                cardId: card.id,
                queueSize: this.cardQueue.length,
            });
            return;
        }

        const cardVisual = new DialogueCardVisual(this.scene, card, this.config);
        this.activeCards.set(card.id, cardVisual);

        // Position card
        const cardIndex = this.activeCards.size - 1;
        const yPosition =
      cardIndex * (this.config.height + this.config.cardSpacing);
        cardVisual.setPosition(0, yPosition);

        // Add to container with animation
        this.container.add(cardVisual.getContainer());
        cardVisual.animateIn();

        // Setup choice handlers
        cardVisual.onChoiceSelected = (choice: DialogueChoice) => {
            this.handleChoiceSelected(card, choice);
        };

        logAutopoiesis.info("Dialogue card shown", {
            cardId: card.id,
            type: card.type,
            priority: card.priority,
            activeCards: this.activeCards.size,
        });
    }

    /**
   * Hide a specific dialogue card
   */
    public hideCard(cardId: string): void {
        const cardVisual = this.activeCards.get(cardId);
        if (!cardVisual) return;

        cardVisual.animateOut(() => {
            this.container.remove(cardVisual.getContainer());
            cardVisual.destroy();
            this.activeCards.delete(cardId);

            // Reposition remaining cards
            this.repositionCards();

            // Show next card from queue if available
            this.showNextQueuedCard();

            logAutopoiesis.info("Dialogue card hidden", { cardId });
        });
    }

    /**
   * Clear all active cards
   */
    public clearAllCards(): void {
        this.activeCards.forEach((cardVisual) => {
            cardVisual.destroy();
        });
        this.activeCards.clear();
        this.cardQueue = [];
        this.container.removeAll();

        logAutopoiesis.info("All dialogue cards cleared");
    }

    /**
   * Toggle UI visibility
   */
    public toggleVisibility(): void {
        this.isVisible = !this.isVisible;
        this.container.setVisible(this.isVisible);

        logAutopoiesis.info(
            `Dialogue cards ${this.isVisible ? "shown" : "hidden"}`,
        );
    }

    /**
   * Handle choice selection
   */
    private handleChoiceSelected(
        card: DialogueCard,
        choice: DialogueChoice,
    ): void {
    // Emit choice event to be handled by CardDialogueSystem
        this.scene.events.emit("dialogueChoiceSelected", {
            cardId: card.id,
            choice: choice,
            timestamp: Date.now(),
        });

        // Auto-hide card after choice (unless it's a persistent card)
        if (card.type !== "reflection") {
            setTimeout(() => {
                this.hideCard(card.id);
            }, 1000);
        }
    }

    /**
   * Reposition all active cards smoothly
   */
    private repositionCards(): void {
        let index = 0;
        this.activeCards.forEach((cardVisual) => {
            const targetY = index * (this.config.height + this.config.cardSpacing);
            cardVisual.animateToPosition(0, targetY);
            index++;
        });
    }

    /**
   * Show next card from queue
   */
    private showNextQueuedCard(): void {
        if (
            this.cardQueue.length > 0 &&
      this.activeCards.size < this.config.maxCardsVisible
        ) {
            const nextCard = this.cardQueue.shift();
            if (nextCard) {
                this.showCard(nextCard);
            }
        }
    }

    /**
   * Get current stats for debugging
   */
    public getStats(): {
    activeCards: number;
    queuedCards: number;
    visible: boolean;
    } {
        return {
            activeCards: this.activeCards.size,
            queuedCards: this.cardQueue.length,
            visible: this.isVisible,
        };
    }

    /**
   * Cleanup when UI is destroyed
   */
    public destroy(): void {
        this.clearAllCards();
        this.container.destroy();
        this.scene.events.off("showDialogueCard");
        this.scene.events.off("hideDialogueCard");
        this.scene.events.off("clearDialogueCards");

        logAutopoiesis.info("DialogueCardUI destroyed");
    }
}

/**
 * Individual dialogue card visual component
 */
class DialogueCardVisual {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private card: DialogueCard;
    private config: CardUIConfig;
    private background: Phaser.GameObjects.Rectangle;
    private titleText: Phaser.GameObjects.Text;
    private contentText: Phaser.GameObjects.Text;
    private choiceButtons: Phaser.GameObjects.Text[] = [];
    private closeButton?: Phaser.GameObjects.Text;
    public onChoiceSelected?: (choice: DialogueChoice) => void;

    constructor(scene: Phaser.Scene, card: DialogueCard, config: CardUIConfig) {
        this.scene = scene;
        this.card = card;
        this.config = config;
        this.container = scene.add.container(0, 0);

        this.createVisuals();
    }

    /**
   * Create visual elements for the card
   */
    private createVisuals(): void {
    // Card background with rounded corners effect
        this.background = this.scene.add.rectangle(
            this.config.width / 2,
            this.config.height / 2,
            this.config.width,
            this.config.height,
            this.getCardColor(),
            0.92,
        );
        this.background.setStrokeStyle(2, this.getCardBorderColor());
        this.container.add(this.background);

        // Card title
        const titleStyle = {
            fontSize: "16px",
            fontFamily: "Arial",
            color: "#2c3e50",
            fontStyle: "bold",
            wordWrap: { width: this.config.width - this.config.padding * 2 },
        };

        this.titleText = this.scene.add.text(
            this.config.padding,
            this.config.padding,
            this.card.title,
            titleStyle,
        );
        this.container.add(this.titleText);

        // Card content
        const contentStyle = {
            fontSize: "13px",
            fontFamily: "Arial",
            color: "#34495e",
            wordWrap: { width: this.config.width - this.config.padding * 2 },
            lineSpacing: 2,
        };

        this.contentText = this.scene.add.text(
            this.config.padding,
            this.config.padding + 25,
            this.card.content,
            contentStyle,
        );
        this.container.add(this.contentText);

        // Create choice buttons if present
        this.createChoiceButtons();

        // Add priority indicator
        this.addPriorityIndicator();

        // Add emotional tone indicator
        this.addEmotionalIndicator();

        // Botón de cierre visible (×)
        this.closeButton = this.scene.add.text(this.config.width - 18, 6, "×", {
            fontSize: "14px",
            color: "#c0392b",
            fontStyle: "bold",
        });
        this.closeButton.setInteractive({ useHandCursor: true });
        this.closeButton.on("pointerdown", () => {
            // Emitir evento para cerrar esta carta concreta
            this.scene.events.emit("hideDialogueCard", this.card.id);
        });
        this.container.add(this.closeButton);
    }

    /**
   * Create interactive choice buttons
   */
    private createChoiceButtons(): void {
        if (!this.card.choices || this.card.choices.length === 0) return;

        const buttonStartY = this.config.height - 45;
        const buttonSpacing = 80;

        this.card.choices.forEach((choice, index) => {
            const buttonStyle = {
                fontSize: "11px",
                fontFamily: "Arial",
                color: "#27ae60",
                backgroundColor: "#ecf0f1",
                padding: { x: 8, y: 4 },
            };

            const button = this.scene.add.text(
                this.config.padding + index * buttonSpacing,
                buttonStartY,
                choice.text,
                buttonStyle,
            );

            button.setInteractive({ useHandCursor: true });
            button.on("pointerdown", () => {
                if (this.onChoiceSelected) {
                    this.onChoiceSelected(choice);
                }
            });

            button.on("pointerover", () => {
                button.setStyle({ color: "#2ecc71", backgroundColor: "#d5dbdb" });
            });

            button.on("pointerout", () => {
                button.setStyle({ color: "#27ae60", backgroundColor: "#ecf0f1" });
            });

            this.choiceButtons.push(button);
            this.container.add(button);
        });
    }

    /**
   * Add priority indicator
   */
    private addPriorityIndicator(): void {
        const colors = {
            low: 0x95a5a6,
            medium: 0xf39c12,
            high: 0xe74c3c,
            urgent: 0xc0392b,
        } as const;

        const priority = this.card.priority;

        const indicator = this.scene.add.circle(
            this.config.width - 15,
            15,
            6,
            colors[priority] ?? colors.medium,
        );
        this.container.add(indicator);
    }

    /**
   * Add emotional tone indicator
   */
    private addEmotionalIndicator(): void {
        const emotions = {
            happy: "😊",
            sad: "😢",
            worried: "😟",
            excited: "🤩",
            contemplative: "🤔",
            playful: "😄",
        };

        const emoji = emotions[this.card.emotionalTone] || "💭";
        const emotionText = this.scene.add.text(this.config.width - 35, 5, emoji, {
            fontSize: "14px",
        });
        this.container.add(emotionText);
    }

    /**
   * Get card background color based on type
   */
    private getCardColor(): number {
        const colors = {
            mission: 0xe8f8f5, // Light mint
            event: 0xfef9e7, // Light yellow
            memory: 0xf4ecf7, // Light purple
            reflection: 0xeaf2f8, // Light blue
            interaction: 0xfdf2e9, // Light orange
        };
        return colors[this.card.type] || colors.event;
    }

    /**
   * Get card border color based on priority
   */
    private getCardBorderColor(): number {
        const colors = {
            low: 0xbdc3c7,
            medium: 0xf39c12,
            high: 0xe74c3c,
            urgent: 0xc0392b,
        };
        return colors[this.card.priority] || colors.medium;
    }

    /**
   * Update card content
   */
    public updateContent(card: DialogueCard): void {
        this.card = card;
        this.titleText.setText(card.title);
        this.contentText.setText(card.content);
    // Note: For full update, we'd need to recreate choice buttons
    }

    /**
   * Animate card entrance
   */
    public animateIn(): void {
        this.container.setScale(0.8);
        this.container.setAlpha(0);

        this.scene.tweens.add({
            targets: this.container,
            scale: 1,
            alpha: 1,
            duration: this.config.animationDuration,
            ease: "Back.easeOut",
        });
    }

    /**
   * Animate card exit
   */
    public animateOut(callback: () => void): void {
        this.scene.tweens.add({
            targets: this.container,
            scale: 0.8,
            alpha: 0,
            duration: this.config.animationDuration,
            ease: "Power2.easeIn",
            onComplete: callback,
        });
    }

    /**
   * Animate to new position
   */
    public animateToPosition(x: number, y: number): void {
        this.scene.tweens.add({
            targets: this.container,
            x: x,
            y: y,
            duration: this.config.animationDuration * 0.6,
            ease: "Power2.easeOut",
        });
    }

    /**
   * Set position
   */
    public setPosition(x: number, y: number): void {
        this.container.setPosition(x, y);
    }

    /**
   * Get container reference
   */
    public getContainer(): Phaser.GameObjects.Container {
        return this.container;
    }

    /**
   * Destroy card visual
   */
    public destroy(): void {
        this.container.destroy();
    }
}
