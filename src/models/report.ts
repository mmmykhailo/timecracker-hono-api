import { z } from "@hono/zod-openapi";
import { ObjectId } from "mongodb";
import { getCollection } from "../lib/db";

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
	.openapi("ReportEntry");

export const reportSchema = z
	.object({
		_id: z.instanceof(ObjectId),
		ownerId: z.instanceof(ObjectId),
		date: z.string().regex(/^\d{8}$/, "Invalid date format. Expected yyyyMMdd"),
		entries: z.array(reportEntrySchema),
		createdAt: z.date(),
		updatedAt: z.date(),
	})
	.openapi("Report");

export const reportEntryDataSchema = reportSchema.omit({
	_id: true,
	createdAt: true,
	updatedAt: true,
});
export const unownedReportDataSchema = reportEntryDataSchema
	.omit({
		ownerId: true,
	})
	.openapi("UnownedReportData");

export type Report = z.infer<typeof reportSchema>;
export type ReportData = z.infer<typeof reportEntryDataSchema>;
export type UnownedReportData = z.infer<typeof unownedReportDataSchema>;

export type NewReport = ReportData & Pick<Report, "createdAt" | "updatedAt">;

export async function insertReport(reportData: ReportData): Promise<Report> {
	const reports = getCollection("reports");

	const now = new Date();

	const newReport: NewReport = {
		ownerId: reportData.ownerId,
		date: reportData.date,
		entries: reportData.entries,
		createdAt: now,
		updatedAt: now,
	};

	const result = await reports.insertOne(newReport);
	const report: Report = {
		...newReport,
		_id: result.insertedId,
	};
	return report;
}

export async function updateReportByIdAndOwnerId(
	id: string | ObjectId,
	ownerId: string | ObjectId,
	reportData: UnownedReportData,
) {
	const reports = getCollection<Report>("reports");

	const now = new Date();

	const result = await reports.findOneAndUpdate(
		{ _id: new ObjectId(id), ownerId: new ObjectId(ownerId) },
		{
			$set: {
				...reportData,
				updatedAt: now,
			},
		},
		{ returnDocument: "after" },
	);

	return result;
}

export async function findReportsByOwner(
	ownerId: ObjectId,
): Promise<Array<Report>> {
	const users = getCollection<Report>("reports");
	return await users.find({ ownerId }).toArray();
}

export async function findReportsByOwnerAndDate(
	ownerId: ObjectId,
	date: string,
): Promise<Array<Report>> {
	const users = getCollection<Report>("reports");
	return await users.find({ date, ownerId }).toArray();
}
