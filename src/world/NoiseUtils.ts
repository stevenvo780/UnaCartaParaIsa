/**
 * Utilidades de ruido para generación procedural - Versión simplificada
 * Compatible con ProceduralWorldGenerator
 */

export class NoiseUtils {
  private p: number[] = [];
  private seed: number;

  constructor(seed: string | number = "default") {
    this.seed = typeof seed === "string" ? this.hashString(seed) : seed;
    this.initializePermutationTable();
  }

  /**
   * Hash simple para convertir string a número
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Inicializar tabla de permutación con seed
   */
  private initializePermutationTable(): void {
    // Crear permutación base
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }

    // Mezclar usando el seed
    let currentSeed = this.seed;
    for (let i = 255; i > 0; i--) {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      const j = Math.floor((currentSeed / 233280) * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }

    // Duplicar para evitar buffer overflow
    for (let i = 0; i < 256; i++) {
      this.p[256 + i] = this.p[i];
    }
  }

  /**
   * Función de fade suave
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
   * Ruido Perlin 2D - función principal para el generador
   */
  public noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = this.fade(x);
    const v = this.fade(y);

    const A = this.p[X] + Y;
    const AA = this.p[A & 255];
    const AB = this.p[(A + 1) & 255];
    const B = this.p[X + 1] + Y;
    const BA = this.p[B & 255];
    const BB = this.p[(B + 1) & 255];

    const result = this.lerp(
      this.lerp(
        this.grad(this.p[AA & 255], x, y),
        this.grad(this.p[BA & 255], x - 1, y),
        u,
      ),
      this.lerp(
        this.grad(this.p[AB & 255], x, y - 1),
        this.grad(this.p[BB & 255], x - 1, y - 1),
        u,
      ),
      v,
    );

    // Normalizar al rango [-1, 1]
    return Math.max(-1, Math.min(1, result));
  }

  /**
   * Ruido fractal con múltiples octavas
   */
  public fractalNoise(
    x: number,
    y: number,
    octaves = 4,
    persistence = 0.5,
    scale = 0.1,
  ): number {
    let value = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return value / maxValue;
  }

  /**
   * Obtener valor de ruido normalizado [0, 1]
   */
  public normalizedNoise(x: number, y: number): number {
    return (this.noise2D(x, y) + 1) * 0.5;
  }

  /**
   * Ruido ridge para características montañosas
   */
  public ridgeNoise(x: number, y: number, octaves = 4): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 0.02;

    for (let i = 0; i < octaves; i++) {
      const sample = Math.abs(this.noise2D(x * frequency, y * frequency));
      value += (1 - sample) * amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return Math.max(0, Math.min(1, value));
  }

  /**
   * Obtener el seed actual
   */
  public getSeed(): number {
    return this.seed;
  }

  /**
   * Regenerar con nuevo seed
   */
  public reseed(newSeed: string | number): void {
    this.seed =
      typeof newSeed === "string" ? this.hashString(newSeed) : newSeed;
    this.initializePermutationTable();
  }
}
