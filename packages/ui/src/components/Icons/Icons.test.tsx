// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import { BarChartIcon } from './BarChartIcon';
import { CheckIcon } from './CheckIcon';
import { CollapseAllIcon } from './CollapseAllIcon';
import { ColumnsOrderIcon } from './ColumnsOrderIcon';
import { CopyIcon } from './CopyIcon';
import { DisclosureIcon } from './DisclosureIcon';
import { EraserIcon } from './EraserIcon';
import { ErrorIcon } from './ErrorIcon';
import { ExpandAllIcon } from './ExpandAllIcon';
import { EyeIcon } from './EyeIcon';
import { EyeOffIcon } from './EyeOffIcon';
import { FileTextIcon } from './FileTextIcon';
import { FilterIcon } from './FilterIcon';
import { GroupRowsIcon } from './GroupRowsIcon';
import { HomeIcon } from './HomeIcon';
import { InfoIcon } from './InfoIcon';
import { ListAllIcon } from './ListAllIcon';
import { ListCheckedIcon } from './ListCheckedIcon';
import { ListOrderedIcon } from './ListOrderedIcon';
import { ListUncheckedIcon } from './ListUncheckedIcon';
import { LockIcon } from './LockIcon';
import { MaximizeIcon } from './MaximizeIcon';
import { MenuCloseIcon } from './MenuCloseIcon';
import { MenuIcon } from './MenuIcon';
import { MinimizeIcon } from './MinimizeIcon';
import { MoreVerticalIcon } from './MoreVerticalIcon';
import { PinIcon } from './PinIcon';
import { PinLeftIcon } from './PinLeftIcon';
import { PinOffIcon } from './PinOffIcon';
import { PinRightIcon } from './PinRightIcon';
import { PlusIcon } from './PlusIcon';
import { RefreshIcon } from './RefreshIcon';
import { SettingsIcon } from './SettingsIcon';
import { SortAscIcon } from './SortAscIcon';
import { SortClearIcon } from './SortClearIcon';
import { SortDescIcon } from './SortDescIcon';
import { SortNeutralIcon } from './SortNeutralIcon';
import { SuccessIcon } from './SuccessIcon';
import { UngroupRowsIcon } from './UngroupRowsIcon';
import { UserIcon } from './UserIcon';
import { WarningIcon } from './WarningIcon';

const iconComponents = [
  { Component: BarChartIcon, defaultSize: 24, name: 'BarChartIcon' },
  { Component: CheckIcon, defaultSize: 10, name: 'CheckIcon' },
  { Component: ColumnsOrderIcon, defaultSize: 16, name: 'ColumnsOrderIcon' },
  { Component: DisclosureIcon, defaultSize: 24, name: 'DisclosureIcon' },
  { Component: EraserIcon, defaultSize: 16, name: 'EraserIcon' },
  { Component: ErrorIcon, defaultSize: 24, name: 'ErrorIcon' },
  { Component: EyeIcon, defaultSize: 24, name: 'EyeIcon' },
  { Component: EyeOffIcon, defaultSize: 24, name: 'EyeOffIcon' },
  { Component: FileTextIcon, defaultSize: 24, name: 'FileTextIcon' },
  { Component: FilterIcon, defaultSize: 16, name: 'FilterIcon' },
  { Component: GroupRowsIcon, defaultSize: 16, name: 'GroupRowsIcon' },
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
  { Component: CollapseAllIcon, defaultSize: 16, name: 'CollapseAllIcon' },
  { Component: CopyIcon, defaultSize: 24, name: 'CopyIcon' },
  { Component: ExpandAllIcon, defaultSize: 16, name: 'ExpandAllIcon' },
  { Component: PlusIcon, defaultSize: 24, name: 'PlusIcon' },
  { Component: UngroupRowsIcon, defaultSize: 16, name: 'UngroupRowsIcon' },
  { Component: UserIcon, defaultSize: 24, name: 'UserIcon' },
  { Component: WarningIcon, defaultSize: 24, name: 'WarningIcon' },
] as const;

/**
 * The icons this directory actually holds, read off disk.
 *
 * The sweep below is a hand-written list, which is what lets it assert each
 * icon's own default size — but a hand-written list falls behind silently, and
 * had: four icons were shipped uncovered, two of them added by the fold-all
 * pair. So the list is checked against the directory rather than trusted, and a
 * new icon fails here on the day it lands instead of whenever someone notices
 * (#577).
 */
const iconDirectoryNames = readdirSync(
  path.dirname(fileURLToPath(import.meta.url)),
  { withFileTypes: true },
)
  .filter((entry) => entry.isDirectory() && entry.name.endsWith('Icon'))
  .map((entry) => entry.name);

describe('Icons', () => {
  it('sweeps every icon this directory holds', () => {
    expect(
      iconComponents
        .map(({ name }) => name)
        .toSorted((a, b) => a.localeCompare(b)),
    ).toStrictEqual(iconDirectoryNames.toSorted((a, b) => a.localeCompare(b)));
  });

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
