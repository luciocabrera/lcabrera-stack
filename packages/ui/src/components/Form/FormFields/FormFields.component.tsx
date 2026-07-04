import * as stylex from '@stylexjs/stylex';

import { Tabs } from '@repo/ui/components/Tabs';
import { FormField } from '@repo/ui/components/Form/FormField/FormField.component';

import type { FormFieldsProps } from './FormFields.types';

import { styles } from './FormFields.stylex';

/**
 * Single recursive walker for group/row/tab/leaf nodes — the render-side
 * counterpart to flattenFields.util.ts (ADR-005).
 */
export const FormFields = <TValues extends Record<string, unknown>>({
  fields,
}: FormFieldsProps<TValues>) => {
  return (
    <div {...stylex.props(styles.stack)}>
      {fields.map((field, index) => {
        const key =
          field.type === 'group' ? `group-${index}` : `${field.type}-${index}`;

        switch (field.type) {
          case 'group': {
            return (
              <div key={key} {...stylex.props(styles.group)}>
                {field.label && (
                  <span {...stylex.props(styles.groupLabel)}>
                    {field.label}
                  </span>
                )}
                <FormFields fields={field.fields} />
              </div>
            );
          }
          case 'row': {
            return (
              <div key={key} {...stylex.props(styles.row)}>
                {field.fields.map((rowField, rowIndex) => (
                  <div
                    key={`row-field-${rowIndex}`}
                    {...stylex.props(styles.rowField)}
                  >
                    <FormFields fields={[rowField]} />
                  </div>
                ))}
              </div>
            );
          }
          case 'tab': {
            return (
              <Tabs
                key={key}
                tabs={field.tabs.map((tab, tabIndex) => ({
                  children: <FormFields fields={tab.fields} />,
                  header: tab.label,
                  key: `tab-${tabIndex}`,
                }))}
              />
            );
          }
          default: {
            return (
              <FormField field={field} key={`${field.accessor}-${index}`} />
            );
          }
        }
      })}
    </div>
  );
};
