import { useSyncExternalStore } from 'react';

import { matchesCssColorSyntax } from '#ui/components/Table/cellRenderers/matchesCssColorSyntax.util';

const unsubscribe = () => undefined;

const subscribe = () => unsubscribe;

const isBrowserColor = (value: string) =>
  typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
    ? CSS.supports('color', value)
    : matchesCssColorSyntax(value);

const getSnapshot = () => isBrowserColor;

const getServerSnapshot = () => matchesCssColorSyntax;

export const useTableCellColorCheck = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
