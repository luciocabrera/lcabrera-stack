import type { ReactNode } from 'react';

export type AppDocumentProps = {
  readonly children: ReactNode;
  readonly rootData?: AppDocumentRootData;
  readonly stylexCssHref: string;
};

export type AppDocumentRootData = {
  readonly cspNonce?: string;
};
