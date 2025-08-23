import { vi } from "vitest";

type EventCallback = (...args: unknown[]) => void;
type ListenersMap = Map<string, EventCallback[]>;

// Mock Phaser globally for testing
const mockPhaser = {
  Events: {
    EventEmitter: class MockEventEmitter {
      private listeners: ListenersMap = new Map();

      on(event: string, callback: EventCallback): void {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
      }

      off(event: string, callback?: EventCallback): void {
        if (callback) {
          const callbacks = this.listeners.get(event) || [];
          const index = callbacks.indexOf(callback);
          if (index > -1) {
            callbacks.splice(index, 1);
          }
        } else {
          this.listeners.delete(event);
        }
      }

      emit(event: string, ...args: unknown[]): void {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach((callback: EventCallback) => callback(...args));
      }

      removeAllListeners(): void {
        this.listeners.clear();
      }
    },
  },
  GameObjects: {
    Group: class MockGroup {},
    Container: class MockContainer {},
    Sprite: class MockSprite {},
  },
  Scene: class MockScene {},
  Time: {
    TimerEvent: class MockTimerEvent {},
  },
};

// Global Phaser mock  
declare global {
  interface Window {
    Phaser: typeof mockPhaser;
  }
}
(globalThis as unknown as { Phaser: typeof mockPhaser }).Phaser = mockPhaser;

// Mock window.crypto for secure random tests
Object.defineProperty(window, "crypto", {
  value: {
    getRandomValues: vi.fn().mockImplementation((arr: Uint32Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 0xffffffff);
      }
      return arr;
    }),
  },
  writable: true,
});
