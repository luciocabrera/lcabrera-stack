import type { PathFieldDef } from '@repo/ui/components/Form/Form.types';

export type PathFieldProps<TValues extends Record<string, unknown>> = {
  readonly field: PathFieldDef<TValues>;
};
