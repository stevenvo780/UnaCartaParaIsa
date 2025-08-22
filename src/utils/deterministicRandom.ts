/**
 * Sistema de Random Determinístico
 * Reemplaza Math.random() para hacer el juego reproducible y debuggeable
 */

import seedrandom from "seedrandom";
import { logAutopoiesis } from "./logger";

class DeterministicRandom {
    private rng: () => number;
    private currentSeed: string;
    private generationCount: number = 0;

    constructor(seed?: string) {
        this.currentSeed = seed || this.generateDefaultSeed();
        this.rng = seedrandom(this.currentSeed);
        logAutopoiesis.info("DeterministicRandom initialized", {
            seed: this.currentSeed,
            timestamp: new Date().toISOString(),
        });
    }

    /**
   * Genera un número aleatorio entre 0 y 1 (reemplaza Math.random())
   */
    public random(): number {
        this.generationCount++;
        const value = this.rng();

        // Log ocasional para debugging (1 de cada 1000)
        if (this.generationCount % 1000 === 0) {
            logAutopoiesis.debug("Random generation milestone", {
                seed: this.currentSeed,
                count: this.generationCount,
                lastValue: value,
            });
        }

        return value;
    }

    /**
   * Genera un entero aleatorio entre min y max (inclusive)
   */
    public randomInt(min: number, max: number): number {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    /**
   * Genera un float aleatorio entre min y max
   */
    public randomFloat(min: number, max: number): number {
        return this.random() * (max - min) + min;
    }

    /**
   * Selecciona un elemento aleatorio de un array
   */
    public randomChoice<T>(array: T[]): T {
        if (array.length === 0) {
            throw new Error("Cannot choose from empty array");
        }
        const index = this.randomInt(0, array.length - 1);
        return array[index];
    }

    /**
   * Genera un booleano aleatorio con probabilidad opcional
   */
    public randomBool(probability: number = 0.5): boolean {
        return this.random() < probability;
    }

    /**
   * Reinicia el generador con nueva semilla
   */
    public reseed(newSeed?: string): void {
        this.currentSeed = newSeed || this.generateDefaultSeed();
        this.rng = seedrandom(this.currentSeed);
        this.generationCount = 0;

        logAutopoiesis.info("Random generator reseeded", {
            newSeed: this.currentSeed,
        });
    }

    /**
   * Obtiene la semilla actual
   */
    public getCurrentSeed(): string {
        return this.currentSeed;
    }

    /**
   * Obtiene estadísticas del generador
   */
    public getStats(): {
    seed: string;
    generationCount: number;
    isReproducible: boolean;
    } {
        return {
            seed: this.currentSeed,
            generationCount: this.generationCount,
            isReproducible: true,
        };
    }

    /**
   * Genera semilla por defecto basada en fecha pero reproducible
   */
    private generateDefaultSeed(): string {
    // Usar fecha del día para reproducibilidad durante desarrollo
        const today = new Date().toISOString().split("T")[0];
        return `game-seed-${today}`;
    }

    /**
   * Crea un generador hijo con semilla derivada (para subsistemas)
   */
    public createSubGenerator(subsystem: string): DeterministicRandom {
        const childSeed = `${this.currentSeed}-${subsystem}`;
        return new DeterministicRandom(childSeed);
    }
}

// Instancia global del generador
export const gameRandom = new DeterministicRandom();

// Export para casos donde se necesite un generador específico
export { DeterministicRandom };

// Helper functions para migración gradual
export const random = () => gameRandom.random();
export const randomInt = (min: number, max: number) =>
    gameRandom.randomInt(min, max);
export const randomFloat = (min: number, max: number) =>
    gameRandom.randomFloat(min, max);
export const randomChoice = <T>(array: T[]) => gameRandom.randomChoice(array);
export const randomBool = (probability?: number) =>
    gameRandom.randomBool(probability);
