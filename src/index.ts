import tseslint from 'typescript-eslint';

import { mindoktorRecommended } from './configs/recommended.js';
import { mindoktorStylistic } from './configs/stylistic.js';

export const configs = {
  recommended: mindoktorRecommended,
  stylistic: mindoktorStylistic,
};

const defaultConfig = tseslint.config({
  extends: [mindoktorRecommended, mindoktorStylistic],
});

export default defaultConfig;
