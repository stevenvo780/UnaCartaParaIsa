import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "coverage/",
        "**/*.d.ts",
        "vite.config.ts",
        "vitest.config.ts",
      ],
    },
  },
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
});
