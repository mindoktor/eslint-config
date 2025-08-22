import tseslint from 'typescript-eslint';
import { mindoktorReactRecommended } from './configs/reactRecommended.js';
import { mindoktorRecommended } from './configs/recommended.js';
import { mindoktorStylistic } from './configs/stylistic.js';
export const configs = {
    recommended: mindoktorRecommended,
    reactRecommended: mindoktorReactRecommended,
    stylistic: mindoktorStylistic,
};
const defaultConfig = tseslint.config({
    extends: [mindoktorRecommended, mindoktorStylistic],
});
export default defaultConfig;
//# sourceMappingURL=index.js.map