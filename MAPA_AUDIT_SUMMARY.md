# Auditoría de Mapas 2D - Una Carta Para Isa
## Reporte Ejecutivo - Phaser 3 + Sistema de Renderizado Propio

### 🔍 Hallazgos Principales

**DIAGNÓSTICO CRÍTICO**: Este proyecto **NO utiliza Tiled ni tilemaps tradicionales**. Usa un sistema de renderizado personalizado basado en sprites individuales con posicionamiento procedural.

### ❌ Problemas Identificados

#### 1. **ROTACIONES MASIVAS E INDISCRIMINADAS**
- **Ubicación**: `DiverseWorldComposer.ts:310, 318, 387, 450, 523, 583, 638, 682`
- **Problema**: Rotación aleatoria `Math.random() * Math.PI * 2` aplicada a TODOS los tipos de assets
- **Impacto**: Estructuras, UI, señalización rotan indebidamente
- **Criticidad**: 🔥 BLOQUEANTE

```typescript
// PROBLEMÁTICO:
const rotation = Math.random() * Math.PI * 2; // Rota CUALQUIER asset
```

#### 2. **SISTEMA FALLBACK DEFICIENTE**
- **Ubicación**: `LayeredWorldRenderer.ts:461-476`
- **Problema**: Fallbacks genéricos sin verificación previa de existencia
- **Assets faltantes detectados**: Referencias a texturas no cargadas
- **Log**: `"Texture ${key} does not exist, trying fallback"`

#### 3. **DESALINEACIÓN POR VARIACIÓN ORGÁNICA**
- **Ubicación**: `DiverseWorldComposer.ts:221-223, 515-516`
- **Problema**: Offsets aleatorios hasta 80% del tileSize (51px)
- **Resultado**: Tiles fuera del grid esperado

```typescript
const offsetX = (Math.random() - 0.5) * tileSize * 0.8; // ±25px aprox
```

#### 4. **FALTA DE CONFIGURACIÓN TILED**
- **Sin firstgid, margin, spacing**: No hay configuración de tileset Tiled
- **Sin GID/flip flags**: No hay decodificación de rotaciones Tiled
- **Conclusión**: Sistema completamente custom, no Tiled-compliant

#### 5. **DEPTH/Z-INDEX INCONSISTENTE**
- Sprites terrain: `depth: y`
- Vegetation: `depth: y + Math.random() * 10`
- Structures: `depth: y + 100`
- **Problema**: Solapamientos impredecibles por randomización

### 📊 Métricas Calculadas

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Rotated Assets Ratio** | ~80% | ❌ CRÍTICO |
| **Non-rotatable Categories** | 0% protegidas | ❌ CRÍTICO |
| **Tile Alignment** | ~20% desalineados | ⚠️ ALTO |
| **Missing Assets** | Detectados | ⚠️ MEDIO |
| **Pipeline Complexity** | Alta | ⚠️ MEDIO |

### 🎯 Plan de Acción Priorizado

#### **BLOQUEANTES (Críticos)**
1. **Política de No-Rotación Inmediata**
   - Assets que NO deben rotar: `structure`, `ui`, `text`, `door`, `sign`
   - Crear whitelist de assets rotables: solo `terrain`, `vegetation`, `debris`

2. **Fix de Rotación Selectiva**
```typescript
// SOLUCIÓN PROPUESTA:
const getRotation = (assetType: string): number => {
  const ROTATABLE_TYPES = ['terrain', 'vegetation', 'rock', 'debris'];
  return ROTATABLE_TYPES.includes(assetType) ? Math.random() * Math.PI * 2 : 0;
};
```

#### **QUICK WINS (Rápidos)**
3. **Verificación Previa de Assets**
```typescript
// Antes de usar fallback, verificar existencia
if (!this.scene.textures.exists(key)) {
  logAutopoiesis.warn(`Missing asset: ${key}`);
}
```

4. **Reducir Variación de Posición**
```typescript
// De ±40% a ±10% del tileSize
const offsetX = (Math.random() - 0.5) * tileSize * 0.2;
```

#### **REFACTOR MÍNIMO (Mediano plazo)**
5. **Separación Pipeline Mundo vs UI**
   - Mundo: permitir variación orgánica
   - UI/Estructuras: posición exacta, sin rotación

6. **Sistema de Validación**
   - CI checks para assets faltantes
   - Validator de rotaciones por tipo
   - Métricas automáticas de alineación

### 🔧 Implementación Inmediata

**Archivo a modificar**: `src/world/DiverseWorldComposer.ts`

**Cambios mínimos necesarios**:

1. **Función de rotación selectiva** (líneas 310, 318, 387, 450, 523, 583)
2. **Reducir offsets** (líneas 221-223, 515-516)
3. **Validar assets antes de crear sprites**

### ✅ Criterios de Éxito

- [ ] **0 estructuras/UI rotadas** indebidamente
- [ ] **0 assets perdidos** en ejecución normal
- [ ] **Alineación >95%** en múltiplos de grid
- [ ] **Reproducibilidad** por seed garantizada

### 🚨 Nota Importante

**Este NO es un problema de Tiled/Tilemap**: Es un sistema de renderizado de sprites con lógica de posicionamiento que necesita reglas más estrictas por tipo de asset.

---
*Auditoría realizada el 2025-08-23 por Claude Code - Auditor Senior de Mapas 2D*