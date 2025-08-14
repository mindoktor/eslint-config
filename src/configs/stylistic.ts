import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

import tseslint from 'typescript-eslint';

export const mindoktorStylistic = tseslint.config({
  extends: [eslintPluginPrettierRecommended],
});
