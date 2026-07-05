import { Tabs } from '@repo/ui/components/Tabs';
import { FormFields } from '@repo/ui/components/Form/FormFields/FormFields.component';

import type { FormFieldTabsProps } from './FormFieldTabs.types';

/**
 * Renders a `tab` field node: one `Tabs` panel per tab, each tab's fields
 * delegated back to `FormFields`. Tab labels double as stable React keys.
 */
export const FormFieldTabs = <TValues extends Record<string, unknown>>({
  field,
}: FormFieldTabsProps<TValues>) => {
  return (
    <Tabs
      tabs={field.tabs.map((tab) => ({
        children: <FormFields fields={tab.fields} />,
        header: tab.label,
        key: tab.label,
      }))}
    />
  );
};
