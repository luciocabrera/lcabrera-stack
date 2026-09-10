import { screen } from '@testing-library/react';

import type { TabItem } from './Tabs.types';

export const TABS_FIXTURE: readonly TabItem[] = [
  { children: <span>Content A</span>, header: 'Tab A', key: 'a' },
  { children: <span>Content B</span>, header: 'Tab B', key: 'b' },
  { children: <span>Content C</span>, header: 'Tab C', key: 'c' },
];

export const focusedTab = () => screen.getByRole('tab', { selected: true });
