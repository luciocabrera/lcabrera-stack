import { isTableCellParamsRecord } from '#ui/components/Table/cellRenderers/isTableCellParamsRecord.util';
import { isTableCellToneName } from '#ui/components/Table/cellRenderers/isTableCellToneName.util';
import { listUnknownKeys } from '#ui/components/Table/cellRenderers/listUnknownKeys.util';

const RULE_KEYS = new Set(['equals', 'gte', 'lt', 'tone']);

const isBound = (bound: unknown) =>
  bound === undefined || (typeof bound === 'number' && Number.isFinite(bound));

const isEquals = (equals: unknown) =>
  equals === undefined ||
  typeof equals === 'boolean' ||
  typeof equals === 'string' ||
  (typeof equals === 'number' && Number.isFinite(equals));

export const findTableCellBadgeRuleIssue = (rule: unknown) => {
  if (!isTableCellParamsRecord(rule)) return 'a rule must be an object';

  const [unknownKey] = listUnknownKeys({ allowed: RULE_KEYS, record: rule });
  if (unknownKey !== undefined) return `unknown rule key "${unknownKey}"`;

  if (!isTableCellToneName(rule.tone)) return 'a rule needs a tone name';
  if (!isBound(rule.gte) || !isBound(rule.lt)) {
    return 'gte and lt must be finite numbers';
  }
  if (!isEquals(rule.equals)) {
    return 'equals must be a string, a finite number or a boolean';
  }
};
