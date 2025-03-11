import { createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "../../middleware/auth";
import { reportSchema, unownedReportDataSchema } from "../../models/report";

export const getReportsRoute = createRoute({
	tags: ["Reports"],
	summary: "Current user reports",
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

export const getReportByDateRoute = createRoute({
	tags: ["Reports"],
	summary: "Current user report by date",
	method: "get",
	path: "/date/:date",
	security: [{ Bearer: [] }],
	responses: {
		200: {
			description: "Get report for current user by date",
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

export const postReportRoute = createRoute({
	tags: ["Reports"],
	summary: "Create report",
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
	summary: "Patch report",
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
			description: "Patch report",
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
