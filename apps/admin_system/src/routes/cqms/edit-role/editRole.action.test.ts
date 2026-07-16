import type { ActionFunctionArgs } from 'react-router';

import { getRoleWithPermissions } from '@repo/scan-ingestion/queries/getRoleWithPermissions.util';
import { replaceRolePermissions } from '@repo/scan-ingestion/queries/replaceRolePermissions.util';
import { updateRole } from '@repo/scan-ingestion/queries/updateRole.util';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requireUser } from '@/auth/requireUser.util';

import { action } from './editRole.action';

vi.mock('@/auth/requireUser.util', () => ({ requireUser: vi.fn() }));
vi.mock('@repo/scan-ingestion/queries/getRoleWithPermissions.util', () => ({
  getRoleWithPermissions: vi.fn(),
}));
vi.mock('@repo/scan-ingestion/queries/updateRole.util', () => ({
  updateRole: vi.fn(),
}));
vi.mock('@repo/scan-ingestion/queries/replaceRolePermissions.util', () => ({
  replaceRolePermissions: vi.fn(),
}));

const ROLE_ID = 'b3f1c2d4-0000-4000-8000-000000000001';
const USER_ID = 'a1b2c3d4-0000-4000-8000-0000000000ff';
const PERMISSION_ID = 'c4d5e6f7-0000-4000-8000-000000000002';

const buildFormData = (values: Readonly<Record<string, string>> = {}) => {
  const formData = new FormData();
  formData.set('description', 'Ships releases');
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  formData.append('permissionIds', PERMISSION_ID);
  return formData;
};

const invoke = (formData: FormData = buildFormData()) =>
  action({
    context: {},
    params: { roleName: 'release-manager' },
    request: new Request('https://cqms.example/cqms/admin/roles/edit', {
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
  vi.mocked(getRoleWithPermissions).mockResolvedValue({
    id: ROLE_ID,
    role_name: 'release-manager',
  } as Awaited<ReturnType<typeof getRoleWithPermissions>>);
  vi.mocked(updateRole).mockResolvedValue(undefined);
  vi.mocked(replaceRolePermissions).mockResolvedValue(undefined);
});

describe('editRole action', () => {
  it('updates the role and its permissions, then redirects to the detail page', async () => {
    const response = await invoke();

    expect(updateRole).toHaveBeenCalledWith({
      description: 'Ships releases',
      isEnabled: false,
      roleId: ROLE_ID,
      userId: USER_ID,
    });
    expect(replaceRolePermissions).toHaveBeenCalledWith({
      permissionIds: [PERMISSION_ID],
      roleId: ROLE_ID,
      userId: USER_ID,
    });
    expect(response).toMatchObject({
      status: 302,
    });
  });

  it('sends an empty description as undefined, so the column is left unset', async () => {
    await invoke(buildFormData({ description: '' }));

    expect(updateRole).toHaveBeenCalledWith(
      expect.objectContaining({ description: undefined }),
    );
  });

  it('authenticates before reading the role (actions run before loaders)', async () => {
    vi.mocked(requireUser).mockRejectedValue(new Error('Redirect to /login'));

    await expect(invoke()).rejects.toThrow('Redirect to /login');
    expect(getRoleWithPermissions).not.toHaveBeenCalled();
  });

  it('surfaces a validation failure as a field error rather than writing', async () => {
    const formData = buildFormData();
    formData.set('permissionIds', 'not-a-uuid');

    const result = await invoke(formData);

    expect(result).toMatchObject({
      errors: { permissionIds: expect.any(String) },
    });
    expect(updateRole).not.toHaveBeenCalled();
  });

  it("renders Postgres's typed rejection as a field error, not a 500", async () => {
    vi.mocked(updateRole).mockRejectedValue(
      new Error('the seeded admin role is immutable'),
    );

    const result = await invoke();

    expect(result).toEqual({
      errors: { description: 'the seeded admin role is immutable' },
    });
  });
});
