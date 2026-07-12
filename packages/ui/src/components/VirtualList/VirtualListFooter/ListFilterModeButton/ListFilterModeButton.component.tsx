import { Button } from '@repo/ui/components/Button';

import type { ListFilterModeButtonProps } from './ListFilterModeButton.types';

import { useSetListFilterMode } from '../../contexts/VirtualListConfig/ui/actions';
import { useGetListFilterMode } from '../../contexts/VirtualListConfig/ui/selectors';

/**
 * Store-connected wrapper around the shared Button for one filter mode:
 * derives its own active state and dispatches the mode switch itself.
 */
export const ListFilterModeButton = ({
  count,
  icon,
  mode,
  tooltip,
}: ListFilterModeButtonProps) => {
  const listFilterMode = useGetListFilterMode();
  const setListFilterMode = useSetListFilterMode();

  const isActive = listFilterMode === mode;

  const handleClick = () => {
    setListFilterMode(mode);
  };

  return (
    <Button
      color={isActive ? 'secondary' : 'ghost'}
      icon={icon}
      onClick={handleClick}
      size='mini'
      tooltipContent={`${tooltip} (${count})`}
      variant='flat'
      width='auto'
    />
  );
};
