// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export const mindoktorRecommended = tseslint.config(
  {
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strictTypeChecked,
    ],
    rules: {
      // // Return types should not be mandatory
      '@typescript-eslint/explicit-function-return-type': 'off',

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

      curly: ['error', 'all'],
    },
  }, {
  languageOptions: {
    parserOptions: {
      projectService: true,
    },
  },
});
