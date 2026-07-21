// @vitest-environment jsdom

/* eslint-disable unicorn/no-null -- DB registry rows use SQL NULL for nullable columns */

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { loaderDataRef } = vi.hoisted(() => ({
  loaderDataRef: {
    current: {} as {
      readonly permissions: readonly Record<string, unknown>[];
      readonly role: Record<string, unknown>;
    },
  },
}));

vi.mock('react-router', () => ({
  useLoaderData: () => loaderDataRef.current,
}));

vi.mock('@lcabrera/ui/components/NavLink', () => ({
  NavLink: ({
    children,
    to,
  }: {
    readonly children: ReactNode;
    readonly to: string;
  }) => <a href={to}>{children}</a>,
}));

import { RoleDetail } from './RoleDetail.component';

const permissions = [
  { action: 'read', id: 1, resource_type: 'project' },
  { action: 'write', id: 2, resource_type: 'scanner' },
];

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  loaderDataRef.current = {
    permissions,
    role: {
      description: 'Read-only reviewer',
      enabled: true,
      permission_ids: [1],
      role_name: 'reviewer',
    },
  };
});

describe('RoleDetail', () => {
  it('renders the enabled role with its assigned permission labels', () => {
    render(<RoleDetail />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'reviewer' }),
    ).not.toBeNull();
    expect(screen.getByText('enabled')).not.toBeNull();
    expect(screen.getByText(/Read-only reviewer/)).not.toBeNull();
    expect(screen.getByText('project: read')).not.toBeNull();
    expect(
      screen.getByRole('link', { name: 'Edit Role' }).getAttribute('href'),
    ).toBe('/cqms/admin/roles/edit/reviewer');
  });

  it('renders a disabled role without permissions using the fallbacks', () => {
    loaderDataRef.current = {
      permissions,
      role: {
        description: null,
        enabled: false,
        permission_ids: [],
        role_name: 'ghost',
      },
    };

    render(<RoleDetail />);

    expect(screen.getByText('disabled')).not.toBeNull();
    expect(screen.getByText('No description.')).not.toBeNull();
    expect(screen.getByText('No permissions assigned.')).not.toBeNull();
  });
});
