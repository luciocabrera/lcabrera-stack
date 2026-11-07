import * as stylex from '@stylexjs/stylex';

import { Text } from '#ui/components/Text';

import type { DescriptionListProps } from './DescriptionList.types';

import { styles } from './DescriptionList.stylex';

export const DescriptionList = ({
  customStylex,
  items,
  layout = 'grid',
  ...rest
}: DescriptionListProps) => (
  <dl
    {...rest}
    {...stylex.props(styles.list, styles.layout[layout], customStylex)}
  >
    {items.map((item) => (
      <div key={item.term} {...stylex.props(styles.item[layout])}>
        <Text as='dt' size='sm' tone='secondary'>
          {item.term}
        </Text>
        <Text as='dd' customStylex={styles.value} size='sm'>
          {item.value}
        </Text>
      </div>
    ))}
  </dl>
);
