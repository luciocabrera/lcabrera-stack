import type { ReactNode } from 'react';

/**
 * The subset of the app's root-route loader data this component actually
 * reads — kept minimal and local rather than importing the app's own loader
 * type, since that type is app-specific and this component isn't.
 */
export type AppDocumentRootData = {
  readonly cspNonce?: string;
};

export type AppDocumentProps = {
  readonly children: ReactNode;
  /** Root-route loader data, e.g. from useRouteLoaderData('root') — optional since it's undefined until the loader resolves. */
  readonly rootData?: AppDocumentRootData;
  /** The app's own compiled StyleX stylesheet URL (e.g. `import stylexCssHref from '../stylex.css?url'`) — a per-app build artifact, cannot be sourced from this package. */
  readonly stylexCssHref: string;
};
