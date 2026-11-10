import { Title } from '@lcabrera/ui/components/Title';
import * as stylex from '@stylexjs/stylex';

import type { ShowcaseSubsectionProps } from './ShowcaseSubsection.types';

import { styles } from './ShowcaseSubsection.stylex';

export const ShowcaseSubsection = ({
  children,
  title,
}: ShowcaseSubsectionProps) => (
  <div {...stylex.props(styles.subsection)}>
    <Title customStylex={styles.subsectionTitle} level={3} variant='plain'>
      {title}
    </Title>
    {children}
  </div>
);
