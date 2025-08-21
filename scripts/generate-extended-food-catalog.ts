/**
 * Script para generar un catálogo extendido de comidas
 * Usa todos los assets disponibles automáticamente
 */

import { promises as fs } from "fs";
import path from "path";

interface FoodDefinition {
  id: string;
  name: string;
  sprite: string;
  category: "healthy" | "junk" | "dessert" | "snack";
  hungerRestore: number;
  happinessBonus: number;
  energyEffect: number;
  healthEffect: number;
  price: number;
  consumeTime: number;
  spoilTime: number;
  description: string;
}

// Mapeo de archivos a definiciones de comida
const FOOD_MAPPINGS: Record<string, Partial<FoodDefinition>> = {
  // HEALTHY FOODS
  "07_bread.png": {
    id: "bread", name: "Pan", category: "healthy",
    hungerRestore: 25, happinessBonus: 5, energyEffect: 5, healthEffect: 2,
    price: 3, consumeTime: 3000, spoilTime: 120000,
    description: "Pan fresco y nutritivo"
  },
  "88_salmon.png": {
    id: "salmon", name: "Salmón", category: "healthy",
    hungerRestore: 40, happinessBonus: 10, energyEffect: 15, healthEffect: 12,
    price: 18, consumeTime: 12000, spoilTime: 180000,
    description: "Salmón fresco rico en omega-3"
  },
  "40_eggsalad.png": {
    id: "eggsalad", name: "Ensalada de Huevo", category: "healthy",
    hungerRestore: 30, happinessBonus: 8, energyEffect: 12, healthEffect: 10,
    price: 8, consumeTime: 6000, spoilTime: 240000,
    description: "Ensalada nutritiva de huevo"
  },
  "92_sandwich.png": {
    id: "sandwich", name: "Sándwich", category: "healthy",
    hungerRestore: 35, happinessBonus: 12, energyEffect: 8, healthEffect: 6,
    price: 7, consumeTime: 5000, spoilTime: 200000,
    description: "Sándwich casero balanceado"
  },
  "97_sushi.png": {
    id: "sushi", name: "Sushi", category: "healthy",
    hungerRestore: 35, happinessBonus: 15, energyEffect: 10, healthEffect: 8,
    price: 25, consumeTime: 8000, spoilTime: 120000,
    description: "Sushi fresco de alta calidad"
  },
  "87_ramen.png": {
    id: "ramen", name: "Ramen", category: "healthy",
    hungerRestore: 45, happinessBonus: 20, energyEffect: 12, healthEffect: 5,
    price: 12, consumeTime: 10000, spoilTime: 300000,
    description: "Ramen caliente reconfortante"
  },

  // JUNK FOODS
  "15_burger.png": {
    id: "burger", name: "Hamburguesa", category: "junk",
    hungerRestore: 50, happinessBonus: 25, energyEffect: 5, healthEffect: -2,
    price: 10, consumeTime: 8000, spoilTime: 180000,
    description: "Hamburguesa jugosa pero poco saludable"
  },
  "81_pizza.png": {
    id: "pizza", name: "Pizza", category: "junk",
    hungerRestore: 45, happinessBonus: 30, energyEffect: 8, healthEffect: -1,
    price: 15, consumeTime: 10000, spoilTime: 240000,
    description: "Pizza deliciosa pero grasosa"
  },
  "54_hotdog.png": {
    id: "hotdog", name: "Perro Caliente", category: "junk",
    hungerRestore: 30, happinessBonus: 20, energyEffect: 3, healthEffect: -3,
    price: 6, consumeTime: 4000, spoilTime: 150000,
    description: "Clásico perro caliente"
  },
  "44_frenchfries.png": {
    id: "frenchfries", name: "Papas Fritas", category: "junk",
    hungerRestore: 20, happinessBonus: 15, energyEffect: 2, healthEffect: -2,
    price: 5, consumeTime: 3000, spoilTime: 120000,
    description: "Papas fritas crujientes"
  },
  "99_taco.png": {
    id: "taco", name: "Taco", category: "junk",
    hungerRestore: 35, happinessBonus: 18, energyEffect: 6, healthEffect: 0,
    price: 8, consumeTime: 6000, spoilTime: 180000,
    description: "Taco mexicano sabroso"
  },

  // DESSERTS
  "05_apple_pie.png": {
    id: "apple_pie", name: "Tarta de Manzana", category: "dessert",
    hungerRestore: 35, happinessBonus: 25, energyEffect: 10, healthEffect: 3,
    price: 12, consumeTime: 8000, spoilTime: 300000,
    description: "Tarta casera de manzana"
  },
  "30_chocolatecake.png": {
    id: "chocolate_cake", name: "Pastel de Chocolate", category: "dessert",
    hungerRestore: 25, happinessBonus: 35, energyEffect: 15, healthEffect: -1,
    price: 15, consumeTime: 6000, spoilTime: 240000,
    description: "Delicioso pastel de chocolate"
  },
  "57_icecream.png": {
    id: "icecream", name: "Helado", category: "dessert",
    hungerRestore: 15, happinessBonus: 30, energyEffect: 8, healthEffect: 0,
    price: 8, consumeTime: 3000, spoilTime: 60000,
    description: "Helado cremoso refrescante"
  },
  "34_donut.png": {
    id: "donut", name: "Dona", category: "dessert",
    hungerRestore: 20, happinessBonus: 25, energyEffect: 12, healthEffect: -2,
    price: 4, consumeTime: 2000, spoilTime: 180000,
    description: "Dona dulce y esponjosa"
  },
  "22_cheesecake.png": {
    id: "cheesecake", name: "Tarta de Queso", category: "dessert",
    hungerRestore: 30, happinessBonus: 28, energyEffect: 8, healthEffect: 1,
    price: 18, consumeTime: 8000, spoilTime: 300000,
    description: "Cremosa tarta de queso"
  },

  // SNACKS
  "28_cookies.png": {
    id: "cookies", name: "Galletas", category: "snack",
    hungerRestore: 15, happinessBonus: 15, energyEffect: 5, healthEffect: 0,
    price: 3, consumeTime: 2000, spoilTime: 600000,
    description: "Galletas crujientes caseras"
  },
  "83_popcorn.png": {
    id: "popcorn", name: "Palomitas", category: "snack",
    hungerRestore: 10, happinessBonus: 12, energyEffect: 3, healthEffect: 0,
    price: 2, consumeTime: 1500, spoilTime: 300000,
    description: "Palomitas crujientes"
  },
  "77_potatochips.png": {
    id: "potatochips", name: "Papas Fritas de Bolsa", category: "snack",
    hungerRestore: 12, happinessBonus: 10, energyEffect: 2, healthEffect: -1,
    price: 3, consumeTime: 2000, spoilTime: 900000,
    description: "Papas fritas de bolsa saladas"
  },
  "71_nacho.png": {
    id: "nacho", name: "Nachos", category: "snack",
    hungerRestore: 18, happinessBonus: 16, energyEffect: 4, healthEffect: -1,
    price: 6, consumeTime: 4000, spoilTime: 240000,
    description: "Nachos con queso fundido"
  },
};

async function generateExtendedCatalog() {
  const assetsDir = path.join(__dirname, "../public/assets/consumable_items/food");
  
  try {
    const files = await fs.readdir(assetsDir);
    const pngFiles = files.filter(f => f.endsWith('.png') && !f.startsWith('#1'));
    
    console.log(`📁 Found ${pngFiles.length} food assets`);
    console.log(`🎯 Mapped ${Object.keys(FOOD_MAPPINGS).length} foods`);
    
    // Generar código para FoodCatalog
    let catalogCode = `  private static readonly foods: FoodItem[] = [\n`;
    
    Object.entries(FOOD_MAPPINGS).forEach(([filename, food]) => {
      catalogCode += `    {\n`;
      catalogCode += `      id: "${food.id}",\n`;
      catalogCode += `      name: "${food.name}",\n`;
      catalogCode += `      sprite: "assets/consumable_items/food/${filename}",\n`;
      catalogCode += `      category: "${food.category}",\n`;
      catalogCode += `      hungerRestore: ${food.hungerRestore},\n`;
      catalogCode += `      happinessBonus: ${food.happinessBonus},\n`;
      catalogCode += `      energyEffect: ${food.energyEffect},\n`;
      catalogCode += `      healthEffect: ${food.healthEffect},\n`;
      catalogCode += `      price: ${food.price},\n`;
      catalogCode += `      consumeTime: ${food.consumeTime},\n`;
      catalogCode += `      spoilTime: ${food.spoilTime},\n`;
      catalogCode += `      description: "${food.description}",\n`;
      catalogCode += `    },\n`;
    });
    
    catalogCode += `  ];\n`;
    
    // Guardar resultado
    await fs.writeFile(
      path.join(__dirname, "extended-food-catalog.ts"),
      catalogCode
    );
    
    console.log(`✅ Generated extended catalog with ${Object.keys(FOOD_MAPPINGS).length} foods`);
    console.log(`📊 Coverage: ${((Object.keys(FOOD_MAPPINGS).length / pngFiles.length) * 100).toFixed(1)}%`);
    
    // Mostrar assets no utilizados
    const unusedAssets = pngFiles.filter(f => !FOOD_MAPPINGS[f]);
    console.log(`\n🗑️ Unused assets (${unusedAssets.length}):`);
    unusedAssets.slice(0, 10).forEach(f => console.log(`  - ${f}`));
    if (unusedAssets.length > 10) {
      console.log(`  ... and ${unusedAssets.length - 10} more`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

if (require.main === module) {
  generateExtendedCatalog();
}

export { FOOD_MAPPINGS };