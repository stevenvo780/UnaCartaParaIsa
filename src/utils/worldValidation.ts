/**
 * Validadores para configuración de mundo y límites de seguridad
 */

import { logAutopoiesis } from "./logger";
import type { WorldGenConfig } from "../world/types";

export interface WorldLimits {
  readonly MAX_WORLD_WIDTH: number;
  readonly MAX_WORLD_HEIGHT: number;
  readonly MAX_TOTAL_TILES: number;
  readonly MIN_WORLD_SIZE: number;
  readonly MAX_BIOMES: number;
  readonly MAX_ASSET_LAYERS: number;
  readonly MAX_NOISE_OCTAVES: number;
}

export const WORLD_LIMITS: WorldLimits = {
    MAX_WORLD_WIDTH: 1000,
    MAX_WORLD_HEIGHT: 1000,
    MAX_TOTAL_TILES: 500000, // 500k tiles máximo
    MIN_WORLD_SIZE: 16,
    MAX_BIOMES: 10,
    MAX_ASSET_LAYERS: 20,
    MAX_NOISE_OCTAVES: 8,
} as const;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedConfig?: WorldGenConfig;
}

export class WorldConfigValidator {
    /**
   * Validar configuración completa de mundo
   */
    public static validateWorldConfig(config: WorldGenConfig): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Crear copia para sanitización
        const sanitized = { ...config };

        // Validar dimensiones
        const dimensionResult = this.validateDimensions(sanitized);
        errors.push(...dimensionResult.errors);
        warnings.push(...dimensionResult.warnings);

        // Validar configuración de ruido
        const noiseResult = this.validateNoiseConfig(sanitized);
        errors.push(...noiseResult.errors);
        warnings.push(...noiseResult.warnings);

        // Validar biomas
        const biomeResult = this.validateBiomeConfig(sanitized);
        errors.push(...biomeResult.errors);
        warnings.push(...biomeResult.warnings);

        // Validar seed
        const seedResult = this.validateSeed(sanitized);
        errors.push(...seedResult.errors);
        warnings.push(...seedResult.warnings);

        const isValid = errors.length === 0;

        if (!isValid) {
            logAutopoiesis.error("❌ Configuración de mundo inválida", {
                errors,
                warnings,
                config: sanitized,
            });
        } else if (warnings.length > 0) {
            logAutopoiesis.warn("⚠️ Advertencias en configuración de mundo", {
                warnings,
                config: sanitized,
            });
        }

        return {
            isValid,
            errors,
            warnings,
            sanitizedConfig: isValid ? sanitized : undefined,
        };
    }

    /**
   * Validar dimensiones del mundo
   */
    private static validateDimensions(config: WorldGenConfig): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validar ancho
        if (
            !Number.isInteger(config.width) ||
      config.width < WORLD_LIMITS.MIN_WORLD_SIZE
        ) {
            errors.push(`Ancho debe ser entero >= ${WORLD_LIMITS.MIN_WORLD_SIZE}`);
        } else if (config.width > WORLD_LIMITS.MAX_WORLD_WIDTH) {
            errors.push(
                `Ancho excede límite máximo de ${WORLD_LIMITS.MAX_WORLD_WIDTH}`,
            );
        }

        // Validar alto
        if (
            !Number.isInteger(config.height) ||
      config.height < WORLD_LIMITS.MIN_WORLD_SIZE
        ) {
            errors.push(`Alto debe ser entero >= ${WORLD_LIMITS.MIN_WORLD_SIZE}`);
        } else if (config.height > WORLD_LIMITS.MAX_WORLD_HEIGHT) {
            errors.push(
                `Alto excede límite máximo de ${WORLD_LIMITS.MAX_WORLD_HEIGHT}`,
            );
        }

        // Validar total de tiles
        const totalTiles = config.width * config.height;
        if (totalTiles > WORLD_LIMITS.MAX_TOTAL_TILES) {
            errors.push(
                `Total de tiles (${totalTiles}) excede límite máximo (${WORLD_LIMITS.MAX_TOTAL_TILES})`,
            );
        }

        // Advertir sobre mundos muy grandes
        if (totalTiles > 100000) {
            warnings.push(
                `Mundo grande (${totalTiles} tiles) puede afectar rendimiento`,
            );
        }

        // Validar tileSize
        if (
            !Number.isInteger(config.tileSize) ||
      config.tileSize < 8 ||
      config.tileSize > 128
        ) {
            errors.push("tileSize debe ser entero entre 8 y 128");
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    /**
   * Validar configuración de ruido
   */
    private static validateNoiseConfig(config: WorldGenConfig): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        const noiseTypes = ["temperature", "moisture", "elevation"] as const;

        for (const noiseType of noiseTypes) {
            const noise = config.noise[noiseType];

            if (!noise) {
                errors.push(`Configuración de ruido '${noiseType}' faltante`);
                continue;
            }

            // Validar escala
            if (
                typeof noise.scale !== "number" ||
        noise.scale <= 0 ||
        noise.scale > 1
            ) {
                errors.push(`${noiseType}.scale debe ser número entre 0 y 1`);
            }

            // Validar octavas
            if (
                !Number.isInteger(noise.octaves) ||
        noise.octaves < 1 ||
        noise.octaves > WORLD_LIMITS.MAX_NOISE_OCTAVES
            ) {
                errors.push(
                    `${noiseType}.octaves debe ser entero entre 1 y ${WORLD_LIMITS.MAX_NOISE_OCTAVES}`,
                );
            }

            // Validar persistencia
            if (
                typeof noise.persistence !== "number" ||
        noise.persistence <= 0 ||
        noise.persistence > 1
            ) {
                errors.push(`${noiseType}.persistence debe ser número entre 0 y 1`);
            }

            // Validar lacunaridad
            if (
                typeof noise.lacunarity !== "number" ||
        noise.lacunarity < 1 ||
        noise.lacunarity > 4
            ) {
                errors.push(`${noiseType}.lacunarity debe ser número entre 1 y 4`);
            }

            // Advertir sobre configuraciones que pueden ser problemáticas
            if (noise.octaves > 6) {
                warnings.push(
                    `${noiseType} tiene muchas octavas (${noise.octaves}), puede ser lento`,
                );
            }
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    /**
   * Validar configuración de biomas
   */
    private static validateBiomeConfig(config: WorldGenConfig): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!config.biomes) {
            errors.push("Configuración de biomas faltante");
            return { isValid: false, errors, warnings };
        }

        // Validar biomas habilitados
        if (!Array.isArray(config.biomes.enabled)) {
            errors.push("biomes.enabled debe ser un array");
        } else {
            if (config.biomes.enabled.length === 0) {
                errors.push("Debe haber al menos un bioma habilitado");
            }

            if (config.biomes.enabled.length > WORLD_LIMITS.MAX_BIOMES) {
                errors.push(
                    `Demasiados biomas (${config.biomes.enabled.length}), máximo ${WORLD_LIMITS.MAX_BIOMES}`,
                );
            }
        }

        // Validar spawns forzados
        if (config.biomes.forceSpawn) {
            if (!Array.isArray(config.biomes.forceSpawn)) {
                errors.push("biomes.forceSpawn debe ser un array");
            } else {
                for (let i = 0; i < config.biomes.forceSpawn.length; i++) {
                    const spawn = config.biomes.forceSpawn[i];

                    if (
                        !spawn.biome ||
            !spawn.position ||
            typeof spawn.radius !== "number"
                    ) {
                        errors.push(`forceSpawn[${i}] debe tener biome, position y radius`);
                    }

                    if (spawn.radius < 1 || spawn.radius > 50) {
                        errors.push(`forceSpawn[${i}].radius debe estar entre 1 y 50`);
                    }

                    if (
                        spawn.position.x < 0 ||
            spawn.position.x >= config.width ||
            spawn.position.y < 0 ||
            spawn.position.y >= config.height
                    ) {
                        errors.push(`forceSpawn[${i}].position fuera de límites del mundo`);
                    }
                }
            }
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    /**
   * Validar seed
   */
    private static validateSeed(config: WorldGenConfig): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (typeof config.seed !== "number") {
            errors.push("Seed debe ser un número");
        } else {
            if (!Number.isInteger(config.seed)) {
                warnings.push(
                    "Seed no es entero, puede causar comportamiento impredecible",
                );
            }

            if (config.seed < 0) {
                errors.push("Seed debe ser positivo");
            }

            if (config.seed > Number.MAX_SAFE_INTEGER) {
                errors.push("Seed excede valor máximo seguro");
            }
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    /**
   * Sanitizar configuración aplicando límites seguros
   */
    public static sanitizeConfig(config: WorldGenConfig): WorldGenConfig {
        const sanitized = { ...config };

        // Aplicar límites de dimensiones
        sanitized.width = Math.max(
            WORLD_LIMITS.MIN_WORLD_SIZE,
            Math.min(WORLD_LIMITS.MAX_WORLD_WIDTH, Math.floor(config.width)),
        );
        sanitized.height = Math.max(
            WORLD_LIMITS.MIN_WORLD_SIZE,
            Math.min(WORLD_LIMITS.MAX_WORLD_HEIGHT, Math.floor(config.height)),
        );

        // Verificar límite total de tiles
        if (sanitized.width * sanitized.height > WORLD_LIMITS.MAX_TOTAL_TILES) {
            const ratio = Math.sqrt(
                WORLD_LIMITS.MAX_TOTAL_TILES / (sanitized.width * sanitized.height),
            );
            sanitized.width = Math.floor(sanitized.width * ratio);
            sanitized.height = Math.floor(sanitized.height * ratio);
        }

        // Sanitizar tileSize
        sanitized.tileSize = Math.max(
            8,
            Math.min(128, Math.floor(config.tileSize)),
        );

        // Sanitizar seed
        if (typeof config.seed !== "number" || config.seed < 0) {
            sanitized.seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        }

        // Sanitizar configuración de ruido
        const noiseTypes = ["temperature", "moisture", "elevation"] as const;
        for (const noiseType of noiseTypes) {
            const noise = sanitized.noise[noiseType];
            if (noise) {
                noise.scale = Math.max(0.001, Math.min(1, noise.scale));
                noise.octaves = Math.max(
                    1,
                    Math.min(WORLD_LIMITS.MAX_NOISE_OCTAVES, Math.floor(noise.octaves)),
                );
                noise.persistence = Math.max(0.1, Math.min(1, noise.persistence));
                noise.lacunarity = Math.max(1, Math.min(4, noise.lacunarity));
            }
        }

        return sanitized;
    }
}

/**
 * Función de conveniencia para validación rápida
 */
export function validateAndSanitizeWorldConfig(
    config: WorldGenConfig,
): ValidationResult {
    // Primero sanitizar
    const sanitized = WorldConfigValidator.sanitizeConfig(config);

    // Luego validar
    const result = WorldConfigValidator.validateWorldConfig(sanitized);

    return {
        ...result,
        sanitizedConfig: sanitized,
    };
}
