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
			date: z.string().openapi({ example: "20250321" }),
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
	operationId: "putReportByDate",
	path: "/date/{date}",
	security: [{ Bearer: [] }],
	request: {
		params: z.object({
			date: z.string().openapi({ example: "20250321" }),
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
	operationId: "putReportById",
	security: [{ Bearer: [] }],
	request: {
		params: z.object({
			id: z.string(),
		}),
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

export const getDailyDurationsRoute = createRoute({
	tags: ["Reports"],
	summary: "Daily durations",
	method: "get",
	path: "/daily-durations",
	security: [{ Bearer: [] }],
	request: {
		query: z.object({
			from: z.string().openapi({ example: "20250321" }),
			to: z.string().openapi({ example: "20250321" }),
		}),
	},
	responses: {
		200: {
			description: "Get daily durations",
			content: {
				"application/json": {
					schema: z.object({
						dailyDurations: z
							.record(
								z.string(),
								z.object({
									totalDuration: z.number().int().min(0),
								}),
							)
							.openapi({
								example: {
									"20250319": { totalDuration: 360 },
									"20250320": { totalDuration: 30 },
								},
							}),
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
