import type { FieldNode } from '@repo/ui/components/Form/Form.types';

import { useFormFieldsRendererContext } from '@repo/ui/components/Form/FormFields/contexts/FormFieldsRendererContext/useFormFieldsRendererContext.hook';
import * as stylex from '@stylexjs/stylex';

import type { FormFieldGroupProps } from './FormFieldGroup.types';

import { styles } from './FormFieldGroup.stylex';

/**
 * Renders a `group` field node: an optional label above a vertically stacked
 * set of nested fields (delegated back to `FormFields` via
 * `FormFieldsRendererContext` — see that context's doc comment for why this
 * isn't a direct import of `FormFields.component.tsx`).
 */
export const FormFieldGroup = <TValues extends Record<string, unknown>>({
  field,
}: FormFieldGroupProps<TValues>) => {
  const renderFields = useFormFieldsRendererContext();

  return (
    <div {...stylex.props(styles.group)}>
      {field.label && (
        <span {...stylex.props(styles.groupLabel)}>{field.label}</span>
      )}
      {renderFields(
        field.fields as readonly FieldNode<Record<string, unknown>>[],
      )}
    </div>
  );
};
