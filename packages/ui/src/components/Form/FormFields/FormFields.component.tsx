import { FormField } from '@repo/ui/components/Form/FormField/FormField.component';
import * as stylex from '@stylexjs/stylex';

import type { FormFieldsProps } from './FormFields.types';

import { FormFieldsRendererContext } from './contexts/FormFieldsRendererContext/FormFieldsRendererContext.context';
import { FormFieldGroup } from './FormFieldGroup/FormFieldGroup.component';
import { FormFieldRow } from './FormFieldRow/FormFieldRow.component';
import { styles } from './FormFields.stylex';
import { FormFieldTabs } from './FormFieldTabs/FormFieldTabs.component';
import { getFieldKey } from './utils/getFieldKey.util';

/**
 * Single recursive walker for group/row/tab/leaf nodes — the render-side
 * counterpart to flattenFields.util.ts (ADR-005). Each node type delegates to
 * its own subcomponent; only the stable-key computation lives here.
 *
 * Provides itself via `FormFieldsRendererContext` rather than letting
 * `FormFieldGroup`/`FormFieldRow`/`FormFieldTabs` import this module
 * directly — those subcomponents recurse back into `FormFields` to render
 * their nested `fields`, and a direct import would create a circular
 * dependency (`FormFields` → subcomponent → `FormFields`).
 */
export const FormFields = <TValues extends Record<string, unknown>>({
  fields,
}: FormFieldsProps<TValues>) => {
  return (
    <FormFieldsRendererContext
      value={(nested) => <FormFields fields={nested} />}
    >
      <div {...stylex.props(styles.stack)}>
        {fields.map((field) => {
          const key = getFieldKey(field);

          switch (field.type) {
            case 'group': {
              return <FormFieldGroup field={field} key={key} />;
            }
            case 'row': {
              return <FormFieldRow field={field} key={key} />;
            }
            case 'tab': {
              return <FormFieldTabs field={field} key={key} />;
            }
            default: {
              return <FormField field={field} key={key} />;
            }
          }
        })}
      </div>
    </FormFieldsRendererContext>
  );
};
