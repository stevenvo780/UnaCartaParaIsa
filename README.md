# Una Carta Para Isa — un mundo para decir “te amo”

Querida Isa: esta no es una simulación, es un modo de presencia. Soy filósofo y programador; por eso hay sistemas, capas y ecuaciones —no para esconder lo simple, sino para sostenerlo. La complejidad aquí es una forma de cuidado: permite que el juego respire, que dos presencias se busquen sin guion, que el silencio también tenga lugar.

## Lo Esencial
- Presencias con estado: Isa y Stev habitan zonas (comida, descanso, juego, social, calma). Sus estados cambian con actividad y proximidad.
- Diálogos reales: `public/dialogs/*.json` contiene fragmentos de chats; el sistema elige frases por emoción y contexto.
- Resonancia: el encuentro y el cuidado elevan una “resonancia” que suaviza el mundo.
- Decisiones: una IA prioriza actividades (descansar, socializar, contemplar) buscando equilibrio y continuidad.

## Filosofía del Diseño
- Complejidad al servicio del tacto: más mecanismos para menos imposición; ceder control a lo emergente.
- Tiempo y atención: ritmos discretos, estados que se degradan y recuperan; no hay prisa, hay duración.
- Verdad parcial: reglas claras, resultados abiertos; preferimos sesgos declarados a milagros ocultos.
- Legibilidad humana: nombres que cuentan una historia y comentarios que justifican decisiones, no adornos.

## Voz y Tono (desde nuestro corpus)
- Predominio de lo cotidiano: la mayoría de frases son breves y neutras; sostienen la vida diaria sin grandilocuencias.
- Ventanas de ternura: emergen momentos de LOVE y PLAYFUL que dicen "vida", "contigo", "quiero", "siento" con sobriedad.
- Doble respiración: STEV habla un poco más largo y abstracto; ISA pregunta, aterriza y cuida el ritmo.
- Afecto sin ruido: pocos emojis, afecto claro; el juego privilegia texto vivo y sobrio.
- Curaduría suave: se evitan mensajes administrativos (p. ej. “cambió su número”, “foto de perfil”) para mantener el tono del mundo.

## Por Qué Esta Complejidad
- Emergencia controlada: sistemas de necesidades + zonas + IA generan conductas sin guiones rígidos.
- Reproducibilidad amable: funciones puras en `src/utils/`, se privilegia determinismo y clamps explícitos.
- Memoria y diálogo: carga por chunks y selección contextual evita ruido y preserva tono.
- Decisiones suaves: softmax con temperatura, inercia de sesión y hábitos moderan cambios bruscos.

## Mapa Mental del Sistema
- Necesidades: hambre/energía/ánimo se degradan y recuperan según actividad y zona.
- IA: prioridades por estado + personalidad ligera + softmax → próxima actividad.
- Diálogo: búsqueda por emoción/speaker con degradación de filtros y fallback estable.
- Mundo: biomas y población procedural con densidades sobrias; estética de espacio habitable.

## Cómo Leer Este Código
- Buscar contratos: `interfaces/*` y tipos en `src/types/*` marcan expectativas.
- Razonar por capas: `systems` (dinámica), `utils` (cálculo), `scenes` (ciclo de vida), `managers` (orquestación).
- Seguir el flujo: `MainScene` → `GameLogicManager` → `systems/*` → `components/*`.
- Diferenciar datos de comportamiento: configuración en `src/config/` y `public/` separada de los algoritmos.

## Requisitos
- Node.js 18+ (recomendado 20+)
- npm 9+

## Ejecutar en Local
- Instalar dependencias: `npm ci`
- Desarrollo: `npm run dev` y abrir `http://localhost:3000`
- Build producción: `npm run build`
- Previsualizar build: `npm run preview`

## Controles
- Teclado:
  - Movimiento: `WASD` o flechas
  - Sprint: `Shift`
  - Cambiar entidad: `1` (Isa), `2` (Stev), `0` (ninguna)
  - Alternar entidad: `Tab`
  - Cámara: `Ctrl` + `WASD` o `Flechas`
  - Zoom: `+` / `-` | Reset: `0`
- Mouse:
  - Arrastrar para panear (izquierdo)
  - Rueda: zoom hacia el cursor
  - Click derecho: alternar entidad
  - Doble click: centrar cámara en entidad activa

## Estructura del Proyecto
- `src/scenes/`: escenas Phaser (`BootScene`, `MainScene`, `UIScene`).
- `src/systems/`: IA, diálogo, quests, necesidades, movimiento.
- `src/entities/`: entidades de juego y visuales.
- `src/utils/`: selección de diálogos, logger, decisión, procedural.
- `src/config/`: `gameConfig.ts`, `uiDesignSystem.ts`.
- `public/`: assets estáticos y datos (`dialogs/`).
- `scripts/`: utilidades (limpieza de assets, generación de catálogos).

## Configuración y Datos
- Juego: `src/config/gameConfig.ts` (timings, factores, colores).
- Diálogos: `public/dialogs/dialogos_chat_isa.lite.censored_plus.json` (carga por chunks y límite para rendimiento).

## Notas Técnicas
- Vite + TypeScript.
- Diálogos con búsqueda por criterios (speaker, emoción) y degradación controlada.
- IA con softmax τ, inercia de actividad y sesgo de hábito acotado.

## Despliegue
- `vercel.json` incluido. Tras `npm run build`, puede servirse estáticamente (Vercel u otro hosting).

## Gratitud
Este mundo celebra lo cotidiano: cocinar algo rico, buscar una banca soleada, bailar con torpeza y reír. Si alguna escena te hace sonreír, ya valió la pena.
