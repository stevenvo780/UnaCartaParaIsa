/**
 * Sistema de Ciclo Día/Noche para "Una Carta Para Isa"
 * Implementa un ciclo realista que afecta las necesidades y comportamientos
 */

import Phaser from "phaser";
import type { GameState } from "../types";
import { logAutopoiesis } from "../utils/logger";
import type { NeedsSystem } from "./NeedsSystem";

export interface TimeOfDay {
  hour: number; // 0-23
  minute: number; // 0-59
  phase:
    | "dawn"
    | "morning"
    | "midday"
    | "afternoon"
    | "dusk"
    | "night"
    | "deep_night";
  lightLevel: number; // 0-1 (0 = darkness, 1 = bright daylight)
  temperature: number; // -10 to 40 degrees Celsius
  timestamp: number;
}

export interface WeatherCondition {
  type: "clear" | "cloudy" | "rainy" | "stormy" | "foggy" | "snowy";
  intensity: number; // 0-1
  visibility: number; // 0-1 (how far entities can see)
  comfort: number; // -1 to 1 (how comfortable it is to be outside)
  duration: number; // milliseconds remaining
}

export interface EnvironmentalEffects {
  needsMultipliers: {
    hunger: number;
    thirst: number;
    energy: number;
    mentalHealth: number;
  };
  movementSpeed: number; // multiplier for movement speed
  visionRange: number; // multiplier for vision range
  socialMood: number; // bonus/penalty to social interactions
}

export class DayNightSystem {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private needsSystem: NeedsSystem;

  // Time configuration
  private timeConfig = {
    minutesPerGameHour: 2, // Real minutes for 1 game hour (720 minutes = 12 hours for full day)
    startHour: 6, // Game starts at 6 AM
    startMinute: 0,
  };

  // Current state
  private currentTime: TimeOfDay;
  private currentWeather: WeatherCondition;
  private lastTimeUpdate = 0;
  private lastWeatherChange = 0;

  // Visual effects
  private lightingOverlay?: Phaser.GameObjects.Rectangle;
  private weatherParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private ambientLight = { r: 255, g: 255, b: 255, alpha: 1 };

  // Time progression intervals
  private readonly TIME_UPDATE_INTERVAL = 1000; // Update every second
  private readonly WEATHER_CHANGE_INTERVAL = 300000; // Weather can change every 5 minutes
  private readonly WEATHER_DURATION_MIN = 180000; // Minimum 3 minutes
  private readonly WEATHER_DURATION_MAX = 900000; // Maximum 15 minutes

  constructor(
    scene: Phaser.Scene,
    gameState: GameState,
    needsSystem: NeedsSystem,
  ) {
    this.scene = scene;
    this.gameState = gameState;
    this.needsSystem = needsSystem;

    // Initialize with starting time
    this.currentTime = this.createInitialTime();
    this.currentWeather = this.createInitialWeather();

    this.setupVisualEffects();

    logAutopoiesis.info("🌅 Sistema Día/Noche inicializado", {
      startTime: this.getTimeString(),
      weather: this.currentWeather.type,
      dayDuration: `${this.timeConfig.minutesPerGameHour * 24} minutos reales`,
    });
  }

  /**
   * Crear tiempo inicial
   */
  private createInitialTime(): TimeOfDay {
    return {
      hour: this.timeConfig.startHour,
      minute: this.timeConfig.startMinute,
      phase: this.getPhaseFromTime(this.timeConfig.startHour),
      lightLevel: this.calculateLightLevel(this.timeConfig.startHour),
      temperature: this.calculateTemperature(
        this.timeConfig.startHour,
        "clear",
      ),
      timestamp: Date.now(),
    };
  }

  /**
   * Crear clima inicial
   */
  private createInitialWeather(): WeatherCondition {
    return {
      type: "clear",
      intensity: 0.2,
      visibility: 1.0,
      comfort: 0.8,
      duration:
        this.WEATHER_DURATION_MIN +
        Math.random() * (this.WEATHER_DURATION_MAX - this.WEATHER_DURATION_MIN),
    };
  }

  /**
   * Actualizar sistema de tiempo
   */
  public update(): void {
    const now = Date.now();

    // Actualizar tiempo
    if (now - this.lastTimeUpdate > this.TIME_UPDATE_INTERVAL) {
      this.updateTime();
      this.lastTimeUpdate = now;
    }

    // Actualizar clima
    if (
      now - this.lastWeatherChange > this.WEATHER_CHANGE_INTERVAL &&
      this.shouldChangeWeather()
    ) {
      this.updateWeather();
      this.lastWeatherChange = now;
    }

    // Actualizar efectos visuales
    this.updateVisualEffects();

    // Aplicar efectos ambientales a las entidades
    this.applyEnvironmentalEffects();
  }

  /**
   * Actualizar tiempo del juego
   */
  private updateTime(): void {
    // Calcular cuántos minutos de juego han pasado
    const realMinutesPerGameMinute = this.timeConfig.minutesPerGameHour / 60;
    const realMillisPerGameMinute = realMinutesPerGameMinute * 60 * 1000;

    const timeSinceLastUpdate = Date.now() - this.currentTime.timestamp;
    const gameMinutesToAdd = Math.floor(
      timeSinceLastUpdate / realMillisPerGameMinute,
    );

    if (gameMinutesToAdd > 0) {
      this.currentTime.minute += gameMinutesToAdd;

      // Manejar overflow de minutos
      if (this.currentTime.minute >= 60) {
        const hoursToAdd = Math.floor(this.currentTime.minute / 60);
        this.currentTime.minute = this.currentTime.minute % 60;
        this.currentTime.hour = (this.currentTime.hour + hoursToAdd) % 24;
      }

      // Actualizar propiedades derivadas
      this.currentTime.phase = this.getPhaseFromTime(this.currentTime.hour);
      this.currentTime.lightLevel = this.calculateLightLevel(
        this.currentTime.hour,
      );
      this.currentTime.temperature = this.calculateTemperature(
        this.currentTime.hour,
        this.currentWeather.type,
      );
      this.currentTime.timestamp = Date.now();

      // Emitir evento de cambio de tiempo
      this.scene.events.emit("timeChanged", this.currentTime);

      // Log cambios importantes
      if (gameMinutesToAdd > 0 && this.currentTime.minute % 30 === 0) {
        logAutopoiesis.info(`🕐 Tiempo: ${this.getTimeString()}`, {
          phase: this.currentTime.phase,
          temperature: `${this.currentTime.temperature}°C`,
          lightLevel: `${Math.round(this.currentTime.lightLevel * 100)}%`,
        });
      }
    }
  }

  /**
   * Obtener fase del día según la hora
   */
  private getPhaseFromTime(hour: number): TimeOfDay["phase"] {
    if (hour >= 5 && hour < 7) return "dawn";
    if (hour >= 7 && hour < 11) return "morning";
    if (hour >= 11 && hour < 15) return "midday";
    if (hour >= 15 && hour < 18) return "afternoon";
    if (hour >= 18 && hour < 21) return "dusk";
    if (hour >= 21 && hour < 23) return "night";
    return "deep_night";
  }

  /**
   * Calcular nivel de luz según la hora
   */
  private calculateLightLevel(hour: number): number {
    // Curva suave de luz durante el día
    if (hour >= 6 && hour <= 18) {
      // Día: 6 AM a 6 PM
      const dayProgress = (hour - 6) / 12;
      return Math.sin(dayProgress * Math.PI) * 0.8 + 0.2; // 0.2 a 1.0
    } else {
      // Noche: 6 PM a 6 AM
      const nightHour = hour > 18 ? hour - 18 : hour + 6;
      return Math.max(0.05, 0.3 - (nightHour / 12) * 0.25); // 0.05 a 0.3
    }
  }

  /**
   * Calcular temperatura según hora y clima
   */
  private calculateTemperature(
    hour: number,
    weatherType: WeatherCondition["type"],
  ): number {
    // Temperatura base según la hora (ciclo diario)
    const baseTemp = 15 + Math.sin(((hour - 6) / 24) * 2 * Math.PI) * 10; // 5°C a 25°C

    // Modificadores por clima
    const weatherModifiers = {
      clear: 0,
      cloudy: -3,
      rainy: -5,
      stormy: -7,
      foggy: -2,
      snowy: -12,
    };

    return Math.round(baseTemp + weatherModifiers[weatherType]);
  }

  /**
   * Verificar si debe cambiar el clima
   */
  private shouldChangeWeather(): boolean {
    this.currentWeather.duration -= this.TIME_UPDATE_INTERVAL;
    return this.currentWeather.duration <= 0;
  }

  /**
   * Actualizar clima
   */
  private updateWeather(): void {
    const weatherTypes: WeatherCondition["type"][] = [
      "clear",
      "cloudy",
      "rainy",
      "stormy",
      "foggy",
    ];

    // Probabilidades basadas en la estación y hora
    const weatherProbabilities = this.getWeatherProbabilities();

    // Seleccionar nuevo clima
    let newWeatherType = this.currentWeather.type;
    const rand = Math.random();
    let cumulative = 0;

    for (const [weather, probability] of Object.entries(weatherProbabilities)) {
      cumulative += probability;
      if (rand <= cumulative) {
        newWeatherType = weather as WeatherCondition["type"];
        break;
      }
    }

    // Evitar cambios demasiado abruptos
    if (this.isAbruptWeatherChange(this.currentWeather.type, newWeatherType)) {
      newWeatherType = this.getTransitionWeather(
        this.currentWeather.type,
        newWeatherType,
      );
    }

    this.currentWeather = {
      type: newWeatherType,
      intensity: this.calculateWeatherIntensity(newWeatherType),
      visibility: this.calculateVisibility(newWeatherType),
      comfort: this.calculateComfort(
        newWeatherType,
        this.currentTime.temperature,
      ),
      duration:
        this.WEATHER_DURATION_MIN +
        Math.random() * (this.WEATHER_DURATION_MAX - this.WEATHER_DURATION_MIN),
    };

    // Recalcular temperatura con nuevo clima
    this.currentTime.temperature = this.calculateTemperature(
      this.currentTime.hour,
      this.currentWeather.type,
    );

    // Emitir evento de cambio de clima
    this.scene.events.emit("weatherChanged", this.currentWeather);

    logAutopoiesis.info(`🌤️ Clima cambió a: ${this.currentWeather.type}`, {
      intensity: Math.round(this.currentWeather.intensity * 100),
      visibility: Math.round(this.currentWeather.visibility * 100),
      comfort: Math.round(this.currentWeather.comfort * 100),
      temperature: `${this.currentTime.temperature}°C`,
    });
  }

  /**
   * Obtener probabilidades de clima según contexto
   */
  private getWeatherProbabilities(): Record<string, number> {
    const base = {
      clear: 0.4,
      cloudy: 0.3,
      rainy: 0.15,
      stormy: 0.05,
      foggy: 0.1,
    };

    // Ajustar según la hora (más lluvia por la noche)
    if (
      this.currentTime.phase === "night" ||
      this.currentTime.phase === "deep_night"
    ) {
      base.rainy += 0.1;
      base.foggy += 0.1;
      base.clear -= 0.2;
    }

    return base;
  }

  /**
   * Verificar si un cambio de clima es muy abrupto
   */
  private isAbruptWeatherChange(current: string, next: string): boolean {
    const abruptChanges = [
      ["clear", "stormy"],
      ["clear", "rainy"],
      ["stormy", "clear"],
    ];

    return abruptChanges.some(
      ([from, to]) =>
        (current === from && next === to) || (current === to && next === from),
    );
  }

  /**
   * Obtener clima de transición
   */
  private getTransitionWeather(
    current: string,
    target: string,
  ): WeatherCondition["type"] {
    if (
      (current === "clear" && target === "stormy") ||
      (current === "stormy" && target === "clear")
    ) {
      return "cloudy";
    }
    if (
      (current === "clear" && target === "rainy") ||
      (current === "rainy" && target === "clear")
    ) {
      return "cloudy";
    }
    return target as WeatherCondition["type"];
  }

  /**
   * Calcular intensidad del clima
   */
  private calculateWeatherIntensity(
    weatherType: WeatherCondition["type"],
  ): number {
    const intensities = {
      clear: 0.1,
      cloudy: 0.3,
      foggy: 0.4,
      rainy: 0.5 + Math.random() * 0.4,
      stormy: 0.7 + Math.random() * 0.3,
      snowy: 0.6 + Math.random() * 0.3,
    };

    return intensities[weatherType];
  }

  /**
   * Calcular visibilidad según clima
   */
  private calculateVisibility(weatherType: WeatherCondition["type"]): number {
    const baseVisibility = {
      clear: 1.0,
      cloudy: 0.9,
      rainy: 0.6,
      stormy: 0.4,
      foggy: 0.3,
      snowy: 0.5,
    };

    return baseVisibility[weatherType] * this.currentTime.lightLevel;
  }

  /**
   * Calcular confort según clima y temperatura
   */
  private calculateComfort(
    weatherType: WeatherCondition["type"],
    temperature: number,
  ): number {
    let comfort = 0;

    // Comfort base por temperatura
    if (temperature >= 18 && temperature <= 24) {
      comfort = 1.0; // Temperatura ideal
    } else if (temperature >= 15 && temperature <= 28) {
      comfort = 0.7; // Buena
    } else if (temperature >= 10 && temperature <= 32) {
      comfort = 0.4; // Aceptable
    } else {
      comfort = 0.1; // Incómoda
    }

    // Modificadores por clima
    const weatherComfort = {
      clear: 0,
      cloudy: -0.1,
      rainy: -0.4,
      stormy: -0.7,
      foggy: -0.2,
      snowy: -0.5,
    };

    return Math.max(-1, Math.min(1, comfort + weatherComfort[weatherType]));
  }

  /**
   * Configurar efectos visuales
   */
  private setupVisualEffects(): void {
    // Overlay de iluminación
    this.lightingOverlay = this.scene.add.rectangle(
      0,
      0,
      this.scene.scale.width * 2,
      this.scene.scale.height * 2,
      0x000000,
      0.3,
    );
    this.lightingOverlay.setOrigin(0, 0);
    this.lightingOverlay.setScrollFactor(0);
    this.lightingOverlay.setDepth(100);
    this.lightingOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  /**
   * Actualizar efectos visuales
   */
  private updateVisualEffects(): void {
    if (!this.lightingOverlay) return;

    // Calcular color de iluminación ambiental
    const lightness = this.currentTime.lightLevel;
    const weather = this.currentWeather;

    // Color base según hora del día
    let r = 255,
      g = 255,
      b = 255;

    if (this.currentTime.phase === "dawn") {
      r = 255;
      g = 200;
      b = 150; // Luz dorada del amanecer
    } else if (this.currentTime.phase === "dusk") {
      r = 255;
      g = 150;
      b = 100; // Luz rojiza del atardecer
    } else if (
      this.currentTime.phase === "night" ||
      this.currentTime.phase === "deep_night"
    ) {
      r = 100;
      g = 120;
      b = 200; // Luz azulada de la noche
    }

    // Modificar según clima
    if (weather.type === "rainy" || weather.type === "stormy") {
      r *= 0.7;
      g *= 0.8;
      b *= 0.9; // Más azul/gris
    } else if (weather.type === "foggy") {
      r *= 0.9;
      g *= 0.9;
      b *= 0.9; // Más gris
    }

    // Calcular alpha del overlay (más oscuro = más alpha)
    const alpha = Math.max(0, 1 - lightness) * 0.6;

    // Aplicar color
    const color = Phaser.Display.Color.GetColor(
      Math.round(r),
      Math.round(g),
      Math.round(b),
    );
    this.lightingOverlay.setFillStyle(color, alpha);

    this.ambientLight = {
      r: Math.round(r),
      g: Math.round(g),
      b: Math.round(b),
      alpha,
    };
  }

  /**
   * Aplicar efectos ambientales a las entidades
   */
  private applyEnvironmentalEffects(): void {
    const effects = this.calculateEnvironmentalEffects();

    // Aplicar efectos a todas las entidades registradas
    ["isa", "stev"].forEach((entityId) => {
      this.applyEffectsToEntity(entityId, effects);
    });
  }

  /**
   * Calcular efectos ambientales actuales
   */
  private calculateEnvironmentalEffects(): EnvironmentalEffects {
    const time = this.currentTime;
    const weather = this.currentWeather;

    const effects: EnvironmentalEffects = {
      needsMultipliers: {
        hunger: 1.0,
        thirst: 1.0,
        energy: 1.0,
        mentalHealth: 1.0,
      },
      movementSpeed: 1.0,
      visionRange: weather.visibility,
      socialMood: weather.comfort * 0.5,
    };

    // Efectos por hora del día
    if (time.phase === "night" || time.phase === "deep_night") {
      effects.needsMultipliers.energy *= 1.3; // Más cansancio por la noche
      effects.movementSpeed *= 0.9; // Movimiento más lento
    } else if (time.phase === "midday") {
      effects.needsMultipliers.thirst *= 1.2; // Más sed al mediodía
    }

    // Efectos por clima
    if (weather.type === "rainy" || weather.type === "stormy") {
      effects.needsMultipliers.mentalHealth *= 1.1; // Más impacto mental
      effects.movementSpeed *= 0.8; // Movimiento más lento bajo lluvia
    }

    if (weather.type === "clear" && time.phase === "morning") {
      effects.needsMultipliers.mentalHealth *= 0.9; // Mejora el ánimo
      effects.socialMood += 0.2;
    }

    return effects;
  }

  /**
   * Aplicar efectos a una entidad específica
   */
  private applyEffectsToEntity(
    entityId: string,
    effects: EnvironmentalEffects,
  ): void {
    // Los efectos se aplicarán a través del NeedsSystem
    const entityNeeds = this.needsSystem.getEntityNeeds(entityId);
    if (!entityNeeds) return;

    // Aplicar multiplicadores de necesidades como modificadores temporales
    Object.entries(effects.needsMultipliers).forEach(
      ([needType, multiplier]) => {
        if (multiplier !== 1.0) {
          const modification = (multiplier - 1.0) * 2; // Convertir a cambio absoluto pequeño
          this.needsSystem.modifyEntityNeed(entityId, needType, modification);
        }
      },
    );
  }

  /**
   * Obtener información actual del tiempo
   */
  public getCurrentTime(): TimeOfDay {
    return { ...this.currentTime };
  }

  /**
   * Obtener información detallada del tiempo (alias para compatibilidad)
   */
  public getCurrentTimeInfo(): TimeOfDay & {
    weather: WeatherCondition;
    effects: EnvironmentalEffects;
  } {
    return {
      ...this.currentTime,
      weather: this.getCurrentWeather(),
      effects: this.getCurrentEffects(),
    };
  }

  /**
   * Obtener información actual del clima
   */
  public getCurrentWeather(): WeatherCondition {
    return { ...this.currentWeather };
  }

  /**
   * Obtener string formateado del tiempo
   */
  public getTimeString(): string {
    const h = this.currentTime.hour.toString().padStart(2, "0");
    const m = this.currentTime.minute.toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  /**
   * Obtener efectos ambientales actuales
   */
  public getCurrentEffects(): EnvironmentalEffects {
    return this.calculateEnvironmentalEffects();
  }

  /**
   * Establecer tiempo específico (para testing)
   */
  public setTime(hour: number, minute: number = 0): void {
    this.currentTime.hour = Math.max(0, Math.min(23, hour));
    this.currentTime.minute = Math.max(0, Math.min(59, minute));
    this.currentTime.phase = this.getPhaseFromTime(this.currentTime.hour);
    this.currentTime.lightLevel = this.calculateLightLevel(
      this.currentTime.hour,
    );
    this.currentTime.temperature = this.calculateTemperature(
      this.currentTime.hour,
      this.currentWeather.type,
    );
    this.currentTime.timestamp = Date.now();

    this.scene.events.emit("timeChanged", this.currentTime);
  }

  /**
   * Forzar cambio de clima (para testing)
   */
  public setWeather(weatherType: WeatherCondition["type"]): void {
    this.currentWeather.type = weatherType;
    this.currentWeather.intensity = this.calculateWeatherIntensity(weatherType);
    this.currentWeather.visibility = this.calculateVisibility(weatherType);
    this.currentWeather.comfort = this.calculateComfort(
      weatherType,
      this.currentTime.temperature,
    );
    this.currentWeather.duration = this.WEATHER_DURATION_MIN;

    this.currentTime.temperature = this.calculateTemperature(
      this.currentTime.hour,
      weatherType,
    );

    this.scene.events.emit("weatherChanged", this.currentWeather);
  }

  /**
   * Obtener estadísticas del sistema
   */
  public getStats() {
    return {
      time: this.getTimeString(),
      phase: this.currentTime.phase,
      temperature: `${this.currentTime.temperature}°C`,
      weather: this.currentWeather.type,
      lightLevel: Math.round(this.currentTime.lightLevel * 100),
      visibility: Math.round(this.currentWeather.visibility * 100),
      comfort: Math.round(this.currentWeather.comfort * 100),
      ambientLight: this.ambientLight,
    };
  }

  /**
   * Limpiar sistema
   */
  public cleanup(): void {
    if (this.lightingOverlay) {
      this.lightingOverlay.destroy();
    }

    if (this.weatherParticles) {
      this.weatherParticles.destroy();
    }
  }
}
