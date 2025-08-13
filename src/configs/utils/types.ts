import type { ConfigArray as TSConfigArray } from 'typescript-eslint';
import type tseslint from 'typescript-eslint';
import type { TSESLint } from '@typescript-eslint/utils';

export type ConfigArray = TSConfigArray;
export type Config = ConfigArray[number];
export type RuleLevel = TSESLint.SharedConfig.RuleLevel;
export type RuleLevelAndOptions = TSESLint.SharedConfig.RuleLevelAndOptions;
export type RuleEntry = TSESLint.SharedConfig.RuleEntry;
export type RulesRecord = TSESLint.SharedConfig.RulesRecord;

export type InferredRuleEntryFromConfig<
  TRuleName extends string,
  TConfigArray extends ConfigArray
> = Exclude<
  Exclude<TConfigArray[number]['rules'], undefined>[TRuleName],
  undefined
>;

// Typing inference test
type _inferredExplicitFunctionReturnType = InferredRuleEntryFromConfig<
  '@typescript-eslint/explicit-function-return-type',
  (typeof tseslint)['configs']['recommended']
>;

export type _InferredRuleOptions<TRuleEntry extends RuleEntry | undefined> =
  TRuleEntry extends TSESLint.SharedConfig.RuleLevel | undefined
    ? never
    : TRuleEntry extends [infer _, infer Options]
    ? Options
    : never;

export type InferredRuleOptions<TRuleEntry extends RuleEntry> =
  Exclude<TRuleEntry, TSESLint.SharedConfig.RuleLevel> extends [infer _, ...infer Options]
    ? Options
    : never;

// Typing inference test
type _inferredExplicitFunctionReturnTypeOptions = InferredRuleOptions<
  _inferredExplicitFunctionReturnType
>;

export const isRuleLevelAndOptions = (
  rule: RuleEntry
): rule is RuleLevelAndOptions => {
  return Array.isArray(rule) && rule.length > 1;
};
