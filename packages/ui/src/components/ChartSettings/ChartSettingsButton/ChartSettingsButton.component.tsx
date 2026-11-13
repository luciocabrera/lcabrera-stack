import { Button } from '#ui/components/Button';
import { SettingsIcon } from '#ui/components/Icons';

import { useToggleChartSettingsOpen } from '../contexts/actions';
import {
  useGetChartSettingsLabel,
  useGetIsChartSettingsOpen,
} from '../contexts/selectors';

export const ChartSettingsButton = () => {
  const isOpen = useGetIsChartSettingsOpen();
  const label = useGetChartSettingsLabel();
  const toggleChartSettingsOpen = useToggleChartSettingsOpen();

  return (
    <Button
      aria-expanded={isOpen}
      aria-label={label}
      icon={<SettingsIcon size={16} />}
      onClick={toggleChartSettingsOpen}
      size='mini'
      variant='ghost'
    />
  );
};
