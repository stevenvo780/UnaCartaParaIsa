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
  | "fun";

export interface Zone {
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
  properties?: Record<string, any>;
  benefits?: {
    energy?: number;
    happiness?: number;
    comfort?: number;
  };
}
