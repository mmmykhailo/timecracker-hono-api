import { createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "../../middleware/auth";
import { reportSchema, unownedReportDataSchema } from "../../models/report";

export const getReportsRoute = createRoute({
	tags: ["Reports"],
	method: "get",
	path: "/",
	security: [{ Bearer: [] }],
	responses: {
		200: {
			description: "Get all reports of current user",
			content: {
				"application/json": {
					schema: z.object({
						reports: z.array(reportSchema),
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

export const postReportRoute = createRoute({
	tags: ["Reports"],
	method: "post",
	path: "/",
	security: [{ Bearer: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: unownedReportDataSchema,
				},
			},
			required: true,
		},
	},
	responses: {
		201: {
			description: "Create report",
			content: {
				"application/json": {
					schema: z.object({
						report: reportSchema,
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

export const patchReportRoute = createRoute({
	tags: ["Reports"],
	method: "patch",
	path: "/{id}",
	security: [{ Bearer: [] }],
	request: {
		params: z.object({
			id: z.string(),
		}),
		body: {
			content: {
				"application/json": {
					schema: unownedReportDataSchema.partial(),
				},
			},
			required: true,
		},
	},
	responses: {
		201: {
			description: "Create report",
			content: {
				"application/json": {
					schema: z.object({
						report: reportSchema,
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
