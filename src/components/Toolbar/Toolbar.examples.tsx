import {
  BarChartIcon,
  FileTextIcon,
  HomeIcon,
  SettingsIcon,
  UserIcon,
} from '@/components/Icons';

import type { ToolbarItemConfig } from './Toolbar.types';

import { Toolbar } from './Toolbar.component';

// Example usage with SidePanel
export const SidePanelToolbarExample = () => {
  const navItems: ToolbarItemConfig[] = [
    {
      color: 'primary',
      icon: <HomeIcon size={20} />,
      label: 'Home',
      to: '/',
      type: 'link',
    },
    {
      color: 'outline',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      end: false,
      icon: <BarChartIcon size={20} />,
      label: 'Dashboard',
      to: '/dashboard',
      type: 'link',
    },
    {
      color: 'ghost',
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
    {
      icon: <SettingsIcon size={20} />,
      label: 'Cars Sales',
      to: '/car-sales',
      type: 'link',
    },
    {
      icon: <SettingsIcon size={20} />,
      label: 'Cars Sales Infinite',
      to: '/car-sales-infinite',
      type: 'link',
    },
    {
      icon: <SettingsIcon size={20} />,
      label: 'Enterprise Orders',
      to: '/enterprise-orders',
      type: 'link',
    },
    {
      icon: <SettingsIcon size={20} />,
      label: 'Wide All-Types 150',
      to: '/wide-alltypes-150',
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
      color: 'outline',
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

export const HorizontalToolbarExampleShort = () => {
  const actionItems: ToolbarItemConfig[] = [
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
