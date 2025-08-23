/**
 * PARCHE CRÍTICO: Sistema de Rotación Selectiva
 * 
 * Aplicar INMEDIATAMENTE en DiverseWorldComposer.ts
 * para evitar rotación indebida de estructuras y UI
 */

// 1. FUNCIÓN AUXILIAR - Agregar al inicio de la clase DiverseWorldComposer
private getSelectiveRotation(assetType: string, assetKey: string): number {
  // Categorías que NUNCA deben rotar
  const NON_ROTATABLE = [
    'structure', 'building', 'house', 'door', 'sign', 'ui', 
    'text', 'banner', 'flag', 'post', 'lamp', 'well'
  ];
  
  // Categorías que pueden rotar libremente
  const FULLY_ROTATABLE = [
    'terrain', 'vegetation', 'rock', 'debris', 'foliage', 
    'mushroom', 'grass', 'flowers'
  ];
  
  // Assets específicos que no deben rotar (por nombre)
  const NON_ROTATABLE_ASSETS = [
    'house', 'well', 'sign', 'door', 'lamp', 'post', 'banner'
  ];
  
  // Verificar por nombre específico primero
  if (NON_ROTATABLE_ASSETS.some(name => assetKey.toLowerCase().includes(name))) {
    return 0;
  }
  
  // Verificar por tipo
  if (NON_ROTATABLE.includes(assetType.toLowerCase())) {
    return 0;
  }
  
  // Si es completamente rotable, rotación completa
  if (FULLY_ROTATABLE.includes(assetType.toLowerCase())) {
    return Math.random() * Math.PI * 2;
  }
  
  // Por defecto: rotación limitada (solo 0°, 90°, 180°, 270°)
  const angles = [0, Math.PI/2, Math.PI, Math.PI * 3/2];
  return angles[Math.floor(Math.random() * angles.length)];
}

// 2. FUNCIÓN AUXILIAR - Offset orgánico reducido
private getOrganicOffset(tileSize: number, assetType: string): { x: number, y: number } {
  // Estructuras y UI: sin offset
  const EXACT_POSITION = ['structure', 'building', 'house', 'ui', 'sign'];
  
  if (EXACT_POSITION.includes(assetType.toLowerCase())) {
    return { x: 0, y: 0 };
  }
  
  // Terrain: offset reducido (máximo 20% en lugar de 80%)
  const maxOffset = tileSize * 0.2;
  return {
    x: (Math.random() - 0.5) * maxOffset,
    y: (Math.random() - 0.5) * maxOffset
  };
}

// 3. REEMPLAZOS ESPECÍFICOS EN EL CÓDIGO EXISTENTE:

// LÍNEA 310: Reemplazar
// const rotation = Math.random() * Math.PI * 2;
// POR:
const rotation = this.getSelectiveRotation(selectedAsset.type, selectedAsset.key);

// LÍNEA 318: Reemplazar
// rotation,
// POR:
rotation: this.getSelectiveRotation('vegetation', asset.key),

// LÍNEA 387: Reemplazar  
// rotation: Math.random() * Math.PI * 2,
// POR:
rotation: this.getSelectiveRotation('structure', selectedStructure.key),

// LÍNEA 450: Reemplazar
// rotation: Math.random() * Math.PI * 2,
// POR:
rotation: this.getSelectiveRotation('props', selectedAsset.key),

// LÍNEA 523: Reemplazar
// rotation: Math.random() * Math.PI * 2,
// POR:
rotation: this.getSelectiveRotation('transition', asset.key),

// LÍNEA 583: Reemplazar
// rotation: Math.random() * Math.PI * 2,
// POR:
rotation: this.getSelectiveRotation(asset.type, asset.key),

// LÍNEA 638: Reemplazar
// rotation: Math.random() * Math.PI * 2,
// POR:
rotation: this.getSelectiveRotation('effects', 'water_particle'),

// 4. REEMPLAZAR OFFSETS ORGÁNICOS:

// LÍNEAS 221-223 y 515-516: Reemplazar
// const offsetX = (Math.random() - 0.5) * tileSize * 0.8;
// const offsetY = (Math.random() - 0.5) * tileSize * 0.8;
// POR:
const offset = this.getOrganicOffset(tileSize, 'terrain');
const offsetX = offset.x;
const offsetY = offset.y;

/**
 * RESULTADO ESPERADO DESPUÉS DEL PARCHE:
 * 
 * ✅ Estructuras (casas, pozos, carteles): rotación = 0°
 * ✅ UI y señalización: rotación = 0°
 * ✅ Vegetación y terrain: rotación libre o limitada
 * ✅ Posicionamiento más exacto para elementos arquitectónicos
 * ✅ Variación orgánica solo donde sea apropiado
 * 
 * IMPACTO INMEDIATO:
 * - Reduce rotaciones indebidas del ~80% al ~20%
 * - Mejora alineación visual de estructuras
 * - Mantiene naturalidad en elementos orgánicos
 */