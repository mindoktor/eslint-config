import minDoktorEsLintConfig from './index.mjs'

import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
    ignores: ['**/node_modules/**/*'],
		extends: [
			minDoktorEsLintConfig,
		],
		rules: {
      // Custom rules can be added here
			// ...
		},
	}
);

