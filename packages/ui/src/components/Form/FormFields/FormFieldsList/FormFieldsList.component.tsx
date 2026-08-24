import * as stylex from '@stylexjs/stylex';
import { use } from 'react';

import { FormField } from '#ui/components/Form/FormField/FormField.component';

import type { FormFieldsListProps } from './FormFieldsList.types';

import { FormFieldsRendererContext } from '../contexts/FormFieldsRendererContext/FormFieldsRendererContext.context';
import { FormFieldGroup } from '../FormFieldGroup/FormFieldGroup.component';
import { FormFieldRow } from '../FormFieldRow/FormFieldRow.component';
import { FormFieldTabs } from '../FormFieldTabs/FormFieldTabs.component';
import { getFieldKey } from '../utils/getFieldKey.util';
import { hasScrollOwningChild } from '../utils/hasScrollOwningChild.util';
import { styles } from './FormFieldsList.stylex';

/**
 * Single recursive walker for group/row/tab/leaf nodes — the render-side counterpart to
 * flattenFields.util.ts (ADR-005).
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
