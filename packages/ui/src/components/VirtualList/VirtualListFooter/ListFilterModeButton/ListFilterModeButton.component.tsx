import { Button } from '@repo/ui/components/Button';

import type { ListFilterModeButtonProps } from './ListFilterModeButton.types';

export const ListFilterModeButton = ({
  count,
  icon,
  isActive,
  mode,
  onSelect,
  tooltip,
}: ListFilterModeButtonProps) => {
  const handleClick = () => {
    onSelect(mode);
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
