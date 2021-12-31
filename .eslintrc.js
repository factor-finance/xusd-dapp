module.exports = {
  env: {
    es6: true,
    node: false,
    browser: true,
    amd: true,
    mocha: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/jsx-runtime"
  ],
  globals: {
    process: "readable",
    module: "writable"
  },
  parserOptions: {
    ecmaVersion: 11,
    sourceType: "module",
  }
};
