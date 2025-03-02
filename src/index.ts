import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";

const app = new OpenAPIHono();

app.openapi(
	createRoute({
		tags: ["Index", "not index"],
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

app.get(
	"/ref",
	apiReference({
		layout: "classic",
		pageTitle: "Timecracker API Reference",
		spec: { url: "/doc" },
	}),
);

app.doc("/doc", {
	info: {
		title: "An API",
		version: "v1",
	},
	openapi: "3.1.0",
});

export default {
	port: 3000,
	fetch: app.fetch,
};
