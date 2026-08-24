import type { FieldNode } from '#ui/components/Form/Form.types';

import { useFormFieldsRendererContext } from '#ui/components/Form/FormFields/contexts/FormFieldsRendererContext/useFormFieldsRendererContext.hook';
import { Tabs } from '#ui/components/Tabs';

import type { FormFieldTabsProps } from './FormFieldTabs.types';

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
