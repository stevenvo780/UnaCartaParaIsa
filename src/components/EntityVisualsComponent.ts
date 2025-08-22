/**
 * Componente para manejar la visualización de una entidad
 * Separa la lógica visual del GameEntity
 */

import type Phaser from "phaser";
import type { MoodType } from "../types";
import { GAME_BALANCE } from "../config/gameConfig";

export class EntityVisualsComponent {
    private sprite: Phaser.Physics.Arcade.Sprite;
    private currentSprite: string;
    private pulsePhase = 0;

    constructor(
        sprite: Phaser.Physics.Arcade.Sprite,
        _entityId: "isa" | "stev",
        initialSprite: string,
    ) {
        this.sprite = sprite;
        this.currentSprite = initialSprite;

        this.setupVisuals();
    }

    /**
   * Configura los visuales iniciales
   */
    private setupVisuals(): void {
        this.sprite.setScale(GAME_BALANCE.VISUALS.ENTITY_SCALE);
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setInteractive();

        // Configuración de físicas
        if (this.sprite.body) {
            this.sprite.body.setSize(
                this.sprite.width * 0.6,
                this.sprite.height * 0.8,
            );
            this.sprite.body.setOffset(
                this.sprite.width * 0.2,
                this.sprite.height * 0.1,
            );
        }
    }

    /**
   * Actualiza el sprite visual
   */
    setSprite(spriteKey: string): void {
        if (this.currentSprite !== spriteKey) {
            this.currentSprite = spriteKey;
            this.sprite.setTexture(spriteKey);
        }
    }

    /**
   * Actualiza el tinte basado en el mood
   */
    updateMoodVisuals(mood: MoodType): void {
        const moodColors = {
            "😊": 0x90ee90, // Light Green
            "😢": 0x4682b4, // Steel Blue
            "😡": 0xff6347, // Tomato
            "😌": 0xdda0dd, // Plum
            "🤩": 0xffd700, // Gold
            "😑": 0x808080, // Gray
            "😔": 0x483d8b, // Dark Slate Blue
            "😰": 0xff4500, // Orange Red
            "😴": 0x6a5acd, // Slate Blue
        };

        const tint = moodColors[mood] || 0xffffff;
        this.sprite.setTint(tint);
    }

    /**
   * Aplica efecto de pulso
   */
    updatePulseEffect(deltaTime: number): void {
        this.pulsePhase += deltaTime * 0.002;
        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.1;
        this.sprite.setScale(GAME_BALANCE.VISUALS.ENTITY_SCALE * pulseScale);
    }

    /**
   * Actualiza la posición visual
   */
    updatePosition(x: number, y: number): void {
        this.sprite.setPosition(x, y);
    }

    /**
   * Obtiene la posición actual
   */
    getPosition(): { x: number; y: number } {
        return {
            x: this.sprite.x,
            y: this.sprite.y,
        };
    }

    /**
   * Establece la velocidad del sprite
   */
    setVelocity(x: number, y: number): void {
        if (this.sprite.body && "setVelocity" in this.sprite.body) {
            this.sprite.body.setVelocity(x, y);
        }
    }

    /**
   * Obtiene el sprite actual
   */
    getCurrentSprite(): string {
        return this.currentSprite;
    }

    /**
   * Limpia los recursos visuales
   */
    cleanup(): void {
        this.sprite.removeInteractive();
    }
}
