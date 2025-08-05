// @ts-check

/** @type {import('eslint').Linter.Config} */
export const strictConfig = {
  languageOptions: {
    globals: {
      MyGlobal: true,
    },
  },

  rules: {
    semi: [2, "always"],
  },
}