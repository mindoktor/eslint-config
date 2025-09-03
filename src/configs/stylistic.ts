import { defineConfig } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const prettierConfig = {
  singleQuote: true,
  parser: 'typescript',
} as const;

export const mindoktorStylistic = defineConfig({
  extends: [eslintPluginPrettierRecommended],
  rules: {
    'prettier/prettier': ['error', prettierConfig],
  },
});
