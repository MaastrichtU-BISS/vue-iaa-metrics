import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";

// Dev: `vite` serves the demo harness (index.html + src/dev).
// Build: library mode, Vue kept external so consumers provide their own.
export default defineConfig({
  plugins: [
    vue(),
    // Emits one .d.ts per source file into dist/, mirroring src/index.ts's
    // exports — scoped to `src` minus `src/dev` and tests, so their types
    // never leak into the published package. (Not rollupTypes: true — that
    // option goes through @microsoft/api-extractor, which silently drops
    // declarations for .vue SFCs, breaking MetricsPage's published types
    // entirely.)
    dts({
      include: ["src"],
      exclude: ["src/dev/**", "src/**/*.test.ts"],
      tsconfigPath: resolve(__dirname, "tsconfig.json"),
      // Its own .vue auto-detection only checks include-glob strings for a
      // literal ".vue" substring plus a shallow root-dir scan — neither
      // reaches src/components/*.vue, so it silently (no warning) falls back
      // to the plain "ts" processor and drops every component's types.
      processor: "vue",
    }),
  ],
  server: {
    // Dev-only: proxies to a locally-run `lawnotation-iaa --serve` so the
    // demo harness can exercise real computation. Same-origin through this
    // proxy avoids the Go service's lack of CORS headers — exactly the
    // "host proxies it" pattern real consumers are expected to follow (see
    // src/dev/mockSource.ts and the README).
    proxy: {
      "/iaa": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/iaa/, ""),
      },
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "VueIaaMetrics",
      fileName: "vue-iaa-metrics",
    },
    rollupOptions: {
      external: ["vue"],
      output: { globals: { vue: "Vue" } },
    },
  },
});
