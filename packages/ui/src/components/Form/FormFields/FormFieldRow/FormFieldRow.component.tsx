import * as stylex from '@stylexjs/stylex';

import { FormFields } from '@repo/ui/components/Form/FormFields/FormFields.component';
import { getFieldKey } from '@repo/ui/components/Form/FormFields/utils/getFieldKey.util';

import type { FormFieldRowProps } from './FormFieldRow.types';

import { styles } from './FormFieldRow.stylex';

/**
 * Renders a `row` field node: its child fields laid out horizontally, each in
 * an equal-flex cell that delegates back to `FormFields`.
 */
export const FormFieldRow = <TValues extends Record<string, unknown>>({
  field,
}: FormFieldRowProps<TValues>) => {
  return (
    <div {...stylex.props(styles.row)}>
      {field.fields.map((rowField) => (
        <div key={getFieldKey(rowField)} {...stylex.props(styles.rowField)}>
          <FormFields fields={[rowField]} />
        </div>
      ))}
    </div>
  );
};
