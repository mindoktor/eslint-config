import minDoktorEsLintConfig from './src/index.js';
import { globalIgnores } from 'eslint/config';

import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    extends: [minDoktorEsLintConfig],
    rules: {
      // Custom rules can be added here
      // ...
    },
  },
  globalIgnores([
    'dist/', // ignore entire dist directory
    'node_modules/',
  ])
);
