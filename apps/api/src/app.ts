import Fastify from "fastify";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./modules/auth/auth.routes.js";
import demoRoutes from "./modules/demo/demo.routes.js";
export function buildApp() {
  const app = Fastify({logger: true,});

  // Ruta base de salud (para probar que el server está vivo)
  app.get("/health", async () => { return { ok: true };});

 // 1) Primero el plugin que DECORA la instancia
  app.register(authPlugin);

  // 2) Luego las rutas que dependen de esos decoradores
  app.register(authRoutes, { prefix: "/auth" });
  app.register(demoRoutes);

  return app;
}