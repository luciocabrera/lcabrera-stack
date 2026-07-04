import type { ReactNode } from 'react';

import type { TStore } from '@repo/ui/hooks/useStore.hook';

import type {
  FieldErrors,
  FormMode,
} from '@repo/ui/components/Form/Form.types';

export type FormState<TValues extends Record<string, unknown>> = {
  readonly errors: FieldErrors<TValues>;
  /** Frozen pristine snapshot captured at mount — never mutated after creation; the dirty-check baseline for `mode: 'edit'`. */
  readonly initialValues: TValues;
  readonly mode: FormMode;
  readonly values: TValues;
};

export type FormContextValue<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> = {
  readonly formStore: TStore<FormState<TValues>>;
};

export type FormProviderProps<TValues extends Record<string, unknown>> = {
  readonly children: ReactNode;
  readonly initialState: FormState<TValues>;
  /** Re-synced into the store whenever this prop's identity changes — e.g. a new `useActionData()` result after a failed submission. */
  readonly serverErrors?: FieldErrors<TValues>;
};
