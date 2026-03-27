export type EnvConfig = {
  readonly API_PORT: number;
  readonly DB_HOST: string;
  readonly DB_NAME: string;
  readonly DB_PASSWORD: string;
  readonly DB_PORT: number;
  readonly DB_USER: string;
  readonly DISTINCT_VALUES_DELAY_MS: number;
  readonly ENTERPRISE_ORDERS_DELAY_MS: number;
};
