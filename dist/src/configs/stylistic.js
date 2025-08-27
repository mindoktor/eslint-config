import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';
const prettierConfig = {
    singleQuote: true,
    parser: 'typescript',
};
export const mindoktorStylistic = tseslint.config({
    extends: [eslintPluginPrettierRecommended],
    rules: {
        'prettier/prettier': ['error', prettierConfig],
    },
});
//# sourceMappingURL=stylistic.js.map