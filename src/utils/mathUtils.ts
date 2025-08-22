/**
 * Utilidades matemáticas compartidas
 */

import type { Zone } from "../types";

/**
 * Interpolación lineal entre dos valores
 */
export function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

/**
 * Calcula distancia euclidea entre dos puntos
 */
export function calculateDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number },
): number {
  return Math.hypot(point2.x - point1.x, point2.y - point1.y);
}

/**
 * Obtiene el centro de una zona
 */
export function getZoneCenter(zone: Zone): { x: number; y: number } {
  return {
    x: zone.bounds.x + zone.bounds.width / 2,
    y: zone.bounds.y + zone.bounds.height / 2,
  };
}

/**
 * Calcula distancia entre dos zonas
 */
export function calculateZoneDistance(zoneA: Zone, zoneB: Zone): number {
  const centerA = getZoneCenter(zoneA);
  const centerB = getZoneCenter(zoneB);
  return calculateDistance(centerA, centerB);
}

/**
 * Clamp un valor entre un mínimo y máximo
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Verifica si un número está dentro de un rango
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Convierte coordenadas del mundo a coordenadas de grilla
 */
export function worldToGrid(
  x: number,
  y: number,
  gridSize: number,
): { x: number; y: number } {
  return {
    x: Math.floor(x / gridSize),
    y: Math.floor(y / gridSize),
  };
}

/**
 * Convierte una posición a tile/baldosa
 */
export function positionToTile(
  position: { x: number; y: number },
  tileSize: number,
): { x: number; y: number } {
  return worldToGrid(position.x, position.y, tileSize);
}

/**
 * Redondea un número a N decimales
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
