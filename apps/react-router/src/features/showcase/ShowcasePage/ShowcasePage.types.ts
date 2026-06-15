import type { ReactNode } from 'react';

export type MockRow = Record<string, boolean | number | string>;

export type MockResponse = {
  readonly data: MockRow[];
  readonly total: number;
};

export type ShowcaseSectionProps = {
  readonly children: ReactNode;
  readonly title: string;
};

export type ShowcaseSubsectionProps = {
  readonly children: ReactNode;
  readonly title: ReactNode;
};
