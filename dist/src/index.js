import { defineConfig } from 'eslint/config';
import { mindoktorReactRecommended } from './configs/reactRecommended.js';
import { mindoktorRecommended } from './configs/recommended.js';
import { mindoktorStylistic } from './configs/stylistic.js';
export const configs = {
    recommended: mindoktorRecommended,
    reactRecommended: mindoktorReactRecommended,
    stylistic: mindoktorStylistic,
};
const defaultConfig = defineConfig({
    extends: [mindoktorRecommended, mindoktorStylistic],
});
export default defaultConfig;
//# sourceMappingURL=index.js.map