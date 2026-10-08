type RouteLoaderArgsArgs = {
  readonly params: Readonly<Record<string, string>>;
  readonly path: string;
  readonly search?: string;
};

export const routeLoaderArgs = ({
  params,
  path,
  search = '',
}: RouteLoaderArgsArgs) => {
  const segments = path.split('/');
  const missing = segments
    .filter((segment) => segment.startsWith(':'))
    .map((segment) => segment.slice(1))
    .filter((name) => !Object.hasOwn(params, name));

  if (missing.length > 0) {
    throw new Error(`no value for :${missing.join(', :')} in ${path}`);
  }

  const pathname = segments
    .map((segment) =>
      segment.startsWith(':')
        ? encodeURIComponent(params[segment.slice(1)] ?? '')
        : segment,
    )
    .join('/');

  return {
    context: {},
    params: { ...params },
    request: new Request(`http://localhost/${pathname}${search}`),
  };
};
