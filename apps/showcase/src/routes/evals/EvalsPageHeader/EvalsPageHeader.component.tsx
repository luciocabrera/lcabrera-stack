import * as stylex from '@stylexjs/stylex';
import { Link } from 'react-router';

import type { EvalsPageHeaderProps } from './EvalsPageHeader.types';

import { styles } from './EvalsPageHeader.stylex';

export const EvalsPageHeader = ({ title, trail }: EvalsPageHeaderProps) => (
  <header {...stylex.props(styles.header)}>
    <p {...stylex.props(styles.trail)}>
      <Link to='/evals'>Evals</Link> / {trail}
    </p>
    <h1 {...stylex.props(styles.title)}>{title}</h1>
  </header>
);
