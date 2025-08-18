import reactPlugin from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';

import { mindoktorRecommended } from './recommended.js';

export const mindoktorReactRecommended = tseslint.config({
  extends: [
    mindoktorRecommended,
    reactPlugin.configs.flat.recommended,
    reactPlugin.configs.flat['jsx-runtime'],
  ],
  rules: {
    // Prop types are not required in TypeScript
    // See more: https://github.com/mindoktor/mindoktor/pull/18308
    'react/prop-types': 'off',
  },
});
