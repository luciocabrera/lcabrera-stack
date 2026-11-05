import * as stylex from '@stylexjs/stylex';

import type { BreadcrumbsProps } from './Breadcrumbs.types';

import { styles } from './Breadcrumbs.stylex';
import { BreadcrumbsItem } from './BreadcrumbsItem/BreadcrumbsItem.component';
import { toBreadcrumbEntries } from './utils/toBreadcrumbEntries.util';

export const Breadcrumbs = ({
  items,
  label = 'Breadcrumb',
}: BreadcrumbsProps) => {
  if (items.length === 0) return;

  return (
    <nav aria-label={label}>
      <ol {...stylex.props(styles.list)}>
        {toBreadcrumbEntries(items).map(({ identity, isCurrent, item }) => (
          <BreadcrumbsItem isCurrent={isCurrent} item={item} key={identity} />
        ))}
      </ol>
    </nav>
  );
};
