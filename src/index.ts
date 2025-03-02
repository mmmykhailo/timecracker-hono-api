import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { connectDB } from "./db/connection";
import authRoutes from "./routes/auth";
import protectedRoutes from "./routes/protected";
import { errorHandler } from "./middleware/errorHandler";

const app = new OpenAPIHono();

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
	type: "http",
	scheme: "bearer",
});

app.onError(errorHandler);

app.route("/auth", authRoutes);
app.route("/", protectedRoutes);

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
		title: "Timecracker API",
		version: "v1",
		description:
			"REST API with authentication via username/password and GitHub OAuth",
	},
	openapi: "3.0.0",
	// components: {
	// 	securitySchemes: {
	// 		Bearer: {
	// 			type: "http",
	// 			scheme: "bearer",
	// 			bearerFormat: "JWT",
	// 		},
	// 	},
	// },
});

connectDB()
	.then(() => console.log("Connected to MongoDB"))
	.catch((err) => console.error("MongoDB connection error:", err));

export default {
	port: 3000,
	fetch: app.fetch,
};
