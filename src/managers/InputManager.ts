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
  private isDragging = false;
  private lastPointerPosition = { x: 0, y: 0 };
  private isSprinting = false;

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

    // Additional control keys
    this.scene.input.keyboard.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      // Cycle through entities
      const entities: ControlledEntity[] = ['none', 'isa', 'stev'];
      const currentIndex = entities.indexOf(this.controlledEntity);
      const nextIndex = (currentIndex + 1) % entities.length;
      this.setControlledEntity(entities[nextIndex]);
    });

    // Sprint modifier
    this.scene.input.keyboard.on('keydown-SHIFT', () => {
      this.isSprinting = true;
      this.scene.events.emit('sprintStart');
    });
    this.scene.input.keyboard.on('keyup-SHIFT', () => {
      this.isSprinting = false;
      this.scene.events.emit('sprintEnd');
    });

    // Setup mouse controls
    this.setupMouseControls();

    logAutopoiesis.info('Input controls configured');
  }

  /**
   * Configura los controles del mouse
   */
  private setupMouseControls(): void {
    if (!this.scene.input) return;

    // Mouse drag for camera movement
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.lastPointerPosition = { x: pointer.x, y: pointer.y };
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging && this.scene.cameras?.main) {
        const deltaX = pointer.x - this.lastPointerPosition.x;
        const deltaY = pointer.y - this.lastPointerPosition.y;
        
        // Invert the movement for natural camera panning
        this.scene.cameras.main.scrollX -= deltaX * 0.5;
        this.scene.cameras.main.scrollY -= deltaY * 0.5;
        
        this.lastPointerPosition = { x: pointer.x, y: pointer.y };
      }
    });

    this.scene.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // Mouse wheel for zoom
    this.scene.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[], deltaX: number, deltaY: number) => {
      if (this.scene.cameras?.main) {
        const camera = this.scene.cameras.main;
        const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Phaser.Math.Clamp(camera.zoom * zoomFactor, 0.5, 2);
        camera.setZoom(newZoom);
      }
    });
  }

  /**
   * Establece qué entidad está siendo controlada
   */
  setControlledEntity(entity: ControlledEntity): void {
    const prevEntity = this.controlledEntity;
    this.controlledEntity = entity;
    
    // Provide visual feedback when switching control
    if (entity !== 'none') {
      logAutopoiesis.info(`🎮 Control activo: ${entity.toUpperCase()}`);
      
      // Emit event for UI feedback
      this.scene.events.emit('controlChanged', {
        previous: prevEntity,
        current: entity
      });
    } else {
      logAutopoiesis.info('🎮 Control manual desactivado - modo AUTO');
      this.scene.events.emit('controlChanged', {
        previous: prevEntity,
        current: 'none'
      });
    }
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
  processMovementInput(isaEntity: AnimatedGameEntity, stevEntity: AnimatedGameEntity): void {
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
    const baseSpeed = 160;
    const speed = this.isSprinting ? baseSpeed * 1.5 : baseSpeed;
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
