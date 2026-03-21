export type ApiConfig = {
  readonly dev: { readonly apiHost: string };
  readonly localhost: { readonly apiHost: string };
  readonly prod: { readonly apiHost: string };
};
