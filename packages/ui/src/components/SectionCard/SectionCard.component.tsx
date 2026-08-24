import * as stylex from '@stylexjs/stylex';

import { Card } from '#ui/components/Card';

import type { SectionCardProps } from './SectionCard.types';

import { styles } from './SectionCard.stylex';

export const SectionCard = ({
  children,
  customStylex,
  description,
  title,
}: SectionCardProps) => (
  <Card color='default' customStylex={customStylex} elevation='sm' padding='lg'>
    <section {...stylex.props(styles.section)}>
      <h2 {...stylex.props(styles.sectionTitle)}>{title}</h2>
      {Boolean(description) && (
        <p {...stylex.props(styles.description)}>{description}</p>
      )}
      {children}
    </section>
  </Card>
);
