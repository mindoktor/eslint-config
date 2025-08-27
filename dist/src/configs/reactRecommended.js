import reactPlugin from 'eslint-plugin-react';
import * as reactHooksPlugin from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import { mindoktorRecommended } from './recommended.js';
export const mindoktorReactRecommended = tseslint.config({
    extends: [
        mindoktorRecommended,
        reactPlugin.configs.flat.recommended,
        reactPlugin.configs.flat['jsx-runtime'],
        // Switch to recommended when upgrading to version 6
        // See: https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks#flat-config-eslintconfigjsts
        reactHooksPlugin.configs['recommended-latest'],
    ],
    rules: {
        // Prop types are not required in TypeScript
        // See more: https://github.com/mindoktor/mindoktor/pull/18308
        'react/prop-types': 'off',
    },
});
//# sourceMappingURL=reactRecommended.js.map