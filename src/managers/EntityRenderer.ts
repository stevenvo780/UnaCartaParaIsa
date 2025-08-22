/**
 * Entity Renderer - Maneja el renderizado específico de entidades
 */

import type { WorldEntity } from "../types/worldEntities";
import { logAutopoiesis } from "../utils/logger";
import { BiomeType } from "../world/types";
import type { AnimationManager } from "./AnimationManager";
import { BiomeManager } from "./BiomeManager";

export class EntityRenderer {
    private scene: Phaser.Scene;
    private animationManager?: AnimationManager;
    private renderedEntities = new Map<string, Phaser.GameObjects.GameObject>();

    constructor(scene: Phaser.Scene, animationManager?: AnimationManager) {
        this.scene = scene;
        this.animationManager = animationManager;
    }

    /**
   * Renderiza una entidad del mundo
   */
    public renderWorldEntity(
        entity: WorldEntity,
        worldWidth: number,
        worldHeight: number,
    ): Phaser.GameObjects.GameObject | null {
    // Determinar bioma para efectos visuales
        const biome = BiomeManager.determineBiome(
            entity.x,
            entity.y,
            worldWidth,
            worldHeight,
        );

        // Intentar crear sprite animado primero
        if (this.animationManager && this.isAnimatedAsset(entity.assetKey)) {
            const animatedSprite = this.animationManager.createAnimatedSprite(
                entity.x,
                entity.y,
                entity.assetKey || "",
            );

            if (animatedSprite) {
                this.applyEntityProperties(animatedSprite, entity, biome);
                this.renderedEntities.set(entity.id, animatedSprite);
                return animatedSprite;
            }
        }

        // Crear sprite estático como fallback
        const sprite = this.createStaticSprite(entity);
        if (sprite) {
            this.applyEntityProperties(sprite, entity, biome);
            this.renderedEntities.set(entity.id, sprite);
        }

        return sprite;
    }

    /**
   * Verifica si un asset es animado
   */
    private isAnimatedAsset(assetKey: string): boolean {
        return (
            assetKey.includes("_anim") ||
      ["campfire", "flag", "pointer", "chicken", "pig", "flowers"].some(
          (animKey) => assetKey.includes(animKey),
      )
        );
    }

    /**
   * Crea un sprite estático
   */
    private createStaticSprite(
        entity: WorldEntity,
    ): Phaser.GameObjects.Sprite | null {
        try {
            // Intentar cargar sprite normal
            if (entity.assetKey && this.scene.textures.exists(entity.assetKey)) {
                return this.scene.add.sprite(entity.x, entity.y, entity.assetKey);
            }

            // Fallback a rectángulo coloreado
            const fallbackColor = this.getFallbackColor(entity.assetKey || "");
            const rect = this.scene.add.rectangle(
                entity.x,
                entity.y,
                16,
                16,
                fallbackColor,
            );

            logAutopoiesis.debug("Fallback rectangle created for missing asset", {
                assetKey: entity.assetKey,
                entityId: entity.id,
            });

            return rect as any; // Cast para compatibilidad
        } catch (error) {
            logAutopoiesis.error("Error creating static sprite", {
                entityId: entity.id,
                assetKey: entity.assetKey,
                error: String(error),
            });
            return null;
        }
    }

    /**
   * Aplica propiedades de la entidad al sprite
   */
    private applyEntityProperties(
        sprite: Phaser.GameObjects.GameObject,
        entity: WorldEntity,
        biome: BiomeType,
    ): void {
    // Aplicar escala si está definida
        if (entity.scale && (sprite as any).setScale) {
            (sprite as any).setScale(entity.scale);
        }

        // Aplicar rotación si está definida
        if (entity.rotation && (sprite as any).setRotation) {
            (sprite as any).setRotation(entity.rotation);
        }

        // Aplicar profundidad si está definida
        if (entity.depth && (sprite as any).setDepth) {
            (sprite as any).setDepth(entity.depth);
        }

        // Aplicar efectos del bioma de forma segura
        try {
            const asSprite = sprite as unknown as Phaser.GameObjects.Sprite;
            if ((asSprite as any).setTint) {
                BiomeManager.applyBiomeEffects(asSprite, biome);
            }
        } catch {}

        // Aplicar propiedades adicionales si existen
        if (entity.metadata) {
            this.applyCustomProperties(sprite, entity.metadata);
        }
    }

    /**
   * Aplica propiedades personalizadas de la entidad
   */
    private applyCustomProperties(
        sprite: Phaser.GameObjects.GameObject,
        properties: Record<string, any>,
    ): void {
        Object.entries(properties).forEach(([key, value]) => {
            if (key === "tint" && (sprite as any).setTint) {
                (sprite as any).setTint(value);
            } else if (key === "alpha" && (sprite as any).setAlpha) {
                (sprite as any).setAlpha(value);
            }
        });
    }

    /**
   * Obtiene color de fallback basado en el tipo de asset
   */
    private getFallbackColor(assetKey: string): number {
        const colorMap: Record<string, number> = {
            tree: 0x228b22,
            grass: 0x90ee90,
            rock: 0x708090,
            water: 0x4169e1,
            flower: 0xff69b4,
            food: 0xffa500,
            building: 0x8b4513,
            decoration: 0x9370db,
        };

        for (const [keyword, color] of Object.entries(colorMap)) {
            if (assetKey.includes(keyword)) {
                return color;
            }
        }

        return 0x808080; // Gris por defecto
    }

    /**
   * Obtiene una entidad renderizada por ID
   */
    public getRenderedEntity(
        entityId: string,
    ): Phaser.GameObjects.GameObject | undefined {
        return this.renderedEntities.get(entityId);
    }

    /**
   * Limpia todas las entidades renderizadas
   */
    public cleanup(): void {
        this.renderedEntities.forEach((gameObject) => {
            if (gameObject && gameObject.active) {
                gameObject.destroy();
            }
        });
        this.renderedEntities.clear();
        logAutopoiesis.info("EntityRenderer cleanup completed");
    }

    /**
   * Obtiene estadísticas de renderizado
   */
    public getStats() {
        return {
            renderedEntities: this.renderedEntities.size,
            hasAnimationManager: !!this.animationManager,
        };
    }
}
