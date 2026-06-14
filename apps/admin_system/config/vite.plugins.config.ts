import { createReactRouterPluginsConfig } from '@repo/vite-configs/plugins';

export const pluginsConfig = createReactRouterPluginsConfig({
  appRootUrl: import.meta.url,
});
