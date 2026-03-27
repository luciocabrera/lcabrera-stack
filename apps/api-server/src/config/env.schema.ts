import { z } from "zod";

export const envSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(3001),
  DB_HOST: z.string().default("localhost"),
  DB_NAME: z.string().default("car_sales_db"),
  DB_PASSWORD: z.string().default("root"),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USER: z.string().default("root"),
  DISTINCT_VALUES_DELAY_MS: z.coerce.number().int().nonnegative().default(10_000),
  ENTERPRISE_ORDERS_DELAY_MS: z.coerce.number().int().nonnegative().default(3000),
});

export type EnvConfig = z.infer<typeof envSchema>;
