import type { ReactNode } from 'react';

import type { TableColumnDataType } from '@/components/Table/Table.types';

export type MockResponse = {
  readonly data: MockRow[];
  readonly total: number;
};

export type MockRow = Record<string, boolean | number | string>;

export type ShowcaseSectionProps = {
  readonly children: ReactNode;
  readonly title: string;
};

export type ShowcaseSubsectionProps = {
  readonly children: ReactNode;
  readonly title: ReactNode;
};

export type GenerateCellValueArgs = {
  readonly colIdx: number;
  readonly dataType: TableColumnDataType | undefined;
  readonly rowIdx: number;
};
