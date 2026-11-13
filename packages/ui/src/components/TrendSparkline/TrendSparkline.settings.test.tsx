// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import {
  acceptChartSettings,
  openChartSettings,
  withOpenableDialogs,
} from '#ui/components/ChartSettings/ChartSettings.fixtures';

import { TrendSparkline } from './TrendSparkline.component';

const POINTS = [{ value: 1 }, { value: 3 }, { value: 2 }];

const sparkline = () => screen.getByRole('img', { name: 'Trend' });

withOpenableDialogs();

describe('TrendSparkline settings', () => {
  it('offers density and the connecting line for a points chart', () => {
    render(<TrendSparkline label='Trend' points={POINTS} />);

    const drawer = openChartSettings('Trend');

    expect(
      drawer
        .getAllByRole('group')
        .map((group) => group.firstChild?.textContent),
    ).toEqual(['Density', 'Show']);
    expect(
      drawer
        .getByRole('switch', { name: 'Line between points' })
        .getAttribute('aria-checked'),
    ).toBe('true');
  });

  it('draws its settings button after the sparkline, on the same line', () => {
    render(<TrendSparkline label='Trend' values={[1, 2]} />);

    const button = screen.getByRole('button', { name: 'Settings for Trend' });

    expect(
      sparkline().compareDocumentPosition(button) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(button.parentElement).toBe(sparkline().parentElement);
  });

  it('offers density alone for a values chart', () => {
    render(<TrendSparkline label='Trend' values={[1, 2]} />);

    expect(
      openChartSettings('Trend')
        .getAllByRole('group')
        .map((group) => group.firstChild?.textContent),
    ).toEqual(['Density']);
  });

  it('grows to the accepted density and drops the line once it is switched off', () => {
    render(<TrendSparkline label='Trend' points={POINTS} />);

    const before = sparkline().getAttribute('height');
    const drawer = openChartSettings('Trend');

    fireEvent.click(drawer.getByRole('radio', { name: 'Spacious' }));
    fireEvent.click(
      drawer.getByRole('switch', { name: 'Line between points' }),
    );
    acceptChartSettings(drawer);

    expect([before, sparkline().getAttribute('height')]).toEqual(['24', '42']);
    expect(sparkline().querySelector('path')).toBeNull();
    expect(sparkline().querySelectorAll('circle')).toHaveLength(POINTS.length);
  });

  it('draws no settings button when the feature is off', () => {
    render(
      <TrendSparkline
        features={{ settings: false }}
        label='Trend'
        values={[1, 2]}
      />,
    );

    expect(screen.queryByRole('button')).toBeNull();
  });
});
