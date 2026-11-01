import * as stylex from '@stylexjs/stylex';
import { Link } from 'react-router';

import type { BreadcrumbsItemProps } from './BreadcrumbsItem.types';

import { styles } from '../Breadcrumbs.stylex';

export const BreadcrumbsItem = ({
  isCurrent,
  item: { label, to },
}: BreadcrumbsItemProps) => {
  if (isCurrent) {
    return (
      <li {...stylex.props(styles.item)}>
        <span aria-current='page' {...stylex.props(styles.current)}>
          {label}
        </span>
      </li>
    );
  }

  return (
    <li {...stylex.props(styles.item)}>
      {to === undefined ? (
        <span>{label}</span>
      ) : (
        <Link to={to} {...stylex.props(styles.link)}>
          {label}
        </Link>
      )}
      <span aria-hidden='true' {...stylex.props(styles.separator)}>
        /
      </span>
    </li>
  );
};
