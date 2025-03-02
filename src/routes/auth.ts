import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
	register,
	login,
	githubAuth,
	githubCallback,
	logout,
} from "../controllers/auth";

const loginSchema = z.object({
	username: z.string().min(3),
	password: z.string().min(6),
});

const registerSchema = z.object({
	username: z.string().min(3),
	password: z.string().min(6),
	email: z.string().email(),
});

const tokenResponseSchema = z.object({
	token: z.string(),
	user: z.object({
		username: z.string(),
		email: z.string().email(),
	}),
});

const app = new OpenAPIHono();

app.openapi(
	createRoute({
		tags: ["Auth"],
		method: "post",
		path: "/register",
		request: {
			body: {
				content: {
					"application/json": {
						schema: registerSchema,
					},
				},
			},
		},
		responses: {
			201: {
				description: "User registered successfully",
				content: {
					"application/json": {
						schema: tokenResponseSchema,
					},
				},
			},
			400: {
				description: "Invalid input or username already exists",
			},
		},
	}),
	register,
);

app.openapi(
	createRoute({
		tags: ["Auth"],
		method: "post",
		path: "/login",
		request: {
			body: {
				content: {
					"application/json": {
						schema: loginSchema,
					},
				},
			},
		},
		responses: {
			200: {
				description: "User logged in successfully",
				content: {
					"application/json": {
						schema: tokenResponseSchema,
					},
				},
			},
			401: {
				description: "Invalid credentials",
			},
		},
	}),
	login,
);

app.openapi(
	createRoute({
		tags: ["Auth"],
		method: "get",
		path: "/github",
		responses: {
			302: {
				description: "Redirect to GitHub",
			},
		},
	}),
	githubAuth,
);

app.openapi(
	createRoute({
		tags: ["Auth"],
		method: "get",
		path: "/github/callback",
		request: {
			query: z.object({
				code: z.string(),
				state: z.string(),
			}),
		},
		responses: {
			200: {
				description: "GitHub OAuth callback successful",
				content: {
					"application/json": {
						schema: tokenResponseSchema,
					},
				},
			},
			400: {
				description: "Invalid state or code",
			},
		},
	}),
	githubCallback,
);

app.openapi(
	createRoute({
		tags: ["Auth"],
		method: "post",
		path: "/logout",
		responses: {
			200: {
				description: "Logout successful",
				content: {
					"application/json": {
						schema: z.object({
							message: z.string(),
						}),
					},
				},
			},
		},
	}),
	logout,
);

export default app;
