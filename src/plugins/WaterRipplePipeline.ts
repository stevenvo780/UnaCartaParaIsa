import Phaser from "phaser";

/**
 * WaterRipplePipeline
 * Pipeline WebGL ligero para simular ondas en agua sobre sprites individuales.
 * No afecta toda la escena; solo los sprites con setPipeline('WaterRipple').
 */
export class WaterRipplePipeline extends Phaser.Renderer.WebGL.Pipelines
  .SinglePipeline {
  constructor(game: Phaser.Game) {
    super({
      game,
      fragShader: `
      precision mediump float;
      uniform sampler2D uMainSampler;
      uniform float uTime;
      uniform vec2 uResolution;
      varying vec2 outTexCoord;

      // Parámetros ajustables
      const float SPEED = 0.5;      // velocidad de animación
      const float AMPLITUDE = 0.008; // amplitud de distorsión
      const float FREQ = 12.0;       // frecuencia de ondas

      void main() {
        vec2 uv = outTexCoord;
        float t = uTime * SPEED;

        // Distorsión sinusoidal simple combinada (horizontal + vertical)
        float waveX = sin((uv.y + t) * FREQ) * AMPLITUDE;
        float waveY = cos((uv.x + t * 1.2) * FREQ) * AMPLITUDE;
        uv += vec2(waveX, waveY);

        // Sample original con leve atenuación hacia los bordes (sutil vignette)
        vec4 color = texture2D(uMainSampler, uv);
        float vignette = smoothstep(0.0, 0.1, uv.x) * smoothstep(1.0, 0.9, uv.x)
                        * smoothstep(0.0, 0.1, uv.y) * smoothstep(1.0, 0.9, uv.y);
        color.rgb *= mix(0.98, 1.02, vignette);

        // Ligero tinte azulado muy sutil
        color.rgb = mix(color.rgb, vec3(0.92, 0.97, 1.0), 0.04);
        gl_FragColor = color;
      }
      `,
    });
  }

  onPreRender(): void {
    // Actualizar uniforms cada frame
    const time = (this.game.loop?.time || 0) / 1000;
    this.set1f("uTime", time);

    // Usar resolución del escalado de Phaser (tipado correcto)
    const w: number = this.game.scale.width;
    const h: number = this.game.scale.height;
    this.set2f("uResolution", w, h);
  }
}

export default WaterRipplePipeline;
