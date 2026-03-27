import type { FastifyRequest } from "fastify";

/**
 * Create a preValidation hook that JSON-parses specified querystring fields.
 *
 * This allows Fastify's schema validation to validate the parsed objects
 * (e.g. sort arrays, filter maps) rather than raw JSON strings.
 */
export const createJsonFieldsParser =
  (fields: readonly string[]) =>
  async (request: FastifyRequest): Promise<void> => {
    const query = request.query as Record<string, unknown>;

    for (const field of fields) {
      const value = query[field];

      if (typeof value === "string") {
        try {
          query[field] = JSON.parse(value);
        } catch {
          // Leave as string; schema validation will reject it
        }
      }
    }
  };
