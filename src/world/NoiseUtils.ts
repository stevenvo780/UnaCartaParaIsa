/**
 * Utilidades de ruido para generación procedural de mundos
 * Implementa algoritmos de ruido Perlin y Simplex adaptados para la generación de biomas
 */

import type { NoiseOptions } from './types';

export class NoiseGenerator {
  private p: number[] = [];
  private perm: number[] = [];
  
  constructor(seed: number = 12345) {
    this.initializePermutationTable(seed);
  }
  
  private initializePermutationTable(seed: number): void {
    // Inicializar tabla de permutación con seed
    const rng = new SeededRandom(seed);
    
    // Crear permutación base
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }
    
    // Mezclar usando Fisher-Yates con seed
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }
    
    // Duplicar para evitar buffer overflow
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }
  
  /**
   * Función de fade suave para interpolación
   */
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  /**
   * Interpolación lineal
   */
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }
  
  /**
   * Función de gradiente
   */
  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  
  /**
   * Ruido Perlin 2D básico
   */
  public perlin2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    
    x -= Math.floor(x);
    y -= Math.floor(y);
    
    const u = this.fade(x);
    const v = this.fade(y);
    
    const A = this.perm[X] + Y;
    const AA = this.perm[A];
    const AB = this.perm[A + 1];
    const B = this.perm[X + 1] + Y;
    const BA = this.perm[B];
    const BB = this.perm[B + 1];
    
    return this.lerp(
      this.lerp(
        this.grad(this.perm[AA], x, y),
        this.grad(this.perm[BA], x - 1, y),
        u
      ),
      this.lerp(
        this.grad(this.perm[AB], x, y - 1),
        this.grad(this.perm[BB], x - 1, y - 1),
        u
      ),
      v
    );
  }
  
  /**
   * Ruido fractal con múltiples octavas
   */
  public fractalNoise(x: number, y: number, options: NoiseOptions): number {
    let value = 0;
    let amplitude = 1;
    let frequency = options.scale;
    let maxValue = 0;
    
    for (let i = 0; i < options.octaves; i++) {
      value += this.perlin2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= options.persistence;
      frequency *= options.lacunarity;
    }
    
    return value / maxValue;
  }
  
  /**
   * Ruido ridge (para montañas y features más marcados)
   */
  public ridgeNoise(x: number, y: number, options: NoiseOptions): number {
    let value = 0;
    let amplitude = 1;
    let frequency = options.scale;
    let maxValue = 0;
    
    for (let i = 0; i < options.octaves; i++) {
      const sample = Math.abs(this.perlin2D(x * frequency, y * frequency));
      value += (1 - sample) * amplitude;
      maxValue += amplitude;
      amplitude *= options.persistence;
      frequency *= options.lacunarity;
    }
    
    return value / maxValue;
  }
  
  /**
   * Ruido Voronoi simple para características celulares
   */
  public voronoiNoise(x: number, y: number, scale: number = 1): number {
    const ix = Math.floor(x * scale);
    const iy = Math.floor(y * scale);
    
    let minDist = Infinity;
    
    // Verificar las 9 celdas cercanas
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cellX = ix + dx;
        const cellY = iy + dy;
        
        // Punto semilla pseudoaleatoria en cada celda
        const pointX = cellX + this.hash2D(cellX, cellY) / 256;
        const pointY = cellY + this.hash2D(cellX + 1, cellY) / 256;
        
        const dist = Math.sqrt(
          Math.pow((x * scale) - pointX, 2) + 
          Math.pow((y * scale) - pointY, 2)
        );
        
        minDist = Math.min(minDist, dist);
      }
    }
    
    return Math.min(minDist, 1);
  }
  
  /**
   * Hash 2D simple para Voronoi
   */
  private hash2D(x: number, y: number): number {
    return this.perm[(this.perm[x & 255] + y) & 255];
  }
}

/**
 * Generador de números pseudoaleatorios con seed
 */
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
  
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

/**
 * Utilidades de procesamiento de mapas de ruido
 */
export class NoiseProcessor {
  /**
   * Normaliza un mapa de valores al rango [0, 1]
   */
  public static normalize(map: number[][]): number[][] {
    let min = Infinity;
    let max = -Infinity;
    
    for (const row of map) {
      for (const value of row) {
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
    }
    
    const range = max - min;
    if (range === 0) return map;
    
    return map.map(row => 
      row.map(value => (value - min) / range)
    );
  }
  
  /**
   * Aplica suavizado gaussiano a un mapa
   */
  public static smooth(map: number[][], radius: number = 1): number[][] {
    const height = map.length;
    const width = map[0].length;
    const result = Array(height).fill(0).map(() => Array(width).fill(0));
    
    const kernel = this.createGaussianKernel(radius);
    const kernelSize = kernel.length;
    const offset = Math.floor(kernelSize / 2);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let weightSum = 0;
        
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const ny = y + ky - offset;
            const nx = x + kx - offset;
            
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const weight = kernel[ky][kx];
              sum += map[ny][nx] * weight;
              weightSum += weight;
            }
          }
        }
        
        result[y][x] = weightSum > 0 ? sum / weightSum : map[y][x];
      }
    }
    
    return result;
  }
  
  /**
   * Crea un kernel gaussiano para suavizado
   */
  private static createGaussianKernel(radius: number): number[][] {
    const size = radius * 2 + 1;
    const kernel = Array(size).fill(0).map(() => Array(size).fill(0));
    const sigma = radius / 3;
    const twoSigmaSquared = 2 * sigma * sigma;
    let sum = 0;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - radius;
        const dy = y - radius;
        const value = Math.exp(-(dx * dx + dy * dy) / twoSigmaSquared);
        kernel[y][x] = value;
        sum += value;
      }
    }
    
    // Normalizar
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        kernel[y][x] /= sum;
      }
    }
    
    return kernel;
  }
  
  /**
   * Combina múltiples mapas de ruido con pesos
   */
  public static blend(maps: number[][][], weights: number[]): number[][] {
    if (maps.length === 0 || maps.length !== weights.length) {
      throw new Error('Maps and weights arrays must have the same length');
    }
    
    const height = maps[0].length;
    const width = maps[0][0].length;
    const result = Array(height).fill(0).map(() => Array(width).fill(0));
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        
        for (let i = 0; i < maps.length; i++) {
          sum += maps[i][y][x] * weights[i];
        }
        
        result[y][x] = sum / totalWeight;
      }
    }
    
    return result;
  }
}
