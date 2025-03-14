import { z } from "@hono/zod-openapi";
import { ObjectId } from "mongodb";
import { getCollection } from "../lib/db";
import { parseTimeIntoMinutes } from "../lib/time-strings";

export const reportEntrySchema = z
	.object({
		time: z.object({
			start: z
				.string()
				.regex(/^\d{2}:\d{2}$/, "Invalid time format. Expected hh:mm"),
			end: z
				.string()
				.regex(/^\d{2}:\d{2}$/, "Invalid time format. Expected hh:mm"),
		}),
		duration: z.number().int().min(0),
		project: z.string(),
		activity: z.string().nullable(),
		description: z.string(),
	})
	.refine(
		(report) =>
			report.duration ===
			parseTimeIntoMinutes(report.time.end) -
				parseTimeIntoMinutes(report.time.start),
		"Incorrect duration",
	)
	.openapi("ReportEntry");

export const reportSchema = z
	.object({
		_id: z.instanceof(ObjectId).openapi({ type: "string" }),
		ownerId: z.instanceof(ObjectId).openapi({ type: "string" }),
		date: z.string().regex(/^\d{8}$/, "Invalid date format. Expected yyyyMMdd"),
		entries: z.array(reportEntrySchema),
	})
	.openapi("Report");

export const reportDataSchema = reportSchema.omit({
	_id: true,
});
export const unownedReportDataSchema = reportDataSchema
	.omit({
		ownerId: true,
	})
	.openapi("UnownedReportData");

export type Report = z.infer<typeof reportSchema>;
export type ReportData = z.infer<typeof reportDataSchema>;
export type UnownedReportData = z.infer<typeof unownedReportDataSchema>;

export async function insertReport({
	reportData,
}: { reportData: ReportData }): Promise<Report> {
	const reports = getCollection("reports");

	const newReport: ReportData = {
		ownerId: reportData.ownerId,
		date: reportData.date,
		entries: reportData.entries,
	};

	const result = await reports.insertOne(newReport);
	const report: Report = {
		...newReport,
		_id: result.insertedId,
	};
	return report;
}

export async function updateReportByIdAndOwnerId({
	id,
	ownerId,
	reportData,
}: {
	id: string | ObjectId;
	ownerId: string | ObjectId;
	reportData: UnownedReportData;
}) {
	const reports = getCollection<Report>("reports");

	const result = await reports.findOneAndUpdate(
		{ _id: new ObjectId(id), ownerId: new ObjectId(ownerId) },
		{
			$set: {
				entries: reportData.entries,
				date: reportData.date,
			},
		},
		{ returnDocument: "after" },
	);

	return result;
}

export async function upsertReportByDateAndOwnerId({
	dateStr,
	ownerId,
	reportData,
}: {
	dateStr: string;
	ownerId: string | ObjectId;
	reportData: Omit<UnownedReportData, "date">;
}) {
	const reports = getCollection<Report>("reports");

	const result = await reports.findOneAndUpdate(
		{ date: dateStr, ownerId: new ObjectId(ownerId) },
		{
			$set: {
				entries: reportData.entries,
			},
		},
		{ returnDocument: "after", upsert: true },
	);

	return result;
}

export async function findReportsByOwner({
	ownerId,
}: { ownerId: ObjectId }): Promise<Array<Report>> {
	const users = getCollection<Report>("reports");
	return await users.find({ ownerId }).toArray();
}

export async function findReportsByDateAndOwnerId({
	date,
	ownerId,
}: { date: string; ownerId: ObjectId }): Promise<Report | null> {
	const users = getCollection<Report>("reports");
	return await users.findOne({ date, ownerId });
}
