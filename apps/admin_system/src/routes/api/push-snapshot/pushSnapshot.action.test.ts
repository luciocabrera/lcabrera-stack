import type { ActionFunctionArgs } from 'react-router';

import { saveProjectSnapshot } from '@repo/scan-ingestion/ingestion/snapshots/saveProjectSnapshot';
import { discoverProjectWorkspaces } from '@repo/scan-ingestion/ingestion/workspaces/discoverProjectWorkspaces.util';
import { checkUserPermission } from '@repo/scan-ingestion/queries/checkUserPermission.util';
import { replaceProjectWorkspaces } from '@repo/scan-ingestion/queries/replaceProjectWorkspaces.util';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { requireApiUser } from '@/auth/requireApiUser.util';

import { action } from './pushSnapshot.action';

// Every module this action reaches for is an I/O edge (Bearer verification,
// Postgres, the filesystem). Stubbing them keeps the suite DB-free (ADR-032)
// while still exercising the action's own gate order.
vi.mock('@/auth/requireApiUser.util', () => ({ requireApiUser: vi.fn() }));
vi.mock('@repo/scan-ingestion/queries/checkUserPermission.util', () => ({
  checkUserPermission: vi.fn(),
}));
vi.mock('@repo/scan-ingestion/ingestion/snapshots/saveProjectSnapshot', () => ({
  saveProjectSnapshot: vi.fn(),
}));
vi.mock('@repo/scan-ingestion/queries/replaceProjectWorkspaces.util', () => ({
  replaceProjectWorkspaces: vi.fn(),
}));
vi.mock(
  '@repo/scan-ingestion/ingestion/workspaces/discoverProjectWorkspaces.util',
  () => ({ discoverProjectWorkspaces: vi.fn() }),
);

const PROJECT_ID = 'b3f1c2d4-0000-4000-8000-000000000001';
const USER_ID = 'a1b2c3d4-0000-4000-8000-0000000000ff';

// Uint8Array<ArrayBufferLike> is not a BodyInit — that union admits
// SharedArrayBuffer-backed views, which fetch bodies reject.
const buildRequest = (body: Uint8Array<ArrayBuffer>) =>
  new Request(`https://cqms.example/_action/push-snapshot/${PROJECT_ID}`, {
    body,
    headers: { 'X-CodePulse-Host': 'ada-laptop' },
    method: 'POST',
  });

const invoke = ({
  body = new Uint8Array([1, 2, 3]),
  params = { projectId: PROJECT_ID },
}: {
  readonly body?: Uint8Array<ArrayBuffer>;
  readonly params?: Readonly<Record<string, string>>;
} = {}) =>
  action({
    context: {},
    params,
    request: buildRequest(body),
  } as unknown as ActionFunctionArgs);

type ThrownDataResponse = {
  readonly data: unknown;
  readonly init: { readonly status: number };
};

/**
 * `data()` throws a DataWithResponseInit — not a Response and not a
 * RouteErrorResponse — so the status lives on `.init`, not `.status`.
 */
const isDataResponse = (value: unknown): value is ThrownDataResponse =>
  typeof value === 'object' &&
  value !== null &&
  (value as { readonly type?: unknown }).type === 'DataWithResponseInit';

const statusOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    if (isDataResponse(error)) {
      return { data: error.data, status: error.init.status };
    }
    throw error;
  }
  throw new Error('Expected the action to throw a data() response.');
};

beforeEach(() => {
  // Call history leaks across tests otherwise, and several of these assert
  // that a write was NOT reached.
  vi.clearAllMocks();

  vi.mocked(requireApiUser).mockResolvedValue({ userId: USER_ID });
  vi.mocked(checkUserPermission).mockResolvedValue({ allowed: true });
  vi.mocked(discoverProjectWorkspaces).mockReturnValue([]);
  vi.mocked(replaceProjectWorkspaces).mockResolvedValue(undefined);
  vi.mocked(saveProjectSnapshot).mockResolvedValue({
    fileCount: 12,
    sizeBytes: 3,
    snapshotId: 'snap-1',
    storagePath: '/tmp/snap-1',
  });
});

describe('pushSnapshot action', () => {
  it('stores the archive and reports what landed', async () => {
    const response = await invoke();

    expect(await response.json()).toEqual({
      fileCount: 12,
      sizeBytes: 3,
      snapshotId: 'snap-1',
    });
    expect(saveProjectSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        archiveName: 'cli-push.zip',
        projectId: PROJECT_ID,
        sourceLabel: 'cli:ada-laptop',
        userId: USER_ID,
      }),
    );
  });

  it('authenticates before reading the body or touching the database', async () => {
    vi.mocked(requireApiUser).mockRejectedValue(new Error('Unauthorized'));

    await expect(invoke()).rejects.toThrow('Unauthorized');
    expect(checkUserPermission).not.toHaveBeenCalled();
    expect(saveProjectSnapshot).not.toHaveBeenCalled();
  });

  it('rejects an unparseable project id as 400', async () => {
    const thrown = await statusOf(invoke({ params: { projectId: 'nope' } }));

    expect(thrown).toEqual({ data: 'Invalid project id.', status: 400 });
  });

  it('refuses a caller without update permission as 403, before writing anything', async () => {
    vi.mocked(checkUserPermission).mockResolvedValue({
      allowed: false,
      reason: 'viewer lacks update on project',
    });

    const thrown = await statusOf(invoke());

    expect(thrown).toEqual({
      data: 'viewer lacks update on project',
      status: 403,
    });
    expect(saveProjectSnapshot).not.toHaveBeenCalled();
  });

  it('rejects an empty body as 400 without writing it to disk', async () => {
    const thrown = await statusOf(invoke({ body: new Uint8Array() }));

    expect(thrown).toEqual({
      data: 'Empty request body — expected a .zip archive.',
      status: 400,
    });
    expect(saveProjectSnapshot).not.toHaveBeenCalled();
  });

  it('keeps the sync when workspace discovery fails (ADR-021 best-effort)', async () => {
    vi.mocked(replaceProjectWorkspaces).mockRejectedValue(
      new Error('workspace table locked'),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const response = await invoke();

    expect(response.status).toBe(200);
    expect(warn).toHaveBeenCalledWith(
      'Workspace discovery failed (non-fatal):',
      expect.any(Error),
    );
  });
});
