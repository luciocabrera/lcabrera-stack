import type { ReactNode } from 'react';

export type AppDocumentProps = {
  readonly children: ReactNode;
  readonly rootData?: AppDocumentRootData;
  /** The app's own compiled StyleX stylesheet URL (e.g. `import stylexCssHref from '../stylex.css?url'`) — a per-app build artifact, cannot be sourced from this package. */
  readonly stylexCssHref: string;
};

export type AppDocumentRootData = {
  readonly cspNonce?: string;
};
