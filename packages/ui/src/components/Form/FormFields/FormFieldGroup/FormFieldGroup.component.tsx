import * as stylex from '@stylexjs/stylex';

import { FormFields } from '@repo/ui/components/Form/FormFields/FormFields.component';

import type { FormFieldGroupProps } from './FormFieldGroup.types';

import { styles } from './FormFieldGroup.stylex';

/**
 * Renders a `group` field node: an optional label above a vertically stacked
 * set of nested fields (delegated back to `FormFields`).
 */
export const FormFieldGroup = <TValues extends Record<string, unknown>>({
  field,
}: FormFieldGroupProps<TValues>) => {
  return (
    <div {...stylex.props(styles.group)}>
      {field.label && (
        <span {...stylex.props(styles.groupLabel)}>{field.label}</span>
      )}
      <FormFields fields={field.fields} />
    </div>
  );
};
