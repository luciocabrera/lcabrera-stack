import type { ReactNode } from 'react';

export type SafeResult<TResponse> =
  | { readonly ok: true; readonly data: TResponse }
  | { readonly ok: false; readonly error: unknown };

export type TableDataResolverProps<TResponse> = {
  readonly children: (response: TResponse) => ReactNode;
  readonly onRetry: () => void;
  readonly safeDataPromise: Promise<SafeResult<TResponse>>;
};
