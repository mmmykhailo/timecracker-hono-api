import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { getProfile } from "../controllers/auth";
import { authMiddleware } from "../middleware/auth";

const app = new OpenAPIHono();

app.openapi(
	createRoute({
		tags: ["Index"],
		method: "get",
		path: "/",
		responses: {
			200: {
				description: "Respond a message",
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
	(c) => {
		return c.json({
			message: "hello",
		});
	},
);

app.openapi(
	createRoute({
		tags: ["Protected"],
		method: "get",
		path: "/me",
		security: [{ Bearer: [] }],
		responses: {
			200: {
				description: "Get user profile",
				content: {
					"application/json": {
						schema: z.object({
							username: z.string(),
							email: z.string(),
						}),
					},
				},
			},
			401: {
				description: "Unauthorized",
			},
		},
		middleware: authMiddleware,
	}),
	getProfile,
);

export default app;
