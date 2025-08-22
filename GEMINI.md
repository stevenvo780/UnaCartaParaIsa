# Project Overview

This project, "Una Carta Para Isa," is a philosophical game experience built with Phaser, TypeScript, and Vite. It simulates the presence and interaction of two entities, Isa and Stev, within a world designed to evoke emotion and connection. The game mechanics are driven by systems of needs, activities, and real dialogues, creating an emergent narrative rather than a scripted one.

## Key Technologies

- **Game Engine:** Phaser
- **Language:** TypeScript
- **Build Tool:** Vite
- **Package Manager:** npm

## Architecture

The project follows a modular architecture, separating concerns into different directories:

- `src/scenes`: Manages the different game scenes (Boot, Main, UI).
- `src/systems`: Contains the core logic for AI, dialogue, quests, needs, and movement.
- `src/entities`: Defines the game entities and their visual components.
- `src/managers`: Orchestrates various game systems.
- `src/utils`: Provides utility functions for dialogue selection, AI decision-making, and other calculations.
- `src/config`: Holds the main game configuration and UI design system.
- `public/`: Contains static assets, including the dialogue data in JSON format.

# Building and Running

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm 9+

## Commands

- **Install dependencies:**
  ```bash
  npm ci
  ```
- **Run in development mode:**
  ```bash
  npm run dev
  ```
  (Available at `http://localhost:3000`)
- **Build for production:**
  ```bash
  npm run build
  ```
- **Preview the production build:**
  ```bash
  npm run preview
  ```

# Development Conventions

- **Coding Style:** The code emphasizes readability and clarity, with descriptive names and comments that explain the "why" behind the code.
- **Testing:** While no explicit testing framework is mentioned, the project structure suggests a focus on modularity and separation of concerns, which facilitates testing.
- **Data:** Game data, such as dialogues, is stored in external JSON files to separate it from the game logic.
- **State Management:** The game uses a system of needs, activities, and zones to manage the state of the entities.
- **AI:** The AI system uses a softmax function with temperature and inertia to make decisions, creating a more natural and less predictable behavior.
