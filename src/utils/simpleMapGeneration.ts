/**
 * Mapa simplificado con 12 zonas especializadas - VERSIÓN LIMPIA sin basura
 */

import type { GameState, MapElement, Zone } from "../types";
import { logAutopoiesis } from "./logger";

export function createDefaultZones(): Zone[] {
  return [
    {
      id: "nourishment",
      name: "Jardín de Nutrición",
      bounds: { x: 80, y: 100, width: 350, height: 300 },
      type: "food",
      color: "rgba(46, 204, 113, 0.3)",
      attractiveness: 5,
    },
    {
      id: "wisdom",
      name: "Biblioteca",
      bounds: { x: 480, y: 120, width: 320, height: 280 },
      type: "comfort",
      color: "rgba(78, 52, 46, 0.3)",
      attractiveness: 4,
    },
    {
      id: "healing",
      name: "Santuario",
      bounds: { x: 850, y: 100, width: 300, height: 250 },
      type: "rest",
      color: "rgba(231, 76, 60, 0.25)",
      attractiveness: 6,
    },
    {
      id: "workshop",
      name: "Taller",
      bounds: { x: 1200, y: 140, width: 380, height: 340 },
      type: "work",
      color: "rgba(189, 195, 199, 0.25)",
      attractiveness: 3,
    },
    {
      id: "spa",
      name: "Spa",
      bounds: { x: 1650, y: 100, width: 280, height: 300 },
      type: "comfort",
      color: "rgba(142, 68, 173, 0.25)",
      attractiveness: 7,
    },
    {
      id: "entertainment",
      name: "Teatro",
      bounds: { x: 100, y: 500, width: 400, height: 320 },
      type: "recreation",
      color: "rgba(244, 208, 63, 0.3)",
      attractiveness: 6,
    },
    {
      id: "celebration",
      name: "Plaza",
      bounds: { x: 580, y: 480, width: 350, height: 340 },
      type: "social",
      color: "rgba(26, 188, 156, 0.3)",
      attractiveness: 5,
    },
    {
      id: "meditation",
      name: "Jardín Zen",
      bounds: { x: 1000, y: 520, width: 320, height: 280 },
      type: "rest",
      color: "rgba(155, 89, 182, 0.25)",
      attractiveness: 5,
    },
    {
      id: "exploration",
      name: "Centro Aventura",
      bounds: { x: 1400, y: 500, width: 380, height: 300 },
      type: "recreation",
      color: "rgba(230, 126, 34, 0.3)",
      attractiveness: 4,
    },
    {
      id: "social_hub",
      name: "Hub Social",
      bounds: { x: 1850, y: 480, width: 300, height: 320 },
      type: "social",
      color: "rgba(52, 152, 219, 0.3)",
      attractiveness: 6,
    },
    {
      id: "creative",
      name: "Estudio Arte",
      bounds: { x: 200, y: 950, width: 400, height: 280 },
      type: "recreation",
      color: "rgba(241, 196, 15, 0.3)",
      attractiveness: 5,
    },
    {
      id: "reflection",
      name: "Laguna",
      bounds: { x: 700, y: 920, width: 350, height: 300 },
      type: "rest",
      color: "rgba(52, 73, 94, 0.25)",
      attractiveness: 4,
    },
  ];
}

export function createExpandedMapElements(): MapElement[] {
  return [
    {
      id: "central_fountain",
      position: { x: 900, y: 700 },
      size: { width: 80, height: 80 },
      type: "decoration",
      color: "#3498db",
    },
    {
      id: "north_bridge",
      position: { x: 800, y: 50 },
      size: { width: 200, height: 40 },
      type: "decoration",
      color: "#8b4513",
    },
    {
      id: "garden_gazebo",
      position: { x: 250, y: 250 },
      size: { width: 60, height: 60 },
      type: "decoration",
      color: "#ffffff",
    },
    {
      id: "library_entrance",
      position: { x: 640, y: 200 },
      size: { width: 50, height: 30 },
      type: "decoration",
      color: "#4e342e",
    },
    {
      id: "healing_altar",
      position: { x: 1000, y: 225 },
      size: { width: 40, height: 40 },
      type: "decoration",
      color: "#e74c3c",
    },
    {
      id: "workshop_forge",
      position: { x: 1390, y: 310 },
      size: { width: 70, height: 50 },
      type: "decoration",
      color: "#95a5a6",
    },
    {
      id: "spa_pool",
      position: { x: 1790, y: 250 },
      size: { width: 90, height: 70 },
      type: "decoration",
      color: "#8e44ad",
    },
    {
      id: "theater_stage",
      position: { x: 300, y: 660 },
      size: { width: 120, height: 80 },
      type: "decoration",
      color: "#f1c40f",
    },
    {
      id: "plaza_monument",
      position: { x: 755, y: 650 },
      size: { width: 60, height: 80 },
      type: "decoration",
      color: "#1abc9c",
    },
    {
      id: "zen_stones",
      position: { x: 1160, y: 660 },
      size: { width: 50, height: 30 },
      type: "decoration",
      color: "#9b59b6",
    },
    {
      id: "adventure_base",
      position: { x: 1590, y: 650 },
      size: { width: 80, height: 60 },
      type: "decoration",
      color: "#e67e22",
    },
    {
      id: "social_beacon",
      position: { x: 2000, y: 640 },
      size: { width: 40, height: 60 },
      type: "decoration",
      color: "#3498db",
    },
    {
      id: "art_easel",
      position: { x: 400, y: 1090 },
      size: { width: 30, height: 40 },
      type: "decoration",
      color: "#f39c12",
    },
    {
      id: "reflection_pier",
      position: { x: 875, y: 1070 },
      size: { width: 100, height: 30 },
      type: "decoration",
      color: "#34495e",
    },
    {
      id: "east_watchtower",
      position: { x: 2100, y: 300 },
      size: { width: 50, height: 80 },
      type: "decoration",
      color: "#7f8c8d",
    },
    {
      id: "west_gate",
      position: { x: 30, y: 600 },
      size: { width: 40, height: 60 },
      type: "decoration",
      color: "#5d4e75",
    },
    {
      id: "south_garden",
      position: { x: 1200, y: 1350 },
      size: { width: 200, height: 100 },
      type: "decoration",
      color: "#27ae60",
    },
    {
      id: "crystal_formation",
      position: { x: 1500, y: 800 },
      size: { width: 60, height: 90 },
      type: "decoration",
      color: "#af7ac5",
    },
  ];
}

export function createWorldMapData(): GameState {
  const zones = createDefaultZones();
  const mapElements = createExpandedMapElements();

  logAutopoiesis.info("🗺️ Mundo expandido creado", {
    zones: zones.length,
    elements: mapElements.length,
    worldSize: "2400x1600",
  });

  return {
    zones,
    mapElements,
    entities: [],
    resonance: 0,
    cycles: 0,
    lastSave: Date.now(),
    togetherTime: 0,
    connectionAnimation: {
      active: false,
      startTime: 0,
      type: "NOURISH",
    },
    currentConversation: {
      isActive: false,
      participants: [],
      lastSpeaker: null,
      lastDialogue: null,
      startTime: 0,
    },
    terrainTiles: [],
    roads: [],
    objectLayers: [],
    worldSize: { width: 2400, height: 1600 },
    generatorVersion: "1.0.0",
  };
}
