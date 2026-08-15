import { createReactRouterPluginsConfig } from '@lcabrera/vite-config/plugins';

export const pluginsConfig = createReactRouterPluginsConfig({
  appRootUrl: import.meta.url,
  // The StyleX alias for @lcabrera/ui's source. It is a path into this repo's
  // layout, so the config package takes it as an option and defaults to none
  // (ADR-069) — resolved against `appRootUrl`, which sits at <workspace>/config/.
  stylexAliases: { '@lcabrera/ui/*': '../../../packages/ui/src/*' },
});
