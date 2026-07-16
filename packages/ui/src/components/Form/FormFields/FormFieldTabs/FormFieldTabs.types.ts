import type { TabFieldNode } from '@repo/ui/components/Form/Form.types';

export type FormFieldTabsProps<TValues extends Record<string, unknown>> = {
  readonly field: TabFieldNode<TValues>;
};
