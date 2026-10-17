import type { ReactNode } from 'react';

import { vi } from 'vite-plus/test';

import { MockButton } from './createMockButton.util';

vi.mock('#ui/components/Button', () => ({ Button: MockButton }));

vi.mock('#ui/components/SidePanel', () => ({
  SidePanelFooter: ({ children }: { readonly children: ReactNode }) => (
    <div>{children}</div>
  ),
}));
