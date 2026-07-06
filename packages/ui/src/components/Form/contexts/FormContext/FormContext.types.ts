import type {
  FieldErrors,
  FormMode,
} from '@repo/ui/components/Form/Form.types';
import type { TStore } from '@repo/ui/hooks/useStore.hook';
import type { ReactNode } from 'react';

export type FormContextValue<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> = {
  readonly fieldsStore: TStore<FormFieldsState<TValues>>;
  readonly metaStore: TStore<FormMetaState>;
};

/** Per-field data — high-frequency, every slice keyed by accessor. */
export type FormFieldsState<TValues extends Record<string, unknown>> = {
  readonly errors: FieldErrors<TValues>;
  /** Frozen pristine snapshot captured at mount — never mutated after creation; the dirty-check baseline for `mode: 'edit'`. */
  readonly initialValues: TValues;
  readonly values: TValues;
};

/** Form-level metadata — low-frequency, not keyed by any single field. */
export type FormMetaState = {
  readonly mode: FormMode;
};

export type FormProviderProps<TValues extends Record<string, unknown>> = {
  readonly children: ReactNode;
  readonly initialFieldsState: FormFieldsState<TValues>;
  readonly mode: FormMode;
  /** Re-synced into fieldsStore whenever this prop's identity changes — e.g. a new `useActionData()` result after a failed submission. */
  readonly serverErrors?: FieldErrors<TValues>;
};
