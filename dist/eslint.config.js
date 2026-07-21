import { defineConfig, globalIgnores } from 'eslint/config';
import minDoktorEsLintConfig from './src/index.js';
export default defineConfig({
    extends: [minDoktorEsLintConfig],
    // Language Options
    languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
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
}, {
    rules: {
    // Custom rules can be added here
    // ...
    },
}, globalIgnores([
    'dist/', // ignore entire dist directory
    'node_modules/',
    // Agent tooling dirs, ignored so ESLint doesn't try to parse the agent
    // scripts they contain (which aren't part of this package's source).
    '.claude/',
    '.agents/',
]));
//# sourceMappingURL=eslint.config.js.map