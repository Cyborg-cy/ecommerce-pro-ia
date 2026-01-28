import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import "dotenv/config";

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? "0.0.0.0";

const app = buildApp();
const env = loadEnv();

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
