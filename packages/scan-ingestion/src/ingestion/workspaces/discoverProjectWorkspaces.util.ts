import path from 'node:path';

import { expandWorkspaceGlobs } from './expandWorkspaceGlobs.util.ts';
import { readPackageName } from './readPackageName.util.ts';
import { readWorkspaceGlobs } from './readWorkspaceGlobs.util.ts';

export type DiscoveredWorkspace = {
  readonly workspace_name?: string;
  readonly workspace_path: string;
};

type DiscoverProjectWorkspacesArgs = {
  readonly rootPath: string;
};

/**
 * Best-effort monorepo workspace discovery (ADR-021): pnpm-workspace.yaml
 * (`packages:` globs) wins when present, else the root package.json's
 * `workspaces` field; globs expand to directories that contain a
 * package.json. A plain single-package repo — or any error along the way
 * — yields [], which the UI reads as "no workspace scoping to offer".
 * Snake_case keys on purpose: this shape goes verbatim into
 * fn_replace_project_workspaces' jsonb_to_recordset.
 */
export const discoverProjectWorkspaces = ({
  rootPath,
}: DiscoverProjectWorkspacesArgs): readonly DiscoveredWorkspace[] => {
  try {
    const globs = readWorkspaceGlobs(rootPath);
    return expandWorkspaceGlobs({ globs, rootPath }).map((workspacePath) => ({
      workspace_name: readPackageName(path.join(rootPath, workspacePath)),
      workspace_path: workspacePath,
    }));
  } catch {
    return [];
  }
};
