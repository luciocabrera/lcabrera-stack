import type {
  FieldErrors,
  FieldNode,
  FormMode,
  FormProps,
  FormSubmission,
  LeafFieldDef,
} from '@repo/ui/components/Form/Form.types';
import type { TStore } from '@repo/ui/hooks/useStore.hook';
import type { ReactNode } from 'react';

export type FormContextValue<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> = {
  readonly fieldsStore: TStore<FormFieldsState<TValues>>;
  readonly metaStore: TStore<FormMetaState<TValues>>;
};

/** Per-field data — high-frequency, every slice keyed by accessor. */
export type FormFieldsState<TValues extends Record<string, unknown>> = {
  readonly errors: FieldErrors<TValues>;
  /** Frozen pristine snapshot captured at mount — never mutated after creation; the dirty-check baseline for `mode: 'edit'`. */
  readonly initialValues: TValues;
  readonly values: TValues;
};

/**
 * Form-level config — low-frequency, not keyed by any single field. Fields
 * are to a form what columns are to the table: definitions owned by the
 * store so consumers subscribe via selectors instead of prop drilling.
 */
export type FormMetaState<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> = {
  readonly cancelLabel: string;
  readonly cancelTo: string;
  readonly fields: readonly FieldNode<TValues>[];
  readonly formId: string;
  readonly leafFields: readonly LeafFieldDef<TValues>[];
  readonly mode: FormMode;
  readonly submission: FormSubmission;
  readonly submitLabel: string;
};

export type FormProviderProps<TValues extends Record<string, unknown>> = Pick<
  FormProps<TValues>,
  | 'cancelLabel'
  | 'cancelTo'
  | 'fields'
  | 'initialValues'
  | 'mode'
  | 'serverErrors'
  | 'submission'
  | 'submitLabel'
> & {
  readonly children: ReactNode;
};
