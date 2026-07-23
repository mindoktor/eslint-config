// Dedicated ESLint flat config for the rule-drift fixtures under
// test/fixtures/ (both fail/ and succeed/). The root eslint.config.ts globally
// ignores these fixtures, so the rule-drift test runs ESLint with THIS config
// instead, pointed at the fixtures' own tsconfig so the typed rules resolve
// types.
//
// It consumes the built package from dist/ — the same artifact consumers
// install — so the snapshot reflects what the shipped config actually does.
import { defineConfig } from 'eslint/config';

import mindoktorConfig from '../dist/src/index.js';

export default defineConfig({
  files: ['**/*.ts'],
  extends: [mindoktorConfig],
  languageOptions: {
    parserOptions: {
      projectService: false,
      project: './tsconfig.fixtures.json',
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
