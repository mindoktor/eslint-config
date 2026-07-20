import type { ESLint } from 'eslint';
import { defineConfig } from 'eslint/config';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

import { mindoktorRecommended } from './recommended.js';

export const mindoktorReactRecommended = defineConfig({
  extends: [
    mindoktorRecommended,
    reactPlugin.configs.flat.recommended,
    reactPlugin.configs.flat['jsx-runtime'],
  ],
  plugins: {
    // The cast is needed because the v7 types nest `configs.flat`, which the
    // ESLint Plugin type does not model
    'react-hooks': reactHooksPlugin as unknown as ESLint.Plugin,
  },
  rules: {
    // Classic hooks rules only — the v7 presets would also opt every consumer
    // into the experimental React Compiler rules, which is a separate decision
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Prop types are not required in TypeScript
    // See more: https://github.com/mindoktor/mindoktor/pull/18308
    'react/prop-types': 'off',
  },
});
