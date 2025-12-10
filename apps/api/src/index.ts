import { Hono } from "hono";
import { logger } from "hono/logger";
import { internalRouter } from "@/routes/internal";

const app = new Hono();

// Middleware
app.use("*", logger());

// Mount routes
// This variable 'routes' holds the type definition for the entire API surface
const routes = app.route("/internal", internalRouter);

// Standard Bun Server Export
export default {
  port: 3000,
  fetch: app.fetch,
};

export { routes };
