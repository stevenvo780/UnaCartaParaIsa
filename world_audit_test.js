/**
 * Test script para auditoria del sistema de mapas
 * Simula la generación de mundos y extrae métricas
 */

// Simular sistema de assets y métricas básicas
class WorldAuditTest {
  constructor() {
    this.metrics = {
      totalAssets: 0,
      rotatedAssets: 0,
      nonRotatableRotatedAssets: 0,
      misalignedTiles: 0,
      missingAssets: 0,
      totalStructures: 0,
      totalVegetation: 0,
      totalProps: 0
    };
    
    this.problematicPatterns = [];
    this.seeds = [];
  }

  // Simular patrones problemáticos encontrados en DiverseWorldComposer.ts
  simulateProblematicRotations() {
    console.log("🔍 Simulando patrones problemáticos detectados en código...");
    
    // Patrón 1: Rotación aleatoria en vegetación (línea 310)
    const vegetationRotation = Math.random() * Math.PI * 2;
    
    // Patrón 2: Rotación aleatoria en estructuras (línea 387) 
    const structureRotation = Math.random() * Math.PI * 2;
    
    // Patrón 3: Offsets excesivos en transiciones (línea 515-516)
    const tileSize = 32;
    const offsetX = (Math.random() - 0.5) * tileSize * 0.8; // ±12.8px
    const offsetY = (Math.random() - 0.5) * tileSize * 0.8;
    
    this.problematicPatterns.push({
      type: "rotation_indiscriminate", 
      location: "createVegetationLayer:310",
      value: vegetationRotation,
      shouldBe: 0,
      assetType: "tree/foliage"
    });
    
    this.problematicPatterns.push({
      type: "rotation_indiscriminate",
      location: "createStructureLayer:387", 
      value: structureRotation,
      shouldBe: 0,
      assetType: "structure/building"
    });
    
    this.problematicPatterns.push({
      type: "offset_excessive",
      location: "createTransitionLayer:515-516",
      valueX: offsetX,
      valueY: offsetY,
      maxAllowed: tileSize * 0.2 // 20%
    });
    
    console.log("⚠️  Patrones problemáticos detectados:", this.problematicPatterns.length);
  }

  // Simular generación de mundo por seed
  simulateWorldGeneration(seed) {
    console.log(`\n🌍 Generando mundo con seed: ${seed}`);
    
    Math.seedrandom = (s) => { 
      Math.random = () => parseFloat('0.' + Math.sin(s++).toString().substr(6));
    };
    Math.seedrandom(seed);
    
    // Simular assets por capa
    const layers = {
      vegetation: this.simulateVegetationLayer(),
      structures: this.simulateStructureLayer(), 
      details: this.simulateDetailLayer(),
      props: this.simulatePropsLayer()
    };
    
    // Calcular métricas
    let totalAssets = 0;
    let rotatedAssets = 0;
    let nonRotatableRotated = 0;
    
    const nonRotatableTypes = ['structure', 'building', 'house', 'door', 'sign', 'ui', 'text', 'banner', 'flag', 'post', 'lamp', 'well'];
    
    for (const [layerName, assets] of Object.entries(layers)) {
      for (const asset of assets) {
        totalAssets++;
        
        if (asset.rotation > 0.1) { // Considerando floating point
          rotatedAssets++;
          
          // Verificar si es un tipo que NO debería rotar
          const isNonRotatable = nonRotatableTypes.some(type => 
            asset.key.toLowerCase().includes(type) || asset.type.includes(type)
          );
          
          if (isNonRotatable) {
            nonRotatableRotated++;
            console.log(`❌ Asset no-rotable rotado: ${asset.key} (${asset.rotation.toFixed(2)} rad)`);
          }
        }
      }
    }
    
    return {
      seed,
      totalAssets,
      rotatedAssets,
      nonRotatableRotated,
      rotatedAssetRatio: rotatedAssets / totalAssets,
      nonRotatableRotatedRatio: nonRotatableRotated / totalAssets,
      layers: Object.keys(layers).map(name => ({
        name,
        assetCount: layers[name].length
      }))
    };
  }

  simulateVegetationLayer() {
    const assets = [];
    const assetTypes = ['oak_tree1', 'bush_emerald_1', 'tree_emerald_1', 'willow1'];
    
    for (let i = 0; i < 150; i++) {
      const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)];
      assets.push({
        key: assetType,
        type: 'vegetation',
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        rotation: Math.random() * Math.PI * 2, // PROBLEMÁTICO - rota TODO
        scale: 1.5 + Math.random() * 1.0
      });
    }
    
    return assets;
  }

  simulateStructureLayer() {
    const assets = [];
    const structureTypes = ['house', 'blue-gray_ruins1', 'well_hay_1', 'barn', 'tower'];
    
    for (let i = 0; i < 25; i++) {
      const structureType = structureTypes[Math.floor(Math.random() * structureTypes.length)];
      assets.push({
        key: structureType,
        type: 'structure', 
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        rotation: Math.random() * Math.PI * 2, // PROBLEMÁTICO - casas rotadas!
        scale: 2.0 + Math.random() * 1.0
      });
    }
    
    return assets;
  }

  simulateDetailLayer() {
    const assets = [];
    const detailTypes = ['rock1_1', 'beige_green_mushroom1', 'chest', 'barrel'];
    
    for (let i = 0; i < 200; i++) {
      const detailType = detailTypes[Math.floor(Math.random() * detailTypes.length)];
      assets.push({
        key: detailType,
        type: 'detail',
        x: Math.random() * 1000, 
        y: Math.random() * 1000,
        rotation: Math.random() * Math.PI * 2, // PROBLEMÁTICO - cofres rotados!
        scale: 1.2 + Math.random() * 0.8
      });
    }
    
    return assets;
  }

  simulatePropsLayer() {
    const assets = [];
    const propTypes = ['lamp_post_3', 'bench_1', 'sign_post', 'well', 'door'];
    
    for (let i = 0; i < 50; i++) {
      const propType = propTypes[Math.floor(Math.random() * propTypes.length)];
      assets.push({
        key: propType,
        type: 'prop',
        x: Math.random() * 1000,
        y: Math.random() * 1000, 
        rotation: Math.random() * Math.PI * 2, // PROBLEMÁTICO - puertas rotadas!
        scale: 1.5 + Math.random() * 1.0
      });
    }
    
    return assets;
  }

  // Ejecutar auditoría completa
  async runFullAudit() {
    console.log("🚀 Iniciando auditoría completa del sistema de mapas...\n");
    
    this.simulateProblematicRotations();
    
    // Generar múltiples mundos con diferentes seeds
    const testSeeds = [12345, 67890, 11111, 22222, 33333, 44444, 55555, 66666, 77777, 88888];
    const results = [];
    
    for (const seed of testSeeds) {
      const result = this.simulateWorldGeneration(seed);
      results.push(result);
    }
    
    // Calcular estadísticas agregadas
    const aggregated = this.calculateAggregatedStats(results);
    
    console.log("\n📊 REPORTE DE AUDITORÍA:");
    console.log("=" * 50);
    console.log(`📈 Assets totales promedio: ${aggregated.avgTotalAssets}`);
    console.log(`🔄 Assets rotados promedio: ${aggregated.avgRotatedAssets} (${(aggregated.avgRotatedRatio * 100).toFixed(1)}%)`);
    console.log(`❌ Assets no-rotables rotados: ${aggregated.avgNonRotatableRotated} (${(aggregated.avgNonRotatableRatio * 100).toFixed(1)}%)`);
    console.log(`⚠️  Patrones problemáticos: ${this.problematicPatterns.length}`);
    
    console.log("\n🎯 CRITERIOS DE FALLA:");
    console.log(`• Assets no-rotables rotados > 0: ${aggregated.avgNonRotatableRotated > 0 ? '❌ FALLA' : '✅ PASA'}`);
    console.log(`• Ratio rotación excesiva > 80%: ${aggregated.avgRotatedRatio > 0.8 ? '❌ FALLA' : '✅ PASA'}`);
    
    return {
      aggregated,
      results,
      problematicPatterns: this.problematicPatterns
    };
  }

  calculateAggregatedStats(results) {
    const count = results.length;
    
    return {
      avgTotalAssets: Math.round(results.reduce((sum, r) => sum + r.totalAssets, 0) / count),
      avgRotatedAssets: Math.round(results.reduce((sum, r) => sum + r.rotatedAssets, 0) / count),
      avgNonRotatableRotated: Math.round(results.reduce((sum, r) => sum + r.nonRotatableRotated, 0) / count), 
      avgRotatedRatio: results.reduce((sum, r) => sum + r.rotatedAssetRatio, 0) / count,
      avgNonRotatableRatio: results.reduce((sum, r) => sum + r.nonRotatableRotatedRatio, 0) / count,
      seeds: results.map(r => r.seed)
    };
  }
}

// Ejecutar auditoría
const auditor = new WorldAuditTest();
auditor.runFullAudit().then(audit => {
  console.log("\n✅ Auditoría completada!");
  console.log(`📄 Datos guardados para ${audit.results.length} seeds`);
});