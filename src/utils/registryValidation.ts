/**
 * Validador para datos del registry de Phaser
 * Previene inyección y manipulación de datos críticos del juego
 */

import { logAutopoiesis } from "./logger";
import type { GameState, Zone } from "../types";

export interface RegistryValidationResult<T = Record<string, string | number | boolean>> {
  isValid: boolean;
  data?: T;
  errors: string[];
  sanitizedData?: T;
}

export interface ValidationMapElement {
  id: string;
  type: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  color?: string;
  assetId?: string;
  rotation?: number;
  scale?: number;
}

export interface ValidationWorldConfig {
  seed?: number;
  biomeSettings?: Record<string, string | number | boolean>;
  worldSize?: { width: number; height: number };
  difficulty?: number;
}

export interface GameStateSchema {
  zones: Zone[];
  mapElements: ValidationMapElement[];
  resonance: number;
  worldConfig?: ValidationWorldConfig;
  entities?: Entity[];
}

export class RegistryValidator {
  private static readonly MAX_ZONES = 50;
  private static readonly MAX_MAP_ELEMENTS = 1000;
  private static readonly MAX_STRING_LENGTH = 500;
  private static readonly ALLOWED_ZONE_TYPES = [
    "kitchen",
    "bedroom",
    "living",
    "bathroom",
    "office",
    "gym",
    "library",
    "social",
    "recreation",
    "food",
    "water",
    "shelter",
    "rest",
    "play",
    "comfort",
    "work",
    "energy",
    "hygiene",
    "entertainment",
    "fun",
  ];

  /**
   * Validar datos completos del gameState
   */
  public static validateGameState(
    data: Record<string, string | number | boolean | object | undefined> | null | undefined,
  ): RegistryValidationResult<GameState> {
    const errors: string[] = [];

    if (!data || typeof data !== "object") {
      return {
        isValid: false,
        errors: ["GameState debe ser un objeto válido"],
      };
    }

    const dataObject = data as Record<string, unknown>;

    // Validar zonas
    const zonesResult = this.validateZones(dataObject.zones);
    if (!zonesResult.isValid) {
      errors.push(...zonesResult.errors);
    }

    // Validar elementos del mapa
    const elementsResult = this.validateMapElements(dataObject.mapElements);
    if (!elementsResult.isValid) {
      errors.push(...elementsResult.errors);
    }

    // Validar resonancia
    const resonanceResult = this.validateResonance(dataObject.resonance);
    if (!resonanceResult.isValid) {
      errors.push(...resonanceResult.errors);
    }

    // Crear datos sanitizados
    const sanitizedData: GameState = {
      zones: zonesResult.sanitizedData || [],
      mapElements: elementsResult.sanitizedData || [],
      resonance: resonanceResult.sanitizedData || 0,
      entities: this.sanitizeArray(dataObject.entities, 10), // Máximo 10 entidades
      cycles: 0,
      lastSave: Date.now(),
      togetherTime: 0,
      connectionAnimation: {
        active: false,
        startTime: 0,
        type: "exploration" as const,
      },
      currentConversation: {
        isActive: false,
        participants: [],
        lastSpeaker: null,
        lastDialogue: null,
        startTime: 0,
      },
      terrainTiles: [],
      roads: [],
      objectLayers: [],
      worldSize: { width: 0, height: 0 },
      generatorVersion: "1.0",
    };

    return {
      isValid: errors.length === 0,
      data: sanitizedData,
      errors,
      sanitizedData,
    };
  }

  /**
   * Validar array de zonas
   */
  private static validateZones(zones: any): RegistryValidationResult<Zone[]> {
    const errors: string[] = [];
    const sanitizedZones: Zone[] = [];

    if (!Array.isArray(zones)) {
      return {
        isValid: false,
        errors: ["Zones debe ser un array"],
        sanitizedData: [],
      };
    }

    if (zones.length > this.MAX_ZONES) {
      errors.push(
        `Demasiadas zonas: ${zones.length}, máximo ${this.MAX_ZONES}`,
      );
      zones = zones.slice(0, this.MAX_ZONES); // Truncar
    }

    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i];
      const zoneResult = this.validateSingleZone(zone, i);

      if (zoneResult.isValid && zoneResult.sanitizedData) {
        sanitizedZones.push(zoneResult.sanitizedData);
      } else {
        errors.push(...zoneResult.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitizedZones,
    };
  }

  /**
   * Validar una zona individual
   */
  private static validateSingleZone(
    zone: any,
    index: number,
  ): RegistryValidationResult<Zone> {
    const errors: string[] = [];

    if (!zone || typeof zone !== "object") {
      return {
        isValid: false,
        errors: [`Zona ${index} debe ser un objeto`],
      };
    }

    // Validar ID
    if (typeof zone.id !== "string" || zone.id.length === 0) {
      errors.push(`Zona ${index}: ID inválido`);
    } else if (zone.id.length > this.MAX_STRING_LENGTH) {
      errors.push(`Zona ${index}: ID demasiado largo`);
    }

    // Validar tipo
    if (!this.ALLOWED_ZONE_TYPES.includes(zone.type)) {
      errors.push(`Zona ${index}: Tipo inválido '${zone.type}'`);
    }

    // Validar posición y tamaño
    const positionResult = this.validatePosition(
      zone.position,
      `Zona ${index}`,
    );
    const sizeResult = this.validateSize(zone.size, `Zona ${index}`);
    const boundsResult = this.validateBounds(zone.bounds, `Zona ${index}`);

    errors.push(...positionResult.errors);
    errors.push(...sizeResult.errors);
    errors.push(...boundsResult.errors);

    // Validar propiedades opcionales
    const color = this.sanitizeNumber(zone.color, 0, 0xffffff).toString();

    // Crear zona sanitizada
    const sanitizedZone: Zone = {
      id: this.sanitizeString(zone.id),
      type: this.ALLOWED_ZONE_TYPES.includes(zone.type)
        ? zone.type
        : "recreation",
      name: this.sanitizeString(zone.name),
      bounds: boundsResult.sanitizedData || {
        x: 0,
        y: 0,
        width: 32,
        height: 32,
      },
      color: color,
      attractiveness: this.sanitizeNumber(zone.attractiveness, 0, 100),
      properties: this.sanitizeObject(zone.properties),
    };

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitizedZone,
    };
  }

  /**
   * Validar elementos del mapa
   */
  private static validateMapElements(
    elements: any,
  ): RegistryValidationResult<any[]> {
    const errors: string[] = [];
    const sanitizedElements: any[] = [];

    if (!Array.isArray(elements)) {
      return {
        isValid: true, // No es crítico
        errors: [],
        sanitizedData: [],
      };
    }

    if (elements.length > this.MAX_MAP_ELEMENTS) {
      errors.push(
        `Demasiados elementos del mapa: ${elements.length}, máximo ${this.MAX_MAP_ELEMENTS}`,
      );
      elements = elements.slice(0, this.MAX_MAP_ELEMENTS);
    }

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      if (element && typeof element === "object") {
        sanitizedElements.push({
          id: this.sanitizeString(element.id),
          type: this.sanitizeString(element.type),
          position: this.sanitizePosition(element.position),
          assetKey: this.sanitizeString(element.assetKey),
          properties: this.sanitizeObject(element.properties),
          collides: Boolean(element.collides),
          width: this.sanitizeNumber(element.width, 0, 200),
          height: this.sanitizeNumber(element.height, 0, 200),
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitizedElements,
    };
  }

  /**
   * Validar valor de resonancia
   */
  private static validateResonance(
    resonance: any,
  ): RegistryValidationResult<number> {
    const errors: string[] = [];

    if (typeof resonance !== "number") {
      errors.push("Resonancia debe ser un número");
    }

    if (resonance < 0 || resonance > 1) {
      errors.push("Resonancia debe estar entre 0 y 1");
    }

    if (!Number.isFinite(resonance)) {
      errors.push("Resonancia debe ser un número finito");
    }

    const sanitized = this.sanitizeNumber(resonance, 0, 1);

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitized,
    };
  }

  /**
   * Validar posición
   */
  private static validatePosition(
    position: any,
    context: string,
  ): RegistryValidationResult<{ x: number; y: number }> {
    const errors: string[] = [];

    if (!position || typeof position !== "object") {
      errors.push(`${context}: Posición debe ser un objeto`);
    }

    if (typeof position?.x !== "number" || !Number.isFinite(position.x)) {
      errors.push(`${context}: position.x debe ser un número finito`);
    }

    if (typeof position?.y !== "number" || !Number.isFinite(position.y)) {
      errors.push(`${context}: position.y debe ser un número finito`);
    }

    const sanitizedPosition = {
      x: this.sanitizeNumber(position?.x, -10000, 10000),
      y: this.sanitizeNumber(position?.y, -10000, 10000),
    };

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitizedPosition,
    };
  }

  /**
   * Validar tamaño
   */
  private static validateSize(
    size: any,
    context: string,
  ): RegistryValidationResult<{ width: number; height: number }> {
    const errors: string[] = [];

    if (!size || typeof size !== "object") {
      errors.push(`${context}: Size debe ser un objeto`);
    }

    if (typeof size?.width !== "number" || size.width <= 0) {
      errors.push(`${context}: size.width debe ser un número positivo`);
    }

    if (typeof size?.height !== "number" || size.height <= 0) {
      errors.push(`${context}: size.height debe ser un número positivo`);
    }

    const sanitizedSize = {
      width: this.sanitizeNumber(size?.width, 8, 500),
      height: this.sanitizeNumber(size?.height, 8, 500),
    };

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitizedSize,
    };
  }

  /**
   * Validar bounds
   */
  private static validateBounds(
    bounds: any,
    context: string,
  ): RegistryValidationResult<{
    x: number;
    y: number;
    width: number;
    height: number;
  }> {
    const errors: string[] = [];

    if (!bounds || typeof bounds !== "object") {
      errors.push(`${context}: Bounds debe ser un objeto`);
    }

    const requiredProps = ["x", "y", "width", "height"];
    for (const prop of requiredProps) {
      if (
        typeof bounds?.[prop] !== "number" ||
        !Number.isFinite(bounds[prop])
      ) {
        errors.push(`${context}: bounds.${prop} debe ser un número finito`);
      }
    }

    const sanitizedBounds = {
      x: this.sanitizeNumber(bounds?.x, -10000, 10000),
      y: this.sanitizeNumber(bounds?.y, -10000, 10000),
      width: this.sanitizeNumber(bounds?.width, 8, 500),
      height: this.sanitizeNumber(bounds?.height, 8, 500),
    };

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitizedBounds,
    };
  }

  /**
   * Sanitizar string
   */
  private static sanitizeString(value: any, defaultValue: string = ""): string {
    if (typeof value !== "string") {
      return defaultValue;
    }

    // Remover caracteres peligrosos
    const cleaned = value
      .replace(/[<>"/\\&]/g, "") // Remover caracteres HTML/SQL peligrosos
      .trim()
      .slice(0, this.MAX_STRING_LENGTH);

    return cleaned || defaultValue;
  }

  /**
   * Sanitizar número
   */
  private static sanitizeNumber(
    value: any,
    min: number = 0,
    max: number = 100,
  ): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return min;
    }

    return Math.max(min, Math.min(max, value));
  }

  /**
   * Sanitizar posición
   */
  private static sanitizePosition(position: any): { x: number; y: number } {
    return {
      x: this.sanitizeNumber(position?.x, -10000, 10000),
      y: this.sanitizeNumber(position?.y, -10000, 10000),
    };
  }

  /**
   * Sanitizar objeto genérico
   */
  private static sanitizeObject(
    obj: any,
    maxKeys: number = 20,
  ): Record<string, any> {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      return {};
    }

    const sanitized: Record<string, any> = {};
    const keys = Object.keys(obj).slice(0, maxKeys);

    for (const key of keys) {
      const cleanKey = this.sanitizeString(key);
      if (cleanKey) {
        const value = obj[key];

        if (typeof value === "string") {
          sanitized[cleanKey] = this.sanitizeString(value);
        } else if (typeof value === "number") {
          sanitized[cleanKey] = this.sanitizeNumber(value, -1000000, 1000000);
        } else if (typeof value === "boolean") {
          sanitized[cleanKey] = Boolean(value);
        }
        // Ignorar otros tipos por seguridad
      }
    }

    return sanitized;
  }

  /**
   * Sanitizar array
   */
  private static sanitizeArray(arr: any, maxLength: number = 100): any[] {
    if (!Array.isArray(arr)) {
      return [];
    }

    return arr
      .slice(0, maxLength)
      .filter((item) => item !== null && item !== undefined);
  }
}

/**
 * Función helper para validación rápida del registry
 */
export function safeGetFromRegistry<T = any>(
  scene: Phaser.Scene,
  key: string,
  validator?: (data: any) => RegistryValidationResult<T>,
): T | null {
  try {
    const data = scene.registry.get(key);

    if (!data) {
      return null;
    }

    if (validator) {
      const result = validator(data);
      if (result.isValid && result.sanitizedData) {
        return result.sanitizedData;
      } else {
        logAutopoiesis.warn(`Datos inválidos en registry para clave '${key}'`, {
          errors: result.errors,
        });
        return null;
      }
    }

    return data;
  } catch (error) {
    logAutopoiesis.error(
      `Error al acceder al registry para clave '${key}'`,
      error,
    );
    return null;
  }
}

/**
 * Función helper para establecer datos seguros en el registry
 */
export function safeSetToRegistry<T = any>(
  scene: Phaser.Scene,
  key: string,
  data: T,
  validator?: (data: any) => RegistryValidationResult<T>,
): boolean {
  try {
    let dataToSet = data;

    if (validator) {
      const result = validator(data);
      if (!result.isValid) {
        logAutopoiesis.error(
          `Intentando establecer datos inválidos en registry para clave '${key}'`,
          {
            errors: result.errors,
          },
        );
        return false;
      }
      dataToSet = result.sanitizedData || data;
    }

    scene.registry.set(key, dataToSet);
    return true;
  } catch (error) {
    logAutopoiesis.error(
      `Error al establecer datos en registry para clave '${key}'`,
      error,
    );
    return false;
  }
}
