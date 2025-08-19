/**
 * Tipos y interfaces para el sistema de comida
 */

export type FoodCategory = 'healthy' | 'junk' | 'dessert' | 'drink' | 'snack';

export interface FoodItem {
  id: string;
  name: string;
  sprite: string;
  category: FoodCategory;
  hungerRestore: number; // Cuánto restaura de hambre (0-50)
  happinessBonus: number; // Bonus de felicidad (0-20)
  energyEffect: number; // Efecto en energía (-10 a +20)
  healthEffect: number; // Efecto en salud (-5 a +15)
  price: number; // Costo en monedas
  consumeTime: number; // Tiempo que toma comer (ms)
  spoilTime?: number; // Tiempo hasta que se echa a perder (ms)
  description: string;
}

export interface FoodInventoryItem {
  food: FoodItem;
  quantity: number;
  acquiredAt: number; // timestamp
}

export interface EatingAction {
  entityId: string;
  foodId: string;
  startTime: number;
  duration: number;
  position: { x: number; y: number };
}
