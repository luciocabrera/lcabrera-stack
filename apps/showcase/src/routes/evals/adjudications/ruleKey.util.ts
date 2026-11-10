type RuleKeyArgs = {
  readonly analyzer: string;
  readonly rule: string;
};

export const ruleKey = ({ analyzer, rule }: RuleKeyArgs) =>
  `${analyzer}/${rule}`;
