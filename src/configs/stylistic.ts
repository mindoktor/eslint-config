import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

import tseslint from 'typescript-eslint';

const prettierConfig = {
  singleQuote: true,
  parser: 'typescript',
} as const;

export const mindoktorStylistic = tseslint.config({
  extends: [eslintPluginPrettierRecommended],
  rules: {
    'prettier/prettier': ['error', prettierConfig],
  },
});
