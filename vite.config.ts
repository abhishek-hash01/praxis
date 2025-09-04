import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    define: {
      __APP_ENV__: JSON.stringify(env.NODE_ENV),
    },
    server: {
      host: "::",
      port: 5173,
    },
    build: {
      outDir: "dist",
      // Ensure environment variables are replaced at build time
      emptyOutDir: true,
      rollupOptions: {
        output: {
          // Prevent exposing paths in sourcemaps
          sourcemapExcludeSources: true,
        },
      },
      // Minify the output
      minify: 'esbuild',
      // Don't include source maps in production
      sourcemap: mode !== 'production',
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});
