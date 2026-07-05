// @vitest-environment jsdom

import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createRoutesStub } from 'react-router';

import { mockDialogElement } from '@repo/ui/utils/tests/mockDialogElement.util';
import { loader as browseDirectoryLoader } from '@repo/ui/routing/browseDirectory.loader';

import { PathBrowserModal } from './PathBrowserModal.component';

const dialogMocksRef: { current: { readonly restoreMockDialog: () => void } } =
  {
    current: { restoreMockDialog: () => {} },
  };

afterEach(() => {
  dialogMocksRef.current.restoreMockDialog();
  cleanup();
});

beforeEach(() => {
  const setup = mockDialogElement(false);
  dialogMocksRef.current = { restoreMockDialog: setup.restore };
});

describe('PathBrowserModal', () => {
  let root: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'path-browser-modal-test-'));
    mkdirSync(join(root, 'projects'));
    mkdirSync(join(root, 'downloads'));
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const renderModal = (props: {
    readonly onSelect?: (path: string) => void;
  }) => {
    const onSelect = props.onSelect ?? vi.fn();
    const Stub = createRoutesStub([
      {
        Component: () => (
          <PathBrowserModal
            browseAction='/_action/browse-directory'
            initialPath={root}
            isOpen
            onClose={vi.fn()}
            onSelect={onSelect}
          />
        ),
        path: '/',
      },
      {
        loader: browseDirectoryLoader,
        path: '/_action/browse-directory',
      },
    ]);

    return { onSelect, ...render(<Stub initialEntries={['/']} />) };
  };

  it('lists real subdirectories of the initial path', async () => {
    renderModal({});

    expect(await screen.findByText('projects')).not.toBeNull();
    expect(screen.getByText('downloads')).not.toBeNull();
  });

  it('drills into a subdirectory when clicked and lists its contents', async () => {
    mkdirSync(join(root, 'projects', 'cqms'));
    renderModal({});

    fireEvent.click(await screen.findByText('projects'));

    expect(await screen.findByText('cqms')).not.toBeNull();
  });

  it('calls onSelect with the currently browsed path and closes', async () => {
    const onSelect = vi.fn();
    renderModal({ onSelect });

    await screen.findByText('projects');

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: 'Select This Folder' }),
    );

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(root));
  });
});
