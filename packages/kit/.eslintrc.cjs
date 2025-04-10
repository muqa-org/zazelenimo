/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@muqa/eslint-config/react-internal.js"],
  parser: "@typescript-eslint/parser",
  settings: {
    "next": {
      "rootDir": __dirname
    },
  },
  parserOptions: {
    project: "./tsconfig.lint.json",
    tsconfigRootDir: __dirname,
  },
};
