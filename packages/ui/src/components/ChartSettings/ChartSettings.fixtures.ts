import { fireEvent, screen, within } from '@testing-library/react';

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

const captionTable = (label: string) =>
  screen.getByText(label, { selector: 'caption' }).closest('table');

export const showChartDataTable = (label: string) => {
  const hidden = captionTable(label)?.className;
  const hiddenCell = captionTable(label)?.querySelector('th')?.className;
  const drawer = openChartSettings(label);

  fireEvent.click(drawer.getByRole('switch', { name: 'Data table' }));
  acceptChartSettings(drawer);

  return {
    hidden,
    hiddenCell,
    shown: captionTable(label)?.className,
    shownCell: captionTable(label)?.querySelector('th')?.className,
  };
};
