/**
 * Manager para manejo de entidades del juego
 * Extrae la lógica de creación y manejo de entidades del MainScene
 */

import Phaser from 'phaser';
import type { GameState } from '../types';
import { AnimatedGameEntity } from '../entities/AnimatedGameEntity';
import { gameConfig } from '../config/gameConfig';
import { logAutopoiesis } from '../utils/logger';

export class EntityManager {
  private scene: Phaser.Scene;
  private entities: Phaser.Physics.Arcade.Group;
  private isaEntity?: AnimatedGameEntity;
  private stevEntity?: AnimatedGameEntity;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.entities = scene.physics.add.group();
  }

  /**
   * Crea las entidades principales del juego
   */
  createEntities(gameState: GameState): {
    isaEntity: AnimatedGameEntity;
    stevEntity: AnimatedGameEntity;
  } {
    logAutopoiesis.info('Creating game entities');

    // Crear entidad Isa
    this.isaEntity = new AnimatedGameEntity(this.scene, 300, 200, 'isa', {
      id: 'isa',
      happiness: gameConfig.entityInitialStats,
      energy: gameConfig.entityInitialStats,
      health: gameConfig.entityInitialHealth,
      resonance: gameConfig.initialResonance,
      money: gameConfig.entityInitialMoney,
      hunger: gameConfig.entityInitialStats,
      comfort: gameConfig.entityInitialStats,
      loneliness: 0,
      stress: 0,
      creativity: gameConfig.entityInitialStats
    });

    // Crear entidad Stev
    this.stevEntity = new AnimatedGameEntity(this.scene, 400, 200, 'stev', {
      id: 'stev',
      happiness: gameConfig.entityInitialStats,
      energy: gameConfig.entityInitialStats,
      health: gameConfig.entityInitialHealth,
      resonance: gameConfig.initialResonance,
      money: gameConfig.entityInitialMoney,
      hunger: gameConfig.entityInitialStats,
      comfort: gameConfig.entityInitialStats,
      loneliness: 0,
      stress: 0,
      creativity: gameConfig.entityInitialStats
    });

    // Añadir a la escena
    this.entities.add(this.isaEntity);
    this.entities.add(this.stevEntity);

    // Añadir al estado del juego
    gameState.entities = [this.isaEntity.getEntity(), this.stevEntity.getEntity()];

    return {
      isaEntity: this.isaEntity,
      stevEntity: this.stevEntity
    };
  }

  /**
   * Obtiene una entidad por ID
   */
  getEntity(id: 'isa' | 'stev'): AnimatedGameEntity | undefined {
    return id === 'isa' ? this.isaEntity : this.stevEntity;
  }

  /**
   * Obtiene el grupo de entidades
   */
  getEntitiesGroup(): Phaser.Physics.Arcade.Group {
    return this.entities;
  }

  /**
   * Limpia los recursos del manager
   */
  cleanup(): void {
    this.entities?.clear(true, true);
    this.isaEntity = undefined;
    this.stevEntity = undefined;
  }
}