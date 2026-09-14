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
    // Compiled output of the design system — lint its source, not its build.
    "packages/*/dist/**",
    // design-sync working dirs: staged converter scripts, the generated bundle
    // (which vendors React), and the sync inputs. None of it is app code.
    ".ds-sync/**",
    "ds-bundle/**",
    ".design-sync/**",
  ]),
]);

export default eslintConfig;
