import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import type { FastifyPluginAsync } from "fastify";
import { loadEnv } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: any;
    requireRole: (role: "admin" | "user") => any;

    // helpers para firmar/verificar tokens
    signAccess: (payload: { sub: string; role: "admin" | "user" }) => string;
    signRefresh: (payload: { sub: string; role: "admin" | "user" }) => string;
    verifyRefresh: (token: string) => { sub: string; role: "admin" | "user" };
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string; role: "admin" | "user" };
    user: { sub: string; role: "admin" | "user" };
  }
}

const authPlugin: FastifyPluginAsync = async (app) => {
  const env = loadEnv();

  // Cookies para refresh (httpOnly)
  await app.register(cookie);

  // JWT para ACCESS (default namespace => app.jwt)
  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET
  });

  // JWT para REFRESH (namespace => app.refreshJwt)
  await app.register(jwt, {
    secret: env.JWT_REFRESH_SECRET,
    namespace: "refreshJwt"
  });

  // Helpers: firmar access/refresh
  app.decorate("signAccess", (payload: { sub: string; role: "admin" | "user" }) => {
    return app.jwt.sign(payload, {
      expiresIn: `${env.ACCESS_TTL_MIN}m`
      // issuer lo metemos en payload si lo quieres fijo, o lo validamos luego.
    });
  });

  app.decorate("signRefresh", (payload: { sub: string; role: "admin" | "user" }) => {
    // @ts-expect-error namespace injected by fastify-jwt
    return app.refreshJwt.sign(payload, { expiresIn: `${env.REFRESH_TTL_DAYS}d` });
  });

  app.decorate("verifyRefresh", (token: string) => {
    // @ts-expect-error namespace injected by fastify-jwt
    return app.refreshJwt.verify(token) as { sub: string; role: "admin" | "user" };
  });

  // Middleware: valida ACCESS token en Authorization Bearer
  app.decorate("authenticate", async (req: any, reply: any) => {
    try {
      await req.jwtVerify(); // usa app.jwt (access)
    } catch {
      return reply.code(401).send({ code: "UNAUTHORIZED", message: "Access token inválido o faltante" });
    }
  });

  // Middleware: roles
  app.decorate("requireRole", (role: "admin" | "user") => {
    return async (req: any, reply: any) => {
      if (!req.user) return reply.code(401).send({ code: "UNAUTHORIZED", message: "No autenticado" });
      if (req.user.role !== role) {
        return reply.code(403).send({ code: "FORBIDDEN", message: `Requiere rol ${role}` });
      }
    };
  });
};

export default fp(authPlugin);
