Recopilando información del área de trabajo# Plan Completo de Refactor a Phaser 3 - Dúo Eterno 🧬

## Preflight - Análisis del Proyecto Actual

Ejecutando análisis profundo del codebase...

## 📊 Resumen Ejecutivo del Estado Actual

### Proyecto Actual: Dúo Eterno
- **15,000+ líneas de código** en React + Canvas 2D manual
- **490 assets** de pixel art organizados en taxonomía específica
- **Sistema complejo** de autopoiesis, resonancia y emergencia
- **Logging científico** para research (3,799+ archivos, 1.5GB de datos)
- **IA con personalidades** diferenciadas (Isa/Stev)
- **Performance**: ~30 FPS variable con problemas de memoria

### Funcionalidades Críticas a Preservar
1. **Sistema de Resonancia Matemático** con ecuaciones diferenciales exactas
2. **Autopoiesis** con 8 dimensiones de estado y decay híbrido
3. **IA con Personalidades** (circle vs square) y softmax temperature
4. **Research Logging** para análisis científico de emergencia
5. **Diálogos Filosóficos** contextuales (~200 únicos)
6. **Generación Orgánica** con Voronoi + Poisson disk
7. **Sistema de Supervivencia Mejorado** con alertas tempranas
8. **Persistencia** en localStorage con migración de versiones

## 🎯 Objetivo del Refactor

**Mantener 100% de la funcionalidad científica y emergente** mientras:
- Reducimos código en ~75-80% 
- Mejoramos performance a 60 FPS estables
- Simplificamos mantenimiento
- Habilitamos extensibilidad futura

## 📋 Plan Detallado de Migración (7 días)

### **Día 1: Setup y Arquitectura Base**

#### Mañana (4 horas)
1. **Crear proyecto Phaser 3 con Vite**
   - Setup TypeScript estricto
   - Configurar aliases de importación
   - Estructura de carpetas idéntica a la actual
   - Variables de entorno (.env) migradas

2. **Configuración de Phaser**
   - Canvas con pixel perfect nativo
   - Sistema de escenas (Boot, Intro, Main, UI, Debug)
   - Registry para estado global (reemplaza GameContext)
   - Event bus para comunicación entre sistemas

#### Tarde (4 horas)
3. **Migración de Constantes y Configuración**
   - Copiar TODOS los archivos de `/constants`
   - Migrar gameConfig.ts completo
   - Adaptar tipos TypeScript para Phaser
   - Validar que todas las variables de entorno funcionen

4. **Sistema de Logging**
   - Migrar `logger.ts` y `dynamicsLogger.ts` tal cual
   - Conectar con eventos de Phaser
   - Verificar que el research logging siga intacto

### **Día 2: Core Systems - Autopoiesis y Stats**

#### Mañana (4 horas)
1. **Sistema de Entidades Base**
   - Crear clase `Entity` extendiendo `Phaser.GameObjects.Sprite`
   - Migrar las 8 dimensiones de stats exactas
   - Implementar personalidades (circle/square)
   - Sistema de estados (IDLE, SEEKING, LOW_RESONANCE, FADING, DEAD)

2. **Sistema de Autopoiesis**
   - Migrar activityDynamics.ts COMPLETO
   - Preservar HYBRID_DECAY_RATES exactos
   - Mantener ACTIVITY_EFFECTS con todos sus multiplicadores
   - Implementar efectos día/noche con Phaser.Time

#### Tarde (4 horas)
3. **Sistema de Degradación**
   - Migrar lógica de survival costs
   - Implementar período de gracia cuando health < 10
   - Sistema de alertas tempranas
   - Verificar que los umbrales críticos sean idénticos

4. **Testing de Paridad**
   - Crear entidades de prueba
   - Verificar que decay rates sean exactos
   - Comparar con logs del juego actual
   - Ajustar cualquier discrepancia

### **Día 3: Resonancia e IA**

#### Mañana (4 horas)
1. **Sistema de Resonancia Completo**
   - Migrar las ecuaciones matemáticas EXACTAS:
     ```
     closeness = 1 / (1 + exp((distance - BOND_DISTANCE) / DISTANCE_SCALE))
     gain = BOND_GAIN_PER_SEC * closeness * moodBonus * synergy * (1 - R/100)
     separation = SEPARATION_DECAY_PER_SEC * (1 - closeness) * (R/100)
     stress = STRESS_DECAY_PER_SEC * stressCount * (R/100)
     dR/dt = gain - separation - stress
     ```
   - Implementar mood bonus y synergy
   - Efectos de resonancia en stats
   - Visualización con Phaser.Graphics

2. **Sistema de IA - Decisiones**
   - Migrar aiDecisionEngine.ts COMPLETO
   - Preservar personalidades (socialPreference, activityPersistence, etc.)
   - Implementar softmax con temperature exacta
   - Sistema de habits y reinforcement learning

#### Tarde (4 horas)
3. **Sistema de IA - Comportamiento**
   - Activity inertia y flow states
   - Urgency scores y cambios de actividad
   - Pathfinding con plugin EasyStar.js
   - Movimiento con física de Phaser.Arcade

4. **Sistema de Diálogos**
   - Migrar TODOS los diálogos de dialogues.ts
   - Sistema de selección contextual
   - Speech bubbles con Phaser.GameObjects.Text
   - Integración con sistema de emociones

### **Día 4: Mapa y Zonas**

#### Mañana (4 horas)
1. **Generación de Mapas**
   - Migrar organicMapGeneration.ts 
   - Implementar Voronoi con plugin
   - Poisson disk sampling para decoraciones
   - Generar tilemap de Phaser desde datos

2. **Sistema de Zonas**
   - Crear Phaser.GameObjects.Zone para cada área
   - Migrar efectos de zona exactos
   - Crowding effects y competencia
   - Attractiveness y pathfinding a zonas

#### Tarde (4 horas)
3. **Renderizado de Mapa**
   - Configurar Tilemap con múltiples capas
   - Migrar autotiling (si es necesario)
   - Sistema de decoraciones con ObjectPool
   - Optimización con culling automático

4. **Assets y Texturas**
   - Migrar los 490 assets TAL CUAL están
   - Crear texture atlases con TexturePacker
   - Configurar pixel perfect para cada asset
   - Sistema de carga por prioridad

### **Día 5: UI y Controles**

#### Mañana (4 horas)
1. **Escena de Intro**
   - Migrar IntroScene.tsx a Phaser Scene
   - Preservar TODA la narrativa filosófica
   - Sistema de texto typewriter
   - Transiciones entre escenas

2. **UI Principal**
   - Crear UIScene como overlay
   - Migrar stats display
   - Barra de resonancia
   - Botones de interacción (NOURISH, FEED, etc.)

#### Tarde (4 horas)
3. **Controles y Navegación**
   - Sistema de cámara con zoom/pan
   - Controles táctiles y mouse
   - Selección de entidades
   - Comandos de debug

4. **Panel de Debug**
   - Migrar DynamicsDebugPanel
   - Telemetría en tiempo real
   - Export de datos para research
   - Configuración de variables

### **Día 6: Research y Persistencia**

#### Mañana (4 horas)
1. **Sistema de Research Logging**
   - Migrar todo el sistema de logging científico
   - Pattern detection de comportamientos emergentes
   - Export a JSON para Python/R
   - Métricas de autopoiesis y co-evolución

2. **Sistema de Persistencia**
   - Migrar save/load con localStorage
   - Sistema de migración de versiones
   - Auto-save cada 20 ticks
   - Compatibilidad con saves anteriores

#### Tarde (4 horas)
3. **Telemetría y Analytics**
   - Sistema de eventos para research
   - Tracking de patterns emergentes
   - Detección de sincronización
   - Análisis de crisis y recuperación

4. **Testing de Features Científicas**
   - Verificar logging completo
   - Comparar outputs con versión actual
   - Validar detección de emergencia
   - Ajustar umbrales si es necesario

### **Día 7: Optimización y Polish**

#### Mañana (4 horas)
1. **Optimización de Performance**
   - Profiling con Chrome DevTools
   - Object pooling para entidades frecuentes
   - Optimizar render pipeline
   - Reducir allocations en game loop

2. **Testing de Paridad Completa**
   - Comparación lado a lado con juego actual
   - Verificar TODAS las constantes
   - Validar comportamientos emergentes
   - Ajustes finos de gameplay

#### Tarde (4 horas)
3. **Polish y Detalles**
   - Efectos visuales (partículas para emociones)
   - Audio reactivo a resonancia (opcional)
   - Transiciones suaves
   - Feedback visual mejorado

4. **Documentación y Entrega**
   - README actualizado
   - Guía de migración para research data
   - Documentar cambios en la API
   - Deploy a Vercel

## 🔄 Mapeo de Sistemas Actual → Phaser

| Sistema Actual | Implementación en Phaser | Complejidad |
|----------------|--------------------------|-------------|
| **GameContext + Reducer** | Phaser.Registry + Events | Media |
| **useGameLoop** | Scene.update() nativo | Fácil |
| **Canvas rendering manual** | WebGL automático | Eliminado |
| **Colisiones manuales** | Phaser.Physics.Arcade | Fácil |
| **Animaciones custom** | Phaser.Animations | Fácil |
| **Cámara manual** | Phaser.Cameras | Fácil |
| **UI con React** | Phaser Scene overlay | Media |
| **Research logging** | Migración directa | Fácil |
| **IA y decisiones** | Migración directa | Media |
| **Resonancia matemática** | Migración directa | Fácil |

## ⚠️ Riesgos y Mitigaciones

### Riesgo 1: Pérdida de precisión en matemáticas
- **Mitigación**: Copiar código línea por línea, no reescribir
- **Validación**: Comparar outputs con logs actuales

### Riesgo 2: Cambios en comportamiento emergente
- **Mitigación**: Preservar TODAS las constantes exactas
- **Validación**: Testing extensivo con seeds conocidas

### Riesgo 3: Incompatibilidad con research data
- **Mitigación**: Mantener mismo formato de logging
- **Validación**: Scripts de Python/R deben seguir funcionando

### Riesgo 4: Performance en móviles
- **Mitigación**: Phaser tiene optimizaciones móviles nativas
- **Validación**: Testing en dispositivos reales

## ✅ Criterios de Éxito

1. **Paridad Funcional**: 100% de features preservadas
2. **Performance**: 60 FPS estables (2x mejora)
3. **Código**: <3,000 líneas (~80% reducción)
4. **Research**: Logging idéntico, patterns emergentes preservados
5. **Mantenibilidad**: Código más simple y extensible

## 🚀 Beneficios Esperados

- **Desarrollo 10x más rápido** para nuevas features
- **Bugs reducidos** por usar framework battle-tested
- **Performance garantizado** con WebGL
- **Documentación extensa** de Phaser
- **Comunidad activa** para soporte
- **Plugins ecosystem** para features futuras
- **Mobile-ready** sin trabajo adicional

## 📝 Notas Importantes

1. **NO REESCRIBIR** - Migrar código existente adaptándolo
2. **PRESERVAR CONSTANTES** - Ni un solo valor debe cambiar
3. **VALIDAR CONTINUAMENTE** - Comparar con juego actual
4. **DOCUMENTAR CAMBIOS** - Para que researchers entiendan
5. **MANTENER COMPATIBILIDAD** - Con datos de research existentes

## 🎮 Resultado Final

Un juego que:
- Se ve idéntico
- Se comporta idéntico  
- Genera los mismos patterns emergentes
- Pero con 80% menos código
- Y 100% mejor performance
- Listo para crecer

**El alma científica del proyecto permanece intacta, solo cambia la implementación técnica.**