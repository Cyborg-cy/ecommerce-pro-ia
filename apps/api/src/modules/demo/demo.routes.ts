import type { FastifyPluginAsync } from "fastify";

const demoRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me", { preHandler: app.authenticate }, async (req: any) => {
    return { user: req.user };
  });

  app.get(
    "/admin/secret",
    { preHandler: [app.authenticate, app.requireRole("admin")] },
    async () => ({ secret: "solo admin" })
  );
};

export default demoRoutes;
