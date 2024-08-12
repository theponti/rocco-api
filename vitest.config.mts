import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: "./test/test.setup.ts",
    clearMocks: true,
    exclude: ["**/node_modules/**", "**/build/**"],
    env: {
      SENDGRID_API_KEY: "SG.sendgrid-api-key",
      COOKIE_SECRET: "T1FBln1N5TI7qrzHv/ZW+sVbxKAQtBjUP6U=",
      GOOGLE_SERVICE_ACCOUNT: Buffer.from(
        JSON.stringify({
          type: "service_account",
          project_id: "project-id",
          private_key_id: "private",
        }),
      ).toString("base64"),
    },
    coverage: {
      provider: "v8",
      clean: true,
      enabled: true,
      exclude: ["src/**/*.spec.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
      reporter: ["lcov"],
      reportsDirectory: "coverage",
    },
  },
});
