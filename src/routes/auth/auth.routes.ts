import { createRoute, z } from "@hono/zod-openapi";

const registerSchema = z.object({
	username: z.string().min(3),
	password: z.string().min(6),
	email: z.string().email(),
});

const loginSchema = z.object({
	username: z.string().min(3),
	password: z.string().min(6),
});

const githubAuthorizeUrlSchema = z.object({
	url: z.string(),
});

const tokenResponseSchema = z.object({
	accessToken: z.string(),
	refreshToken: z.string(),
	user: z.object({
		username: z.string(),
		email: z.string().email(),
	}),
});

const refreshTokenSchema = z.object({
	refreshToken: z.string(),
});

const errorResponseSchema = z.object({
	error: z.string().optional(),
});

export const registerRoute = createRoute({
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
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
	},
});

export const loginRoute = createRoute({
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
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
	},
});

export const githubAuthRoute = createRoute({
	tags: ["Auth"],
	method: "get",
	path: "/github",
	request: {
		query: z.object({
			redirect_uri: z.string(),
		}),
	},
	responses: {
		200: {
			description: "GitHub authorize URL",
			content: {
				"application/json": {
					schema: githubAuthorizeUrlSchema,
				},
			},
		},
	},
});

export const githubAuthCallbackRoute = createRoute({
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
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
	},
});

export const refreshTokenRoute = createRoute({
	tags: ["Auth"],
	method: "post",
	path: "/refresh",
	request: {
		body: {
			content: {
				"application/json": {
					schema: refreshTokenSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "New access token generated",
			content: {
				"application/json": {
					schema: tokenResponseSchema,
				},
			},
		},
		401: {
			description: "Invalid refresh token",
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
		},
	},
});

export const logoutRoute = createRoute({
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
});
