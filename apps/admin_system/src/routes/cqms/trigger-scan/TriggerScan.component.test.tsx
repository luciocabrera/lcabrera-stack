// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { actionDataRef, loaderDataRef } = vi.hoisted(() => ({
  actionDataRef: { current: undefined as unknown },
  loaderDataRef: {
    current: {} as {
      readonly hasActiveRun: boolean;
      readonly hasSnapshot: boolean;
      readonly projectId: string;
      readonly scannersPromise: Promise<readonly unknown[]>;
      readonly workspacesPromise: Promise<readonly unknown[]>;
    },
  },
}));

vi.mock('react-router', () => ({
  useActionData: () => actionDataRef.current,
  useLoaderData: () => loaderDataRef.current,
}));

// The form is exercised by its own suspenseful tree; this component's job is
// only to decide WHICH of the three states to show.
vi.mock('./TriggerScanForm', () => ({
  TriggerScanForm: () => <div data-testid='trigger-scan-form' />,
}));

import { TriggerScan } from './TriggerScan.component';

beforeEach(() => {
  actionDataRef.current = undefined;
  loaderDataRef.current = {
    hasActiveRun: false,
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

  it('blocks a second scan while one is already running', () => {
    loaderDataRef.current = { ...loaderDataRef.current, hasActiveRun: true };

    render(<TriggerScan />);

    expect(screen.queryByTestId('trigger-scan-form')).toBeNull();
    expect(screen.getByText(/A scan is already running/)).toBeDefined();
  });

  // The no-snapshot branch returns early, so it must win even mid-run.
  it('prefers the no-snapshot message when both conditions hold', () => {
    loaderDataRef.current = {
      ...loaderDataRef.current,
      hasActiveRun: true,
      hasSnapshot: false,
    };

    render(<TriggerScan />);

    expect(screen.getByText(/No code snapshot has been synced/)).toBeDefined();
    expect(screen.queryByText(/A scan is already running/)).toBeNull();
  });

  it('renders without server errors when the action returned none', () => {
    actionDataRef.current = { errors: { scannerIds: 'Pick a scanner.' } };

    render(<TriggerScan />);

    expect(screen.getByTestId('trigger-scan-form')).toBeDefined();
  });
});
