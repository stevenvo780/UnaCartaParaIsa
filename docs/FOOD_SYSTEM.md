# 🍕 Sistema de Comida - "Una Carta Para Isa"

## 📋 Resumen

Sistema completo de mecánicas de comida que permite a las entidades comprar, almacenar, consumir alimentos y obtener efectos positivos/negativos según el tipo de comida consumida.

## 🎮 Cómo Usar

### Controles del Jugador
- **Tecla I**: Abrir/cerrar inventario de comida
- **Tecla ESPACIO**: Comer (si tienes comida cerca o en inventario)
- **Tecla ESC**: Cerrar todas las UI de comida
- **Click en tiendas**: Abrir tienda de comida

### Mecánicas Básicas
1. **Comprar comida** en tiendas con dinero
2. **Almacenar** en inventario (máximo 20 items)
3. **Consumir** alimentos para restaurar stats
4. **Gestionar** deterioro de alimentos perecederos

## 🏪 Tiendas de Comida

### Ubicaciones
- **Tienda Saludable** (600, 300): Pan, sándwiches, tarta de manzana
- **Fast Food** (900, 500): Hamburguesas, pizza, hot dogs, papas fritas  
- **Dulcería** (300, 600): Helados, torta de chocolate, donas, galletas

### Sistema de Compra
- Precios dinámicos ($2-$20 por item)
- Verificación automática de fondos
- Límite de inventario (20 items)

## 🥘 Tipos de Comida

### 🥗 Saludable (Healthy)
- **Efectos**: +Salud, +Energía, -Estrés
- **Ejemplos**: Salmón, ensalada de huevo, tarta de manzana
- **Beneficios**: Mejora salud a largo plazo

### 🍔 Comida Chatarra (Junk)
- **Efectos**: +Felicidad alta, +Hambre, -Salud, +Estrés
- **Ejemplos**: Hamburguesa, pizza, hot dog
- **Beneficios**: Satisfacción inmediata pero costos de salud

### 🍰 Postres (Dessert) 
- **Efectos**: +Felicidad máxima, +Energía rápida
- **Ejemplos**: Torta de chocolate, helado, donas
- **Beneficios**: Boost de felicidad para estados depresivos

### 🥨 Snacks
- **Efectos**: +Hambre ligero, +Energía moderada
- **Ejemplos**: Palomitas, galletas
- **Beneficios**: Opciones económicas para picar

## 📊 Sistema de Efectos

### Estadísticas Afectadas
- **Hambre**: 10-50 puntos restaurados
- **Felicidad**: 5-25 puntos de bonus
- **Energía**: -10 a +20 puntos de efecto
- **Salud**: -5 a +15 puntos de efecto
- **Estrés**: +2 (junk) o -3 (saludable)

### Tiempo de Consumo
- **Snacks**: 3-4 segundos
- **Comidas ligeras**: 5-8 segundos  
- **Comidas completas**: 10-15 segundos

### Sistema de Deterioro
- **Helado**: 2 minutos (se derrite)
- **Salmón/Carnes**: 3 minutos  
- **Ensaladas**: 4-5 minutos
- **Pan**: 10 minutos
- **Snacks procesados**: No se deterioran

## 🔧 Arquitectura Técnica

### Componentes Principales

#### FoodCatalog
- **Propósito**: Base de datos estática de todos los alimentos
- **Contenido**: 13 tipos de comida con stats balanceados
- **Métodos**: Búsqueda por ID, categoría, precio, recomendaciones

#### FoodInventorySystem  
- **Propósito**: Manejo de almacenamiento personal
- **Funciones**: Add/remove items, cleanup automático, verificación de capacidad
- **Límites**: 20 items máximo, sistema de deterioro temporal

#### FoodSystem (Manager Principal)
- **Propósito**: Orquestación de toda la mecánica
- **Responsabilidades**: 
  - Manejo de acciones de comer (timing, animaciones)
  - Integración compra/inventario/consumo
  - Aplicación de efectos a estadísticas
  - Gestión de tiendas del mundo

#### FoodAssetManager
- **Propósito**: Carga optimizada de sprites de comida
- **Estrategia**: Lazy loading + assets esenciales
- **Optimización**: Solo carga lo necesario, limpieza automática

### Integración con Entidades

#### AnimatedGameEntity
- **Actividad EATING**: Nueva actividad con sprite específico
- **Detección de hambre**: Sistema de recomendación automática
- **Aplicación de efectos**: Modificación directa de EntityStats

#### UI Components
- **FoodUI**: Panel completo inventario + tienda
- **Controles**: Teclado + mouse integrados
- **Visual feedback**: Indicadores de comer, partículas

## 🎨 Assets Utilizados

### Sprites de Comida (102 archivos PNG)
```
assets/consumable_items/food/
├── 05_apple_pie.png
├── 15_burger.png  
├── 30_chocolatecake.png
├── 54_hotdog.png
├── 81_pizza.png
└── ... (98 más)
```

### Assets del Sistema
- **food_store**: Sprite de tienda (Crate_Medium_Closed.png)
- **spark**: Partículas de efectos al comer
- **eating_indicator**: Indicador UI de acción

## 💡 Casos de Uso

### Escenario 1: Entidad con Hambre Baja
```
1. Sistema detecta hunger < 30
2. Recomienda comidas que restauren +25 hambre
3. Verifica dinero disponible
4. Sugiere opciones en rango de precio
5. Jugador puede comprar/consumir manualmente
```

### Escenario 2: Estado Emocional Bajo
```
1. Detecta happiness < 40
2. Filtra por comidas +felicidad (postres, junk food)
3. Prioriza por effectiveness/precio
4. Boost inmediato de humor al consumir
```

### Escenario 3: Comida Próxima a Vencerse
```
1. Cleanup automático cada 30s
2. Warning cuando quedan 20% tiempo vida
3. Incentivo visual para consumir pronto
4. Auto-eliminación al expirar
```

## 🚀 Extensiones Futuras

### Funcionalidades Planeadas
- **Cocinar**: Combinar ingredientes básicos
- **Recetas**: Desbloquear combinaciones especiales  
- **Preferencias**: Entidades desarrollan gustos personales
- **Comercio**: Intercambio entre entidades
- **Estacionalidad**: Precios/disponibilidad por temporada
- **Nutrición avanzada**: Sistema de macronutrientes

### Optimizaciones Técnicas
- **Asset Bundling**: Cargar por categorías
- **Memory Pool**: Reutilizar objetos UI frecuentes
- **Save System**: Persistir inventarios entre sesiones
- **Analytics**: Tracking de patrones de consumo

## 🔍 Testing y Debug

### Comandos de Desarrollo
```javascript
// Añadir comida al inventario
game.scene.getScene('MainScene').foodSystem.getInventory().addFood('pizza', 5);

// Ver stats del inventario  
game.scene.getScene('MainScene').foodSystem.getInventory().getInventoryStats();

// Forzar limpieza de vencidos
game.scene.getScene('MainScene').foodSystem.getInventory().cleanupSpoiledFood();
```

### Logs Importantes
- `Food UI creada`: UI inicializada correctamente
- `Tienda de comida creada`: Posiciones de tiendas
- `Entidad empezó a comer`: Inicio de acciones
- `Aplicando efectos de comida`: Cambios en stats

## 📈 Balance de Juego

### Economía
- **Ingresos promedio**: $50 iniciales por entidad
- **Gasto en comida**: $2-20 por item
- **ROI saludable**: Mejor costo/beneficio largo plazo
- **ROI placer**: Comida chatarra para satisfacción inmediata

### Progresión
- **Early Game**: Pan, snacks básicos
- **Mid Game**: Comidas completas, postres ocasionales  
- **Late Game**: Dieta balanceada, optimización por objetivos

---
*Sistema implementado v1.0 - Documentación actualizada al 19/08/2025*