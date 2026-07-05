import * as stylex from '@stylexjs/stylex';

import { Tabs } from '@repo/ui/components/Tabs';
import { FormField } from '@repo/ui/components/Form/FormField/FormField.component';

import type { FieldNode } from '@repo/ui/components/Form/Form.types';

import type { FormFieldsProps } from './FormFields.types';

import { styles } from './FormFields.stylex';

/**
 * Collects every leaf `accessor` beneath a node. Accessors are unique keys of
 * `TValues`, so the joined result is a stable, content-derived identity for
 * group/row/tab containers that have no id of their own.
 */
const collectAccessors = <TValues extends Record<string, unknown>>(
  node: FieldNode<TValues>,
): readonly string[] => {
  switch (node.type) {
    case 'group':
    case 'row': {
      return node.fields.flatMap((child) => collectAccessors(child));
    }
    case 'tab': {
      return node.tabs.flatMap((tab) =>
        tab.fields.flatMap((child) => collectAccessors(child)),
      );
    }
    default: {
      return [node.accessor];
    }
  }
};

const getFieldKey = <TValues extends Record<string, unknown>>(
  node: FieldNode<TValues>,
): string => `${node.type}:${collectAccessors(node).join('|')}`;

/**
 * Single recursive walker for group/row/tab/leaf nodes — the render-side
 * counterpart to flattenFields.util.ts (ADR-005).
 */
export const FormFields = <TValues extends Record<string, unknown>>({
  fields,
}: FormFieldsProps<TValues>) => {
  return (
    <div {...stylex.props(styles.stack)}>
      {fields.map((field) => {
        const key = getFieldKey(field);

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
                {field.fields.map((rowField) => (
                  <div
                    key={getFieldKey(rowField)}
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
                tabs={field.tabs.map((tab) => ({
                  children: <FormFields fields={tab.fields} />,
                  header: tab.label,
                  key: tab.label,
                }))}
              />
            );
          }
          default: {
            return <FormField field={field} key={key} />;
          }
        }
      })}
    </div>
  );
};
