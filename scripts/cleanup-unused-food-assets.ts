/**
 * Script para limpiar assets de comida no utilizados
 */

import { promises as fs } from "fs";
import path from "path";

// Assets que SÍ se usan (extraídos del FoodCatalog actual)
const USED_ASSETS = new Set([
  "05_apple_pie.png",
  "88_salmon.png", 
  "40_eggsalad.png",
  "15_burger.png",
  "81_pizza.png",
  "54_hotdog.png",
  "44_frenchfries.png",
  "30_chocolatecake.png",
  "57_icecream.png",
  "34_donut.png",
  "83_popcorn.png",
  "28_cookies.png",
  "07_bread.png",
  "92_sandwich.png"
]);

async function cleanupUnusedAssets(dryRun = true) {
  const assetsDir = path.join(__dirname, "../public/assets/consumable_items/food");
  
  try {
    const files = await fs.readdir(assetsDir);
    const pngFiles = files.filter(f => f.endsWith('.png'));
    
    const unusedFiles = pngFiles.filter(f => !USED_ASSETS.has(f));
    
    console.log(`📊 Food Assets Analysis:`);
    console.log(`  Total files: ${pngFiles.length}`);
    console.log(`  Used files: ${USED_ASSETS.size}`);
    console.log(`  Unused files: ${unusedFiles.length}`);
    console.log(`  Waste: ${((unusedFiles.length / pngFiles.length) * 100).toFixed(1)}%`);
    
    if (unusedFiles.length === 0) {
      console.log("✅ No unused assets found!");
      return;
    }
    
    let totalSize = 0;
    for (const file of unusedFiles) {
      const filePath = path.join(assetsDir, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }
    
    console.log(`\n💾 Space that could be freed: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (dryRun) {
      console.log(`\n🗑️ Files to be removed (DRY RUN):`);
      unusedFiles.slice(0, 20).forEach(f => console.log(`  - ${f}`));
      if (unusedFiles.length > 20) {
        console.log(`  ... and ${unusedFiles.length - 20} more`);
      }
      console.log(`\n💡 Run with --execute to actually remove files`);
    } else {
      console.log(`\n🗑️ Removing ${unusedFiles.length} unused files...`);
      
      let removed = 0;
      for (const file of unusedFiles) {
        try {
          await fs.unlink(path.join(assetsDir, file));
          removed++;
        } catch (error) {
          console.warn(`⚠️ Failed to remove ${file}:`, error);
        }
      }
      
      console.log(`✅ Removed ${removed} files`);
      console.log(`💾 Freed ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Ejecutar script
const dryRun = !process.argv.includes("--execute");
cleanupUnusedAssets(dryRun);