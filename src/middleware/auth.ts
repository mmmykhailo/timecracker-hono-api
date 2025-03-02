import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { verify } from "hono/jwt";
import type { JWTPayload } from "hono/utils/jwt/types";
import { findUserByUsername } from "../models/user";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";

export const authMiddleware = createMiddleware(
	async (c: Context, next: Next) => {
		try {
			let token: string | undefined;

			const authHeader = c.req.header("Authorization");
			if (authHeader?.startsWith("Bearer ")) {
				token = authHeader.substring(7);
			}

			if (!token) {
				throw new HTTPException(401, { message: "Unauthorized" });
			}

			const payload: JWTPayload = await verify(token, JWT_SECRET);

			const user = await findUserByUsername(payload.username as string);

			if (!user) {
				throw new HTTPException(401, { message: "User not found" });
			}

			c.set("jwtPayload", payload);
			c.set("user", user);

			await next();
		} catch (error) {
			throw new HTTPException(401, { message: "Unauthorized" });
		}
	},
);
