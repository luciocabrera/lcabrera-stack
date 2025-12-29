import type { ToolbarItemConfig } from '@/components/Toolbar';

import {
  BarChartIcon,
  FileTextIcon,
  HomeIcon,
  SettingsIcon,
  UserIcon,
} from '@/components/Icons';
import { Toolbar } from '@/components/Toolbar';

// Example usage with SidePanel
export const SidePanelToolbarExample = () => {
  const navItems: ToolbarItemConfig[] = [
    {
      icon: <HomeIcon size={20} />,
      label: 'Home',
      to: '/',
      type: 'link',
    },
    {
      end: false,
      icon: <BarChartIcon size={20} />,
      label: 'Dashboard',
      to: '/dashboard',
      type: 'link',
    },
    {
      icon: <FileTextIcon size={20} />,
      label: 'Documents',
      to: '/documents',
      type: 'link',
    },
    {
      icon: <SettingsIcon size={20} />,
      label: 'Settings',
      to: '/settings',
      type: 'link',
    },
  ];

  return (
    <Toolbar
      aria-label='Main navigation'
      data-testid='main-navigation'
      items={navItems}
      orientation='vertical'
    />
  );
};

// Example usage with horizontal toolbar
export const HorizontalToolbarExample = () => {
  const actionItems: ToolbarItemConfig[] = [
    {
      icon: <FileTextIcon size={20} />,
      label: 'Save',
      onClick: () => {
        console.warn('Save clicked');
      },
      type: 'button',
    },
    {
      icon: <BarChartIcon size={20} />,
      label: 'Export',
      onClick: () => {
        console.warn('Export clicked');
      },
      type: 'button',
    },
    {
      color: 'primary',
      icon: <SettingsIcon size={20} />,
      label: 'Publish',
      onClick: () => {
        console.warn('Publish clicked');
      },
      type: 'button',
    },
    {
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
        console.warn('Logout clicked');
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

// Example usage mixing buttons and links
export const MixedToolbarExample = () => {
  const mixedItems: ToolbarItemConfig[] = [
    {
      icon: <UserIcon size={20} />,
      label: 'Profile',
      to: '/profile',
      type: 'link',
    },
    {
      color: 'error',
      icon: <SettingsIcon size={20} />,
      label: 'Logout',
      onClick: () => {
        console.warn('Logout clicked');
      },
      type: 'button',
    },
  ];

  return (
    <Toolbar
      aria-label='User menu'
      data-testid='user-menu'
      items={mixedItems}
      orientation='vertical'
    />
  );
};
