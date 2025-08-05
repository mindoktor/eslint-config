import { defineConfig } from "eslint/config";
import minDoktorEsLintConfig from './index.mjs'

export default defineConfig([
	{
		files: ["**/*.(js|mjs|cjs|ts|jsx|tsx)"],
		extends: [minDoktorEsLintConfig],
	},
]);