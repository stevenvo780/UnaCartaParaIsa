/**
 * Catálogo de comidas disponibles en el juego
 */

import type { FoodItem, FoodCategory } from '../types/food';

export class FoodCatalog {
  private static readonly foods: FoodItem[] = [
    // HEALTHY FOODS
    {
      id: 'apple_pie',
      name: 'Tarta de Manzana',
      sprite: 'assets/consumable_items/food/05_apple_pie.png',
      category: 'healthy',
      hungerRestore: 35,
      happinessBonus: 15,
      energyEffect: 10,
      healthEffect: 8,
      price: 12,
      consumeTime: 8000,
      spoilTime: 300000, // 5 minutos
      description: 'Deliciosa tarta casera de manzana, nutritiva y reconfortante'
    },
    {
      id: 'salmon',
      name: 'Salmón',
      sprite: 'assets/consumable_items/food/88_salmon.png',
      category: 'healthy',
      hungerRestore: 40,
      happinessBonus: 10,
      energyEffect: 15,
      healthEffect: 12,
      price: 18,
      consumeTime: 12000,
      spoilTime: 180000, // 3 minutos
      description: 'Salmón fresco rico en omega-3, excelente para la salud'
    },
    {
      id: 'eggsalad',
      name: 'Ensalada de Huevo',
      sprite: 'assets/consumable_items/food/40_eggsalad.png',
      category: 'healthy',
      hungerRestore: 30,
      happinessBonus: 8,
      energyEffect: 12,
      healthEffect: 10,
      price: 8,
      consumeTime: 6000,
      spoilTime: 240000, // 4 minutos
      description: 'Ensalada fresca con huevo, ligera y nutritiva'
    },

    // JUNK FOOD
    {
      id: 'burger',
      name: 'Hamburguesa',
      sprite: 'assets/consumable_items/food/15_burger.png',
      category: 'junk',
      hungerRestore: 45,
      happinessBonus: 18,
      energyEffect: 5,
      healthEffect: -3,
      price: 15,
      consumeTime: 10000,
      description: 'Hamburguesa jugosa pero poco saludable, muy sabrosa'
    },
    {
      id: 'pizza',
      name: 'Pizza',
      sprite: 'assets/consumable_items/food/81_pizza.png',
      category: 'junk',
      hungerRestore: 50,
      happinessBonus: 20,
      energyEffect: 8,
      healthEffect: -2,
      price: 20,
      consumeTime: 15000,
      description: 'Pizza caliente con queso derretido, irresistible pero grasosa'
    },
    {
      id: 'hotdog',
      name: 'Hot Dog',
      sprite: 'assets/consumable_items/food/54_hotdog.png',
      category: 'junk',
      hungerRestore: 25,
      happinessBonus: 12,
      energyEffect: 3,
      healthEffect: -1,
      price: 8,
      consumeTime: 5000,
      description: 'Clásico hot dog de la calle, rápido y sabroso'
    },
    {
      id: 'frenchfries',
      name: 'Papas Fritas',
      sprite: 'assets/consumable_items/food/44_frenchfries.png',
      category: 'junk',
      hungerRestore: 20,
      happinessBonus: 15,
      energyEffect: 2,
      healthEffect: -2,
      price: 6,
      consumeTime: 4000,
      description: 'Papas fritas crujientes, perfectas como acompañamiento'
    },

    // DESSERTS
    {
      id: 'chocolate_cake',
      name: 'Torta de Chocolate',
      sprite: 'assets/consumable_items/food/30_chocolatecake.png',
      category: 'dessert',
      hungerRestore: 15,
      happinessBonus: 25,
      energyEffect: 15,
      healthEffect: -1,
      price: 14,
      consumeTime: 8000,
      description: 'Exquisita torta de chocolate, pura felicidad en cada bocado'
    },
    {
      id: 'icecream',
      name: 'Helado',
      sprite: 'assets/consumable_items/food/57_icecream.png',
      category: 'dessert',
      hungerRestore: 10,
      happinessBonus: 20,
      energyEffect: 8,
      healthEffect: 0,
      price: 5,
      consumeTime: 3000,
      spoilTime: 120000, // 2 minutos
      description: 'Helado cremoso que se derrite, perfecto para el calor'
    },
    {
      id: 'donut',
      name: 'Dona',
      sprite: 'assets/consumable_items/food/34_donut.png',
      category: 'dessert',
      hungerRestore: 18,
      happinessBonus: 18,
      energyEffect: 12,
      healthEffect: -1,
      price: 4,
      consumeTime: 4000,
      description: 'Dona glaseada dulce, irresistible tentación matutina'
    },

    // SNACKS
    {
      id: 'popcorn',
      name: 'Palomitas',
      sprite: 'assets/consumable_items/food/83_popcorn.png',
      category: 'snack',
      hungerRestore: 12,
      happinessBonus: 8,
      energyEffect: 5,
      healthEffect: 1,
      price: 3,
      consumeTime: 3000,
      description: 'Palomitas crujientes, perfectas para picar'
    },
    {
      id: 'cookies',
      name: 'Galletas',
      sprite: 'assets/consumable_items/food/28_cookies.png',
      category: 'snack',
      hungerRestore: 15,
      happinessBonus: 12,
      energyEffect: 8,
      healthEffect: 0,
      price: 5,
      consumeTime: 4000,
      description: 'Galletas caseras crujientes, ideales con té o café'
    },

    // BREAD & BASICS
    {
      id: 'bread',
      name: 'Pan',
      sprite: 'assets/consumable_items/food/07_bread.png',
      category: 'healthy',
      hungerRestore: 25,
      happinessBonus: 5,
      energyEffect: 10,
      healthEffect: 3,
      price: 2,
      consumeTime: 5000,
      spoilTime: 600000, // 10 minutos
      description: 'Pan fresco básico, alimento fundamental y nutritivo'
    },
    {
      id: 'sandwich',
      name: 'Sándwich',
      sprite: 'assets/consumable_items/food/92_sandwich.png',
      category: 'healthy',
      hungerRestore: 35,
      happinessBonus: 10,
      energyEffect: 12,
      healthEffect: 5,
      price: 8,
      consumeTime: 8000,
      spoilTime: 300000, // 5 minutos
      description: 'Sándwich completo con ingredientes frescos'
    }
  ];

  /**
   * Obtiene todas las comidas disponibles
   */
  static getAllFoods(): FoodItem[] {
    return [...this.foods];
  }

  /**
   * Obtiene una comida por ID
   */
  static getFoodById(id: string): FoodItem | null {
    return this.foods.find(food => food.id === id) || null;
  }

  /**
   * Obtiene comidas por categoría
   */
  static getFoodsByCategory(category: FoodCategory): FoodItem[] {
    return this.foods.filter(food => food.category === category);
  }

  /**
   * Obtiene comidas por rango de precio
   */
  static getFoodsByPriceRange(minPrice: number, maxPrice: number): FoodItem[] {
    return this.foods.filter(food => food.price >= minPrice && food.price <= maxPrice);
  }

  /**
   * Obtiene comidas que restauran al menos cierta cantidad de hambre
   */
  static getFoodsWithMinHungerRestore(minHunger: number): FoodItem[] {
    return this.foods.filter(food => food.hungerRestore >= minHunger);
  }

  /**
   * Obtiene una comida aleatoria de una categoría
   */
  static getRandomFoodFromCategory(category: FoodCategory): FoodItem | null {
    const categoryFoods = this.getFoodsByCategory(category);
    if (categoryFoods.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * categoryFoods.length);
    return categoryFoods[randomIndex];
  }

  /**
   * Obtiene comida recomendada basada en las necesidades de la entidad
   */
  static getRecommendedFood(hunger: number, happiness: number, money: number): FoodItem[] {
    const affordable = this.foods.filter(food => food.price <= money);
    
    // Si tiene mucha hambre, priorizar comidas que restauren más hambre
    if (hunger < 30) {
      return affordable
        .filter(food => food.hungerRestore >= 25)
        .sort((a, b) => b.hungerRestore - a.hungerRestore)
        .slice(0, 3);
    }
    
    // Si está triste, priorizar comidas que den felicidad
    if (happiness < 40) {
      return affordable
        .filter(food => food.happinessBonus >= 12)
        .sort((a, b) => b.happinessBonus - a.happinessBonus)
        .slice(0, 3);
    }
    
    // Por defecto, comida balanceada
    return affordable
      .sort((a, b) => {
        const scoreA = a.hungerRestore + a.happinessBonus + a.healthEffect;
        const scoreB = b.hungerRestore + b.happinessBonus + b.healthEffect;
        return scoreB - scoreA;
      })
      .slice(0, 3);
  }
}