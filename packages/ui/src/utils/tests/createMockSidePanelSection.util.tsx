import type { ReactNode } from 'react';

type MockChildrenProps = {
  readonly children: ReactNode;
};

type MockHeaderProps = {
  readonly title: string;
};

export const mockSidePanelSection = {
  SidePanelSection: ({ children }: MockChildrenProps) => (
    <section>{children}</section>
  ),
  SidePanelSectionHeader: ({ title }: MockHeaderProps) => <h3>{title}</h3>,
  SidePanelSectionMain: ({ children }: MockChildrenProps) => (
    <main>{children}</main>
  ),
};
