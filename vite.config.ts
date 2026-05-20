import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  // Force a single instance of React/React-DOM. Without dedupe, Radix UI's peer dependency on
  // React can lead Vite's optimizer to ship two copies (each with its own dispatcher), which
  // surfaces as "Invalid hook call" / "Cannot read properties of null (reading 'useMemo')" the
  // first time a route loads a Radix component such as <Select>.
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-dom/client"],
  },
  server: {
    proxy: {
      "/backend": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend/, ""),
      },
      "/renderer": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/renderer/, ""),
      },
    },
  },
});
