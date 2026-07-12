import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home/root.ts'),
  route('login', 'routes/login/root.ts'),
  route('logout', 'routes/logout/root.ts'),
  route('_action/persist-cookie', 'routes/api/persist-cookie/root.ts'),
  route('settings', 'routes/settings/root.ts'),
  route('cqms', 'routes/cqms/layout.ts', [
    index('routes/cqms/cqmsIndex.root.ts'),
    route('projects', 'routes/cqms/root.ts'),
    route('projects/new', 'routes/cqms/new-project/root.ts'),
    route('projects/edit/:projectId', 'routes/cqms/edit-project/root.ts'),
    route('projects/view/:projectId', 'routes/cqms/project-detail/root.ts'),
    route(
      'projects/view/:projectId/trigger-scan',
      'routes/cqms/trigger-scan/root.ts',
    ),
    route(
      'projects/view/:projectId/runs/:runId',
      'routes/cqms/run-detail/root.ts',
    ),
    route(
      'projects/view/:projectId/runs/:runId/scans/:scanId',
      'routes/cqms/scan-detail/root.ts',
    ),
    route('scanners', 'routes/cqms/scanners/root.ts'),
    route('scanners/new', 'routes/cqms/new-scanner/root.ts'),
    route('scanners/edit/:scannerId', 'routes/cqms/edit-scanner/root.ts'),
    route('scanners/view/:scannerId', 'routes/cqms/scanner-detail/root.ts'),
    route('admin/users', 'routes/cqms/users/root.ts'),
    route('admin/users/new', 'routes/cqms/new-user/root.ts'),
    route('admin/users/edit/:username', 'routes/cqms/edit-user/root.ts'),
    route('admin/users/view/:username', 'routes/cqms/user-detail/root.ts'),
    route('admin/roles', 'routes/cqms/roles/root.ts'),
    route('admin/roles/new', 'routes/cqms/new-role/root.ts'),
    route('admin/roles/edit/:roleName', 'routes/cqms/edit-role/root.ts'),
    route('admin/roles/view/:roleName', 'routes/cqms/role-detail/root.ts'),
    route('admin/llm-usage', 'routes/cqms/llm-usage/root.ts'),
  ]),
] satisfies RouteConfig;
