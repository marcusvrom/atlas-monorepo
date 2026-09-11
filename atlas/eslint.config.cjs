const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
const tsResolver = require.resolve('eslint-import-resolver-typescript', {
  paths: [require.resolve('eslint-config-expo')],
});
module.exports = defineConfig([
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      'apps/mobile/android/**',
      'apps/mobile/ios/**',
      '**/generated/**',
    ],
  },
  expo,
  {
    settings: {
      'import/resolver': {
        [tsResolver]: { project: ['apps/mobile/tsconfig.json', 'packages/*/tsconfig.json'] },
      },
    },
  },
  // Zod usa legitimamente o mesmo nome para valor e tipo; tsc verifica duplicações.
  { files: ['packages/contracts/**/*.ts'], rules: { '@typescript-eslint/no-redeclare': 'off' } },
]);
