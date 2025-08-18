/* eslint-disable import/no-named-as-default-member */
import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export const mindoktorRecommended = tseslint.config(
  // ESLint and Typescript ESLint
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
          // Adding the overrides alone does not work as intended as it would otherwise pick the
          // defaults from the "recommended" set, not the "strict" one.
          // See more: https://github.com/typescript-eslint/typescript-eslint/issues/11462#issuecomment-3160814883
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

  // Imports
  {
    extends: [
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
    ],
    rules: {
      'import/enforce-node-protocol-usage': ['error', 'always'],
      'import/export': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-absolute-path': 'error',
      'import/no-amd': 'error',
      'import/no-cycle': 'warn',
      'import/no-deprecated': 'warn',
      'import/no-extraneous-dependencies': 'error',
      'import/no-named-default': 'error',
      'import/no-self-import': 'error',
      'import/no-webpack-loader-syntax': 'error',
    },
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'off',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
);
