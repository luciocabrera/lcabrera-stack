// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

const { actionDataRef, loaderDataRef } = vi.hoisted(() => ({
  actionDataRef: { current: undefined as unknown },
  loaderDataRef: {
    current: {} as {
      readonly activeRun?: { readonly elapsed: string; readonly runId: string };
      readonly hasSnapshot: boolean;
      readonly projectId: string;
      readonly scannersPromise: Promise<readonly unknown[]>;
      readonly workspacesPromise: Promise<readonly unknown[]>;
    },
  },
}));

vi.mock('react-router', () => ({
  Link: ({
    children,
    to,
  }: {
    readonly children: ReactNode;
    readonly to: string;
  }) => <a href={to}>{children}</a>,
  useActionData: () => actionDataRef.current,
  useLoaderData: () => loaderDataRef.current,
}));

// The form is exercised by its own suspenseful tree; this component's job is
// only to decide WHICH of the states to show.
vi.mock('./TriggerScanForm', () => ({
  TriggerScanForm: () => <div data-testid='trigger-scan-form' />,
}));

import { TriggerScan } from './TriggerScan.component';

beforeEach(() => {
  actionDataRef.current = undefined;
  loaderDataRef.current = {
    activeRun: undefined,
    hasSnapshot: true,
    projectId: 'b3f1c2d4-0000-4000-8000-000000000001',
    scannersPromise: Promise.resolve([]),
    workspacesPromise: Promise.resolve([]),
  };
});

afterEach(() => {
  cleanup();
});

describe('TriggerScan', () => {
  it('renders the form when a snapshot exists and nothing is running', () => {
    render(<TriggerScan />);

    expect(screen.getByTestId('trigger-scan-form')).toBeDefined();
  });

  it('refuses to offer the form with no synced snapshot', () => {
    loaderDataRef.current = { ...loaderDataRef.current, hasSnapshot: false };

    render(<TriggerScan />);

    expect(screen.queryByTestId('trigger-scan-form')).toBeNull();
    expect(screen.getByText(/No code snapshot has been synced/)).toBeDefined();
  });

  it('blocks a second scan while one is already running, linking to it with elapsed time', () => {
    loaderDataRef.current = {
      ...loaderDataRef.current,
      activeRun: { elapsed: '5m', runId: 'run-123' },
    };

    render(<TriggerScan />);

    expect(screen.queryByTestId('trigger-scan-form')).toBeNull();
    expect(screen.getByText(/A scan is already running/)).toBeDefined();
    expect(screen.getByText(/5m/)).toBeDefined();
    expect(
      screen.getByRole('link', { name: /view the running scan/i }),
    ).toBeDefined();
  });

  it('shows the same banner from a 409 conflict the action returned', () => {
    actionDataRef.current = { conflict: { elapsed: '2m', runId: 'run-456' } };

    render(<TriggerScan />);

    expect(screen.queryByTestId('trigger-scan-form')).toBeNull();
    expect(screen.getByText(/A scan is already running/)).toBeDefined();
    expect(screen.getByText(/2m/)).toBeDefined();
  });

  // The no-snapshot branch returns early, so it must win even mid-run.
  it('prefers the no-snapshot message when both conditions hold', () => {
    loaderDataRef.current = {
      ...loaderDataRef.current,
      activeRun: { elapsed: '5m', runId: 'run-123' },
      hasSnapshot: false,
    };

    render(<TriggerScan />);

    expect(screen.getByText(/No code snapshot has been synced/)).toBeDefined();
    expect(screen.queryByText(/A scan is already running/)).toBeNull();
  });

  it('renders the form (not a banner) when the action returned field errors', () => {
    actionDataRef.current = { errors: { scannerIds: 'Pick a scanner.' } };

    render(<TriggerScan />);

    expect(screen.getByTestId('trigger-scan-form')).toBeDefined();
  });
});
