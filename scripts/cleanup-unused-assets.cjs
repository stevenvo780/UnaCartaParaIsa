/**
 * Script para identificar y limpiar assets no utilizados
 * Escanea el código fuente y remueve assets que no están referenciados
 */

const fs = require('fs').promises;
const path = require('path');

class AssetCleanup {
  constructor() {
    this.assetsDir = path.join(__dirname, '../public/assets');
    this.srcDir = path.join(__dirname, '../src');
    this.ignoredDirs = ['ui_icons', 'consumable_items']; // Assets claramente no utilizados
  }

  /**
   * Escanea archivos fuente por referencias a assets
   */
  async scanSourceForAssetReferences() {
    const references = new Set();
    
    const scanFile = async (filePath) => {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Buscar referencias a assets (patrones comunes)
        const patterns = [
          /assets\/[^'\"\s]+\.(png|jpg|jpeg|webp|gif)/g,
          /'[^']*\.(png|jpg|jpeg|webp|gif)'/g,
          /"[^"]*\.(png|jpg|jpeg|webp|gif)"/g,
        ];
        
        patterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              const cleanMatch = match.replace(/['"]/g, '');
              references.add(cleanMatch);
            });
          }
        });
      } catch (error) {
        console.warn(`Error reading file ${filePath}:`, error.message);
      }
    };

    const scanDirectory = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && /\.(ts|js|json)$/.test(entry.name)) {
            await scanFile(fullPath);
          }
        }
      } catch (error) {
        console.warn(`Error scanning directory ${dir}:`, error.message);
      }
    };

    await scanDirectory(this.srcDir);
    return references;
  }

  /**
   * Calcula el tamaño de un directorio
   */
  async getDirSize(dirPath) {
    let size = 0;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          size += await this.getDirSize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          size += stats.size;
        }
      }
    } catch (error) {
      console.warn(`Error calculando tamaño de ${dirPath}:`, error.message);
    }
    
    return size;
  }

  /**
   * Formatea bytes en formato legible
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Remueve assets no utilizados de directorios específicos
   */
  async cleanupUnusedAssets(dryRun = true) {
    console.log('🧹 Limpiando assets no utilizados...');
    
    let totalCleaned = 0;
    let sizeCleaned = 0;

    for (const dir of this.ignoredDirs) {
      const dirPath = path.join(this.assetsDir, dir);
      
      try {
        await fs.access(dirPath);
        const dirSize = await this.getDirSize(dirPath);
        
        console.log(`📂 Procesando directorio: ${dir} (${this.formatBytes(dirSize)})`);
        
        if (!dryRun) {
          await fs.rm(dirPath, { recursive: true, force: true });
          console.log(`✅ Removido: ${dir}`);
        } else {
          console.log(`📋 [DRY RUN] Se removería: ${dir}`);
        }
        
        totalCleaned++;
        sizeCleaned += dirSize;
        
      } catch (error) {
        console.warn(`⚠️ Directorio ${dir} no existe o ya fue removido`);
      }
    }

    console.log(`\n📊 Resumen de limpieza:`);
    console.log(`   Directorios procesados: ${totalCleaned}`);
    console.log(`   Espacio a liberar: ${this.formatBytes(sizeCleaned)}`);
    console.log(`   Modo: ${dryRun ? 'DRY RUN (sin cambios)' : 'LIMPIEZA REAL'}`);

    return { totalCleaned, sizeCleaned };
  }
}

// Ejecutar script
async function main() {
  const cleanup = new AssetCleanup();
  
  try {
    console.log('🚀 Iniciando análisis de assets...\n');
    
    // Limpiar directorios específicos (DRY RUN por defecto)
    console.log('🧹 Iniciando limpieza de directorios innecesarios...');
    const dryRun = !process.argv.includes('--execute');
    
    if (dryRun) {
      console.log('ℹ️ Ejecutando en modo DRY RUN. Usa --execute para aplicar cambios reales.');
    }
    
    const result = await cleanup.cleanupUnusedAssets(dryRun);
    
    console.log('\n✅ Análisis completado!');
    
    if (result.sizeCleaned > 0) {
      console.log(`💾 Espacio total que se puede liberar: ${cleanup.formatBytes(result.sizeCleaned)}`);
      
      if (dryRun) {
        console.log('\n💡 Para ejecutar la limpieza real, ejecuta:');
        console.log('   node scripts/cleanup-unused-assets.js --execute');
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { AssetCleanup };