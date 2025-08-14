import type { Linter } from 'eslint';

// Alias types for convenience
type RuleSeverity = Linter.RuleSeverity;
type RulesRecord = Linter.RulesRecord;
type RuleEntry = Linter.RuleEntry;

import type {
  InferredRuleEntryFromConfig,
  InferredRuleOptions,
  RulesConfig,
} from './types.js';
import { isRuleLevelAndOptions } from './types.js';

const extractRuleFromConfig = <
  TRuleName extends string,
  TConfigArray extends RulesConfig[]
>(
  configArray: TConfigArray,
  ruleName: TRuleName
): InferredRuleEntryFromConfig<TRuleName, TConfigArray> | undefined => {
  const config = configArray.find((c) => c.rules?.[ruleName] != null);
  return config?.rules?.[ruleName] as
    | InferredRuleEntryFromConfig<TRuleName, TConfigArray>
    | undefined;
};

const extractRuleOptions = <TRuleEntry extends RuleEntry>(
  rule: TRuleEntry
): InferredRuleOptions<TRuleEntry> => {
  const errorString = `Could not extract default options for the given rule`;
  if (!isRuleLevelAndOptions(rule)) {
    throw new Error(errorString);
  }
  const [_, ...ruleOptions] = rule;
  return ruleOptions as InferredRuleOptions<TRuleEntry>;
};

const squashOptions = <T extends Record<string, unknown>>(options: T[]): T => {
  return options.reduce((acc, option) => {
    return {
      ...acc,
      ...option,
    };
  }, {} as T);
};

type OverridesType<
  TRuleName extends string,
  TConfigArray extends RulesConfig[]
> = Exclude<InferredRuleEntryFromConfig<TRuleName, TConfigArray>, RuleSeverity>;

/**
 * This is required to extend a rule from a config with the default options.
 * It allows us to override the default options while keeping the original ones.
 * See more: https://github.com/typescript-eslint/typescript-eslint/issues/11462#issuecomment-3160814883
 */
export const extendFromConfigDefaults = <
  TRuleName extends string,
  TConfigArray extends RulesConfig[]
>(
  config: TConfigArray,
  ruleName: TRuleName,
  overrides: OverridesType<TRuleName, TConfigArray>
): RulesRecord => {
  const rule = extractRuleFromConfig(config, ruleName);

  if (rule == null) {
    throw new Error(`Cannot find rule ${ruleName} in config`);
  }

  // Easier to handle inside this function
  type BroadRuleOptionsType = Record<string, unknown>[];

  const overrideRuleLevel = overrides[0];
  const defaultOptions = squashOptions(
    extractRuleOptions(rule) as BroadRuleOptionsType
  );
  const overrideOptions = squashOptions(
    extractRuleOptions(overrides) as BroadRuleOptionsType
  );

  return {
    [ruleName]: [
      overrideRuleLevel,
      {
        ...defaultOptions,
        ...overrideOptions,
      },
    ],
  };
};
