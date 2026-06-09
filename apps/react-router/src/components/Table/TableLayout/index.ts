// Keep this barrel static-only. Do not re-export createLazyTableLayout here,
// otherwise TableLayout.component is both statically and dynamically imported.
export { TableLayout } from './TableLayout.component';
export type { TableLayoutProps } from './TableLayout.types';
