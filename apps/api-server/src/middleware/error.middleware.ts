import type { ErrorRequestHandler } from "express";

import { HttpError } from "../errors/httpError";

// eslint-disable-next-line local-rules/destructuring-for-functions
export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error("❌ Unhandled API error:", error);
  response.status(500).json({ error: "Internal server error" });
};
