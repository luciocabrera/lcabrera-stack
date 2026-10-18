type RouteLoaderArgsArgs = {
  readonly params: Readonly<Record<string, string>>;
  readonly path: string;
  readonly search?: string;
};

const DYNAMIC_SEGMENT = /^:[\w-]+/u;

export const routeLoaderArgs = ({
  params,
  path,
  search = '',
}: RouteLoaderArgsArgs) => {
  const segments = path.split('/').map((segment) => {
    const [dynamic] = DYNAMIC_SEGMENT.exec(segment) ?? [];

    return dynamic === undefined
      ? { segment }
      : {
          name: dynamic.slice(1),
          segment,
          suffix: segment.slice(dynamic.length),
        };
  });
  const missing = segments
    .filter(({ name }) => name !== undefined && !Object.hasOwn(params, name))
    .map(({ name }) => name);

  if (missing.length > 0) {
    throw new Error(`no value for :${missing.join(', :')} in ${path}`);
  }

  const pathname = segments
    .map(({ name, segment, suffix = '' }) =>
      name === undefined
        ? segment
        : `${encodeURIComponent(params[name] ?? '')}${suffix}`,
    )
    .join('/');

  return {
    context: {},
    params: { ...params },
    request: new Request(`http://localhost/${pathname}${search}`),
  };
};
