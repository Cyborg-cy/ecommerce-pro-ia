import Fastify from "fastify";

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  // Ruta base de salud (para probar que el server está vivo)
  app.get("/health", async () => {
    return { ok: true };
  });

  return app;
}
