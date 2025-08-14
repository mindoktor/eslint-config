import type tseslint from 'typescript-eslint';

import type { Linter } from 'eslint';

// Alias types for convenience
type Config = Linter.Config;
type RuleSeverity = Linter.RuleSeverity;
type RuleSeverityAndOptions = Linter.RuleSeverityAndOptions;
type RuleEntry = Linter.RuleEntry;

/**
 * Simpler config that only contains rules for higher compatibility
 * between different config definitions (e.g. between ESLint and TSLint)
 */
export interface RulesConfig {
  rules?: Config['rules'];
}

export type InferredRuleEntryFromConfig<
  TRuleName extends string,
  TConfigArray extends RulesConfig[]
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
  TRuleEntry extends RuleSeverity | undefined
    ? never
    : TRuleEntry extends [infer _, infer Options]
    ? Options
    : never;

export type InferredRuleOptions<TRuleEntry extends RuleEntry> = Exclude<
  TRuleEntry,
  RuleSeverity
> extends [infer _, ...infer Options]
  ? Options
  : never;

// Typing inference test
type _inferredExplicitFunctionReturnTypeOptions =
  InferredRuleOptions<_inferredExplicitFunctionReturnType>;

export const isRuleLevelAndOptions = (
  rule: RuleEntry
): rule is RuleSeverityAndOptions => {
  return Array.isArray(rule) && rule.length > 1;
};
