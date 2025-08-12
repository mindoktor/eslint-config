import minDoktorEsLintConfig from './src/index.mjs';

import tseslint from 'typescript-eslint';

export default tseslint.config({
  ignores: [
    'node_modules/**/*',
    'dist/*',
    'dist/**/*',
  ],
  extends: [minDoktorEsLintConfig],
  rules: {
    // Custom rules can be added here
    // ...
  },
});
