import type { FieldNode } from '#ui/components/Form/Form.types';

import { useFormFieldsRendererContext } from '#ui/components/Form/FormFields/contexts/FormFieldsRendererContext/useFormFieldsRendererContext.hook';
import { Tabs } from '#ui/components/Tabs';

import type { FormFieldTabsProps } from './FormFieldTabs.types';

/**
 * Renders a `tab` field node: one `Tabs` panel per tab, each tab's fields
 * delegated back to `FormFields` via `FormFieldsRendererContext` (see that
 * context's doc comment for why this isn't a direct import of
 * `FormFields.component.tsx`). Tab labels double as stable React keys.
 */
export const FormFieldTabs = <TValues extends Record<string, unknown>>({
  field,
}: FormFieldTabsProps<TValues>) => {
  const renderFields = useFormFieldsRendererContext();

  return (
    <Tabs
      tabs={field.tabs.map((tab) => ({
        children: renderFields(
          tab.fields as readonly FieldNode<Record<string, unknown>>[],
        ),
        header: tab.label,
        key: tab.label,
      }))}
    />
  );
};
