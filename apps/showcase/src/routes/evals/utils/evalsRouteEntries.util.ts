type EvalsRouteEntriesArgs = {
  readonly parentPath?: string;
  readonly routes: readonly RouteEntry[];
};

type RouteEntry = {
  readonly children?: readonly RouteEntry[];
  readonly file: string;
  readonly index?: boolean;
  readonly path?: string;
};

const EVALS_PREFIX = 'evals';

export const evalsRouteEntries = ({
  parentPath = '',
  routes,
}: EvalsRouteEntriesArgs): readonly {
  readonly file: string;
  readonly path: string;
}[] =>
  routes.flatMap((route) => {
    const path = [parentPath, route.path ?? '']
      .filter((segment) => segment !== '')
      .join('/');
    const own =
      path === EVALS_PREFIX || path.startsWith(`${EVALS_PREFIX}/`)
        ? [{ file: route.file, path }]
        : [];

    return [
      ...own,
      ...evalsRouteEntries({ parentPath: path, routes: route.children ?? [] }),
    ];
  });
