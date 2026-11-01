import * as stylex from '@stylexjs/stylex';

import type { BreadcrumbsProps } from './Breadcrumbs.types';

import { styles } from './Breadcrumbs.stylex';
import { BreadcrumbsItem } from './BreadcrumbsItem/BreadcrumbsItem.component';
import { getBreadcrumbKey } from './utils/getBreadcrumbKey.util';

export const Breadcrumbs = ({
  items,
  label = 'Breadcrumb',
}: BreadcrumbsProps) => {
  if (items.length === 0) return;

  const lastIndex = items.length - 1;

  return (
    <nav aria-label={label}>
      <ol {...stylex.props(styles.list)}>
        {items.map((item, index) => (
          <BreadcrumbsItem
            isCurrent={index === lastIndex}
            item={item}
            key={getBreadcrumbKey(item)}
          />
        ))}
      </ol>
    </nav>
  );
};
