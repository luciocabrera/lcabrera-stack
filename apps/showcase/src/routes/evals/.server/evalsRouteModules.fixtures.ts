import type { LoaderFunctionArgs } from 'react-router';

import routes from '@/routes';

import { evalsRouteEntries } from '../utils/evalsRouteEntries.util';

type RouteModule = {
  readonly loader: (args: LoaderFunctionArgs) => Promise<unknown>;
};

type RouteModuleForArgs = {
  readonly loaded: ReadonlyMap<string, RouteModule>;
  readonly path: string;
};

const MODULES = import.meta.glob<RouteModule>('../**/{root,layout}.ts');

export const EVALS_ROUTE_ENTRIES = evalsRouteEntries({ routes });

export const loadEvalsRouteModules = async () => {
  const loaded = new Map<string, RouteModule>();

  for (const { file } of EVALS_ROUTE_ENTRIES) {
    const load = MODULES[file.replace(/^routes\/evals\//u, '../')];

    if (load) {
      loaded.set(file, await load());
    }
  }

  return loaded;
};

export const routeModuleFor = ({ loaded, path }: RouteModuleForArgs) => {
  const routeModule = loaded.get(
    EVALS_ROUTE_ENTRIES.find((entry) => entry.path === path)?.file ?? '',
  );

  if (routeModule === undefined) {
    throw new Error(`no route module was loaded for ${path}`);
  }

  return routeModule;
};
