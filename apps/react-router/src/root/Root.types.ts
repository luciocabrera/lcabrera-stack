export type DbSanityPayload = {
  readonly isHealthy: boolean;
  readonly issues?: readonly string[];
};
