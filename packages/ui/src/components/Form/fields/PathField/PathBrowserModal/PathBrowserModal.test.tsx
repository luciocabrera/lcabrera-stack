// @vitest-environment jsdom

import { loader as browseDirectoryLoader } from '@repo/ui/routing/browseDirectory.loader';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { createRoutesStub } from 'react-router';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { PathBrowserModal } from './PathBrowserModal.component';

afterEach(() => {
  cleanup();
});

describe('PathBrowserModal', () => {
  // Statically-derived fixture root (packages/ui/node_modules/.cache):
  // security/detect-non-literal-fs-filename only accepts statically
  // resolvable paths (import.meta.dirname + literals), which a mkdtempSync
  // result can never be.
  const root = path.join(
    import.meta.dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    '..',
    'node_modules',
    '.cache',
    'path-browser-modal-test',
  );

  beforeAll(() => {
    rmSync(root, { force: true, recursive: true });
    mkdirSync(path.join(root, 'projects'), { recursive: true });
    mkdirSync(path.join(root, 'downloads'));
  });

  afterAll(() => {
    rmSync(root, { force: true, recursive: true });
  });

  const renderModal = (props: {
    readonly onClose?: () => void;
    readonly onSelect?: (path: string) => void;
  }) => {
    const onClose = props.onClose ?? vi.fn();
    const onSelect = props.onSelect ?? vi.fn();
    const Stub = createRoutesStub([
      {
        Component: () => (
          <PathBrowserModal
            browseAction='/_action/browse-directory'
            initialPath={root}
            isOpen
            onClose={onClose}
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

    return { onClose, onSelect, ...render(<Stub initialEntries={['/']} />) };
  };

  it('lists real subdirectories of the initial path', async () => {
    renderModal({});

    expect(await screen.findByText('projects')).not.toBeNull();
    expect(screen.getByText('downloads')).not.toBeNull();
  });

  it('drills into a subdirectory when clicked and lists its contents', async () => {
    mkdirSync(path.join(root, 'projects', 'cqms'));
    renderModal({});

    fireEvent.click(await screen.findByText('projects'));

    expect(await screen.findByText('cqms')).not.toBeNull();
  });

  it('drills into the active option when Enter is pressed', async () => {
    mkdirSync(path.join(root, 'projects', 'cqms'), { recursive: true });
    mkdirSync(path.join(root, 'downloads', 'archive'), { recursive: true });
    renderModal({});

    const listbox = await screen.findByRole('listbox', {
      name: 'Choose a folder',
    });

    fireEvent.keyDown(listbox, { key: 'Enter' });

    expect(await screen.findByText(/archive|cqms/)).not.toBeNull();
  });

  it('calls onSelect with the currently browsed path and closes', async () => {
    const onSelect = vi.fn();
    renderModal({ onSelect });

    await screen.findByText('projects');

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: 'Use Current' }),
    );

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(root));
  });

  it('renders as an inline listbox, not a dialog', async () => {
    renderModal({});

    await screen.findByText('projects');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(
      screen.getByRole('listbox', { name: 'Choose a folder' }),
    ).not.toBeNull();
  });

  it('closes when Escape is pressed', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const listbox = await screen.findByRole('listbox', {
      name: 'Choose a folder',
    });

    fireEvent.keyDown(listbox, { key: 'Escape' });

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});
