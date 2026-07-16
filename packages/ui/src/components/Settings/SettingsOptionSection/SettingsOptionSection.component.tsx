import { RadioOptionGroup } from '@repo/ui/components/RadioOptionGroup';
import { SectionCard } from '@repo/ui/components/SectionCard';

import type { SettingsOptionSectionProps } from './SettingsOptionSection.types';

export const SettingsOptionSection = <TValue extends string>({
  description,
  name,
  onChange,
  options,
  title,
  value,
}: SettingsOptionSectionProps<TValue>) => {
  return (
    <SectionCard description={description} title={title}>
      <RadioOptionGroup
        name={name}
        onChange={onChange}
        options={options}
        value={value}
      />
    </SectionCard>
  );
};
