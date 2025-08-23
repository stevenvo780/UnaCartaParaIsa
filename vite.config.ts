import { defineConfig } from "vite";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@/assets": resolve(__dirname, "public/assets"),
      "@/components": resolve(__dirname, "src/components"),
      "@/config": resolve(__dirname, "src/config"),
      "@/constants": resolve(__dirname, "src/constants"),
      "@/utils": resolve(__dirname, "src/utils"),
      "@/types": resolve(__dirname, "src/types"),
      "@/scenes": resolve(__dirname, "src/scenes"),
      "@/entities": resolve(__dirname, "src/entities"),
      "@/systems": resolve(__dirname, "src/systems"),
    },
  },
  define: {
    "typeof CANVAS_RENDERER": JSON.stringify(true),
    "typeof WEBGL_RENDERER": JSON.stringify(true),
    // Tree-shake Phaser: deshabilitar features no usadas
    "typeof FEATURE_SOUND": JSON.stringify(true), // Mantener audio
    "typeof DEBUG": JSON.stringify(false), // Remover debug en producción
    "typeof EXPERIMENTAL": JSON.stringify(false), // Sin features experimentales
    "typeof PLUGIN_3D": JSON.stringify(false), // Sin 3D
    "typeof PLUGIN_CAMERA3D": JSON.stringify(false), // Sin cámara 3D
    "typeof PLUGIN_FBINSTANT": JSON.stringify(false), // Sin Facebook Instant
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    open: false,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    chunkSizeWarningLimit: 500, // Stricter chunk size limit
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar Phaser en su propio chunk
          phaser: ["phaser"],
          // Separar sistemas críticos
          'systems-core': [
            "./src/systems/NeedsSystem",
            "./src/systems/MovementSystem",
            "./src/systems/QuestSystem"
          ],
          // Separar sistemas avanzados
          'systems-advanced': [
            "./src/systems/AISystem",
            "./src/systems/EmergenceSystem",
            "./src/systems/CardDialogueSystem"
          ],
          // Separar generación de mundo
          'world-generation': [
            "./src/world/DiverseWorldComposer",
            "./src/world/TerrainGenerator",
            "./src/world/VoronoiGenerator"
          ],
          // Separar renderizado
          'world-rendering': [
            "./src/world/LayeredWorldRenderer",
            "./src/world/CreativeAssetLoader"
          ],
          // Separar componentes UI básicos
          'ui-basic': [
            "./src/components/BaseUIComponent",
            "./src/components/SystemStatusUI"
          ],
          // Separar componentes UI complejos
          'ui-complex': [
            "./src/components/QuestUI",
            "./src/components/FoodUI", 
            "./src/components/ExplorationUI",
            "./src/components/DialogueCardUI"
          ],
          // Separar managers
          'managers': [
            "./src/managers/GameLogicManager",
            "./src/managers/EntityManager",
            "./src/managers/EntityStateManager"
          ],
          // Separar utilidades
          'utils': [
            "./src/utils/SystemLoader",
            "./src/utils/LoadingProgressManager",
            "./src/utils/memoryManager"
          ]
        }
      }
    }
  },
  plugins: [
    visualizer({
      filename: "dist/bundle-analysis.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ]
});
