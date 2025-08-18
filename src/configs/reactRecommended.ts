import tseslint from 'typescript-eslint';

import { mindoktorRecommended } from './recommended.js';

export const mindoktorReactRecommended = tseslint.config({
  extends: [mindoktorRecommended],
});
