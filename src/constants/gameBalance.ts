/**
 * 🎯 CONSTANTES DE BALANCE DEL JUEGO
 * Centraliza todos los valores numéricos para facilitar ajustes y eliminar magic numbers
 */

export const GAME_BALANCE = {
  // Ciclos y frecuencias
  CYCLE_LOG_FREQUENCY: 10, // Cada cuántos ciclos mostrar log
  UI_UPDATE_INTERVAL: 100, // ms para actualizar UI
  DIALOGUE_CHECK_INTERVAL: 8000, // ms para evaluar diálogos
  DIALOGUE_VARIATION: 7000, // ms de variación aleatoria
  
  // Dimensiones del mundo
  WORLD: {
    DEFAULT_WIDTH: 1200,
    DEFAULT_HEIGHT: 800,
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600,
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080
  },

  // Escalas y tamaños visuales
  VISUALS: {
    ENTITY_SCALE: 1.5,
    TILE_SIZE: 64,
    ENTITY_DEPTH: 10,
    ZONE_DEPTH: 2,
    UI_DEPTH: 1000,
    
    // Pulso de entidades
    BASE_PULSE_SCALE: 1.5,
    PULSE_AMPLITUDE: 0.1,
    PULSE_SPEED: 0.1
  },

  // Sistema de resonancia
  RESONANCE: {
    BAR_SCALE: 2, // Factor de escala para la barra de UI
    BAR_WIDTH: 200,
    BAR_HEIGHT: 20,
    THRESHOLD_HIGH: 50,
    THRESHOLD_MEDIUM: 25,
    
    // Colores (en formato hex)
    COLOR_HIGH: 0x27ae60,
    COLOR_MEDIUM: 0xf39c12,
    COLOR_LOW: 0xe74c3c
  },

  // Sprites y animaciones
  SPRITES: {
    ENTITY_SIZE: 32,
    ANIMATION_DURATION: 300,
    FADE_DURATION: 500,
    TWEEN_EASE: 'Back.easeOut',
    TWEEN_EASE_IN: 'Back.easeIn'
  },

  // Sistemas de movimiento
  MOVEMENT: {
    DIRECTION_CHANGE_PROBABILITY: 0.02, // 2% chance per frame
    ENTITY_COLLISION_RADIUS: 15,
    SQUARE_ENTITY_SIZE: 30
  },

  // Transparencia y efectos
  EFFECTS: {
    MIN_ALPHA: 0.5,
    MAX_ALPHA: 1.0,
    HEALTH_ALPHA_FACTOR: 0.5,
    
    // Thresholds para cambios de sprite
    DYING_THRESHOLD: 20,
    SAD_THRESHOLD: 50,
    LOW_HEALTH_THRESHOLD: 15
  },

  // Zonas del mundo
  ZONES: {
    DEFAULT_ALPHA: 0.25,
    STROKE_ALPHA: 0.8,
    STROKE_WIDTH: 2,
    CORNER_RADIUS: 10,
    
    // Colores por defecto
    FOOD_COLOR: 0x27ae60,
    REST_COLOR: 0x2980b9,
    PLAY_COLOR: 0xe74c3c,
    SOCIAL_COLOR: 0x3498db
  },

  // UI y controles
  UI: {
    BACKGROUND_ALPHA: 0.7,
    PANEL_WIDTH: 300,
    PANEL_HEIGHT: 120,
    TEXT_MARGIN: 10,
    
    // Debug controls
    DEBUG_BUTTON_WIDTH: 40,
    DEBUG_BUTTON_SPACING: 40,
    DEBUG_SPEEDS: [0.5, 1.0, 2.0, 5.0, 10.0]
  },

  // Diálogos
  DIALOGUE: {
    BUBBLE_WIDTH: 240,
    BUBBLE_HEIGHT: 60,
    BUBBLE_OFFSET_Y: -60,
    BUBBLE_RADIUS: 10,
    BUBBLE_ALPHA: 0.9,
    TAIL_SIZE: 8,
    
    // Duraciones
    DEFAULT_DURATION: 4000,
    INTERACTION_DURATION: 3500,
    ANIMATION_DURATION: 300,
    
    // Colores
    ISA_COLOR: 0x8e44ad,
    STEV_COLOR: 0x2980b9,
    TEXT_STROKE: 2,
    
    // Texto
    MAX_TEXT_LENGTH: 80,
    WRAP_WIDTH: 220
  },

  // Decoraciones del mundo
  DECORATIONS: {
    CAMPFIRE_SCALE: 1.2,
    FLOWERS_SCALE: 1.2,
    DECORATION_DEPTH: 1
  },

  // Mapas y generación
  MAP_GENERATION: {
    MIN_ZONES: 4, // Para fallback
    MIN_ELEMENTS: 8, // Para fallback
    ZONE_VARIATION_FACTOR: 0.3, // Para targets aleatorios
    
    // Validación
    MIN_ZONE_SIZE: 100,
    MIN_ELEMENTS_COUNT: 5
  },

  // Performance y optimización
  PERFORMANCE: {
    LOG_SAMPLING_RATE: 0.1, // 10% de logs para AI decisions
    CLEANUP_INTERVAL: 60000, // ms para limpieza
    BATCH_SIZE: 20,
    THROTTLE_THRESHOLD: 16.67 // ms
  }
} as const;

// Tipos derivados para type safety
export type GameBalanceKey = keyof typeof GAME_BALANCE;
export type WorldDimensions = typeof GAME_BALANCE.WORLD;
export type VisualSettings = typeof GAME_BALANCE.VISUALS;
export type ResonanceSettings = typeof GAME_BALANCE.RESONANCE;