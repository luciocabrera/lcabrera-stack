import type { ReactNode } from 'react';

export type BooleanFieldDef<TValues extends Record<string, unknown>> =
  BaseFieldDef<TValues> & {
    readonly type: 'boolean';
    readonly variant?: 'checkbox' | 'toggle';
  };

export type CurrencyFieldDef<TValues extends Record<string, unknown>> =
  BaseFieldDef<TValues> & {
    readonly currency?: string;
    readonly type: 'currency';
  };

export type CustomFieldDef<TValues extends Record<string, unknown>> =
  BaseFieldDef<TValues> & {
    readonly renderField: (args: RenderFieldArgs) => ReactNode;
    readonly type: 'custom';
  };

export type DateFieldDef<TValues extends Record<string, unknown>> =
  BaseFieldDef<TValues> & {
    readonly type: 'date' | 'datetime';
  };

export type FieldClientValidation = {
  readonly max?: number;
  readonly maxLength?: number;
  readonly message?: string;
  readonly min?: number;
  readonly minLength?: number;
  readonly pattern?: RegExp;
  readonly required?: boolean;
};

export type FieldErrors<TValues extends Record<string, unknown>> = Partial<
  Record<keyof TValues & string, string>
>;

export type FieldNode<TValues extends Record<string, unknown>> =
  | GroupFieldNode<TValues>
  | LeafFieldDef<TValues>
  | RowFieldNode<TValues>
  | TabFieldNode<TValues>;

export type FieldOption = {
  readonly label: string;
  readonly value: string;
};

export type FormMode = 'create' | 'edit' | 'view';

export type FormProps<TValues extends Record<string, unknown>> = {
  readonly action?: string;
  readonly cancelLabel?: string;
  readonly cancelTo: string;
  readonly children?: ReactNode;
  readonly fields: readonly FieldNode<TValues>[];
  readonly initialValues?: Partial<TValues>;
  readonly method?: 'delete' | 'patch' | 'post' | 'put';
  readonly mode: FormMode;
  readonly serverErrors?: FieldErrors<TValues>;
  readonly submission?: FormSubmission;
  readonly submitLabel?: string;
};

export type FormSubmission = 'fetcher' | 'navigation';

export type GroupFieldNode<TValues extends Record<string, unknown>> = {
  readonly collapsible?: boolean;
  readonly defaultCollapsed?: boolean;
  readonly fields: readonly FieldNode<TValues>[];
  readonly label?: string;
  readonly type: 'group';
};

export type LeafFieldDef<TValues extends Record<string, unknown>> =
  | BooleanFieldDef<TValues>
  | CurrencyFieldDef<TValues>
  | CustomFieldDef<TValues>
  | DateFieldDef<TValues>
  | NumberFieldDef<TValues>
  | RadioFieldDef<TValues>
  | SelectFieldDef<TValues>
  | TextFieldDef<TValues>;

export type NumberFieldDef<TValues extends Record<string, unknown>> =
  BaseFieldDef<TValues> & {
    readonly type: 'number';
  };

export type RadioFieldDef<TValues extends Record<string, unknown>> =
  BaseFieldDef<TValues> & {
    readonly options: readonly FieldOption[];
    readonly type: 'radio';
  };

export type RenderFieldArgs = {
  readonly error?: string;
  readonly isDisabled: boolean;
  readonly onChange: (value: unknown) => void;
  readonly value: unknown;
};

export type RowFieldNode<TValues extends Record<string, unknown>> = {
  readonly fields: readonly FieldNode<TValues>[];
  readonly spans?: readonly number[];
  readonly type: 'row';
};

export type SelectFieldDef<TValues extends Record<string, unknown>> =
  BaseFieldDef<TValues> & {
    readonly mode?: 'multi' | 'single';
    readonly options: readonly FieldOption[];
    readonly type: 'select';
  };

export type TabFieldNode<TValues extends Record<string, unknown>> = {
  readonly tabs: readonly {
    readonly fields: readonly FieldNode<TValues>[];
    readonly label: string;
  }[];
  readonly type: 'tab';
};

export type TextFieldDef<TValues extends Record<string, unknown>> =
  BaseFieldDef<TValues> & {
    readonly type: 'email' | 'password' | 'text' | 'textarea';
  };

type BaseFieldDef<TValues extends Record<string, unknown>> = {
  readonly accessor: keyof TValues & string;
  readonly clientValidation?: FieldClientValidation;
  readonly description?: string;
  readonly disabled?: boolean;
  readonly label: string;
  readonly placeholder?: string;
};
