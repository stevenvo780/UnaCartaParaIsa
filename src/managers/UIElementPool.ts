/**
 * Pool de elementos UI para gestión eficiente de memoria
 * Evita la creación/destrucción constante de objetos UI
 */

import { logAutopoiesis } from '../utils/logger';

export interface PoolableUIElement {
  gameObject: Phaser.GameObjects.GameObject;
  isActive: boolean;
  reset(): void;
  setup(...args: any[]): void;
}

export class ResonanceLabel implements PoolableUIElement {
  public gameObject: Phaser.GameObjects.Text;
  public isActive: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.gameObject = scene.add.text(0, 0, '', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    this.gameObject.setScrollFactor(0);
    this.gameObject.setVisible(false);
  }

  setup(x: number, y: number, text: string): void {
    this.gameObject.setPosition(x, y);
    this.gameObject.setText(text);
    this.gameObject.setVisible(true);
    this.isActive = true;
  }

  reset(): void {
    this.gameObject.setVisible(false);
    this.isActive = false;
  }
}

export class UIElementPool<T extends PoolableUIElement> {
  private pool: T[] = [];
  private activeElements: Set<T> = new Set();
  private createElementFn: () => T;
  private poolName: string;

  constructor(createElementFn: () => T, poolName: string, initialSize: number = 5) {
    this.createElementFn = createElementFn;
    this.poolName = poolName;
    

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createElementFn());
    }
    
    logAutopoiesis.debug(`UIElementPool '${poolName}' initialized`, { initialSize });
  }

  /**
   * Obtiene un elemento del pool
   */
  public acquire(): T {
    let element = this.pool.pop();
    
    if (!element) {
      element = this.createElementFn();
      logAutopoiesis.debug(`Pool '${this.poolName}' expanded - new element created`);
    }
    
    this.activeElements.add(element);
    return element;
  }

  /**
   * Devuelve un elemento al pool
   */
  public release(element: T): void {
    if (!this.activeElements.has(element)) {
      logAutopoiesis.warn(`Attempting to release element not from this pool: ${this.poolName}`);
      return;
    }
    
    element.reset();
    this.activeElements.delete(element);
    this.pool.push(element);
  }

  /**
   * Libera todos los elementos activos
   */
  public releaseAll(): void {
    this.activeElements.forEach(element => {
      element.reset();
      this.pool.push(element);
    });
    this.activeElements.clear();
    
    logAutopoiesis.debug(`Pool '${this.poolName}' - all elements released`);
  }

  /**
   * Destruye el pool y todos sus elementos
   */
  public destroy(): void {
    [...this.activeElements, ...this.pool].forEach(element => {
      if (element.gameObject && element.gameObject.destroy) {
        element.gameObject.destroy();
      }
    });
    
    this.activeElements.clear();
    this.pool.length = 0;
    
    logAutopoiesis.debug(`UIElementPool '${this.poolName}' destroyed`);
  }

  /**
   * Obtiene estadísticas del pool
   */
  public getStats(): { active: number; pooled: number; total: number } {
    return {
      active: this.activeElements.size,
      pooled: this.pool.length,
      total: this.activeElements.size + this.pool.length
    };
  }
}