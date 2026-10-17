import { vi } from 'vite-plus/test';

import { MockButton } from './createMockButton.util';
import { mockSidePanelSection } from './createMockSidePanelSection.util';

vi.mock('#ui/components/Button', () => ({ Button: MockButton }));

vi.mock('#ui/components/Icons', () => ({
  EraserIcon: () => <span>Eraser icon</span>,
  RefreshIcon: () => <span>Refresh icon</span>,
}));

vi.mock('#ui/components/SidePanel', () => mockSidePanelSection);
