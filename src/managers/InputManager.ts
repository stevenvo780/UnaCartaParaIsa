/**
 * Manager para manejo de inputs del juego
 * Extrae la lógica de input del MainScene
 */

import Phaser from "phaser";
import type { AnimatedGameEntity } from "../entities/AnimatedGameEntity";
import { logAutopoiesis } from "../utils/logger";

export type ControlledEntity = "isa" | "stev" | "none";

export class InputManager {
  private scene: Phaser.Scene;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private controlledEntity: ControlledEntity = "none";
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
    this.wasdKeys = this.scene.input.keyboard.addKeys("W,S,A,D") as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;

    // Controles de cambio de entidad
    this.scene.input.keyboard.on("keydown-ONE", () => {
      this.setControlledEntity("isa");
    });
    this.scene.input.keyboard.on("keydown-TWO", () => {
      this.setControlledEntity("stev");
    });
    this.scene.input.keyboard.on("keydown-ZERO", () => {
      this.setControlledEntity("none");
    });

    // Additional control keys
    this.scene.input.keyboard.on("keydown-TAB", (event: KeyboardEvent) => {
      event.preventDefault();
      // Cycle through entities
      const entities: ControlledEntity[] = ["none", "isa", "stev"];
      const currentIndex = entities.indexOf(this.controlledEntity);
      const nextIndex = (currentIndex + 1) % entities.length;
      this.setControlledEntity(entities[nextIndex]);
    });

    // Sprint modifier
    this.scene.input.keyboard.on("keydown-SHIFT", () => {
      this.isSprinting = true;
      this.scene.events.emit("sprintStart");
    });
    this.scene.input.keyboard.on("keyup-SHIFT", () => {
      this.isSprinting = false;
      this.scene.events.emit("sprintEnd");
    });

    // MEJORA: Controles adicionales para navegación del mapa
    // CTRL + WASD para mover la cámara directamente
    this.scene.input.keyboard.on("keydown", (event: KeyboardEvent) => {
      if (event.ctrlKey && this.scene.cameras?.main) {
        const camera = this.scene.cameras.main;
        const panSpeed = 20;

        switch (event.code) {
          case "KeyW":
          case "ArrowUp":
            camera.scrollY -= panSpeed;
            event.preventDefault();
            break;
          case "KeyS":
          case "ArrowDown":
            camera.scrollY += panSpeed;
            event.preventDefault();
            break;
          case "KeyA":
          case "ArrowLeft":
            camera.scrollX -= panSpeed;
            event.preventDefault();
            break;
          case "KeyD":
          case "ArrowRight":
            camera.scrollX += panSpeed;
            event.preventDefault();
            break;
          case "Equal":
          case "NumpadAdd": {
            // Zoom in con +
            const newZoomIn = Phaser.Math.Clamp(camera.zoom * 1.1, 0.3, 3);
            camera.setZoom(newZoomIn);
            event.preventDefault();
            break;
          }
          case "Minus":
          case "NumpadSubtract": {
            // Zoom out con -
            const newZoomOut = Phaser.Math.Clamp(camera.zoom * 0.9, 0.3, 3);
            camera.setZoom(newZoomOut);
            event.preventDefault();
            break;
          }
          case "Digit0":
          case "Numpad0": {
            // Reset zoom y posición
            camera.setZoom(1);
            camera.centerOn(600, 400); // Centro del mundo
            event.preventDefault();
            break;
          }
        }
      }
    });

    // Setup mouse controls
    this.setupMouseControls();

    logAutopoiesis.info("Input controls configured");
  }

  /**
   * Configura los controles del mouse - MEJORADO para navegación fluida
   */
  private setupMouseControls(): void {
    if (!this.scene.input) return;

    // MEJORA 1: Mouse drag para movimiento de cámara más suave + click derecho
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown && pointer.rightButtonDown()) {
        // Cycle through entities con click derecho
        const entities: ControlledEntity[] = ["isa", "stev", "none"];
        const currentIndex = entities.indexOf(this.controlledEntity);
        const nextIndex = (currentIndex + 1) % entities.length;
        this.setControlledEntity(entities[nextIndex]);
      } else {
        // Normal left-click drag behavior
        this.isDragging = true;
        this.lastPointerPosition = { x: pointer.x, y: pointer.y };

        // Cambiar cursor durante drag
        this.scene.input.setDefaultCursor("grabbing");
      }
    });

    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging && this.scene.cameras?.main) {
        const deltaX = pointer.x - this.lastPointerPosition.x;
        const deltaY = pointer.y - this.lastPointerPosition.y;

        // MEJORA 2: Movimiento más sensible y natural (era 0.5, ahora 1.2)
        this.scene.cameras.main.scrollX -= deltaX * 1.2;
        this.scene.cameras.main.scrollY -= deltaY * 1.2;

        this.lastPointerPosition = { x: pointer.x, y: pointer.y };
      } else {
        // MEJORA 3: Cursor grab cuando no está dragging
        this.scene.input.setDefaultCursor("grab");
      }
    });

    this.scene.input.on("pointerup", () => {
      this.isDragging = false;
      // Restaurar cursor normal
      this.scene.input.setDefaultCursor("default");
    });

    // MEJORA 4: Mouse wheel para zoom más suave
    this.scene.input.on(
      "wheel",
      (
        pointer: Phaser.Input.Pointer,
        gameObjects: Phaser.GameObjects.GameObject[],
        deltaX: number,
        deltaY: number,
      ) => {
        if (this.scene.cameras?.main) {
          const camera = this.scene.cameras.main;

          // Zoom más suave y con más rango
          const zoomFactor = deltaY > 0 ? 0.95 : 1.05; // Más sutil que 0.9/1.1
          const newZoom = Phaser.Math.Clamp(camera.zoom * zoomFactor, 0.3, 3); // Más rango

          // MEJORA 5: Zoom hacia el cursor del mouse
          const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
          camera.setZoom(newZoom);

          // Ajustar scroll para que el zoom sea hacia donde está el mouse
          const newWorldPoint = camera.getWorldPoint(pointer.x, pointer.y);
          camera.scrollX -= newWorldPoint.x - worldPoint.x;
          camera.scrollY -= newWorldPoint.y - worldPoint.y;
        }
      },
    );

    // MEJORA 6: Doble click para centrar en entidad controlada
    this.scene.input.on("pointerdblclick", () => {
      if (this.controlledEntity !== "none" && this.scene.cameras?.main) {
        // Buscar la entidad actualmente controlada
        const scene = this.scene as any;
        const entityManager = scene.entityManager;

        if (entityManager) {
          const entity = entityManager.getEntity(this.controlledEntity);
          if (entity) {
            const pos = entity.getPosition();

            // Centrar cámara suavemente en la entidad
            this.scene.cameras.main.pan(pos.x, pos.y, 500, "Power2");

            logAutopoiesis.info(
              `🎯 Cámara centrada en ${this.controlledEntity}`,
              pos,
            );
          }
        }
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
    if (entity !== "none") {
      logAutopoiesis.info(`🎮 Control activo: ${entity.toUpperCase()}`);

      // Emit event for UI feedback
      this.scene.events.emit("controlChanged", {
        previous: prevEntity,
        current: entity,
      });
    } else {
      logAutopoiesis.info("🎮 Control manual desactivado - modo AUTO");
      this.scene.events.emit("controlChanged", {
        previous: prevEntity,
        current: "none",
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
  processMovementInput(
    isaEntity: AnimatedGameEntity,
    stevEntity: AnimatedGameEntity,
  ): void {
    if (!this.cursors || !this.wasdKeys) return;

    const currentEntity =
      this.controlledEntity === "isa"
        ? isaEntity
        : this.controlledEntity === "stev"
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
      // Use entity-specific walking animation if available, fallback to happy
      const walkAnim = `${currentEntity.getEntityData().id}_walk`;
      const fallbackAnim = `${currentEntity.getEntityData().id}_happy`;

      if (!currentEntity.playAnimation(walkAnim)) {
        currentEntity.playAnimation(fallbackAnim);
      }
    } else {
      // For static sprites, don't try to play animations
      // Just update the entity's state-based animation through normal update cycle
      currentEntity.update();
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
