# eslint-config

Shared ESLint config for MinDoktor projects

## Installation

### Recommended (without React)

Recommended settings for Mindoktor projects.

```sh
yarn add -D @mindoktor/eslint-config \
eslint \
eslint-config-prettier \
eslint-import-resolver-typescript \
eslint-plugin-import \
eslint-plugin-prettier \
eslint-plugin-simple-import-sort \
eslint-plugin-unused-imports \
prettier \
typescript-eslint
```

`eslint.config.mjs`

```js
// @ts-check

import { configs } from '@mindoktor/eslint-config';
import { globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

const defaultConfig = tseslint.config(
  {
    extends: [configs.recommended, configs.stylistic],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
  },
  {
    // Overrides
    rules: {
      // ...
    },
  },
  globalIgnores(['node_modules/']),
);

export default defaultConfig;
```

### React recommended

Includes recommended settings for React projects as well as the other recommended settings.

```sh
yarn add -D @mindoktor/eslint-config \
eslint \
eslint-config-prettier \
eslint-import-resolver-typescript \
eslint-plugin-import \
eslint-plugin-prettier \
eslint-plugin-react \
eslint-plugin-react-hooks \
eslint-plugin-simple-import-sort \
eslint-plugin-unused-imports \
prettier \
typescript-eslint
```

`eslint.config.mjs`

```js
// @ts-check

import { configs } from '@mindoktor/eslint-config';
import { globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

const defaultConfig = tseslint.config(
  {
    extends: [configs.reactRecommended, configs.stylistic],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
      react: {
        version: 'detect',
      },
    },
  },
  {
    // Overrides
    rules: {
      // ...
    },
  },
  globalIgnores(['node_modules/']),
);

export default defaultConfig;
```

## Install a certain branch

To install a specific branch of the ESLint config, you can use the following command:

```sh
yarn add -D @mindoktor/eslint-config#<branch-name>
```

Replace `<branch-name>` with the name of the branch you want to install.
If the branch name is a semantic version (e.g., `1.0.0`), the package manager will use semver rules.
See more: <https://docs.npmjs.com/cli/v8/configuring-npm/package-json#github-urls>
