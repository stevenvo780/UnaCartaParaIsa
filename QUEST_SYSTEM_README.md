# 🗡️ Sistema de Misiones RPG - Una Carta Para Isa

## 📋 Descripción

Un sistema completo de misiones estilo RPG integrado con todos los sistemas existentes del juego. No reinventa la rueda, sino que aprovecha todas las herramientas ya disponibles en Phaser y el motor del juego.

## 🎮 Controles

- **Q** - Abrir/cerrar panel de misiones
- **Interacción automática** - Las misiones se actualizan automáticamente basadas en actividades

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **QuestSystem** (`src/systems/QuestSystem.ts`)
   - Motor principal del sistema de misiones
   - Gestiona estado, progreso y recompensas
   - Integrado con EventEmitter de Phaser

2. **QuestController** (`src/systems/QuestController.ts`)
   - Controlador inteligente que detecta actividades
   - Auto-activa misiones basadas en contexto
   - Integrado con GameLogicManager existente

3. **QuestUI** (`src/components/QuestUI.ts`)
   - UI simple y elegante usando componentes Phaser
   - Notificaciones automáticas
   - Panel de seguimiento de progreso

4. **QuestCatalog** (`src/data/QuestCatalog.ts`)
   - Catálogo de misiones con textos ricos estilo RPG
   - Misiones principales, secundarias y diarias
   - Sistema de requisitos y recompensas

## 🎯 Tipos de Misiones Disponibles

### Misiones Principales
- **"El Despertar de la Resonancia"** - Tutorial de encuentro entre Isa y Stev
- **"El Banquete de los Recuerdos"** - Misión de cocina y memoria

### Misiones Secundarias
- **"El Jardín de los Susurros"** - Exploración mística
- **"Fragmentos del Ayer"** - Recolección de memorias

### Misiones Diarias
- **"Meditación de Resonancia Diaria"** - Fortalecimiento del vínculo

### Misiones de Exploración
- **"Ecos de Civilizaciones Perdidas"** - Exploración de ruinas antiguas

## 🎲 Tipos de Objetivos

- `find_item` - Encontrar objetos específicos
- `talk_to_npc` - Interactuar con entidades
- `reach_location` - Llegar a ubicaciones específicas
- `collect_resource` - Recolectar recursos
- `survive_time` - Sobrevivir cierto tiempo
- `achieve_stats` - Alcanzar niveles de estadísticas
- `complete_activity` - Completar actividades específicas
- `interact_with_entity` - Interactuar con compañero

## 🏆 Sistema de Recompensas

- **Experiencia** - Puntos de experiencia del juego
- **Boost de Stats** - Mejoras temporales de estadísticas
- **Dinero** - Monedas del juego
- **Títulos** - Logros especiales
- **Desbloqueos** - Nuevas características del juego
- **Comida** - Ítems consumibles

## 🤖 Integración Automática

### Con Sistemas Existentes

- **GameLogicManager** - Recibe actualizaciones de estado
- **DialogueSystem** - Muestra diálogos de misiones
- **FoodSystem** - Detecta consumo de comida
- **Entidades** - Monitorea actividades y ubicaciones
- **EventEmitter** - Usa sistema de eventos de Phaser

### Detección Automática

- **Actividades** - Cocinar, comer, meditar, explorar
- **Proximidad** - Distancia entre Isa y Stev
- **Estadísticas** - Niveles de hambre, resonancia, felicidad
- **Ubicaciones** - Llegada a puntos específicos
- **Interacciones** - Contacto entre entidades

## 🎨 Características RPG

### Textos Narrativos
- Descripciones ricas y evocativas
- Diálogos contextuales
- Lore y trasfondo profundo
- Hints y pistas para objetivos

### Sistema de Dificultad
- **Fácil** - Misiones tutorial
- **Medio** - Misiones estándar
- **Difícil** - Desafíos complejos
- **Legendario** - Misiones épicas

### Categorías
- Historia principal
- Misiones secundarias
- Desafíos diarios
- Exploración
- Romance
- Misterio
- Supervivencia

## 🔧 Uso Técnico

### Inicialización
```typescript
// En MainScene.ts - Ya implementado
this.questSystem = new QuestSystem(this);
this.questController = new QuestController(this, this.questSystem, this.dialogueSystem);
this.questUI = new QuestUI(this);
```

### Activación Manual
```typescript
// Iniciar misión específica
this.questSystem.startQuest('main_awakening');

// Actualizar progreso de objetivo
this.questSystem.updateObjectiveProgress('quest_id', 'objective_id');
```

### Eventos Personalizados
```typescript
// Escuchar eventos de misiones
this.scene.events.on('quest_completed', (event) => {
  console.log('Misión completada:', event.questId);
});
```

## 📊 Estado Actual

### ✅ Implementado
- Sistema completo de misiones con 6+ misiones de ejemplo
- UI funcional con notificaciones
- Integración con todos los sistemas existentes
- Detección automática de actividades
- Sistema de recompensas
- Catálogo extenso de misiones con textos RPG

### 🔄 Auto-activación Inteligente
- Misión de comida cuando hay hambre baja
- Misión de resonancia cuando están cerca
- Misiones de exploración basadas en movimiento
- Activación contextual basada en actividades

### 🎯 Listo para Usar
El sistema está completamente funcional y se integra sin problemas con el juego existente. Solo presiona **Q** en el juego para ver las misiones activas.

## 🚀 Extensión Futura

El sistema está diseñado para ser fácilmente extensible:

1. **Agregar Misiones** - Solo añadir al QuestCatalog
2. **Nuevos Objetivos** - Extender tipos en QuestController
3. **Recompensas Personalizadas** - Implementar en QuestSystem
4. **UI Mejorada** - Expandir QuestUI con más características

¡El sistema de misiones está listo y funcionando! 🎮✨