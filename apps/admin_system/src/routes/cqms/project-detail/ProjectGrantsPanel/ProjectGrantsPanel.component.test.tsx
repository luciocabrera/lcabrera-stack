// @vitest-environment jsdom

import type { ProjectGrantRow } from '@repo/scan-ingestion/queries/getProjectGrants.util';
import type { UserListViewRow } from '@repo/scan-ingestion/queries/getUserListView.util';
import type { ReactNode } from 'react';

import { act, cleanup, render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { fetcherRef } = vi.hoisted(() => ({
  fetcherRef: {
    current: {} as {
      data?: unknown;
      Form: (props: { readonly children?: ReactNode }) => ReactNode;
      state: string;
    },
  },
}));

vi.mock('react-router', () => ({
  useFetcher: () => fetcherRef.current,
}));

import { ProjectGrantsPanel } from './ProjectGrantsPanel.component';

const grant = (overrides: Partial<ProjectGrantRow> = {}) =>
  ({
    action: 'execute',
    display_name: 'Ada Lovelace',
    id: 'grant-1',
    resource_type: 'scan',
    username: 'ada',
    ...overrides,
  }) as ProjectGrantRow;

const user = () =>
  ({
    display_name: 'Ada Lovelace',
    id: 'user-1',
    username: 'ada',
  }) as UserListViewRow;

type RenderPanelArgs = {
  readonly grants?: readonly ProjectGrantRow[];
  readonly users?: readonly UserListViewRow[];
};

/**
 * The panel reads both props with `use()`, so it suspends on first render.
 * RTL's own `render` calls `act` synchronously and does not await it, which
 * leaves the tree stuck on the fallback forever ("A component suspended inside
 * an `act` scope, but the `act` call was not awaited") — so the render has to
 * happen inside an awaited act of our own.
 */
const renderPanel = async ({
  grants = [grant()],
  users = [user()],
}: RenderPanelArgs = {}) => {
  // Sonar reads this act() as redundant (S8980). It is not, and removing it
  // fails all four tests with the Suspense fallback still on screen: RTL's
  // render() calls act() *un-awaited*, so a tree suspended on use() never gets
  // the chance to resolve. Awaiting an async act around render is what lets it.
  await act(async () => {
    render(
      <Suspense fallback='loading'>
        <ProjectGrantsPanel
          grantsPromise={Promise.resolve(grants)}
          usersPromise={Promise.resolve(users)}
        />
      </Suspense>,
    );
  });
};

beforeEach(() => {
  fetcherRef.current = {
    Form: ({ children }: { readonly children?: ReactNode }) => (
      <form>{children}</form>
    ),
    state: 'idle',
  };
});

afterEach(() => {
  cleanup();
});

describe('ProjectGrantsPanel', () => {
  it('renders a grant with its curated permission label', async () => {
    await renderPanel();

    // Scoped to the list: the grantee also appears in the "add grant" <select>.
    expect(screen.getByRole('listitem').textContent).toContain(
      'Ada Lovelace (ada)',
    );
    expect(screen.getByRole('listitem').textContent).toContain('Trigger scans');
  });

  it('says so when the project has no per-instance grants', async () => {
    await renderPanel({ grants: [] });

    expect(
      screen.getByText('No per-instance grants on this project.'),
    ).toBeDefined();
  });

  // A grant whose action:resourceType is not in the curated list still has to
  // render — the DB can hold tuples the UI does not offer.
  it('falls back to the raw action and resource type for an uncurated grant', async () => {
    await renderPanel({
      grants: [grant({ action: 'delete', resource_type: 'project' })],
    });

    expect(screen.getByText(/delete project/)).toBeDefined();
  });

  it('renders the action error inline as an alert', async () => {
    fetcherRef.current = {
      ...fetcherRef.current,
      data: { grantError: 'viewer lacks manage on project' },
    };

    await renderPanel();

    expect(screen.getByRole('alert').textContent).toBe(
      'viewer lacks manage on project',
    );
  });

  it('shows no alert when the action returned no error', async () => {
    fetcherRef.current = { ...fetcherRef.current, data: { ok: true } };

    await renderPanel();

    expect(screen.queryByRole('alert')).toBeNull();
  });
});
