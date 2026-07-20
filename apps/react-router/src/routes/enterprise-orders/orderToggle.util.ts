import type { EnterpriseOrderValues } from './config';

export type OrderToggleArgs = {
  readonly accessor: keyof EnterpriseOrderValues;
  readonly label: string;
};

// TODO: Consider moving this util to the shared `@repo/ui` package, since it is used in multiple apps.
// make sure we make it generic enough to be used in other apps, not just enterprise-orders

/** Build a boolean toggle field (`type: 'boolean'`, `variant: 'toggle'`). */
export const orderToggle = ({ accessor, label }: OrderToggleArgs) => ({
  accessor,
  label,
  type: 'boolean' as const,
  variant: 'toggle' as const,
});
