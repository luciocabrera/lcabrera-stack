import type { LeafFieldDef } from '#ui/components/Form/Form.types';

const getDefaultValueForField = <TValues extends Record<string, unknown>>(
  field: LeafFieldDef<TValues>,
): unknown => {
  switch (field.type) {
    case 'boolean': {
      return false;
    }
    // A number field stores `undefined` when cleared, so it must start there
    // too — seeding `''` makes an untouched-then-cleared field read as dirty.
    case 'number': {
      return undefined;
    }
    case 'select': {
      return field.mode === 'multi' ? [] : '';
    }
    default: {
      return '';
    }
  }
};

type GetInitialValuesArgs<TValues extends Record<string, unknown>> = {
  readonly initialValues?: Partial<TValues>;
  readonly leafFields: readonly LeafFieldDef<TValues>[];
};

export const getInitialValues = <TValues extends Record<string, unknown>>({
  initialValues,
  leafFields,
}: GetInitialValuesArgs<TValues>) => {
  const values: Record<string, unknown> = {};

  for (const field of leafFields) {
    const provided = initialValues?.[field.accessor];
    values[field.accessor] = provided ?? getDefaultValueForField(field);
  }

  return values as TValues;
};
