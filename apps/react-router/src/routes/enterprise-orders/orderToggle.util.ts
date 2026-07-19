import type { EnterpriseOrderValues } from './config';

export type OrderToggleArgs = {
  readonly accessor: keyof EnterpriseOrderValues;
  readonly label: string;
};

/** Build a boolean toggle field (`type: 'boolean'`, `variant: 'toggle'`). */
export const orderToggle = ({ accessor, label }: OrderToggleArgs) => ({
  accessor,
  label,
  type: 'boolean' as const,
  variant: 'toggle' as const,
});
