import { z } from "zod";
import type { FastifyPluginAsync } from "fastify";
import { loadEnv } from "../../config/env.js";
import { ResolveFastifyReplyReturnType } from "fastify/types/type-provider.js";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

const authRoutes: FastifyPluginAsync = async (app) => {
    const env = loadEnv();

    //demo : usuario de prueba (sin base de datos)
    
    function mockValidateUser(email: string, password: string) {
        if ( email === "admin@demo.com" && password === "admin")
            return { id: "1", role: "admin" as const };
        if ( email === "user@demo.com" && password === "user" ) {
            return { id: "2", role: "user" as const };
        }
        return null;
    }

    app.post("/login", async (require, reply) => {
        const body = loginSchema.parse(require.body);
        const user = mockValidateUser(body.email, body.password);

        if(!user) {
            return reply.status(401).send({ code : "INVALID_CREDENTIALS", message: "credenciales invalidas" });

        }
        const accessToken = app.signAccess({ sub: user.id, role: user.role });
        const refreshToken = app.signRefresh({ sub: user.id, role: user.role });

        reply.setCookie(env.REFRESH_COOKIE_NAME, refreshToken, {
            httpOnly: true,
            secure: env.COOKIE_SECURE,
            sameSite: env.COOKIE_SAMESITE,
            maxAge: env.REFRESH_TTL_DAYS * 24 * 60 * 60
        });
        return reply.send ({ accessToken});
    });

        app.post("/refresh", async (req, reply)=> {
            const token = (req.cookies as any )?.[env.REFRESH_COOKIE_NAME];
            if(!token) {
                return reply.code(401).send({ code: "no_refresh_token", message: "no refresh token provided"});
            }
            let payload: { sub: string; role: "admin" | "user"};
            try {
                payload = (app as any).authTokens.verifyRefresh (token);
            } catch {
                return reply.code (401).send({ code: "bad_refresh_token", message: "refresh token invalid"});

            }
            const accessToken = app.signAccess ({ sub: payload.sub, role: payload.role });
            return reply.send({ accessToken});

        });
        app.post("/logout", async (_req, reply)=> {
            reply.clearCookie(env.REFRESH_COOKIE_NAME, { path:"/auth"});
            return reply.send({ ok:true });
        });
};
    export default authRoutes;