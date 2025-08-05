// @ts-check

/** @type {import('eslint').Linter.Config[]} */
export const mindoktorRecommended = [{
  languageOptions: {
    globals: {
      MyGlobal: true,
    },
  },

  rules: {
    semi: [2, "always"],
  },
}]
