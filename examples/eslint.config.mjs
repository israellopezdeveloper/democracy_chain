// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // Reglas recomendadas para JS (flat)
  js.configs.recommended,

  // Reglas recomendadas para TS (flat)
  ...tseslint.configs.recommended,

  // Ajustes comunes para JS/TS
  {
    files: ["**/*.{js,cjs,mjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": "off", // lo gestiona la regla de TS debajo
    },
  },

  // Reglas específicas de TS
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
];
