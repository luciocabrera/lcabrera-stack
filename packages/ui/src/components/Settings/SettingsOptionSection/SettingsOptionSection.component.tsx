import * as stylex from '@stylexjs/stylex';

import { Card } from '@repo/ui/components/Card';
import { RadioOptionGroup } from '@repo/ui/components/RadioOptionGroup';

import type { SettingsOptionSectionProps } from './SettingsOptionSection.types';

import { styles } from '../Settings.stylex';

export const SettingsOptionSection = <TValue extends string>({
  description,
  name,
  onChange,
  options,
  title,
  value,
}: SettingsOptionSectionProps<TValue>) => {
  return (
    <Card color='default' elevation='sm' padding='lg'>
      <section {...stylex.props(styles.section)}>
        <h2 {...stylex.props(styles.sectionTitle)}>{title}</h2>
        <p {...stylex.props(styles.description)}>{description}</p>
        <RadioOptionGroup
          name={name}
          onChange={onChange}
          options={options}
          value={value}
        />
      </section>
    </Card>
  );
};
