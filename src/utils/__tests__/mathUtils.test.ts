import { describe, it, expect } from "vitest";
import { clamp, lerp, calculateDistance } from "../mathUtils";

describe("mathUtils", () => {
  describe("clamp", () => {
    it("should clamp values to min/max range", () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it("should handle edge cases", () => {
      expect(clamp(0, 0, 0)).toBe(0);
      expect(clamp(5, 10, 0)).toBe(0); // invalid range - clamp respects min/max order
    });
  });

  describe("lerp", () => {
    it("should interpolate between values correctly", () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
      expect(lerp(0, 10, 0.5)).toBe(5);
    });
  });

  describe("calculateDistance", () => {
    it("should calculate distance between points", () => {
      expect(calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(calculateDistance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
    });
  });
});
