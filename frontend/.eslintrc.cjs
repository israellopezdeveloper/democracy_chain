const ts = require("typescript-eslint");
const eslint = require("@eslint/js");

module.exports = ts.config(
  eslint.configs.recommended,
  ...ts.configs.strictTypeChecked, // Reglas TS muy estrictas
  ...ts.configs.stylisticTypeChecked, // Estilo sobre TS
  {
    ignores: ["dist", "node_modules"],
    languageOptions: {
      parserOptions: { project: ["tsconfig.json"] },
    },
    plugins: {
      import: require("eslint-plugin-import"),
      unicorn: require("eslint-plugin-unicorn"),
      promise: require("eslint-plugin-promise"),
      security: require("eslint-plugin-security"),
      sonarjs: require("eslint-plugin-sonarjs"),
    },
    rules: {
      // Import/order & errores comunes
      "import/order": [
        "error",
        { "newlines-between": "always", alphabetize: { order: "asc" } },
      ],
      "import/no-unresolved": "error",
      "import/no-extraneous-dependencies": [
        "error",
        { devDependencies: ["**/*.test.*", "vite.config.*"] },
      ],

      // Promesas
      "promise/no-return-wrap": "error",
      "promise/always-return": "off",
      "promise/no-nesting": "warn",

      // Seguridad & calidad
      "security/detect-object-injection": "off", // útil pero ruidoso; actívalo si puedes
      "sonarjs/no-duplicate-string": "warn",
      "sonarjs/cognitive-complexity": ["warn", 15],

      // Unicorn (buenas prácticas)
      "unicorn/no-null": "off",
      "unicorn/prefer-optional-catch-binding": "error",
      "unicorn/no-await-expression-member": "error",

      // TS: endurece aún más
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },
  // Último: apaga conflictos con Prettier
  require("eslint-config-prettier"),
);
