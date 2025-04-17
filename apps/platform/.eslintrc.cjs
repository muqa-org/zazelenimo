/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: [
    "@muqa/eslint-config/next.js",
  ],
  parser: "@typescript-eslint/parser",
  settings: {
    "next": {
      "rootDir": __dirname
    },
  },
  parserOptions: {
    project: true,
  },
};
