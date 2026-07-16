import type { FieldNode } from '@repo/ui/components/Form/Form.types';

import { useFormFieldsRendererContext } from '@repo/ui/components/Form/FormFields/contexts/FormFieldsRendererContext/useFormFieldsRendererContext.hook';
import { getFieldKey } from '@repo/ui/components/Form/FormFields/utils/getFieldKey.util';
import * as stylex from '@stylexjs/stylex';

import type { FormFieldRowProps } from './FormFieldRow.types';

import { styles } from './FormFieldRow.stylex';

/**
 * Renders a `row` field node: its child fields laid out horizontally, each in
 * an equal-flex cell that delegates back to `FormFields` via
 * `FormFieldsRendererContext` (see that context's doc comment for why this
 * isn't a direct import of `FormFields.component.tsx`).
 */
export const FormFieldRow = <TValues extends Record<string, unknown>>({
  field,
}: FormFieldRowProps<TValues>) => {
  const renderFields = useFormFieldsRendererContext();

  return (
    <div {...stylex.props(styles.row)}>
      {field.fields.map((rowField) => (
        <div key={getFieldKey(rowField)} {...stylex.props(styles.rowField)}>
          {renderFields([rowField] as readonly FieldNode<
            Record<string, unknown>
          >[])}
        </div>
      ))}
    </div>
  );
};
