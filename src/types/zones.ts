/**
 * Tipos relacionados con zonas del juego
 */

export type ZoneType =
  | "kitchen"
  | "bedroom"
  | "living"
  | "bathroom"
  | "office"
  | "gym"
  | "library"
  | "social"
  | "recreation"
  | "food"
  | "water" // Nueva zona crítica para sed
  | "shelter" // Nueva zona para descanso/protección
  | "rest"
  | "play"
  | "comfort"
  | "work"
  | "energy"
  | "hygiene"
  | "entertainment"
  | "fun"
  // Nuevas zonas para edificios
  | "medical" // Hospital
  | "education" // Escuela
  | "training" // Gimnasio
  | "knowledge" // Biblioteca
  | "market" // Mercado
  | "spiritual" // Templo
  | "security"; // Torre de vigilancia

export interface ZoneDefinition {
  id: string;
  type: ZoneType;
  name: string;
  description: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  color: number;
  interactionRadius: number;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  properties?: Record<string, string | number | boolean>;
  metadata?: Record<string, unknown>;
  benefits?: {
    energy?: number;
    happiness?: number;
    comfort?: number;
  };
}
