/**
 * Manager para manejo de inputs del juego
 * Extrae la lógica de input del MainScene
 */

import type Phaser from 'phaser';
import type { AnimatedGameEntity } from '../entities/AnimatedGameEntity';
import { logAutopoiesis } from '../utils/logger';

export type ControlledEntity = 'isa' | 'stev' | 'none';

export class InputManager {
  private scene: Phaser.Scene;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private controlledEntity: ControlledEntity = 'none';
  private wasdKeys?: Record<string, Phaser.Input.Keyboard.Key>;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupControls();
  }

  /**
   * Configura los controles del juego
   */
  private setupControls(): void {
    if (!this.scene.input?.keyboard) return;

    // Controles de flecha
    this.cursors = this.scene.input.keyboard.createCursorKeys();

    // Controles WASD
    this.wasdKeys = this.scene.input.keyboard.addKeys('W,S,A,D') as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;

    // Controles de cambio de entidad
    this.scene.input.keyboard.on('keydown-ONE', () => {
      this.setControlledEntity('isa');
    });
    this.scene.input.keyboard.on('keydown-TWO', () => {
      this.setControlledEntity('stev');
    });
    this.scene.input.keyboard.on('keydown-ZERO', () => {
      this.setControlledEntity('none');
    });

    logAutopoiesis.info('Input controls configured');
  }

  /**
   * Establece qué entidad está siendo controlada
   */
  setControlledEntity(entity: ControlledEntity): void {
    this.controlledEntity = entity;
    logAutopoiesis.debug(`Switched control to: ${entity}`);
  }

  /**
   * Obtiene la entidad actualmente controlada
   */
  getControlledEntity(): ControlledEntity {
    return this.controlledEntity;
  }

  /**
   * Procesa los inputs de movimiento
   */
  processMovementInput(
    isaEntity: AnimatedGameEntity,
    stevEntity: AnimatedGameEntity
  ): void {
    if (!this.cursors || !this.wasdKeys) return;

    const currentEntity =
      this.controlledEntity === 'isa'
        ? isaEntity
        : this.controlledEntity === 'stev'
          ? stevEntity
          : null;

    if (!currentEntity) return;

    // Reset velocidad
    currentEntity.setVelocity(0, 0);

    // Procesar inputs
    const speed = 160;
    let isMoving = false;

    // Arrows o WASD
    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      currentEntity.setVelocityX(-speed);
      isMoving = true;
    } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      currentEntity.setVelocityX(speed);
      isMoving = true;
    }

    if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
      currentEntity.setVelocityY(-speed);
      isMoving = true;
    } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
      currentEntity.setVelocityY(speed);
      isMoving = true;
    }

    // Actualizar animaciones
    if (isMoving) {
      currentEntity.playAnimation('walk');
    } else {
      currentEntity.playAnimation('idle');
    }
  }

  /**
   * Limpia los recursos del manager
   */
  cleanup(): void {
    this.cursors = undefined;
    this.wasdKeys = undefined;
  }
}
