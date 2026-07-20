import { defineConfig } from 'eslint/config';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

import { mindoktorRecommended } from './recommended.js';

// v7's `configs.flat` grouping does not fit ESLint's Plugin type (every
// `configs` value must itself be a config), so we register the plugin
// without its `configs` — ESLint only reads `meta` and `rules` anyway
const { configs: _configs, ...reactHooksPluginBase } = reactHooksPlugin;

export const mindoktorReactRecommended = defineConfig({
  extends: [
    mindoktorRecommended,
    reactPlugin.configs.flat.recommended,
    reactPlugin.configs.flat['jsx-runtime'],
  ],
  plugins: {
    'react-hooks': reactHooksPluginBase,
  },
  rules: {
    // We keep only the rules we were already using, we can think later if we
    // need any additional ones.
    // See: https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Prop types are not required in TypeScript
    // See more: https://github.com/mindoktor/mindoktor/pull/18308
    'react/prop-types': 'off',
  },
});
