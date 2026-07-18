import { Card } from '@repo/ui/components/Card';
import * as stylex from '@stylexjs/stylex';

import type { SectionCardProps } from './SectionCard.types';

import { styles } from './SectionCard.stylex';

/**
 * Generic bordered "section box" — title, optional description, then
 * whatever content the caller passes. Extracted from `SettingsOptionSection`
 * (which hardcoded a `RadioOptionGroup` as its only possible content) so any
 * consumer needing the same title+description+card shape can reuse it —
 * `SettingsOptionSection` now composes this instead of duplicating it.
 */
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
