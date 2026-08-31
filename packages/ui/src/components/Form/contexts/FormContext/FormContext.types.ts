import type { ReactNode } from 'react';

import type {
  FieldErrors,
  FieldNode,
  FormMode,
  FormProps,
  FormSubmission,
  LeafFieldDef,
} from '#ui/components/Form/Form.types';
import type { TStore } from '#ui/hooks/useStore.hook';

export type FormContextValue<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> = {
  readonly fieldsStore: TStore<FormFieldsState<TValues>>;
  readonly metaStore: TStore<FormMetaState<TValues>>;
};

export type FormFieldsState<TValues extends Record<string, unknown>> = {
  readonly errors: FieldErrors<TValues>;
  /** Frozen at mount; the dirty-check baseline for `mode: 'edit'`. */
  readonly initialValues: TValues;
  readonly values: TValues;
};

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
