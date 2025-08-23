/**
 * Sistema de carga lazy para componentes no críticos
 * Reduce el bundle inicial cargando sistemas bajo demanda
 */

import { CircuitBreakerFactory } from './CircuitBreaker';

type LoadedModule = typeof import('../systems/AISystem') | 
                   typeof import('../systems/EmergenceSystem') |
                   typeof import('../systems/CardDialogueSystem');

export class SystemLoader {
  private static loadedSystems = new Map<string, LoadedModule>();
  private static loadingPromises = new Map<string, Promise<LoadedModule>>();

  /**
   * Carga lazy de sistema de IA con circuit breaker
   */
  static async loadAISystem(): Promise<typeof import('../systems/AISystem')> {
    const key = 'AISystem';
    const breaker = CircuitBreakerFactory.createNormal(`loader_${key}`);
    
    return breaker.execute(async () => {
      if (this.loadedSystems.has(key)) {
        return this.loadedSystems.get(key);
      }

      if (this.loadingPromises.has(key)) {
        return this.loadingPromises.get(key);
      }

      const loadPromise = import('../systems/AISystem');
      this.loadingPromises.set(key, loadPromise);

      try {
        const module = await loadPromise;
        this.loadedSystems.set(key, module);
        this.loadingPromises.delete(key);
        return module;
      } catch (error) {
        this.loadingPromises.delete(key);
        throw error;
      }
    });
  }

  /**
   * Carga lazy de sistema de emergencias
   */
  static async loadEmergenceSystem(): Promise<typeof import('../systems/EmergenceSystem')> {
    const key = 'EmergenceSystem';
    
    if (this.loadedSystems.has(key)) {
      return this.loadedSystems.get(key);
    }

    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    const loadPromise = import('../systems/EmergenceSystem');
    this.loadingPromises.set(key, loadPromise);

    try {
      const module = await loadPromise;
      this.loadedSystems.set(key, module);
      this.loadingPromises.delete(key);
      return module;
    } catch (error) {
      this.loadingPromises.delete(key);
      throw error;
    }
  }

  /**
   * Carga lazy de sistema de cartas de diálogo
   */
  static async loadCardDialogueSystem(): Promise<typeof import('../systems/CardDialogueSystem')> {
    const key = 'CardDialogueSystem';
    
    if (this.loadedSystems.has(key)) {
      return this.loadedSystems.get(key);
    }

    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    const loadPromise = import('../systems/CardDialogueSystem');
    this.loadingPromises.set(key, loadPromise);

    try {
      const module = await loadPromise;
      this.loadedSystems.set(key, module);
      this.loadingPromises.delete(key);
      return module;
    } catch (error) {
      this.loadingPromises.delete(key);
      throw error;
    }
  }

  /**
   * Carga lazy del mundo completo (world generation)
   */
  static async loadWorldSystems(): Promise<{
    DiverseWorldComposer: typeof import('../world/DiverseWorldComposer');
    TerrainGenerator: typeof import('../world/TerrainGenerator');
    LayeredWorldRenderer: typeof import('../world/LayeredWorldRenderer');
  }> {
    const [composer, terrain, renderer] = await Promise.all([
      import('../world/DiverseWorldComposer'),
      import('../world/TerrainGenerator'),
      import('../world/LayeredWorldRenderer')
    ]);

    return {
      DiverseWorldComposer: composer,
      TerrainGenerator: terrain,
      LayeredWorldRenderer: renderer
    };
  }

  /**
   * Carga lazy de componentes UI pesados
   */
  static async loadUIComponents(): Promise<{
    QuestUI: typeof import('../components/QuestUI');
    FoodUI: typeof import('../components/FoodUI');
    ExplorationUI: typeof import('../components/ExplorationUI');
  }> {
    const [quest, food, exploration] = await Promise.all([
      import('../components/QuestUI'),
      import('../components/FoodUI'),
      import('../components/ExplorationUI')
    ]);

    return {
      QuestUI: quest,
      FoodUI: food,
      ExplorationUI: exploration
    };
  }

  /**
   * Preload sistemas críticos después de la carga inicial
   */
  static async preloadCriticalSystems(): Promise<void> {
    // Cargar en paralelo sistemas que se van a necesitar pronto
    const preloadPromises = [
      this.loadAISystem(),
      this.loadCardDialogueSystem(),
      this.loadWorldSystems()
    ];

    try {
      await Promise.allSettled(preloadPromises);
    } catch (error) {
      console.warn('Some systems failed to preload:', error);
    }
  }

  /**
   * Limpia cache de sistemas cargados
   */
  static clearCache(): void {
    this.loadedSystems.clear();
    this.loadingPromises.clear();
  }
}