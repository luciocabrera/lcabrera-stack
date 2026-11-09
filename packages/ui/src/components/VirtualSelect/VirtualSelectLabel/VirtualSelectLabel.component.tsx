import { Text } from '#ui/components/Text';

import type { VirtualSelectLabelProps } from './VirtualSelectLabel.types';

import { useGetLabelId } from '../contexts/meta/selectors';
import { styles } from '../VirtualSelect.stylex';

export const VirtualSelectLabel = ({ label }: VirtualSelectLabelProps) => {
  const labelId = useGetLabelId();

  if (label === undefined) return;

  return (
    <Text
      as='span'
      customStylex={styles.label}
      id={labelId}
      size='sm'
      weight='medium'
    >
      {label}
    </Text>
  );
};
