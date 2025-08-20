/**
 * Script para identificar y limpiar assets no utilizados
 * Escanea el código fuente y remueve assets que no están referenciados
 */

import { promises as fs } from "fs";
import path from "path";

interface AssetUsageReport {
  totalAssets: number;
  usedAssets: string[];
  unusedAssets: string[];
  sizeSaved: number;
}

class AssetCleanup {
  private readonly assetsDir = path.join(__dirname, "../public/assets");
  private readonly srcDir = path.join(__dirname, "../src");
  private readonly ignoredDirs = ["ui_icons", "consumable_items"]; // Assets claramente no utilizados

  /**
   * Escanea archivos fuente por referencias a assets
   */
  async scanSourceForAssetReferences(): Promise<Set<string>> {
    const references = new Set<string>();

    const scanFile = async (filePath: string) => {
      try {
        const content = await fs.readFile(filePath, "utf-8");

        // Buscar referencias a assets (patrones comunes)
        const patterns = [
          /assets\/[^'\"\s]+\.(png|jpg|jpeg|webp|gif)/g,
          /'[^']*\.(png|jpg|jpeg|webp|gif)'/g,
          /"[^"]*\.(png|jpg|jpeg|webp|gif)"/g,
        ];

        patterns.forEach((pattern) => {
          const matches = content.match(pattern);
          if (matches) {
            matches.forEach((match) => {
              const cleanMatch = match.replace(/['"]/g, "");
              references.add(cleanMatch);
            });
          }
        });
      } catch (error) {
        console.warn(`Error reading file ${filePath}:`, error);
      }
    };

    const scanDirectory = async (dir: string) => {
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
        console.warn(`Error scanning directory ${dir}:`, error);
      }
    };

    await scanDirectory(this.srcDir);
    return references;
  }

  /**
   * Lista todos los assets disponibles
   */
  async getAllAssets(): Promise<string[]> {
    const assets: string[] = [];

    const scanAssets = async (dir: string, baseDir = "") => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = baseDir
            ? path.join(baseDir, entry.name)
            : entry.name;

          if (entry.isDirectory()) {
            await scanAssets(fullPath, relativePath);
          } else if (
            entry.isFile() &&
            /\.(png|jpg|jpeg|webp|gif)$/.test(entry.name)
          ) {
            assets.push(`assets/${relativePath.replace(/\\/g, "/")}`);
          }
        }
      } catch (error) {
        console.warn(`Error scanning assets directory ${dir}:`, error);
      }
    };

    await scanAssets(this.assetsDir);
    return assets;
  }

  /**
   * Calcula el tamaño de un asset
   */
  async getAssetSize(assetPath: string): Promise<number> {
    try {
      const fullPath = path.join(__dirname, "../public", assetPath);
      const stats = await fs.stat(fullPath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  /**
   * Genera reporte de uso de assets
   */
  async generateUsageReport(): Promise<AssetUsageReport> {
    console.log("🔍 Escaneando código fuente por referencias a assets...");
    const usedReferences = await this.scanSourceForAssetReferences();

    console.log("📁 Listando todos los assets disponibles...");
    const allAssets = await this.getAllAssets();

    const usedAssets: string[] = [];
    const unusedAssets: string[] = [];
    let sizeSaved = 0;

    console.log("🔗 Comparando assets con referencias...");
    for (const asset of allAssets) {
      const isUsed = Array.from(usedReferences).some(
        (ref) =>
          asset.includes(ref) || ref.includes(asset.replace("assets/", "")),
      );

      if (isUsed) {
        usedAssets.push(asset);
      } else {
        unusedAssets.push(asset);
        sizeSaved += await this.getAssetSize(asset);
      }
    }

    return {
      totalAssets: allAssets.length,
      usedAssets,
      unusedAssets,
      sizeSaved,
    };
  }

  /**
   * Remueve assets no utilizados de directorios específicos
   */
  async cleanupUnusedAssets(dryRun = true): Promise<void> {
    console.log("🧹 Limpiando assets no utilizados...");

    let totalCleaned = 0;
    let sizeCleaned = 0;

    for (const dir of this.ignoredDirs) {
      const dirPath = path.join(this.assetsDir, dir);

      try {
        const exists = await fs.access(dirPath).then(
          () => true,
          () => false,
        );
        if (!exists) continue;

        const stats = await fs.stat(dirPath);
        const dirSize = await this.getDirSize(dirPath);

        console.log(
          `📂 Procesando directorio: ${dir} (${this.formatBytes(dirSize)})`,
        );

        if (!dryRun) {
          await fs.rmdir(dirPath, { recursive: true });
          console.log(`✅ Removido: ${dir}`);
        } else {
          console.log(`📋 [DRY RUN] Se removería: ${dir}`);
        }

        totalCleaned++;
        sizeCleaned += dirSize;
      } catch (error) {
        console.warn(`⚠️ Error procesando ${dir}:`, error);
      }
    }

    console.log("\n📊 Resumen de limpieza:");
    console.log(`   Directorios procesados: ${totalCleaned}`);
    console.log(`   Espacio liberado: ${this.formatBytes(sizeCleaned)}`);
    console.log(
      `   Modo: ${dryRun ? "DRY RUN (sin cambios)" : "LIMPIEZA REAL"}`,
    );
  }

  /**
   * Calcula el tamaño de un directorio
   */
  private async getDirSize(dirPath: string): Promise<number> {
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
      console.warn(`Error calculando tamaño de ${dirPath}:`, error);
    }

    return size;
  }

  /**
   * Formatea bytes en formato legible
   */
  public formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

// Ejecutar script
async function main() {
  const cleanup = new AssetCleanup();

  try {
    // Generar reporte
    console.log("🚀 Iniciando análisis de assets...\n");
    const report = await cleanup.generateUsageReport();

    console.log("\n📋 Reporte de Assets:");
    console.log(`   Total assets: ${report.totalAssets}`);
    console.log(`   Assets utilizados: ${report.usedAssets.length}`);
    console.log(`   Assets no utilizados: ${report.unusedAssets.length}`);
    console.log(
      `   Espacio potencial a liberar: ${cleanup.formatBytes(report.sizeSaved)}`,
    );

    // Mostrar algunos assets no utilizados como ejemplo
    if (report.unusedAssets.length > 0) {
      console.log("\n🗑️ Ejemplos de assets no utilizados:");
      report.unusedAssets.slice(0, 10).forEach((asset) => {
        console.log(`   - ${asset}`);
      });

      if (report.unusedAssets.length > 10) {
        console.log(`   ... y ${report.unusedAssets.length - 10} más`);
      }
    }

    // Limpiar directorios específicos (DRY RUN por defecto)
    console.log("\n🧹 Iniciando limpieza de directorios innecesarios...");
    const dryRun = !process.argv.includes("--execute");

    if (dryRun) {
      console.log(
        "ℹ️ Ejecutando en modo DRY RUN. Usa --execute para aplicar cambios reales.",
      );
    }

    await cleanup.cleanupUnusedAssets(dryRun);

    console.log("\n✅ Análisis completado!");
  } catch (error) {
    console.error("❌ Error durante el análisis:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { AssetCleanup };
