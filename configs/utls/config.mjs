/** @typedef {import('typescript-eslint').ConfigArray} ConfigArray */
/** @typedef {Exclude<import('typescript-eslint').ConfigArray[0]['rules'], undefined>} Rules */
/** @typedef {Exclude<Rules[keyof Rules], undefined>} RuleEntry */

/**
 * @param {ConfigArray} config
 * @param {string} ruleName
 */
const extractRuleFromConfig = (config, ruleName) => {
  const rule = config.find((c) => c.rules && c.rules[ruleName]);
  return rule?.rules?.[ruleName];
};

/**
 * @param {RuleEntry | undefined} rule
 */
const extractDefaultOptions = (rule) => {
  const errorString = `Could not extract default options for 'restrict-template-expressions' from config`;
  if (!(Array.isArray(rule) && rule.length > 1)) {
    throw new Error(errorString);
  }
  const ruleOptions = rule[1];
  if (ruleOptions == null || !(typeof ruleOptions === 'object')) {
    throw new Error(errorString);
  }

  return ruleOptions;
};

/**
 * This is required to extend a rule from a config with the default options.
 * It allows us to override the default options while keeping the original ones.
 * See more: https://github.com/typescript-eslint/typescript-eslint/issues/11462#issuecomment-3160814883
 *
 * @param {ConfigArray} config
 * @param {string} ruleName
 * @param {[string, object]} overrides
 */
export const extendFromConfigDefaults = (config, ruleName, overrides) => {
  const rule = extractRuleFromConfig(config, ruleName);
  const defaultOptions = extractDefaultOptions(rule);
  const errorLevel = overrides[0];
  const overrideOptions = overrides[1];

  return {
    [ruleName]: [
      errorLevel,
      {
        ...defaultOptions,
        ...overrideOptions,
      },
    ],
  };
};
