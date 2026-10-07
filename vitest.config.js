import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.vitest.js"],
    setupFiles: ["./test/setup.js"],
    hookTimeout: 300000,
  },
});