import type { ProjectGrantRow } from '@repo/scan-ingestion/queries/getProjectGrants.util';
import type { UserListViewRow } from '@repo/scan-ingestion/queries/getUserListView.util';

export type ProjectGrantsPanelProps = {
  readonly grantsPromise: Promise<readonly ProjectGrantRow[]>;
  readonly usersPromise: Promise<readonly UserListViewRow[]>;
};
