/**
 * Utilidades para crear y manipular canvas
 */

/**
 * Crea un canvas con el tamaño especificado
 */
export function createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

/**
 * Crea un canvas con contexto 2D
 */
export function createCanvasWithContext(
    width: number,
    height: number,
): {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
} {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d")!;
    return { canvas, ctx };
}

/**
 * Llena un canvas con un color sólido
 */
export function fillCanvas(
    canvas: HTMLCanvasElement,
    color: string,
): HTMLCanvasElement {
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
}

/**
 * Crea un canvas de color sólido (usado para fallbacks)
 */
export function createColorCanvas(
    width: number,
    height: number,
    color: string,
): HTMLCanvasElement {
    const canvas = createCanvas(width, height);
    return fillCanvas(canvas, color);
}

/**
 * Crea un canvas con gradiente simple
 */
export function createGradientCanvas(
    width: number,
    height: number,
    startColor: string,
    endColor: string,
    vertical: boolean = false,
): HTMLCanvasElement {
    const { canvas, ctx } = createCanvasWithContext(width, height);
    
    const gradient = vertical 
        ? ctx.createLinearGradient(0, 0, 0, height)
        : ctx.createLinearGradient(0, 0, width, 0);
    
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    return canvas;
}