import { globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

import minDoktorEsLintConfig from './src/index.js';

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
  ]),
);
