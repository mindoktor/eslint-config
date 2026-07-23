// Dedicated ESLint flat config for the rule-drift fixtures under
// test/fixtures/ (both fail/ and succeed/). The root eslint.config.ts globally
// ignores these fixtures, so the rule-drift test runs ESLint with THIS config
// instead, pointed at the fixtures' own tsconfig so the typed rules resolve
// types.
//
// It consumes the built package from dist/ — the same artifact consumers
// install — so the snapshot reflects what the shipped config actually does.
import { defineConfig } from 'eslint/config';

import mindoktorDefault, { configs } from '../dist/src/index.js';

export default defineConfig(
  // Non-React fixtures: the default config (stylistic + recommended).
  {
    files: ['**/*.ts'],
    ignores: ['**/react/**'],
    extends: [mindoktorDefault],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './tsconfig.fixtures.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // React fixtures (**/react/*.tsx): the opt-in reactRecommended config, so the
  // react + react-hooks rules are exercised by the drift test — the layer a
  // react-hooks peer bump would otherwise change unseen.
  {
    files: ['**/react/**/*.tsx'],
    extends: [configs.reactRecommended],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './tsconfig.fixtures.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
