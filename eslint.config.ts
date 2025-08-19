import { globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

import minDoktorEsLintConfig from './src/index.js';

export default tseslint.config(
  {
    extends: [minDoktorEsLintConfig],
    // Language Options
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
  },
  {
    rules: {
      // Custom rules can be added here
      // ...
    },
  },
  globalIgnores([
    'dist/', // ignore entire dist directory
    'node_modules/',
  ]),
);
