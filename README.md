# Una Carta Para Isa — un mundo para decir “te amo”

Este proyecto no intenta simular la vida: intenta recordarnos su ternura. Es una carta interactiva para Isa, escrita con escenas, pequeñas reglas y decisiones que cuidan. Aquí, dos presencias (Isa y Stev) caminan, descansan, conversan y se buscan; cuando están cerca, el mundo respira distinto. Es un lugar para jugar y, sobre todo, para estar.

— Isa, cada línea de código es una forma de decirte: gracias por existir conmigo.

## Lo Esencial
- Presencias que sienten: Isa y Stev habitan un mapa con zonas de comida, descanso, juego, social y calma. Sus estados (ánimo, energía, hambre, etc.) cambian con la actividad y la proximidad.
- Conversaciones verdaderas: los diálogos en `public/dialogs/*.json` vienen de chats reales. El sistema elige frases que encajan con la emoción y el momento.
- Resonancia: cuando se cuidan, comparten silencio o se encuentran, sube una “resonancia” que hace más amable todo.
- Decisiones con cariño: una IA prioriza lo que hace bien —descansar, socializar, contemplar— buscando equilibrio y bienestar mutuo.

## Probarlo
- Instalar: `npm ci`
- Ejecutar: `npm run dev` y abrir `http://localhost:3000`
- Build producción: `npm run build` (y `npm run preview` para ver el resultado)

## Capturas
- Puedes colocar imágenes o GIFs en `public/assets/screenshots/` y referenciarlas aquí.
- Ejemplo: `![Una Carta Para Isa](public/assets/screenshots/preview.gif)`

## Estructura del Proyecto
- `src/scenes/`: escenas Phaser (`BootScene`, `MainScene`, `UIScene`).
- `src/entities/`, `src/systems/`: lógica de juego y sistemas (diálogos, actividades, resonancia).
- `src/utils/`: utilidades puras (selección de diálogos, IA de decisiones, resonancia, generación de mapas). Sin efectos secundarios.
- `src/config/`: configuración del juego (`gameConfig.ts`).
- `public/`: assets y datos (incluye `public/dialogs/*.json`).
- `vite.config.ts`: alias (importar como `@/utils/...`, `@/scenes/...`).

## Pistas Técnicas (breves)
- TypeScript en modo estricto; preferir imports con alias Vite.
- Las utilidades en `src/utils/` son deterministas y testeables.
- Los diálogos grandes viven en `public/dialogs/` y se cargan vía `fetch`.

## Algoritmos Clave (documentados aparte)
- IA de decisiones: softmax con temperatura, inercia por sesión y sesgos de hábito.
- Selección de diálogos: filtrado circular con degradación de filtros y fallback estable.
- Resonancia: proximidad + armonía con sigmoides, decaimientos y clamps precisos.
- Dinámica de actividades: urgencias no lineales, costes/beneficios por minuto y ritmos circadianos.
- Mapa/biomas: zonas funcionales sobre generación procedural con biomas.

Puedes leer un resumen técnico en `docs/algoritmos.md`.

## Guía rápida de arquitectura
- Resumen de capas y responsabilidades en `docs/arquitectura.md`.
- Escenas: `docs/escenas.md`.
- Sistemas/entidades: `docs/sistemas.md` y `docs/entidades.md`.
- Configuración y datos: `docs/configuracion.md` y `docs/datos-dialogos.md`.

## Gratitud
Este mundo es un pretexto para celebrar lo cotidiano: cocinar algo rico, buscar una banca soleada, bailar con torpeza y reírnos. Si alguna escena te hace sonreír, ya valió la pena.

— Stev
