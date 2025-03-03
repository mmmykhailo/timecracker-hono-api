import { apiReference } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import createApp from "./lib/createApp";
import { connectDatabase } from "./lib/db";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth/auth.index";
import reportEntriesRoutes from "./routes/reportEntries/reportEntries.index";

const app = createApp();

app.use(cors());
app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
	type: "http",
	scheme: "bearer",
});

app.onError(errorHandler);

app.route("/auth", authRoutes);
app.route("/report-entries", reportEntriesRoutes);

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
});

connectDatabase()
	.then(() => console.log("Connected to MongoDB"))
	.catch((err) => console.error("MongoDB connection error:", err));

export default {
	port: 3000,
	fetch: app.fetch,
};
