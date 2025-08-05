// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const mindoktorRecommended = tseslint.config(
  {
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
    ],
    rules: {
      // // Return types should not be mandatory
      // '@typescript-eslint/explicit-function-return-type': 'off',

      // // Warn when using '@ts-ignore' declarations (default is "error")
      // '@typescript-eslint/prefer-ts-expect-error': 'warn',

      // Do not complain of vars and args prefixed with _
      '@typescript-eslint/no-unused-vars': [
        'off',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      curly: ['error', 'all'],
    },
},   {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },);
