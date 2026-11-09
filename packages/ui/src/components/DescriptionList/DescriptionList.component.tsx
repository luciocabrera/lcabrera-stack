import * as stylex from '@stylexjs/stylex';

import { Text } from '#ui/components/Text';

import type { DescriptionListProps } from './DescriptionList.types';

import { descriptionListStyles } from './DescriptionList.stylex';
import { keyDescriptionListItems } from './utils/keyDescriptionListItems.util';

export const DescriptionList = ({
  customStylex,
  items,
  layout = 'grid',
  ...rest
}: DescriptionListProps) => (
  <dl
    {...rest}
    {...stylex.props(
      descriptionListStyles.list,
      descriptionListStyles.layout[layout],
      customStylex,
    )}
  >
    {keyDescriptionListItems(items).map(({ item, key }) => (
      <div key={key} {...stylex.props(descriptionListStyles.item[layout])}>
        <Text as='dt' size='sm' tone='secondary'>
          {item.term}
        </Text>
        <Text as='dd' customStylex={descriptionListStyles.value} size='sm'>
          {item.value}
        </Text>
      </div>
    ))}
  </dl>
);
