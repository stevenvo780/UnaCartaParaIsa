# Repository Guidelines

## Project Structure & Module Organization
- `src/`: TypeScript source.
  - `scenes/`: Phaser scenes (e.g., `BootScene.ts`, `MainScene.ts`, `UIScene.ts`).
  - `entities/`, `systems/`: Game domain logic and systems.
  - `utils/`: Pure helpers (e.g., `dialogueSelector.ts`, `aiDecisionEngine.ts`).
  - `config/`: App/game configuration (e.g., `gameConfig.ts`).
  - `constants/`, `types/`: Shared constants and TypeScript types.
- `public/`: Static assets and data (e.g., `assets/`, `dialogs/*.json`).
- `index.html`: App entry; Vite builds from `src/main.ts`.
- `vite.config.ts`: Path aliases (e.g., import from `'@/scenes/...'`).

## Build, Run, and Development
- Install deps: `npm ci`
- Dev server: `npm run dev` (Vite on `http://localhost:3000`)
- Production build: `npm run build` (type-check + Vite build)
- Preview build: `npm run preview`
- Docker (optional): `docker compose up --build` (dev server exposed on 3000)

## Coding Style & Naming
- TypeScript strict mode is enabled (`tsconfig.json`); fix all type errors.
- Indentation: 2 spaces; use single quotes; prefer `const`.
- File names: PascalCase for classes/scenes (`MainScene.ts`), camelCase for utilities (`resonanceCalculations.ts`).
- Imports: prefer Vite aliases (`@/utils/...`, `@/scenes/...`) over relative `../../` chains.
- Keep `utils/` pure and side-effect free; isolate Phaser code to `scenes/` and game systems.

## Testing Guidelines
- No test runner is configured yet. When adding tests:
  - Place unit tests alongside code (`*.spec.ts`) or under `src/__tests__/`.
  - Aim for fast unit tests on `utils/` and deterministic logic in `systems/`.
  - For scene integration, prefer small headless tests over full E2E.

## Commit & Pull Request Guidelines
- Commits: imperative, concise subject, optional body for context.
  - Example: `feat(utils): add dialogue selector weights`
- PRs: clear description, testing steps, and scope.
  - Link related issues; include before/after screenshots or short GIFs for gameplay/UI changes.
  - Keep PRs focused; update docs when behavior changes.

## Security & Data Tips
- Do not commit secrets. Large dialogue files belong in `public/dialogs/`.
- Avoid absolute paths in scripts (e.g., `copy_dialogues.sh`); prefer repo-relative paths.
