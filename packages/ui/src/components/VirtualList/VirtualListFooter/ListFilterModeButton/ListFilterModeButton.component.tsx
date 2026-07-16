import { Button } from '@repo/ui/components/Button';

import type { ListFilterModeButtonProps } from './ListFilterModeButton.types';

import { useSetListFilterMode } from '../../contexts/list/actions';
import { useGetListFilterMode } from '../../contexts/list/selectors';

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
      icon={icon}
      onClick={handleClick}
      size='mini'
      tooltipContent={`${tooltip} (${count})`}
      variant={isActive ? 'secondary' : 'ghost'}
    />
  );
};
