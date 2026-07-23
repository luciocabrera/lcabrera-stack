import type { ActionFunctionArgs } from 'react-router';

import { getUserWithRoles } from '@repo/scan-ingestion/queries/getUserWithRoles.util';
import { replaceUserRoles } from '@repo/scan-ingestion/queries/replaceUserRoles.util';
import { setUserPassword } from '@repo/scan-ingestion/queries/setUserPassword.util';
import { updateUser } from '@repo/scan-ingestion/queries/updateUser.util';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { requireUser } from '@/auth/requireUser.util';

import { action } from './editUser.action';

vi.mock('@/auth/requireUser.util', () => ({ requireUser: vi.fn() }));
vi.mock('@repo/scan-ingestion/queries/getUserWithRoles.util', () => ({
  getUserWithRoles: vi.fn(),
}));
vi.mock('@repo/scan-ingestion/queries/updateUser.util', () => ({
  updateUser: vi.fn(),
}));
vi.mock('@repo/scan-ingestion/queries/replaceUserRoles.util', () => ({
  replaceUserRoles: vi.fn(),
}));
vi.mock('@repo/scan-ingestion/queries/setUserPassword.util', () => ({
  setUserPassword: vi.fn(),
}));

const TARGET_ID = 'b3f1c2d4-0000-4000-8000-000000000001';
const ACTING_USER_ID = 'a1b2c3d4-0000-4000-8000-0000000000ff';

const buildFormData = (values: Readonly<Record<string, string>> = {}) => {
  const formData = new FormData();
  formData.set('displayName', 'Ada Lovelace');
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
};

const invoke = (formData: FormData = buildFormData()) =>
  action({
    context: {},
    params: { username: 'ada' },
    request: new Request('https://cqms.example/cqms/admin/users/edit', {
      body: formData,
      method: 'POST',
    }),
  } as unknown as ActionFunctionArgs);

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(requireUser).mockResolvedValue({
    id: ACTING_USER_ID,
    username: 'admin',
  } as Awaited<ReturnType<typeof requireUser>>);
  vi.mocked(getUserWithRoles).mockResolvedValue({
    id: TARGET_ID,
    username: 'ada',
  } as Awaited<ReturnType<typeof getUserWithRoles>>);
  vi.mocked(updateUser).mockResolvedValue(undefined);
  vi.mocked(replaceUserRoles).mockResolvedValue(undefined);
  vi.mocked(setUserPassword).mockResolvedValue(undefined);
});

describe('editUser action', () => {
  it('updates the user and roles, then redirects to the detail page', async () => {
    const response = await invoke();

    expect(updateUser).toHaveBeenCalledWith({
      displayName: 'Ada Lovelace',
      isEnabled: false,
      targetUserId: TARGET_ID,
      userId: ACTING_USER_ID,
    });
    expect(replaceUserRoles).toHaveBeenCalledWith({
      roleIds: [],
      targetUserId: TARGET_ID,
      userId: ACTING_USER_ID,
    });
    expect(response).toMatchObject({ status: 302 });
  });

  // The branch that kept this action at cyclomatic 5: an empty newPassword
  // means "keep the current one", so it must NOT reach setUserPassword.
  it('leaves the password alone when newPassword is empty', async () => {
    await invoke();

    expect(setUserPassword).not.toHaveBeenCalled();
  });

  it('sets the password when one was supplied', async () => {
    await invoke(buildFormData({ newPassword: 'analytical-engine' }));

    expect(setUserPassword).toHaveBeenCalledWith({
      password: 'analytical-engine',
      targetUserId: TARGET_ID,
      userId: ACTING_USER_ID,
    });
  });

  it('rejects a too-short password as a field error, without writing', async () => {
    const result = await invoke(buildFormData({ newPassword: 'short' }));

    expect(result).toMatchObject({
      errors: {
        newPassword:
          'Password must be at least 8 characters (leave empty to keep the current one).',
      },
    });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('authenticates before reading the target user', async () => {
    vi.mocked(requireUser).mockRejectedValue(new Error('Redirect to /login'));

    await expect(invoke()).rejects.toThrow('Redirect to /login');
    expect(getUserWithRoles).not.toHaveBeenCalled();
  });

  it("renders Postgres's lockout guard as a field error, not a 500", async () => {
    vi.mocked(updateUser).mockRejectedValue(
      new Error('cannot disable your own account'),
    );

    const result = await invoke();

    expect(result).toEqual({
      errors: { displayName: 'cannot disable your own account' },
    });
  });
});
