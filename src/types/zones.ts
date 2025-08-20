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
  | "rest"
  | "play"
  | "comfort"
  | "work"
  | "energy";

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
  benefits?: {
    energy?: number;
    happiness?: number;
    comfort?: number;
  };
}
