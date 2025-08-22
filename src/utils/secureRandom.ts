/**
 * Utilidades para generación segura de números aleatorios
 * Uso de Web Crypto API para seeds criptográficamente seguros
 */

import { logAutopoiesis } from "./logger";

export class SecureRandomGenerator {
    private static instance: SecureRandomGenerator;
    private cryptoAvailable: boolean;

    private constructor() {
    // Verificar disponibilidad de Web Crypto API
        this.cryptoAvailable =
      typeof window !== "undefined" &&
      window.crypto &&
      window.crypto.getRandomValues !== undefined;

        if (!this.cryptoAvailable) {
            logAutopoiesis.warn(
                "Web Crypto API no disponible, usando fallback menos seguro",
            );
        }
    }

    public static getInstance(): SecureRandomGenerator {
        if (!SecureRandomGenerator.instance) {
            SecureRandomGenerator.instance = new SecureRandomGenerator();
        }
        return SecureRandomGenerator.instance;
    }

    /**
   * Genera un seed criptográficamente seguro
   */
    public generateSecureSeed(): string {
        if (this.cryptoAvailable) {
            // Usar Web Crypto API para máxima seguridad
            const array = new Uint32Array(4); // 128 bits de entropía
            window.crypto.getRandomValues(array);

            // Convertir a string hexadecimal
            return Array.from(array, (byte) =>
                byte.toString(16).padStart(8, "0"),
            ).join("");
        } else {
            // Fallback usando múltiples fuentes de entropía
            return this.generateFallbackSeed();
        }
    }

    /**
   * Genera un número entero seguro en un rango
   */
    public secureRandomInt(min: number, max: number): number {
        if (min >= max) {
            throw new Error("min debe ser menor que max");
        }

        const range = max - min;

        if (this.cryptoAvailable) {
            // Usar Web Crypto API
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            return min + (array[0] % range);
        } else {
            // Fallback mejorado
            return min + Math.floor(this.enhancedRandom() * range);
        }
    }

    /**
   * Genera un número flotante seguro entre 0 y 1
   */
    public secureRandomFloat(): number {
        if (this.cryptoAvailable) {
            const array = new Uint32Array(1);
            window.crypto.getRandomValues(array);
            return array[0] / (0xffffffff + 1);
        } else {
            return this.enhancedRandom();
        }
    }

    /**
   * Fallback para cuando Web Crypto API no está disponible
   */
    private generateFallbackSeed(): string {
    // Combinar múltiples fuentes de entropía
        const timestamp = Date.now();
        const performanceNow =
      typeof performance !== "undefined" ? performance.now() : 0;
        const random1 = Math.random();
        const random2 = Math.random();
        const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent.length : 0;

        // Crear hash simple usando múltiples fuentes
        let hash = 0;
        const sources = [timestamp, performanceNow, random1, random2, userAgent];

        for (const source of sources) {
            const str = source.toString();
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash + char) & 0xffffffff;
            }
        }

        // Convertir a hexadecimal con padding adicional
        return (
            Math.abs(hash).toString(16).padStart(8, "0") +
      Date.now().toString(16).padStart(8, "0") +
      Math.floor(Math.random() * 0xffffffff)
          .toString(16)
          .padStart(8, "0")
        );
    }

    /**
   * Generador mejorado para fallback
   */
    private enhancedRandom(): number {
    // Combinar múltiples Math.random() para mejor entropía
        const r1 = Math.random();
        const r2 = Math.random();
        const r3 = Math.random();

        // XOR mixing para mejor distribución
        const combined = (r1 + r2 + r3) / 3;
        return (combined + (Date.now() % 1000) / 1000) % 1;
    }

    /**
   * Validar que un seed tiene suficiente entropía
   */
    public validateSeedEntropy(seed: string): boolean {
        if (seed.length < 16) {
            return false; // Muy corto
        }

        // Verificar que no sea completamente repetitivo
        const uniqueChars = new Set(seed).size;
        if (uniqueChars < 4) {
            return false; // Muy poca variedad
        }

        // Verificar que no sea completamente secuencial
        let sequential = 0;
        for (let i = 1; i < seed.length; i++) {
            const curr = seed.charCodeAt(i);
            const prev = seed.charCodeAt(i - 1);
            if (Math.abs(curr - prev) <= 1) {
                sequential++;
            }
        }

        // Si más del 70% es secuencial, rechazar
        return sequential / seed.length < 0.7;
    }

    /**
   * Generar múltiples seeds para diferentes propósitos
   */
    public generateSeedSet(): {
    terrain: string;
    biomes: string;
    entities: string;
    weather: string;
    } {
        return {
            terrain: this.generateSecureSeed(),
            biomes: this.generateSecureSeed(),
            entities: this.generateSecureSeed(),
            weather: this.generateSecureSeed(),
        };
    }
}

/**
 * Instancia singleton para uso global
 */
export const secureRandom = SecureRandomGenerator.getInstance();
