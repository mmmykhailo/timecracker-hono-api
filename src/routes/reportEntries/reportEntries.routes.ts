import { createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "../../middleware/auth";
import {
	reportEntrySchema,
	unownedReportEntryDataSchema,
} from "../../models/reportEntry";

export const getReportEntriesRoute = createRoute({
	tags: ["Report entries"],
	method: "get",
	path: "/",
	security: [{ Bearer: [] }],
	responses: {
		200: {
			description: "Get all report entries of current user",
			content: {
				"application/json": {
					schema: z.object({
						reportEntries: z.array(reportEntrySchema),
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
});

export const createReportEntryRoute = createRoute({
	tags: ["Report entries"],
	method: "post",
	path: "/",
	security: [{ Bearer: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: unownedReportEntryDataSchema,
				},
			},
			required: true,
		},
	},
	responses: {
		201: {
			description: "Create report entry",
			content: {
				"application/json": {
					schema: z.object({
						reportEntry: reportEntrySchema,
					}),
				},
			},
		},
		401: {
			description: "Unauthorized",
		},
	},
	middleware: authMiddleware,
});
