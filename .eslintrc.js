module.exports = {
  env: {
    es6: true,
    node: false,
    browser: true,
    amd: true,
    mocha: true,
  },
  rules: {
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react/react-in-jsx-scope': 'error',
  },
  plugins: ['react'],
  extends: [
    'eslint:recommended',
    'plugin:react/jsx-runtime',
    'plugin:react/recommended',
  ],
  globals: {
    process: 'readable',
    module: 'writable',
  },
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: { version: 'detect' },
  },
}
