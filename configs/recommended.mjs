// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import { extendFromConfigDefaults } from './utls/config.mjs';

export const mindoktorRecommended = tseslint.config(
  {
    extends: [eslint.configs.recommended, tseslint.configs.strictTypeChecked],
    rules: {
      // // Warn when using '@ts-ignore' declarations (default is "error")
      '@typescript-eslint/prefer-ts-expect-error': 'warn',

      // Do not complain of vars and args prefixed with _
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // // Allow template literals with numbers and booleans E.g. `${42}-${true}`
      ...extendFromConfigDefaults(
        tseslint.configs.strictTypeChecked,
        '@typescript-eslint/restrict-template-expressions',
        [
          'error',
          {
            allowNumber: true,
            allowBoolean: true,
          },
        ]
      ),

      curly: ['error', 'all'],
    },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  }
);
