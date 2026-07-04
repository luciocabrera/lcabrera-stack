import {
  BarChartIcon,
  FileTextIcon,
  SettingsIcon,
  UserIcon,
} from '@repo/ui/components/Icons';
import { logger } from '@repo/ui/utils/logger';

import type { ToolbarItemConfig } from './Toolbar.types';

import { Toolbar } from './Toolbar.component';

// Example usage with horizontal toolbar
export const HorizontalToolbarExample = () => {
  const actionItems: ToolbarItemConfig[] = [
    {
      color: 'outline',
      icon: <FileTextIcon size={20} />,
      label: 'Save',
      onClick: () => {
        logger.info('Save clicked');
      },
      type: 'button',
    },
    {
      icon: <BarChartIcon size={20} />,
      label: 'Export',
      onClick: () => {
        logger.info('Export clicked');
      },
      type: 'button',
    },
    {
      color: 'primary',
      icon: <SettingsIcon size={20} />,
      label: 'Publish',
      onClick: () => {
        logger.info('Publish clicked');
      },
      type: 'button',
    },
    {
      color: 'outline',
      icon: <UserIcon size={20} />,
      label: 'Settings',
      to: '/settings',
      type: 'link',
    },
    {
      color: 'error',
      icon: <SettingsIcon size={20} />,
      label: 'Logout',
      onClick: () => {
        logger.info('Logout clicked');
      },
      type: 'button',
    },
  ];

  return (
    <Toolbar
      aria-label='Document actions'
      data-testid='document-actions'
      items={actionItems}
      orientation='horizontal'
    />
  );
};

export const HorizontalToolbarExampleShort = () => {
  const actionItems: ToolbarItemConfig[] = [
    {
      color: 'primary',
      icon: <SettingsIcon size={20} />,
      label: 'Publish',
      onClick: () => {
        logger.info('Publish clicked');
      },
      type: 'button',
    },
    {
      color: 'outline',
      icon: <UserIcon size={20} />,
      label: 'Settings',
      to: '/settings',
      type: 'link',
    },
    {
      color: 'error',
      icon: <SettingsIcon size={20} />,
      label: 'Logout',
      onClick: () => {
        logger.info('Logout clicked');
      },
      type: 'button',
    },
  ];

  return (
    <Toolbar
      aria-label='Document actions'
      data-testid='document-actions'
      items={actionItems}
      orientation='horizontal'
    />
  );
};
