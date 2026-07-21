// @vitest-environment jsdom

/* eslint-disable unicorn/no-null -- DB registry rows use SQL NULL for nullable columns */

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { loaderDataRef } = vi.hoisted(() => ({
  loaderDataRef: {
    current: {} as {
      readonly scanner: Record<string, unknown>;
      readonly versionsPromise: Promise<readonly unknown[]>;
    },
  },
}));

vi.mock('react-router', () => ({
  useLoaderData: () => loaderDataRef.current,
}));

vi.mock('@lcabrera/ui', async () => {
  const actual =
    await vi.importActual<typeof import('@lcabrera/ui')>('@lcabrera/ui');

  return {
    ...actual,
    NavLink: ({
      children,
      to,
    }: {
      readonly children: ReactNode;
      readonly to: string;
    }) => <a href={to}>{children}</a>,
    TableLayout: () => <div data-testid='versions-table' />,
  };
});

import { ScannerDetail } from './ScannerDetail.component';

const baseScanner = {
  allowed_tools: null,
  command_template: null,
  config_detection: null,
  description: null,
  deterministic: true,
  display_name: 'Fallow',
  is_active: true,
  raw_artifact_file_name: null,
  scanner_id: 'fallow',
  skill_path: '.github/skills/fallow-code-checker',
  steps_markdown: null,
  supports_diff_scope: true,
  version: 3,
};

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  loaderDataRef.current = {
    scanner: baseScanner,
    versionsPromise: Promise.resolve([]),
  };
});

describe('ScannerDetail', () => {
  it('renders an active deterministic scanner with null-column fallbacks', () => {
    render(<ScannerDetail />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Fallow' }),
    ).not.toBeNull();
    expect(screen.getByText('active')).not.toBeNull();
    expect(screen.getByText(/Deterministic/)).not.toBeNull();
    expect(screen.getByText('No description.')).not.toBeNull();
    expect(screen.getByTestId('versions-table')).not.toBeNull();
    expect(
      screen.getByRole('link', { name: 'Edit Scanner' }).getAttribute('href'),
    ).toBe('/cqms/scanners/edit/fallow');
  });

  it('renders an inactive LLM scanner with populated registry columns', () => {
    loaderDataRef.current = {
      scanner: {
        ...baseScanner,
        allowed_tools: ['Read', 'Grep'],
        command_template: 'run {target}',
        description: 'Static analysis',
        deterministic: false,
        is_active: false,
        raw_artifact_file_name: 'fallow.raw.json',
      },
      versionsPromise: Promise.resolve([]),
    };

    render(<ScannerDetail />);

    expect(screen.getByText('inactive')).not.toBeNull();
    expect(screen.getByText(/LLM agent/)).not.toBeNull();
    expect(screen.getByText('Static analysis')).not.toBeNull();
    expect(screen.getByText(/Read, Grep/)).not.toBeNull();
  });
});
