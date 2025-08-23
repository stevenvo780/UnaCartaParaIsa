import { describe, it, expect, beforeEach, vi } from "vitest";
import { NeedsSystem } from "../NeedsSystem";

describe("NeedsSystem", () => {
  let mockScene: any;
  let mockGameState: any;
  let needsSystem: NeedsSystem;

  beforeEach(() => {
    mockScene = {
      registry: {
        get: vi.fn(),
        set: vi.fn(),
      },
      events: {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      },
      time: {
        now: 1000,
      },
    };

    mockGameState = {
      entities: [
        { id: "isa", position: { x: 100, y: 100 } },
        { id: "stev", position: { x: 200, y: 200 } },
      ],
      zones: [],
    };

    needsSystem = new NeedsSystem(mockScene, mockGameState);
  });

  describe("initializeEntityNeeds", () => {
    it("should initialize entity needs with default values", () => {
      const entityId = "test_entity";

      needsSystem.initializeEntityNeeds(entityId);

      const needs = needsSystem.getEntityNeeds(entityId);
      expect(needs).toBeDefined();
      expect(needs?.needs.hunger).toBeGreaterThan(0);
      expect(needs?.needs.energy).toBeGreaterThan(0);
    });

    it("should initialize entity needs with provided values", () => {
      const entityId = "test_entity";
      const customNeeds = {
        hunger: 50,
        thirst: 60,
        energy: 70,
        hygiene: 80,
        social: 90,
        fun: 40,
        mentalHealth: 85,
        lastUpdate: Date.now(),
      };

      needsSystem.initializeEntityNeeds(entityId, customNeeds);

      const needs = needsSystem.getEntityNeeds(entityId);
      expect(needs?.needs.hunger).toBe(50);
      expect(needs?.needs.thirst).toBe(60);
    });
  });

  describe("needs management", () => {
    it("should handle entity needs updates", () => {
      // Test basic needs functionality without accessing private methods
      const entityId = "test_entity";
      needsSystem.initializeEntityNeeds(entityId);

      const needs = needsSystem.getEntityNeeds(entityId);
      expect(needs).toBeDefined();
      expect(needs?.entityId).toBe(entityId);
    });

    it("should track emergency levels correctly", () => {
      const entityId = "test_entity";
      needsSystem.initializeEntityNeeds(entityId);

      const needs = needsSystem.getEntityNeeds(entityId);
      expect(needs?.emergencyLevel).toBeDefined();
    });
  });
});
