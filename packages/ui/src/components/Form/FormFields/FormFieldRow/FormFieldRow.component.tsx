import type { FieldNode } from '@lcabrera/ui/components/Form/Form.types';

import { useFormFieldsRendererContext } from '@lcabrera/ui/components/Form/FormFields/contexts/FormFieldsRendererContext/useFormFieldsRendererContext.hook';
import { getFieldKey } from '@lcabrera/ui/components/Form/FormFields/utils/getFieldKey.util';
import * as stylex from '@stylexjs/stylex';

import type { FormFieldRowProps } from './FormFieldRow.types';

import { styles } from './FormFieldRow.stylex';

/**
 * Renders a `row` field node: its child fields laid out horizontally, each in a
 * cell that delegates back to `FormFields` via `FormFieldsRendererContext` (see
 * that context's doc comment for why this isn't a direct import of
 * `FormFields.component.tsx`). Cells are equal-width by default; the optional
 * positional `spans` array widens individual cells (grow factor per cell).
 */
export const FormFieldRow = <TValues extends Record<string, unknown>>({
  field,
}: FormFieldRowProps<TValues>) => {
  const renderFields = useFormFieldsRendererContext();

  return (
    <div {...stylex.props(styles.row)}>
      {field.fields.map((rowField, index) => (
        <div
          key={getFieldKey(rowField)}
          {...stylex.props(styles.cell(field.spans?.[index] ?? 1))}
        >
          {renderFields([rowField] as readonly FieldNode<
            Record<string, unknown>
          >[])}
        </div>
      ))}
    </div>
  );
};
