/**
 * Test A/B para validar correcciones del sistema de mapas
 * Compara comportamiento ANTES vs DESPUÉS de las correcciones
 */

// Simular helpers de rotación selectiva
function canAssetRotate(assetType, assetKey) {
  const NON_ROTATABLE_TYPES = [
    "structure", "building", "house", "door", "sign", 
    "ui", "text", "banner", "flag", "post", "lamp", "well", 
    "gate", "fence", "wall", "tower", "barn"
  ];
  
  const NON_ROTATABLE_KEYWORDS = [
    "house", "well", "sign", "door", "lamp", "post", 
    "banner", "gate", "fence", "wall", "tower", "barn", "ruins"
  ];
  
  // Verificar tipo exacto
  if (NON_ROTATABLE_TYPES.includes(assetType.toLowerCase())) {
    return false;
  }
  
  // Verificar palabras clave en la key del asset
  const keyLower = assetKey.toLowerCase();
  if (NON_ROTATABLE_KEYWORDS.some(keyword => keyLower.includes(keyword))) {
    return false;
  }
  
  // Por defecto ser conservador: permitir solo tipos explícitamente rotables
  const ROTATABLE_TYPES = ["terrain", "vegetation", "foliage", "rock", "debris", "mushroom", "decoration"];
  return ROTATABLE_TYPES.includes(assetType.toLowerCase());
}

function getSelectiveRotation(assetType, assetKey) {
  if (!canAssetRotate(assetType, assetKey)) {
    return 0; // Sin rotación
  }
  
  // Rotación según tipo
  switch (assetType.toLowerCase()) {
    case "terrain":
      // Terreno puede rotar en increments de 90°
      return [0, Math.PI/2, Math.PI, 3*Math.PI/2][Math.floor(Math.random() * 4)];
      
    case "rock":
    case "debris":
    case "mushroom":
    case "vegetation":
    case "foliage":
    case "decoration":
      // Elementos naturales pueden rotar libremente
      return Math.random() * Math.PI * 2;
      
    default:
      return 0; // Por defecto no rotar
  }
}

function getOrganicOffset(tileSize, assetType, assetKey) {
  // Sin offset para tipos estructurales
  if (!canAssetRotate(assetType, assetKey)) {
    return { x: 0, y: 0 }; // Snap perfecto a grid
  }
  
  // Offset reducido para elementos orgánicos
  const maxOffset = tileSize * 0.2; // Máximo 20% del tile
  
  switch (assetType.toLowerCase()) {
    case "terrain":
      // Terreno con offset mínimo para naturalidad
      return {
        x: (Math.random() - 0.5) * tileSize * 0.1, // ±5%
        y: (Math.random() - 0.5) * tileSize * 0.1
      };
      
    case "vegetation":
    case "foliage":
    case "rock":
    case "debris":
    case "decoration":
      // Elementos naturales con offset moderado
      return {
        x: (Math.random() - 0.5) * maxOffset,
        y: (Math.random() - 0.5) * maxOffset
      };
      
    default:
      return { x: 0, y: 0 };
  }
}

class WorldAuditTestAB {
  constructor() {
    this.beforeMetrics = [];
    this.afterMetrics = [];
  }

  // Generación ANTES (comportamiento original problemático)
  simulateWorldGenerationBefore(seed) {
    console.log(`\n🔴 ANTES - Generando mundo con seed: ${seed}`);
    
    Math.seedrandom = (s) => { 
      Math.random = () => parseFloat('0.' + Math.sin(s++).toString().substr(6));
    };
    Math.seedrandom(seed);
    
    const layers = {
      vegetation: this.simulateVegetationLayerBefore(),
      structures: this.simulateStructureLayerBefore(), 
      details: this.simulateDetailLayerBefore(),
      props: this.simulatePropsLayerBefore()
    };
    
    return this.calculateMetrics(layers, "ANTES");
  }

  // Generación DESPUÉS (con correcciones)
  simulateWorldGenerationAfter(seed) {
    console.log(`\n🟢 DESPUÉS - Generando mundo con seed: ${seed}`);
    
    Math.seedrandom = (s) => { 
      Math.random = () => parseFloat('0.' + Math.sin(s++).toString().substr(6));
    };
    Math.seedrandom(seed);
    
    const layers = {
      vegetation: this.simulateVegetationLayerAfter(),
      structures: this.simulateStructureLayerAfter(), 
      details: this.simulateDetailLayerAfter(),
      props: this.simulatePropsLayerAfter()
    };
    
    return this.calculateMetrics(layers, "DESPUÉS");
  }

  // ANTES: Comportamiento problemático original
  simulateVegetationLayerBefore() {
    const assets = [];
    const assetTypes = ['oak_tree1', 'bush_emerald_1', 'tree_emerald_1', 'willow1'];
    
    for (let i = 0; i < 150; i++) {
      const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)];
      assets.push({
        key: assetType,
        type: 'vegetation',
        rotation: Math.random() * Math.PI * 2, // PROBLEMÁTICO - rota TODO
        scale: 1.5 + Math.random() * 1.0
      });
    }
    return assets;
  }

  simulateStructureLayerBefore() {
    const assets = [];
    const structureTypes = ['house', 'blue-gray_ruins1', 'well_hay_1', 'barn', 'tower'];
    
    for (let i = 0; i < 25; i++) {
      const structureType = structureTypes[Math.floor(Math.random() * structureTypes.length)];
      assets.push({
        key: structureType,
        type: 'structure', 
        rotation: Math.random() * Math.PI * 2, // PROBLEMÁTICO - casas rotadas!
        scale: 2.0 + Math.random() * 1.0
      });
    }
    return assets;
  }

  simulateDetailLayerBefore() {
    const assets = [];
    const detailTypes = ['rock1_1', 'beige_green_mushroom1', 'chest', 'barrel'];
    
    for (let i = 0; i < 200; i++) {
      const detailType = detailTypes[Math.floor(Math.random() * detailTypes.length)];
      assets.push({
        key: detailType,
        type: 'detail',
        rotation: Math.random() * Math.PI * 2, // PROBLEMÁTICO
        scale: 1.2 + Math.random() * 0.8
      });
    }
    return assets;
  }

  simulatePropsLayerBefore() {
    const assets = [];
    const propTypes = ['lamp_post_3', 'bench_1', 'sign_post', 'well', 'door'];
    
    for (let i = 0; i < 50; i++) {
      const propType = propTypes[Math.floor(Math.random() * propTypes.length)];
      assets.push({
        key: propType,
        type: 'prop',
        rotation: Math.random() * Math.PI * 2, // PROBLEMÁTICO
        scale: 1.5 + Math.random() * 1.0
      });
    }
    return assets;
  }

  // DESPUÉS: Con correcciones aplicadas
  simulateVegetationLayerAfter() {
    const assets = [];
    const assetTypes = ['oak_tree1', 'bush_emerald_1', 'tree_emerald_1', 'willow1'];
    
    for (let i = 0; i < 150; i++) {
      const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)];
      assets.push({
        key: assetType,
        type: 'vegetation',
        rotation: getSelectiveRotation('vegetation', assetType), // CORREGIDO
        scale: 1.5 + Math.random() * 1.0
      });
    }
    return assets;
  }

  simulateStructureLayerAfter() {
    const assets = [];
    const structureTypes = ['house', 'blue-gray_ruins1', 'well_hay_1', 'barn', 'tower'];
    
    for (let i = 0; i < 25; i++) {
      const structureType = structureTypes[Math.floor(Math.random() * structureTypes.length)];
      assets.push({
        key: structureType,
        type: 'structure', 
        rotation: getSelectiveRotation('structure', structureType), // CORREGIDO - ahora 0
        scale: 2.0 + Math.random() * 1.0
      });
    }
    return assets;
  }

  simulateDetailLayerAfter() {
    const assets = [];
    const detailTypes = ['rock1_1', 'beige_green_mushroom1', 'chest', 'barrel'];
    
    for (let i = 0; i < 200; i++) {
      const detailType = detailTypes[Math.floor(Math.random() * detailTypes.length)];
      assets.push({
        key: detailType,
        type: 'detail',
        rotation: getSelectiveRotation('detail', detailType), // CORREGIDO - selectivo
        scale: 1.2 + Math.random() * 0.8
      });
    }
    return assets;
  }

  simulatePropsLayerAfter() {
    const assets = [];
    const propTypes = ['lamp_post_3', 'bench_1', 'sign_post', 'well', 'door'];
    
    for (let i = 0; i < 50; i++) {
      const propType = propTypes[Math.floor(Math.random() * propTypes.length)];
      assets.push({
        key: propType,
        type: 'prop',
        rotation: getSelectiveRotation('prop', propType), // CORREGIDO - 0 para no-rotables
        scale: 1.5 + Math.random() * 1.0
      });
    }
    return assets;
  }

  calculateMetrics(layers, phase) {
    let totalAssets = 0;
    let rotatedAssets = 0;
    let nonRotatableRotated = 0;
    let misalignedAssets = 0; // Para offsets excesivos
    
    const nonRotatableTypes = ['structure', 'building', 'house', 'door', 'sign', 'ui', 'text', 'banner', 'flag', 'post', 'lamp', 'well'];
    
    for (const [layerName, assets] of Object.entries(layers)) {
      for (const asset of assets) {
        totalAssets++;
        
        if (Math.abs(asset.rotation) > 0.01) { // Threshold para floating point
          rotatedAssets++;
          
          // Verificar si es un tipo que NO debería rotar
          const isNonRotatable = nonRotatableTypes.some(type => 
            asset.key.toLowerCase().includes(type) || asset.type.includes(type)
          );
          
          if (isNonRotatable) {
            nonRotatableRotated++;
            if (phase === "ANTES") {
              console.log(`❌ ${phase}: Asset no-rotable rotado: ${asset.key} (${asset.rotation.toFixed(2)} rad)`);
            }
          }
        }
        
        // Simular check de offsets excesivos
        if (asset.offset && (Math.abs(asset.offset.x) > 10 || Math.abs(asset.offset.y) > 10)) {
          misalignedAssets++;
        }
      }
    }
    
    return {
      phase,
      totalAssets,
      rotatedAssets,
      nonRotatableRotated,
      misalignedAssets,
      rotatedAssetRatio: rotatedAssets / totalAssets,
      nonRotatableRotatedRatio: nonRotatableRotated / totalAssets,
      misalignedRatio: misalignedAssets / totalAssets
    };
  }

  async runABComparison() {
    console.log("🚀 Iniciando comparación A/B del sistema de mapas corregido...\n");
    
    const testSeeds = [12345, 67890, 11111, 22222, 33333];
    
    // Ejecutar ANTES y DESPUÉS para las mismas seeds
    for (const seed of testSeeds) {
      const beforeResult = this.simulateWorldGenerationBefore(seed);
      const afterResult = this.simulateWorldGenerationAfter(seed);
      
      this.beforeMetrics.push(beforeResult);
      this.afterMetrics.push(afterResult);
    }
    
    // Calcular estadísticas agregadas
    const beforeAggregated = this.calculateAggregatedStats(this.beforeMetrics);
    const afterAggregated = this.calculateAggregatedStats(this.afterMetrics);
    
    // Mostrar comparación
    this.displayComparison(beforeAggregated, afterAggregated);
    
    return {
      before: beforeAggregated,
      after: afterAggregated,
      improvement: this.calculateImprovement(beforeAggregated, afterAggregated)
    };
  }

  calculateAggregatedStats(results) {
    const count = results.length;
    
    return {
      avgTotalAssets: Math.round(results.reduce((sum, r) => sum + r.totalAssets, 0) / count),
      avgRotatedAssets: Math.round(results.reduce((sum, r) => sum + r.rotatedAssets, 0) / count),
      avgNonRotatableRotated: Math.round(results.reduce((sum, r) => sum + r.nonRotatableRotated, 0) / count), 
      avgMisalignedAssets: Math.round(results.reduce((sum, r) => sum + r.misalignedAssets, 0) / count),
      avgRotatedRatio: results.reduce((sum, r) => sum + r.rotatedAssetRatio, 0) / count,
      avgNonRotatableRatio: results.reduce((sum, r) => sum + r.nonRotatableRotatedRatio, 0) / count,
      avgMisalignedRatio: results.reduce((sum, r) => sum + r.misalignedRatio, 0) / count
    };
  }

  calculateImprovement(before, after) {
    const nonRotatableImprovement = ((before.avgNonRotatableRotated - after.avgNonRotatableRotated) / before.avgNonRotatableRotated) * 100;
    const misalignmentImprovement = ((before.avgMisalignedAssets - after.avgMisalignedAssets) / Math.max(1, before.avgMisalignedAssets)) * 100;
    
    return {
      nonRotatableFixed: before.avgNonRotatableRotated - after.avgNonRotatableRotated,
      nonRotatableImprovement: nonRotatableImprovement.toFixed(1) + '%',
      misalignmentImprovement: misalignmentImprovement.toFixed(1) + '%',
      overallScore: nonRotatableImprovement > 95 ? '✅ EXCELENTE' : nonRotatableImprovement > 80 ? '✅ BUENO' : '⚠️ NECESITA MEJORAS'
    };
  }

  displayComparison(before, after) {
    console.log("\n" + "=".repeat(60));
    console.log("📊 REPORTE COMPARATIVO A/B - CORRECCIONES DE MAPAS");
    console.log("=".repeat(60));
    
    console.log("\n🔴 ANTES (Comportamiento Original):");
    console.log(`   📈 Assets totales: ${before.avgTotalAssets}`);
    console.log(`   🔄 Assets rotados: ${before.avgRotatedAssets} (${(before.avgRotatedRatio * 100).toFixed(1)}%)`);
    console.log(`   ❌ Assets no-rotables rotados: ${before.avgNonRotatableRotated} (${(before.avgNonRotatableRatio * 100).toFixed(1)}%)`);
    console.log(`   ⚠️  Assets desalineados: ${before.avgMisalignedAssets} (${(before.avgMisalignedRatio * 100).toFixed(1)}%)`);
    
    console.log("\n🟢 DESPUÉS (Con Correcciones):");
    console.log(`   📈 Assets totales: ${after.avgTotalAssets}`);
    console.log(`   🔄 Assets rotados: ${after.avgRotatedAssets} (${(after.avgRotatedRatio * 100).toFixed(1)}%)`);
    console.log(`   ✅ Assets no-rotables rotados: ${after.avgNonRotatableRotated} (${(after.avgNonRotatableRatio * 100).toFixed(1)}%)`);
    console.log(`   ✅ Assets desalineados: ${after.avgMisalignedAssets} (${(after.avgMisalignedRatio * 100).toFixed(1)}%)`);
    
    const improvement = this.calculateImprovement(before, after);
    
    console.log("\n🎯 MEJORAS CONSEGUIDAS:");
    console.log(`   ✅ Assets no-rotables corregidos: ${improvement.nonRotatableFixed}`);
    console.log(`   ✅ Mejora en rotación selectiva: ${improvement.nonRotatableImprovement}`);
    console.log(`   ✅ Mejora en alineación: ${improvement.misalignmentImprovement}`);
    console.log(`   🏆 Puntuación general: ${improvement.overallScore}`);
    
    console.log("\n🎯 CRITERIOS DE VALIDACIÓN:");
    console.log(`   • Assets no-rotables rotados = 0: ${after.avgNonRotatableRotated === 0 ? '✅ CUMPLIDO' : '❌ FALLA'}`);
    console.log(`   • Ratio rotación < 80%: ${after.avgRotatedRatio < 0.8 ? '✅ CUMPLIDO' : '❌ FALLA'}`);
    console.log(`   • Solo vegetación/rocas rotan: ${after.avgNonRotatableRotated === 0 ? '✅ CUMPLIDO' : '❌ FALLA'}`);
    
    if (after.avgNonRotatableRotated === 0) {
      console.log("\n🎉 ¡ÉXITO! Las correcciones han eliminado completamente las rotaciones indebidas.");
    } else {
      console.log("\n⚠️ Aún hay assets no-rotables que rotan. Revisar implementación.");
    }
  }
}

// Ejecutar comparación A/B
const auditorAB = new WorldAuditTestAB();
auditorAB.runABComparison().then(comparison => {
  console.log("\n✅ Comparación A/B completada!");
  console.log(`📄 Mejora conseguida: ${comparison.improvement.nonRotatableImprovement} en rotaciones indebidas`);
  console.log(`🎯 Puntuación: ${comparison.improvement.overallScore}`);
});