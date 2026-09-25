import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Vendored from the @bklit shadcn registry (`npx shadcn add @bklit/...`).
    //
    // Held to its own standards rather than ours: it trips ~28 of the React
    // Compiler rules this project runs — setState inside an effect, writing a
    // ref during render — and those are judgement calls its authors made about
    // animation timing, not mistakes to correct here. Editing them would only
    // mean re-editing them the next time the component is pulled.
    //
    // ⚠️ The exception is deliberate: `quarterSparkline` is this project's own
    // chart and predates the registry. It happens to live in the folder the
    // registry installs into, so it is un-ignored by name and stays linted.
    "components/charts/**",
    "!components/charts/quarterSparkline.tsx",
  ]),
]);

export default eslintConfig;
