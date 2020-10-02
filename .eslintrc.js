module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true
  },
  extends: 'airbnb-base',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018
  },
  rules: {
    'linebreak-style': ['error', 'windows'],
    'comma-dangle': 'off',
    'no-console': 'off'
  }
};
