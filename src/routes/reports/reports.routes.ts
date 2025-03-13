import { createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "../../middleware/auth";
import { reportSchema, unownedReportDataSchema } from "../../models/report";

export const getReportsRoute = createRoute({
	tags: ["Reports"],
	summary: "All user reports",
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
	summary: "Report by date",
	method: "get",
	operationId: "getReportByDate",
	path: "/date/{date}",
	security: [{ Bearer: [] }],
	request: {
		params: z.object({
			date: z.string(),
		}),
	},
	responses: {
		200: {
			description: "Get report by date",
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

export const putReportByDateRoute = createRoute({
	tags: ["Reports"],
	summary: "Put report by date",
	method: "put",
	operationId: "getReportByDate",
	path: "/date/{date}",
	security: [{ Bearer: [] }],
	request: {
		params: z.object({
			date: z.string(),
		}),
		body: {
			content: {
				"application/json": {
					schema: unownedReportDataSchema.omit({ date: true }),
				},
			},
			required: true,
		},
	},
	responses: {
		200: {
			description: "Put report by date",
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

export const putReportRoute = createRoute({
	tags: ["Reports"],
	summary: "Put report",
	method: "put",
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
			description: "Put report",
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
