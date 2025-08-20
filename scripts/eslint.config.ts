import tseslint from 'typescript-eslint';

import mainConfig from '../eslint.config.js';

export default tseslint.config({
  extends: [mainConfig],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
});
