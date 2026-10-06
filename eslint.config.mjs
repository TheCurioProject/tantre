import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig(
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/incompatible-library": "off",
    },
  },
  globalIgnores([
    "tmp/**",
    "test-results/**",
    "playwright-report/**",
    "out/**",
    ".next/**",
    ".worker-build/**",
    "tantre-assets/**",
    "public/**",
    "next-env.d.ts",
  ]),
);
