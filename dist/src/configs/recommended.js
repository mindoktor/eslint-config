import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';
export const mindoktorRecommended = defineConfig(
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
        // Enforce consistent brace style for all control statements
        curly: ['error', 'all'],
        // Enforce simple and consistent object literal syntax
        'dot-notation': 'error',
        'no-useless-rename': 'error',
        'object-shorthand': ['error', 'always'],
        // Prefer ...rest over the old `arguments` variable
        'prefer-rest-params': 'error',
        // Use template literals instead of string concatenation
        'prefer-template': 'error',
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
        // Enforce separate-line type imports over the inline `type` keyword on
        // value imports. consistent-type-imports only marks type imports as types;
        // it treats inline (`import { type X }`) and top-level (`import type { X }`)
        // as equally valid. This rule requires the top-level form for cleaner erasure.
        'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/no-absolute-path': 'error',
        'import/no-amd': 'error',
        'import/no-cycle': 'warn',
        'import/no-extraneous-dependencies': 'error',
        'import/no-named-default': 'error',
        'import/no-self-import': 'error',
        'import/no-webpack-loader-syntax': 'error',
        // Disable redundant rules
        // See more:
        // - Performance issues: https://typescript-eslint.io/troubleshooting/typed-linting/performance#eslint-plugin-import
        // - Parse errors: https://github.com/typescript-eslint/typescript-eslint/issues/1333
        'import/default': 'off',
        'import/named': 'off',
        'import/namespace': 'off',
        'import/no-deprecated': 'off',
        'import/no-named-as-default-member': 'off',
        'import/no-unresolved': 'off',
    },
}, 
// Type import workaround for no-duplicate-imports issues
// See more: https://github.com/import-js/eslint-plugin-import/issues/3185#issuecomment-3275581648
{
    rules: {
        'import/no-duplicates': ['off'],
        'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
    },
}, 
// Import sorting and unused imports
{
    plugins: {
        'simple-import-sort': simpleImportSort,
        'unused-imports': unusedImports,
    },
    rules: {
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        // Needs to be disabled for this to work correctly
        // See: https://github.com/sweepline/eslint-plugin-unused-imports?tab=readme-ov-file#usage
        '@typescript-eslint/no-unused-vars': 'off',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': [
            'error',
            {
                args: 'all',
                argsIgnorePattern: '^_',
                vars: 'all',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
                destructuredArrayIgnorePattern: '^_',
                reportUsedIgnorePattern: true,
            },
        ],
    },
});
//# sourceMappingURL=recommended.js.map