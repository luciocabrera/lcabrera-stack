import type { ActionFunctionArgs } from 'react-router';

import { discoverProjectWorkspaces } from '@repo/scan-ingestion/ingestion/workspaces/discoverProjectWorkspaces.util';
import { getProjectById } from '@repo/scan-ingestion/queries/getProjectById.util';
import { replaceProjectWorkspaces } from '@repo/scan-ingestion/queries/replaceProjectWorkspaces.util';
import { triggerScan as triggerScanMutation } from '@repo/scan-ingestion/queries/triggerScan.util';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requireUser } from '@/auth/requireUser.util';

import { action } from './triggerScan.action';

vi.mock('@/auth/requireUser.util', () => ({ requireUser: vi.fn() }));
vi.mock('@repo/scan-ingestion/queries/getProjectById.util', () => ({
  getProjectById: vi.fn(),
}));
vi.mock('@repo/scan-ingestion/queries/triggerScan.util', () => ({
  triggerScan: vi.fn(),
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

const workspace = (path: string) =>
  ({ workspace_path: path }) as unknown as ReturnType<
    typeof discoverProjectWorkspaces
  >[number];

type BuildFormDataArgs = {
  readonly confirmFanOut?: boolean;
  readonly scannerIds?: readonly string[];
  readonly workspacePaths?: readonly string[];
};

const buildFormData = ({
  confirmFanOut = false,
  scannerIds = ['code-smell-checker'],
  workspacePaths = ['apps/web'],
}: BuildFormDataArgs = {}) => {
  const formData = new FormData();
  if (confirmFanOut) {
    formData.set('confirmFanOut', 'on');
  }
  for (const scannerId of scannerIds) {
    formData.append('scannerIds', scannerId);
  }
  for (const workspacePath of workspacePaths) {
    formData.append('workspacePaths', workspacePath);
  }
  return formData;
};

const invoke = (formData: FormData = buildFormData()) =>
  action({
    context: {},
    params: { projectId: PROJECT_ID },
    request: new Request('https://cqms.example/cqms/projects/trigger', {
      body: formData,
      method: 'POST',
    }),
  } as unknown as ActionFunctionArgs);

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(requireUser).mockResolvedValue({
    id: USER_ID,
    username: 'ada',
  } as Awaited<ReturnType<typeof requireUser>>);
  vi.mocked(getProjectById).mockResolvedValue({
    id: PROJECT_ID,
    snapshot_path: '/tmp/snap-1',
  } as Awaited<ReturnType<typeof getProjectById>>);
  vi.mocked(discoverProjectWorkspaces).mockReturnValue([
    workspace('apps/web'),
    workspace('apps/api'),
  ]);
  vi.mocked(replaceProjectWorkspaces).mockResolvedValue(undefined);
  vi.mocked(triggerScanMutation).mockResolvedValue({ runId: 'run-1' });
});

describe('triggerScan action', () => {
  it('queues the scan and redirects to the new run', async () => {
    const response = await invoke();

    expect(triggerScanMutation).toHaveBeenCalledWith({
      projectId: PROJECT_ID,
      scannerIds: ['code-smell-checker'],
      triggeredBy: 'ada',
      userId: USER_ID,
      workspacePaths: ['apps/web'],
    });
    expect(response).toMatchObject({ status: 302 });
  });

  it('refuses a project with no synced snapshot, with a precise message', async () => {
    // A project with no snapshot carries SQL NULL in the column; parsing it
    // from JSON is how the driver actually delivers it.
    const noSnapshotRow = JSON.parse('{"snapshot_path":null}') as Record<
      string,
      unknown
    >;
    vi.mocked(getProjectById).mockResolvedValue({
      ...noSnapshotRow,
      id: PROJECT_ID,
    } as Awaited<ReturnType<typeof getProjectById>>);

    const result = await invoke();

    expect(result).toMatchObject({
      errors: {
        scannerIds:
          'No code snapshot has been synced for this project. Upload a snapshot before triggering a scan.',
      },
    });
    expect(triggerScanMutation).not.toHaveBeenCalled();
  });

  // Form values are attacker-controllable, so the selection is validated
  // against a FRESH discovery rather than the form's own options (ADR-021).
  it('rejects a workspace that is not part of the project', async () => {
    const result = await invoke(
      buildFormData({ workspacePaths: ['../../etc'] }),
    );

    expect(result).toMatchObject({
      errors: { workspacePaths: 'Not a workspace of this project: ../../etc' },
    });
    expect(triggerScanMutation).not.toHaveBeenCalled();
  });

  // The cost incident this guards: scanners x workspaces queued scans from
  // one submission. Threshold is 8, checked with `>`.
  it('requires confirmation past the fan-out threshold, naming the count', async () => {
    const result = await invoke(
      buildFormData({
        scannerIds: ['a', 'b', 'c', 'd', 'e'],
        workspacePaths: ['apps/web', 'apps/api'],
      }),
    );

    expect(result).toMatchObject({
      errors: {
        confirmFanOut:
          'This will queue 10 scans. Check the box below to confirm and start the scan.',
      },
    });
    expect(triggerScanMutation).not.toHaveBeenCalled();
  });

  it('lets a fan-out exactly at the threshold through unconfirmed', async () => {
    // 4 x 2 = 8, and the guard is `> 8` — the threshold itself is allowed.
    const response = await invoke(
      buildFormData({
        scannerIds: ['a', 'b', 'c', 'd'],
        workspacePaths: ['apps/web', 'apps/api'],
      }),
    );

    expect(triggerScanMutation).toHaveBeenCalled();
    expect(response).toMatchObject({ status: 302 });
  });

  it('queues the large fan-out once it is confirmed', async () => {
    const response = await invoke(
      buildFormData({
        confirmFanOut: true,
        scannerIds: ['a', 'b', 'c', 'd', 'e'],
        workspacePaths: ['apps/web', 'apps/api'],
      }),
    );

    expect(triggerScanMutation).toHaveBeenCalled();
    expect(response).toMatchObject({ status: 302 });
  });

  it('rejects a submission with no scanners selected', async () => {
    const result = await invoke(buildFormData({ scannerIds: [] }));

    expect(result).toMatchObject({
      errors: { scannerIds: expect.any(String) },
    });
    expect(triggerScanMutation).not.toHaveBeenCalled();
  });

  it('still queues the scan when the workspace refresh fails (best-effort)', async () => {
    vi.mocked(replaceProjectWorkspaces).mockRejectedValue(
      new Error('workspace table locked'),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const response = await invoke();

    expect(response).toMatchObject({ status: 302 });
    expect(warn).toHaveBeenCalledWith(
      'Workspace snapshot refresh failed (non-fatal):',
      expect.any(Error),
    );
  });

  it("renders fn_create_run's permission rejection as a field error, not a 500", async () => {
    vi.mocked(triggerScanMutation).mockRejectedValue(
      new Error('viewer lacks the execute grant on scan'),
    );

    const result = await invoke();

    expect(result).toEqual({
      errors: { scannerIds: 'viewer lacks the execute grant on scan' },
    });
  });

  it('authenticates before loading the project', async () => {
    vi.mocked(requireUser).mockRejectedValue(new Error('Redirect to /login'));

    await expect(invoke()).rejects.toThrow('Redirect to /login');
    expect(getProjectById).not.toHaveBeenCalled();
  });
});
