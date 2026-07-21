import { FormField } from '@lcabrera/ui/components/Form/FormField/FormField.component';
import * as stylex from '@stylexjs/stylex';

import type { FormFieldsListProps } from './FormFieldsList.types';

import { FormFieldsRendererContext } from '../contexts/FormFieldsRendererContext/FormFieldsRendererContext.context';
import { FormFieldGroup } from '../FormFieldGroup/FormFieldGroup.component';
import { FormFieldRow } from '../FormFieldRow/FormFieldRow.component';
import { FormFieldTabs } from '../FormFieldTabs/FormFieldTabs.component';
import { getFieldKey } from '../utils/getFieldKey.util';
import { styles } from './FormFieldsList.stylex';

/**
 * Single recursive walker for group/row/tab/leaf nodes — the render-side
 * counterpart to flattenFields.util.ts (ADR-005). Each node type delegates to
 * its own subcomponent; only the stable-key computation lives here.
 *
 * Provides itself via `FormFieldsRendererContext` rather than letting
 * `FormFieldGroup`/`FormFieldRow`/`FormFieldTabs` import this module
 * directly — those subcomponents recurse back into `FormFieldsList` to render
 * their nested `fields`, and a direct import would create a circular
 * dependency (`FormFieldsList` → subcomponent → `FormFieldsList`).
 */
export const FormFieldsList = <TValues extends Record<string, unknown>>({
  fields,
}: FormFieldsListProps<TValues>) => {
  return (
    <FormFieldsRendererContext
      value={(nested) => <FormFieldsList fields={nested} />}
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
