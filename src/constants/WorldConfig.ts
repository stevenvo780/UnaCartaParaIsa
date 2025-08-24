/**
 * Configuración centralizada del mundo y UI
 * Todas las constantes de tamaño y posicionamiento deben estar aquí
 */

// === CONFIGURACIÓN DEL MUNDO ===
export const WORLD_CONFIG = {
  // Tamaño total del mundo en píxeles
  WORLD_WIDTH: 4096,  // Mundo más grande para mejor navegación
  WORLD_HEIGHT: 4096,
  
  // Centro del mundo
  get WORLD_CENTER_X() { return this.WORLD_WIDTH / 2; },
  get WORLD_CENTER_Y() { return this.WORLD_HEIGHT / 2; },
  
  // Márgenes de seguridad para zonas
  ZONE_MARGIN: 100,
  MIN_ZONE_SIZE: 200,
  MAX_ZONE_SIZE: 500,
} as const;

// === CONFIGURACIÓN DE ZONAS ===
export const ZONE_CONFIG = {
  // Tamaños estándar de zonas
  SMALL: { width: 200, height: 180 },
  MEDIUM: { width: 300, height: 250 },
  LARGE: { width: 400, height: 320 },
  
  // Espaciado mínimo entre zonas
  MIN_SPACING: 150,
} as const;

// === CONFIGURACIÓN DE CÁMARA ===
export const CAMERA_CONFIG = {
  // Límites de zoom
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 4.0,
  DEFAULT_ZOOM: 0.8,  // Zoom más cercano para permitir pan completo
  
  // Velocidad de movimiento
  PAN_SPEED: 25,
  ZOOM_STEP: 0.1,
  SMOOTH_FACTOR: 1.2,
} as const;

// === CONFIGURACIÓN DE UI ===
export const UI_CONFIG = {
  // Modal de estadísticas
  STATS_MODAL: {
    TOTAL_WIDTH: 520,
    SECTION_WIDTH: 240,
    SECTION_HEIGHT: 320,
    STATS_PER_SECTION: 18,
    FONT_SIZE: "11px",
    LINE_HEIGHT: 15,
  },
  
  // Barras de UI
  TOP_BAR_HEIGHT: 70,
  BOTTOM_BAR_HEIGHT: 80,
  SIDE_PANEL_WIDTH: 220,
} as const;

// === FUNCIONES DE UTILIDAD ===
export const WorldUtils = {
  /**
   * Calcula posición segura dentro de los límites del mundo
   */
  clampToWorld(x: number, y: number, width: number, height: number) {
    const margin = WORLD_CONFIG.ZONE_MARGIN;
    return {
      x: Math.max(margin, Math.min(x, WORLD_CONFIG.WORLD_WIDTH - width - margin)),
      y: Math.max(margin, Math.min(y, WORLD_CONFIG.WORLD_HEIGHT - height - margin)),
    };
  },

  /**
   * Calcula el centro de un área rectangular
   */
  getCenter(x: number, y: number, width: number, height: number) {
    return {
      x: x + width / 2,
      y: y + height / 2,
    };
  },

  /**
   * Verifica si dos áreas rectangulares se superponen
   */
  hasOverlap(
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number,
    minSpacing: number = ZONE_CONFIG.MIN_SPACING
  ): boolean {
    return !(
      x1 + w1 + minSpacing < x2 ||
      x2 + w2 + minSpacing < x1 ||
      y1 + h1 + minSpacing < y2 ||
      y2 + h2 + minSpacing < y1
    );
  },

  /**
   * Distribuye zonas de manera uniforme sin superposiciones
   */
  distributeZones(zones: Array<{width: number, height: number}>) {
    const positions: Array<{x: number, y: number}> = [];
    const gridCols = Math.ceil(Math.sqrt(zones.length));
    const gridRows = Math.ceil(zones.length / gridCols);
    
    const cellWidth = (WORLD_CONFIG.WORLD_WIDTH - WORLD_CONFIG.ZONE_MARGIN * 2) / gridCols;
    const cellHeight = (WORLD_CONFIG.WORLD_HEIGHT - WORLD_CONFIG.ZONE_MARGIN * 2) / gridRows;
    
    zones.forEach((zone, index) => {
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);
      
      const cellX = WORLD_CONFIG.ZONE_MARGIN + col * cellWidth;
      const cellY = WORLD_CONFIG.ZONE_MARGIN + row * cellHeight;
      
      // Centrar zona dentro de la celda
      const x = cellX + (cellWidth - zone.width) / 2;
      const y = cellY + (cellHeight - zone.height) / 2;
      
      positions.push(this.clampToWorld(x, y, zone.width, zone.height));
    });
    
    return positions;
  }
};

// === CONFIGURACIÓN DE ZONAS ESPECÍFICAS ===
export const ZONE_DEFINITIONS = [
  // Zonas básicas
  { id: "food_zone_central", name: "Zona de Alimentación Central", type: "food", size: ZONE_CONFIG.LARGE, color: "#00FF00", effects: { energy: 10, happiness: 5 } },
  { id: "water_zone_north", name: "Fuente de Agua Norte", type: "water", size: ZONE_CONFIG.MEDIUM, color: "#00BFFF", effects: { energy: 8, comfort: 6 } },
  { id: "rest_zone_south", name: "Área de Descanso Sur", type: "rest", size: ZONE_CONFIG.LARGE, color: "#FF00FF", effects: { energy: 15, comfort: 10, happiness: 8 } },
  
  // Zonas de recuperación
  { id: "medical_zone_hospital", name: "Hospital Central", type: "medical", size: ZONE_CONFIG.MEDIUM, color: "#FF6B6B", effects: { health: 20, comfort: 8, mentalHealth: 5 } },
  { id: "training_zone_gym", name: "Gimnasio de Entrenamiento", type: "training", size: ZONE_CONFIG.MEDIUM, color: "#FFA500", effects: { stamina: 15, energy: -5, health: 10 } },
  { id: "knowledge_zone_library", name: "Gran Biblioteca", type: "knowledge", size: ZONE_CONFIG.MEDIUM, color: "#4ECDC4", effects: { intelligence: 12, mentalHealth: 8, boredom: -10 } },
  { id: "spiritual_zone_temple", name: "Templo de Serenidad", type: "spiritual", size: ZONE_CONFIG.SMALL, color: "#9B59B6", effects: { mentalHealth: 18, stress: -15, socialSkills: 8 } },
  { id: "market_zone_plaza", name: "Plaza del Mercado", type: "market", size: ZONE_CONFIG.LARGE, color: "#F39C12", effects: { socialSkills: 10, happiness: 6, money: 5 } },
] as const;

// === ESTADÍSTICAS COMPLETAS ===
export const ENTITY_STATS = {
  // Estadísticas principales físicas
  PHYSICAL: [
    { key: "health", icon: "💚", label: "Salud" },
    { key: "energy", icon: "⚡", label: "Energía" },
    { key: "stamina", icon: "🏃", label: "Resistencia" },
    { key: "hunger", icon: "🍖", label: "Hambre" },
    { key: "thirst", icon: "💧", label: "Sed" },
    { key: "sleepiness", icon: "😴", label: "Sueño" },
  ],
  
  // Estadísticas mentales y emocionales
  MENTAL: [
    { key: "mentalHealth", icon: "🧠", label: "Mental" },
    { key: "intelligence", icon: "🎓", label: "Inteligencia" },
    { key: "happiness", icon: "😊", label: "Felicidad" },
    { key: "stress", icon: "😰", label: "Estrés" },
    { key: "boredom", icon: "😑", label: "Aburrimiento" },
    { key: "loneliness", icon: "💔", label: "Soledad" },
  ],
  
  // Estadísticas sociales y avanzadas
  SOCIAL: [
    { key: "socialSkills", icon: "👥", label: "Social" },
    { key: "comfort", icon: "🛋️", label: "Comodidad" },
    { key: "creativity", icon: "🎨", label: "Creatividad" },
    { key: "resonance", icon: "🔗", label: "Resonancia" },
    { key: "courage", icon: "💪", label: "Coraje" },
    { key: "money", icon: "💰", label: "Dinero" },
  ],
  
  // Todas las estadísticas en orden
  get ALL() {
    return [...this.PHYSICAL, ...this.MENTAL, ...this.SOCIAL];
  }
} as const;
