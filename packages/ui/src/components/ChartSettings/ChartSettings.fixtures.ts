import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach } from 'vite-plus/test';

type ChartTableArgs = {
  readonly label: string;
  readonly table: () => HTMLTableElement | null;
};

const showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute('open', '');
};

export const withOpenableDialogs = () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = showModal;
  });

  afterEach(() => {
    cleanup();
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  });
};

export const openChartSettings = (label: string) => {
  fireEvent.click(
    screen.getByRole('button', { name: `Settings for ${label}` }),
  );

  return within(screen.getByTestId('side-panel'));
};

export const acceptChartSettings = (
  drawer: ReturnType<typeof openChartSettings>,
) => {
  fireEvent.click(drawer.getByRole('button', { name: 'Accept' }));
};

export const showChartDataTable = ({ label, table }: ChartTableArgs) => {
  const hidden = table()?.className;
  const hiddenCell = table()?.querySelector('th')?.className;
  const drawer = openChartSettings(label);

  fireEvent.click(drawer.getByRole('switch', { name: 'Data table' }));
  acceptChartSettings(drawer);

  return {
    hidden,
    hiddenCell,
    shown: table()?.className,
    shownCell: table()?.querySelector('th')?.className,
  };
};
