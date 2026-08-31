import type { ReactNode } from 'react';

export type AppDocumentProps = {
  readonly children: ReactNode;
  readonly rootData?: AppDocumentRootData;
  /** The app's own compiled StyleX stylesheet URL, a per-app build artifact. */
  readonly stylexCssHref: string;
};

export type AppDocumentRootData = {
  readonly cspNonce?: string;
};
