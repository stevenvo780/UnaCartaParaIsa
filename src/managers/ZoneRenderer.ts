/**
 * Renderizador de zonas de recuperación para agentes
 * Hace visible las áreas donde los agentes pueden recuperarse
 */

import type { Zone } from "../types";
import { logAutopoiesis } from "../utils/logger";

export class ZoneRenderer {
  private scene: Phaser.Scene;
  private zoneGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private zoneContainer: Phaser.GameObjects.Container;
  private animationTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.zoneContainer = scene.add.container(0, 0);
    this.zoneContainer.setDepth(5); // Por encima del terreno pero debajo de entidades
  }

  /**
   * Renderiza todas las zonas de recuperación
   */
  renderZones(zones: Zone[]): void {
    // Limpiar zonas existentes
    this.clearZones();

    // Renderizar cada zona
    zones.forEach(zone => {
      this.renderZone(zone);
    });

    // Iniciar animación de pulsación
    this.startPulseAnimation();

    logAutopoiesis.info("🎨 Zonas de recuperación renderizadas", {
      count: zones.length,
      types: zones.map(z => z.type)
    });
  }

  /**
   * Renderiza una zona individual
   */
  private renderZone(zone: Zone): void {
    const graphics = this.scene.add.graphics();
    
    // Configurar estilo según el tipo de zona
    const zoneStyle = this.getZoneStyle(zone);
    
    // Dibujar fondo con transparencia
    graphics.fillStyle(zoneStyle.fillColor, zoneStyle.fillAlpha);
    graphics.fillRoundedRect(
      zone.bounds.x, 
      zone.bounds.y, 
      zone.bounds.width, 
      zone.bounds.height,
      16 // Radio de esquinas redondeadas
    );
    
    // Dibujar borde más visible
    graphics.lineStyle(zoneStyle.borderWidth, zoneStyle.borderColor, zoneStyle.borderAlpha);
    graphics.strokeRoundedRect(
      zone.bounds.x, 
      zone.bounds.y, 
      zone.bounds.width, 
      zone.bounds.height,
      16
    );
    
    // Agregar texto del nombre de la zona
    const text = this.scene.add.text(
      zone.bounds.x + zone.bounds.width / 2,
      zone.bounds.y + zone.bounds.height / 2,
      zone.name,
      {
        fontSize: '18px',
        color: zoneStyle.textColor,
        fontFamily: 'Arial, sans-serif',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 2
      }
    );
    text.setOrigin(0.5, 0.5);
    text.setDepth(10);
    
    // Agregar al container
    this.zoneContainer.add(graphics);
    this.zoneContainer.add(text);
    
    // Guardar referencia para animaciones
    this.zoneGraphics.set(zone.id, graphics);
  }

  /**
   * Obtiene el estilo visual según el tipo de zona
   */
  private getZoneStyle(zone: Zone) {
    const baseColor = parseInt(zone.color.replace('#', ''), 16);
    
    switch (zone.type) {
      case 'food':
        return {
          fillColor: 0x00FF00,
          fillAlpha: 0.3,
          borderColor: 0x00AA00,
          borderAlpha: 0.8,
          borderWidth: 4,
          textColor: '#FFFFFF'
        };
      case 'water':
        return {
          fillColor: 0x00BFFF,
          fillAlpha: 0.3,
          borderColor: 0x0080FF,
          borderAlpha: 0.8,
          borderWidth: 4,
          textColor: '#FFFFFF'
        };
      case 'rest':
        return {
          fillColor: 0xFF00FF,
          fillAlpha: 0.3,
          borderColor: 0xCC00CC,
          borderAlpha: 0.8,
          borderWidth: 4,
          textColor: '#FFFFFF'
        };
      default:
        return {
          fillColor: baseColor,
          fillAlpha: 0.2,
          borderColor: baseColor,
          borderAlpha: 0.6,
          borderWidth: 3,
          textColor: '#FFFFFF'
        };
    }
  }

  /**
   * Inicia animación de pulsación para hacer las zonas más notables
   */
  private startPulseAnimation(): void {
    if (this.animationTween) {
      this.animationTween.destroy();
    }

    this.animationTween = this.scene.tweens.add({
      targets: this.zoneContainer,
      alpha: { from: 0.7, to: 1.0 },
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * Actualiza la visibilidad de las zonas basado en el zoom
   */
  updateVisibility(cameraZoom: number): void {
    // Hacer las zonas más visibles cuando está más cerca
    const alpha = Phaser.Math.Clamp(cameraZoom * 0.8, 0.4, 1.0);
    this.zoneContainer.setAlpha(alpha);
  }

  /**
   * Limpia todas las zonas renderizadas
   */
  clearZones(): void {
    this.zoneGraphics.clear();
    this.zoneContainer.removeAll(true);
    
    if (this.animationTween) {
      this.animationTween.destroy();
      this.animationTween = undefined;
    }
  }

  /**
   * Destruye el renderizador
   */
  destroy(): void {
    this.clearZones();
    this.zoneContainer.destroy();
  }

  /**
   * Obtiene el container de zonas
   */
  getContainer(): Phaser.GameObjects.Container {
    return this.zoneContainer;
  }
}