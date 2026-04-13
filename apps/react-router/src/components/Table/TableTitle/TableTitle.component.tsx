import * as stylex from '@stylexjs/stylex';

import type { TableTitleProps } from './TableTitle.types.ts';

import { useGetTableTitle } from '../contexts/TableConfig/meta/selectors/index.ts';
import { styles } from './TableTitle.stylex.ts';

export const TableTitle = ({
  actions,
  customStylex,
  icon,
}: TableTitleProps) => {
  const title = useGetTableTitle();
  if (!title && !icon && !actions) {
    return;
  }

  return (
    <div {...stylex.props(styles.container, customStylex)}>
      <div {...stylex.props(styles.titleSection)}>
        {icon && <div {...stylex.props(styles.icon)}>{icon}</div>}
        {title && <h2 {...stylex.props(styles.title)}>{title}</h2>}
      </div>
      {actions && <div {...stylex.props(styles.actions)}>{actions}</div>}
    </div>
  );
};
