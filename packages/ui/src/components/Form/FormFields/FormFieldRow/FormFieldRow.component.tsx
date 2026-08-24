import * as stylex from '@stylexjs/stylex';

import type { FieldNode } from '#ui/components/Form/Form.types';

import { useFormFieldsRendererContext } from '#ui/components/Form/FormFields/contexts/FormFieldsRendererContext/useFormFieldsRendererContext.hook';
import { getFieldKey } from '#ui/components/Form/FormFields/utils/getFieldKey.util';

import type { FormFieldRowProps } from './FormFieldRow.types';

import { styles } from './FormFieldRow.stylex';

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
