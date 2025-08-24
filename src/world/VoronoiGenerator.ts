import Delaunator from "delaunator";
import { logAutopoiesis } from "../utils/logger";

export interface Point {
  x: number;
  y: number;
}

export interface VoronoiCell {
  site: Point;
  vertices: Point[];
  neighbors: number[];
}

export interface VoronoiRegion {
  id: number;
  center: Point;
  bounds: Point[];
  area: number;
  biomeType?: string;
}

/**
 * Generador de diagramas de Voronoi para distribución orgánica de biomas
 */
export class VoronoiGenerator {
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Genera regiones Voronoi usando Poisson Disk Sampling para distribución orgánica
   */
  generateRegions(numRegions: number, minDistance = 100): VoronoiRegion[] {
    logAutopoiesis.info("🔸 Generando regiones Voronoi", {
      numRegions,
      minDistance,
    });

    // 1. Generar puntos con Poisson Disk Sampling
    const sites = this.poissonDiskSampling(numRegions, minDistance);

    // 2. Calcular diagrama de Voronoi
    const voronoi = this.computeVoronoi(sites);

    // 3. Convertir a regiones útiles
    const regions = this.convertToRegions(voronoi);

    logAutopoiesis.info("✅ Regiones Voronoi generadas", {
      regionsCount: regions.length,
      avgArea: regions.reduce((sum, r) => sum + r.area, 0) / regions.length,
    });

    return regions;
  }

  /**
   * Poisson Disk Sampling para distribución orgánica uniforme
   */
  private poissonDiskSampling(
    targetCount: number,
    minDistance: number,
  ): Point[] {
    const points: Point[] = [];
    const active: Point[] = [];
    const cellSize = minDistance / Math.sqrt(2);
    const cols = Math.ceil(this.width / cellSize);
    const rows = Math.ceil(this.height / cellSize);
    const grid: (Point | null)[][] = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(null));

    // Punto inicial aleatorio
    const initialPoint: Point = {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
    };

    points.push(initialPoint);
    active.push(initialPoint);

    const col = Math.floor(initialPoint.x / cellSize);
    const row = Math.floor(initialPoint.y / cellSize);
    grid[row][col] = initialPoint;

    const k = 30; // Número de intentos por punto activo

    while (active.length > 0 && points.length < targetCount) {
      const randomIndex = Math.floor(Math.random() * active.length);
      const point = active[randomIndex];
      let found = false;

      for (let tries = 0; tries < k; tries++) {
        // Generar punto candidato en anillo
        const angle = Math.random() * 2 * Math.PI;
        const radius = minDistance * (1 + Math.random());
        const candidate: Point = {
          x: point.x + radius * Math.cos(angle),
          y: point.y + radius * Math.sin(angle),
        };

        // Verificar límites
        if (
          candidate.x < 0 ||
          candidate.x >= this.width ||
          candidate.y < 0 ||
          candidate.y >= this.height
        ) {
          continue;
        }

        // Verificar distancia mínima
        const candidateCol = Math.floor(candidate.x / cellSize);
        const candidateRow = Math.floor(candidate.y / cellSize);

        let valid = true;

        // Verificar celdas vecinas
        for (let i = -2; i <= 2; i++) {
          for (let j = -2; j <= 2; j++) {
            const neighborRow = candidateRow + i;
            const neighborCol = candidateCol + j;

            if (
              neighborRow >= 0 &&
              neighborRow < rows &&
              neighborCol >= 0 &&
              neighborCol < cols &&
              grid[neighborRow][neighborCol]
            ) {
              const neighbor = grid[neighborRow][neighborCol]!;
              const distance = Math.sqrt(
                (candidate.x - neighbor.x) ** 2 +
                  (candidate.y - neighbor.y) ** 2,
              );

              if (distance < minDistance) {
                valid = false;
                break;
              }
            }
          }
          if (!valid) break;
        }

        if (valid) {
          points.push(candidate);
          active.push(candidate);
          grid[candidateRow][candidateCol] = candidate;
          found = true;
          break;
        }
      }

      if (!found) {
        active.splice(randomIndex, 1);
      }
    }

    return points;
  }

  /**
   * Computa el diagrama de Voronoi usando Delaunator
   */
  private computeVoronoi(sites: Point[]): VoronoiCell[] {
    const coords = sites.flatMap((site) => [site.x, site.y]);
    const delaunay = Delaunator.from(sites.map((site) => [site.x, site.y]));

    const cells: VoronoiCell[] = [];

    for (let i = 0; i < sites.length; i++) {
      const cell: VoronoiCell = {
        site: sites[i],
        vertices: [],
        neighbors: [],
      };

      // Obtener vértices de la celda Voronoi
      const vertices = this.getVoronoiCellVertices(delaunay, i);
      cell.vertices = vertices;

      cells.push(cell);
    }

    return cells;
  }

  /**
   * Obtiene los vértices de una celda Voronoi específica
   */
  private getVoronoiCellVertices(
    delaunay: Delaunator<ArrayLike<number>>,
    siteIndex: number,
  ): Point[] {
    const vertices: Point[] = [];
    const { triangles, halfedges } = delaunay;

    // Encontrar todos los triángulos que contienen este sitio
    const triangleIndices: number[] = [];
    for (let t = 0; t < triangles.length; t += 3) {
      if (
        triangles[t] === siteIndex ||
        triangles[t + 1] === siteIndex ||
        triangles[t + 2] === siteIndex
      ) {
        triangleIndices.push(t / 3);
      }
    }

    // Para cada triángulo, calcular el circumcentro (vértice Voronoi)
    for (const triangleIndex of triangleIndices) {
      const t = triangleIndex * 3;
      const i = triangles[t];
      const j = triangles[t + 1];
      const k = triangles[t + 2];

      const circumcenter = this.circumcenter(
        delaunay.coords[2 * i],
        delaunay.coords[2 * i + 1],
        delaunay.coords[2 * j],
        delaunay.coords[2 * j + 1],
        delaunay.coords[2 * k],
        delaunay.coords[2 * k + 1],
      );

      vertices.push(circumcenter);
    }

    return vertices;
  }

  /**
   * Calcula el circumcentro de un triángulo
   */
  private circumcenter(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
  ): Point {
    const dx = bx - ax;
    const dy = by - ay;
    const ex = cx - ax;
    const ey = cy - ay;
    const bl = dx * dx + dy * dy;
    const cl = ex * ex + ey * ey;
    const d = 0.5 / (dx * ey - dy * ex);

    return {
      x: ax + (ey * bl - dy * cl) * d,
      y: ay + (dx * cl - ex * bl) * d,
    };
  }

  /**
   * Convierte celdas Voronoi a regiones útiles para el juego
   */
  private convertToRegions(cells: VoronoiCell[]): VoronoiRegion[] {
    return cells.map((cell, index) => {
      // Calcular área usando fórmula del cordón de zapato
      const area = this.calculatePolygonArea(cell.vertices);

      return {
        id: index,
        center: cell.site,
        bounds: cell.vertices,
        area: Math.abs(area),
      };
    });
  }

  /**
   * Calcula el área de un polígono usando la fórmula del cordón de zapato
   */
  private calculatePolygonArea(vertices: Point[]): number {
    if (vertices.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
    }

    return area / 2;
  }

  /**
   * Asigna biomas a las regiones basado en su posición y características
   */
  assignBiomes(regions: VoronoiRegion[]): VoronoiRegion[] {
    const biomes = [
      "GRASSLAND",
      "FOREST",
      "DESERT",
      "MOUNTAINOUS",
      "WETLAND",
      "COASTAL",
      "VILLAGE",
      "WASTELAND",
    ];

    return regions.map((region) => {
      // Asignación básica basada en posición
      let biomeType: string;

      if (region.center.y < this.height * 0.2) {
        biomeType = "MOUNTAINOUS";
      } else if (region.center.y > this.height * 0.8) {
        biomeType = "COASTAL";
      } else if (region.center.x < this.width * 0.3) {
        biomeType = "FOREST";
      } else if (region.center.x > this.width * 0.7) {
        biomeType = "DESERT";
      } else if (region.area < 5000) {
        biomeType = "VILLAGE";
      } else {
        biomeType = "GRASSLAND";
      }

      return {
        ...region,
        biomeType,
      };
    });
  }
}
