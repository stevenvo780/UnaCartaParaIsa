/**
 * World Renderer - Maneja todo el rendering visual del mundo
 * Separado de la lógica de juego para mejor organización
 */

import type { Zone, MapElement, GameState } from '../types';
import { GAME_BALANCE } from '../constants/gameBalance';
import { logAutopoiesis } from '../utils/logger';

export class WorldRenderer {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private renderedObjects: Map<string, Phaser.GameObjects.GameObject> = new Map();
  private zoneGraphics: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;
  }

  /**
   * Render the complete world
   */
  public renderWorld(): void {
    this.createWorldBackground();
    this.renderZones();
    this.renderMapElements();
    this.renderDecorations();
    
    logAutopoiesis.info('World rendering completed', {
      zones: this.gameState.zones.length,
      elements: this.gameState.mapElements.length,
      objects: this.renderedObjects.size
    });
  }

  /**
   * Create world background using grass tiles
   */
  private createWorldBackground(): void {
    const tileSize = GAME_BALANCE.VISUALS.TILE_SIZE;
    const worldWidth = this.gameState.worldSize.width;
    const worldHeight = this.gameState.worldSize.height;


    for (let x = 0; x < worldWidth; x += tileSize) {
      for (let y = 0; y < worldHeight; y += tileSize) {

        const grassTypes = ['grass-1', 'grass-2', 'grass-3', 'grass-base'];
        const randomGrass = grassTypes[Math.floor(Math.random() * grassTypes.length)];
        
        const grassTile = this.scene.add.image(x + tileSize/2, y + tileSize/2, randomGrass);
        grassTile.setDisplaySize(tileSize, tileSize);
        grassTile.setDepth(0);
        
        this.renderedObjects.set(`grass_${x}_${y}`, grassTile);
      }
    }

    logAutopoiesis.debug('World background created', {
      tileCount: Math.ceil(worldWidth / tileSize) * Math.ceil(worldHeight / tileSize)
    });
  }

  /**
   * Render all zones visually
   */
  private renderZones(): void {
    this.gameState.zones.forEach((zone, index) => {
      this.renderSingleZone(zone, index);
    });
  }

  /**
   * Render a single zone
   */
  private renderSingleZone(zone: Zone, index: number): void {

    let colorValue = GAME_BALANCE.ZONES.SOCIAL_COLOR;
    if (zone.color.startsWith('rgba(')) {
      const rgbaMatch = zone.color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
      if (rgbaMatch) {
        const [, r, g, b] = rgbaMatch.map(Number);
        colorValue = (r << 16) | (g << 8) | b;
      }
    }


    const zoneRect = this.scene.add.rectangle(
      zone.bounds.x + zone.bounds.width / 2,
      zone.bounds.y + zone.bounds.height / 2,
      zone.bounds.width,
      zone.bounds.height,
      colorValue,
      GAME_BALANCE.ZONES.DEFAULT_ALPHA
    );
    zoneRect.setStrokeStyle(
      GAME_BALANCE.ZONES.STROKE_WIDTH,
      colorValue,
      GAME_BALANCE.ZONES.STROKE_ALPHA
    );
    zoneRect.setDepth(GAME_BALANCE.ZONES.DEPTH);


    const label = this.scene.add.text(
      zone.bounds.x + zone.bounds.width / 2,
      zone.bounds.y + zone.bounds.height / 2,
      zone.name,
      {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        align: 'center'
      }
    );
    label.setOrigin(0.5);
    label.setDepth(3);
    label.setStroke('#000000', 3);


    this.renderedObjects.set(`zone_${zone.id}`, zoneRect);
    this.renderedObjects.set(`zone_label_${zone.id}`, label);
  }

  /**
   * Render map elements
   */
  private renderMapElements(): void {
    this.gameState.mapElements.forEach((element, index) => {
      this.renderSingleMapElement(element, index);
    });
  }

  /**
   * Render a single map element
   */
  private renderSingleMapElement(element: MapElement, index: number): void {
    const colorValue = typeof element.color === 'string' ? 
      parseInt(element.color.replace('#', ''), 16) : element.color;

    const elementRect = this.scene.add.rectangle(
      element.position.x + element.size.width / 2,
      element.position.y + element.size.height / 2,
      element.size.width,
      element.size.height,
      colorValue,
      0.8
    );
    elementRect.setStrokeStyle(1, 0xffffff, 0.6);
    elementRect.setDepth(2);

    this.renderedObjects.set(`element_${element.id}`, elementRect);
  }

  /**
   * Create decorative elements
   */
  private renderDecorations(): void {

    const decorations = [
      { x: 150, y: 120, sprite: 'flowers-red' },
      { x: 300, y: 180, sprite: 'flowers-white' },
      { x: 500, y: 250, sprite: 'campfire' },
      { x: 650, y: 150, sprite: 'flowers-red' },
      { x: 800, y: 300, sprite: 'flowers-white' },
      { x: 900, y: 400, sprite: 'campfire' }
    ];

    decorations.forEach((deco, index) => {
      const decoration = this.scene.add.image(deco.x, deco.y, deco.sprite);
      decoration.setScale(GAME_BALANCE.DECORATIONS.CAMPFIRE_SCALE);
      decoration.setDepth(GAME_BALANCE.DECORATIONS.DECORATION_DEPTH);
      
      this.renderedObjects.set(`decoration_${index}`, decoration);
    });

    logAutopoiesis.debug('Decorations rendered', { count: decorations.length });
  }

  /**
   * Create activity zones with improved visuals
   */
  public createActivityZones(): void {

    const activityZones = [
      { 
        x: 100, y: 100, width: 200, height: 150, 
        color: GAME_BALANCE.ZONES.FOOD_COLOR, 
        name: 'Rest Zone' 
      },
      { 
        x: 400, y: 200, width: 180, height: 120, 
        color: GAME_BALANCE.ZONES.REST_COLOR, 
        name: 'Food Zone' 
      },
      { 
        x: 700, y: 300, width: 200, height: 160, 
        color: GAME_BALANCE.ZONES.SOCIAL_COLOR, 
        name: 'Social Zone' 
      }
    ];

    activityZones.forEach((zone, index) => {

      const zoneRect = this.scene.add.rectangle(
        zone.x + zone.width / 2,
        zone.y + zone.height / 2,
        zone.width,
        zone.height,
        zone.color,
        GAME_BALANCE.ZONES.DEFAULT_ALPHA
      );
      zoneRect.setStrokeStyle(3, zone.color, 0.6);
      zoneRect.setDepth(2);
      

      const label = this.scene.add.text(
        zone.x + zone.width / 2,
        zone.y + zone.height / 2,
        zone.name,
        {
          fontSize: '16px',
          color: '#ffffff',
          fontFamily: 'Arial',
          fontStyle: 'bold'
        }
      );
      label.setOrigin(0.5);
      label.setDepth(3);
      label.setStroke('#000000', 2);

      this.renderedObjects.set(`activity_zone_${index}`, zoneRect);
      this.renderedObjects.set(`activity_label_${index}`, label);
    });
  }

  /**
   * Update visual elements that change over time
   */
  public updateVisuals(): void {


  }

  /**
   * Hide/show specific elements
   */
  public setElementVisibility(elementId: string, visible: boolean): void {
    const element = this.renderedObjects.get(elementId);
    if (element) {
      element.setVisible(visible);
    }
  }

  /**
   * Change element tint
   */
  public setElementTint(elementId: string, tint: number): void {
    const element = this.renderedObjects.get(elementId);
    if (element && 'setTint' in element) {
      (element as any).setTint(tint);
    }
  }

  /**
   * Cleanup all rendered objects
   */
  public destroy(): void {
    this.renderedObjects.forEach(obj => {
      if (obj.destroy) {
        obj.destroy();
      }
    });
    
    this.zoneGraphics.forEach(graphic => {
      if (graphic.destroy) {
        graphic.destroy();
      }
    });
    
    this.renderedObjects.clear();
    this.zoneGraphics.length = 0;
    
    logAutopoiesis.info('WorldRenderer destroyed');
  }

  /**
   * Get rendering statistics
   */
  public getStats(): { renderedObjects: number; zones: number; elements: number } {
    return {
      renderedObjects: this.renderedObjects.size,
      zones: this.gameState.zones.length,
      elements: this.gameState.mapElements.length
    };
  }
}