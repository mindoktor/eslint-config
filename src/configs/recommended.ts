import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

type Options = Record<string, string>;
const tseslintRestrictTemplateExpressionRuleEntry =
  tseslint.configs.strictTypeChecked.find(
    (config) =>
      config.rules?.['@typescript-eslint/restrict-template-expressions'] !=
      null,
  )?.rules?.['@typescript-eslint/restrict-template-expressions'];
const tseslintRestrictTemplateExpressionDefaultOptions: Options = Array.isArray(
  tseslintRestrictTemplateExpressionRuleEntry,
)
  ? (tseslintRestrictTemplateExpressionRuleEntry[1] as Options)
  : {};

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

      // Allow template literals with numbers and booleans E.g. `${42}-${true}`
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          ...tseslintRestrictTemplateExpressionDefaultOptions,
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
