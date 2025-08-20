/**
 * Sistema de carga fragmentada de diálogos para optimizar rendimiento
 * Divide el archivo masivo de 5.3MB en chunks manejables
 */

import type { DialogueCriteria, DialogueEntry } from "../types";
import { logAutopoiesis } from "./logger";

interface DialogueChunk {
  id: string;
  startIndex: number;
  endIndex: number;
  loaded: boolean;
  data?: DialogueEntry[];
}

interface DialogueMetadata {
  totalEntries: number;
  chunks: DialogueChunk[];
  chunkSize: number;
}

export class DialogueChunkLoader {
  private static instance: DialogueChunkLoader;
  private metadata: DialogueMetadata | null = null;
  private cache = new Map<string, DialogueEntry[]>();
  private loadingPromises = new Map<string, Promise<DialogueEntry[]>>();

  // 🚀 MEGA-OPTIMIZED: Configuración para máximo rendimiento con menos chunks
  private readonly CHUNK_SIZE = 5000; // ⚡ AUMENTADO: más diálogos por chunk = menos chunks
  private readonly MAX_CACHE_CHUNKS = 1; // ⚡ MÍNIMO: solo 1 chunk en memoria
  private readonly PRELOAD_ADJACENT = false; // ⚡ DESACTIVADO: no precargar chunks

  private constructor() {}

  public static getInstance(): DialogueChunkLoader {
    if (!DialogueChunkLoader.instance) {
      DialogueChunkLoader.instance = new DialogueChunkLoader();
    }
    return DialogueChunkLoader.instance;
  }

  /**
   * Inicializar el loader con metadata de chunks
   */
  public async initialize(): Promise<void> {
    try {
      // Intentar cargar metadata de chunks
      const metadataResponse = await fetch("/dialogs/dialogues-metadata.json");
      if (metadataResponse.ok) {
        this.metadata = await metadataResponse.json();
        logAutopoiesis.info("Dialogue chunks metadata loaded", {
          totalEntries: this.metadata.totalEntries,
          chunks: this.metadata.chunks.length,
        });
        return;
      }
    } catch (error) {
      logAutopoiesis.warn(
        "No chunked dialogues found, creating chunks from main file",
      );
    }

    // Fallback: crear chunks desde archivo principal
    await this.createChunksFromMainFile();
  }

  /**
   * Crear chunks desde el archivo principal (fallback)
   */
  private async createChunksFromMainFile(): Promise<void> {
    try {
      const response = await fetch(
        "/dialogs/dialogos_chat_isa.lite.censored_plus.json",
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const dialogues: DialogueEntry[] = await response.json();

      // Crear metadata de chunks
      this.metadata = {
        totalEntries: dialogues.length,
        chunkSize: this.CHUNK_SIZE,
        chunks: [],
      };

      // Dividir en chunks
      for (let i = 0; i < dialogues.length; i += this.CHUNK_SIZE) {
        const chunkId = `chunk_${Math.floor(i / this.CHUNK_SIZE)}`;
        const chunk: DialogueChunk = {
          id: chunkId,
          startIndex: i,
          endIndex: Math.min(i + this.CHUNK_SIZE, dialogues.length),
          loaded: false,
        };

        this.metadata.chunks.push(chunk);

        // Guardar primer chunk inmediatamente
        if (i === 0) {
          const chunkData = dialogues.slice(chunk.startIndex, chunk.endIndex);
          this.cache.set(chunkId, chunkData);
          chunk.loaded = true;
          chunk.data = chunkData;
        }
      }

      logAutopoiesis.info("Created dialogue chunks from main file", {
        totalEntries: dialogues.length,
        chunks: this.metadata.chunks.length,
        chunkSize: this.CHUNK_SIZE,
      });
    } catch (error) {
      logAutopoiesis.error("Failed to create dialogue chunks", {
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Obtener diálogo por índice con carga lazy
   */
  public async getDialogue(index: number): Promise<DialogueEntry | null> {
    if (!this.metadata) {
      await this.initialize();
    }

    if (!this.metadata || index >= this.metadata.totalEntries) {
      return null;
    }

    // Encontrar chunk correspondiente
    const chunkIndex = Math.floor(index / this.CHUNK_SIZE);
    const chunk = this.metadata.chunks[chunkIndex];

    if (!chunk) {
      return null;
    }

    // Cargar chunk si no está en cache
    const chunkData = await this.loadChunk(chunk.id);

    // Obtener diálogo específico dentro del chunk
    const localIndex = index - chunk.startIndex;
    return chunkData[localIndex] || null;
  }

  /**
   * Obtener múltiples diálogos por rango
   */
  public async getDialogueRange(
    startIndex: number,
    count: number,
  ): Promise<DialogueEntry[]> {
    const dialogues: DialogueEntry[] = [];

    for (let i = 0; i < count; i++) {
      const dialogue = await this.getDialogue(startIndex + i);
      if (dialogue) {
        dialogues.push(dialogue);
      }
    }

    return dialogues;
  }

  /**
   * Buscar diálogos por criterios (carga chunks según necesidad)
   */
  public async searchDialogues(criteria: {
    speaker?: "ISA" | "STEV";
    emotion?: string;
    textContains?: string;
    limit?: number;
  }): Promise<DialogueEntry[]> {
    if (!this.metadata) {
      await this.initialize();
    }

    const results: DialogueEntry[] = [];
    const limit = criteria.limit || 50;
    let found = 0;

    // Buscar en chunks cargados primero
    for (const [chunkId, chunkData] of this.cache) {
      if (found >= limit) break;

      for (const dialogue of chunkData) {
        if (found >= limit) break;

        if (this.matchesCriteria(dialogue, criteria)) {
          results.push(dialogue);
          found++;
        }
      }
    }

    // Si no se encontraron suficientes, buscar en otros chunks
    if (found < limit && this.metadata) {
      for (const chunk of this.metadata.chunks) {
        if (found >= limit) break;
        if (this.cache.has(chunk.id)) continue; // Ya revisado

        try {
          const chunkData = await this.loadChunk(chunk.id);

          for (const dialogue of chunkData) {
            if (found >= limit) break;

            if (this.matchesCriteria(dialogue, criteria)) {
              results.push(dialogue);
              found++;
            }
          }
        } catch (error) {
          logAutopoiesis.warn(`Failed to search in chunk ${chunk.id}`, {
            error: String(error),
          });
        }
      }
    }

    return results;
  }

  /**
   * Cargar chunk específico con manejo de cache
   */
  private async loadChunk(chunkId: string): Promise<DialogueEntry[]> {
    // Verificar si ya está en cache
    const cached = this.cache.get(chunkId);
    if (cached) {
      return cached;
    }

    // Verificar si ya se está cargando
    const loadingPromise = this.loadingPromises.get(chunkId);
    if (loadingPromise) {
      return loadingPromise;
    }

    // Crear nueva promesa de carga
    const promise = this.doLoadChunk(chunkId);
    this.loadingPromises.set(chunkId, promise);

    try {
      const data = await promise;

      // Gestionar cache (remover chunks antiguos si excede límite)
      this.manageCacheSize();

      // Añadir al cache
      this.cache.set(chunkId, data);

      // Precargar chunks adyacentes si está habilitado
      if (this.PRELOAD_ADJACENT) {
        this.preloadAdjacentChunks(chunkId);
      }

      return data;
    } finally {
      this.loadingPromises.delete(chunkId);
    }
  }

  /**
   * Realizar carga real del chunk
   */
  private async doLoadChunk(chunkId: string): Promise<DialogueEntry[]> {
    try {
      // Intentar cargar chunk individual primero
      const chunkResponse = await fetch(`/dialogs/chunks/${chunkId}.json`);
      if (chunkResponse.ok) {
        const data = await chunkResponse.json();
        logAutopoiesis.debug(`Loaded dialogue chunk: ${chunkId}`, {
          entries: data.length,
        });
        return data;
      }
    } catch (error) {
      logAutopoiesis.debug(`Chunk file not found: ${chunkId}, using main file`);
    }

    // Fallback: cargar desde archivo principal
    return this.loadChunkFromMainFile(chunkId);
  }

  /**
   * Cargar chunk desde archivo principal (fallback)
   */
  private async loadChunkFromMainFile(
    chunkId: string,
  ): Promise<DialogueEntry[]> {
    if (!this.metadata) {
      throw new Error("Metadata not initialized");
    }

    const chunk = this.metadata.chunks.find((c) => c.id === chunkId);
    if (!chunk) {
      throw new Error(`Chunk not found: ${chunkId}`);
    }

    const response = await fetch(
      "/dialogs/dialogos_chat_isa.lite.censored_plus.json",
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const allDialogues: DialogueEntry[] = await response.json();
    const chunkData = allDialogues.slice(chunk.startIndex, chunk.endIndex);

    logAutopoiesis.debug(`Loaded chunk from main file: ${chunkId}`, {
      entries: chunkData.length,
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
    });

    return chunkData;
  }

  /**
   * Verificar si diálogo coincide con criterios
   */
  private matchesCriteria(
    dialogue: DialogueEntry,
    criteria: DialogueCriteria,
  ): boolean {
    if (criteria.speaker && dialogue.speaker !== criteria.speaker) {
      return false;
    }

    if (criteria.emotion && dialogue.emotion !== criteria.emotion) {
      return false;
    }

    if (
      criteria.textContains &&
      !dialogue.text.toLowerCase().includes(criteria.textContains.toLowerCase())
    ) {
      return false;
    }

    return true;
  }

  /**
   * Gestionar tamaño del cache
   */
  private manageCacheSize(): void {
    if (this.cache.size >= this.MAX_CACHE_CHUNKS) {
      // Remover el chunk más antiguo (simple LRU)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        logAutopoiesis.debug(`Removed old chunk from cache: ${firstKey}`);
      }
    }
  }

  /**
   * Precargar chunks adyacentes para mejor rendimiento
   */
  private preloadAdjacentChunks(chunkId: string): void {
    if (!this.metadata) return;

    const currentIndex = this.metadata.chunks.findIndex(
      (c) => c.id === chunkId,
    );
    if (currentIndex === -1) return;

    // Precargar anterior y siguiente
    const toPreload = [currentIndex - 1, currentIndex + 1].filter(
      (idx) => idx >= 0 && idx < this.metadata.chunks.length,
    );

    for (const idx of toPreload) {
      const adjacentChunk = this.metadata.chunks[idx];
      if (
        !this.cache.has(adjacentChunk.id) &&
        !this.loadingPromises.has(adjacentChunk.id)
      ) {
        // Precargar en background sin bloquear
        this.loadChunk(adjacentChunk.id).catch((error) => {
          logAutopoiesis.debug(`Failed to preload chunk: ${adjacentChunk.id}`, {
            error: String(error),
          });
        });
      }
    }
  }

  /**
   * Obtener estadísticas del cache
   */
  public getStats(): {
    totalChunks: number;
    loadedChunks: number;
    cacheSize: number;
    totalEntries: number;
  } {
    return {
      totalChunks: this.metadata?.chunks.length || 0,
      loadedChunks: this.cache.size,
      cacheSize: this.cache.size,
      totalEntries: this.metadata?.totalEntries || 0,
    };
  }

  /**
   * Limpiar cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
    logAutopoiesis.info("Dialogue cache cleared");
  }
}

// Exportar instancia singleton
export const dialogueChunkLoader = DialogueChunkLoader.getInstance();
