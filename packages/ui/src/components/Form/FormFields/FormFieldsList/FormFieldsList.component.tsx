import { FormField } from '@lcabrera/ui/components/Form/FormField/FormField.component';
import * as stylex from '@stylexjs/stylex';
import { use } from 'react';

import type { FormFieldsListProps } from './FormFieldsList.types';

import { FormFieldsRendererContext } from '../contexts/FormFieldsRendererContext/FormFieldsRendererContext.context';
import { FormFieldGroup } from '../FormFieldGroup/FormFieldGroup.component';
import { FormFieldRow } from '../FormFieldRow/FormFieldRow.component';
import { FormFieldTabs } from '../FormFieldTabs/FormFieldTabs.component';
import { getFieldKey } from '../utils/getFieldKey.util';
import { hasScrollOwningChild } from '../utils/hasScrollOwningChild.util';
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
 *
 * That same context doubles as the depth signal. Every list renders inside its
 * parent's provider, so the one that reads `undefined` is by construction the
 * outermost — which is what earns it the height (`styles.region`) and, unless
 * a child already scrolls, the form's single scroll boundary
 * (see `Form/ARCHITECTURE.md` → Layout).
 */
export const FormFieldsList = <TValues extends Record<string, unknown>>({
  fields,
}: FormFieldsListProps<TValues>) => {
  const isNested = use(FormFieldsRendererContext) !== undefined;
  const isRoot = !isNested;

  return (
    <FormFieldsRendererContext
      value={(nested) => <FormFieldsList fields={nested} />}
    >
      <div
        {...stylex.props(
          styles.stack,
          isRoot && styles.region,
          isRoot && !hasScrollOwningChild(fields) && styles.scroll,
        )}
      >
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
