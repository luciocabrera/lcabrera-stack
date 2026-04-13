// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BarChartIcon } from './BarChartIcon/index.ts';
import { CheckIcon } from './CheckIcon/index.ts';
import { ColumnsOrderIcon } from './ColumnsOrderIcon/index.ts';
import { EraserIcon } from './EraserIcon/index.ts';
import { ErrorIcon } from './ErrorIcon/index.ts';
import { EyeIcon } from './EyeIcon/index.ts';
import { FileTextIcon } from './FileTextIcon/index.ts';
import { FilterIcon } from './FilterIcon/index.ts';
import { HomeIcon } from './HomeIcon/index.ts';
import { InfoIcon } from './InfoIcon/index.ts';
import { ListAllIcon } from './ListAllIcon/index.ts';
import { ListCheckedIcon } from './ListCheckedIcon/index.ts';
import { ListOrderedIcon } from './ListOrderedIcon/index.ts';
import { ListUncheckedIcon } from './ListUncheckedIcon/index.ts';
import { LockIcon } from './LockIcon/index.ts';
import { MaximizeIcon } from './MaximizeIcon/index.ts';
import { MenuCloseIcon } from './MenuCloseIcon/index.ts';
import { MenuIcon } from './MenuIcon/index.ts';
import { MinimizeIcon } from './MinimizeIcon/index.ts';
import { MoreVerticalIcon } from './MoreVerticalIcon/index.ts';
import { PinIcon } from './PinIcon/index.ts';
import { PinLeftIcon } from './PinLeftIcon/index.ts';
import { PinOffIcon } from './PinOffIcon/index.ts';
import { PinRightIcon } from './PinRightIcon/index.ts';
import { RefreshIcon } from './RefreshIcon/index.ts';
import { SettingsIcon } from './SettingsIcon/index.ts';
import { SortAscIcon } from './SortAscIcon/index.ts';
import { SortClearIcon } from './SortClearIcon/index.ts';
import { SortDescIcon } from './SortDescIcon/index.ts';
import { SortNeutralIcon } from './SortNeutralIcon/index.ts';
import { SuccessIcon } from './SuccessIcon/index.ts';
import { UserIcon } from './UserIcon/index.ts';
import { WarningIcon } from './WarningIcon/index.ts';

const iconComponents = [
  { Component: BarChartIcon, defaultSize: 24, name: 'BarChartIcon' },
  { Component: CheckIcon, defaultSize: 10, name: 'CheckIcon' },
  { Component: ColumnsOrderIcon, defaultSize: 16, name: 'ColumnsOrderIcon' },
  { Component: EraserIcon, defaultSize: 16, name: 'EraserIcon' },
  { Component: ErrorIcon, defaultSize: 24, name: 'ErrorIcon' },
  { Component: EyeIcon, defaultSize: 24, name: 'EyeIcon' },
  { Component: FileTextIcon, defaultSize: 24, name: 'FileTextIcon' },
  { Component: FilterIcon, defaultSize: 16, name: 'FilterIcon' },
  { Component: HomeIcon, defaultSize: 24, name: 'HomeIcon' },
  { Component: InfoIcon, defaultSize: 24, name: 'InfoIcon' },
  { Component: ListAllIcon, defaultSize: 16, name: 'ListAllIcon' },
  { Component: ListCheckedIcon, defaultSize: 16, name: 'ListCheckedIcon' },
  { Component: ListOrderedIcon, defaultSize: 16, name: 'ListOrderedIcon' },
  { Component: ListUncheckedIcon, defaultSize: 16, name: 'ListUncheckedIcon' },
  { Component: LockIcon, defaultSize: 24, name: 'LockIcon' },
  { Component: MaximizeIcon, defaultSize: 16, name: 'MaximizeIcon' },
  { Component: MenuCloseIcon, defaultSize: 24, name: 'MenuCloseIcon' },
  { Component: MenuIcon, defaultSize: 24, name: 'MenuIcon' },
  { Component: MinimizeIcon, defaultSize: 16, name: 'MinimizeIcon' },
  { Component: MoreVerticalIcon, defaultSize: 12, name: 'MoreVerticalIcon' },
  { Component: PinIcon, defaultSize: 24, name: 'PinIcon' },
  { Component: PinLeftIcon, defaultSize: 24, name: 'PinLeftIcon' },
  { Component: PinOffIcon, defaultSize: 24, name: 'PinOffIcon' },
  { Component: PinRightIcon, defaultSize: 24, name: 'PinRightIcon' },
  { Component: RefreshIcon, defaultSize: 16, name: 'RefreshIcon' },
  { Component: SettingsIcon, defaultSize: 24, name: 'SettingsIcon' },
  { Component: SortAscIcon, defaultSize: 12, name: 'SortAscIcon' },
  { Component: SortClearIcon, defaultSize: 12, name: 'SortClearIcon' },
  { Component: SortDescIcon, defaultSize: 12, name: 'SortDescIcon' },
  { Component: SortNeutralIcon, defaultSize: 12, name: 'SortNeutralIcon' },
  { Component: SuccessIcon, defaultSize: 24, name: 'SuccessIcon' },
  { Component: UserIcon, defaultSize: 24, name: 'UserIcon' },
  { Component: WarningIcon, defaultSize: 24, name: 'WarningIcon' },
] as const;

describe('Icons', () => {
  it.each(iconComponents)('$name renders an svg element', ({ Component }) => {
    const { container } = render(<Component />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.tagName.toLowerCase()).toBe('svg');
  });

  it.each(iconComponents)(
    '$name has the correct default size',
    ({ Component, defaultSize }) => {
      const { container } = render(<Component />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe(String(defaultSize));
      expect(svg?.getAttribute('height')).toBe(String(defaultSize));
    },
  );

  it.each(iconComponents)('$name accepts custom size', ({ Component }) => {
    const { container } = render(<Component size={32} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('32');
    expect(svg?.getAttribute('height')).toBe('32');
  });
});
