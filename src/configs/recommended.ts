import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';


export const mindoktorRecommended = tseslint.config(
  {
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',

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

      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          // Copy/pasted strict defaults from https://typescript-eslint.io/rules/restrict-template-expressions#options
          // to allow options overrides keeping using strict defaults.
          // Why adding just the overrides was not enough?
          // See: https://github.com/typescript-eslint/typescript-eslint/issues/11462#issuecomment-3160814883
          ...{
            allowAny: false,
            allowBoolean: false,
            allowNever: false,
            allowNullish: false,
            allowNumber: false,
            allowRegExp: false,
          },
          // Actual overrides
          // Allow template literals with numbers and booleans E.g. `${42}-${true}`
          allowNumber: true,
          allowBoolean: true,
        },
      ],

      // We want to enforce strict boolean expressions to avoid unintended type coercion
      // https://typescript-eslint.io/rules/strict-boolean-expressions
      '@typescript-eslint/strict-boolean-expressions': 'error',

      curly: ['error', 'all'],
    },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
);
