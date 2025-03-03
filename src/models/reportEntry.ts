import { z } from "@hono/zod-openapi";
import { ObjectId } from "mongodb";
import { getCollection } from "../lib/db";

export const reportEntrySchema = z.object({
	_id: z.instanceof(ObjectId),
	ownerId: z.instanceof(ObjectId),
	date: z.string().regex(/^\d{8}$/, "Invalid date format. Expected yyyyMMdd"),
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
	createdAt: z.date(),
	updatedAt: z.date(),
});
export const reportEntryDataSchema = reportEntrySchema.omit({
	_id: true,
	createdAt: true,
	updatedAt: true,
});
export const unownedReportEntryDataSchema = reportEntryDataSchema.omit({
	ownerId: true,
});

export type ReportEntry = z.infer<typeof reportEntrySchema>;
export type ReportEntryData = z.infer<typeof reportEntryDataSchema>;
export type UnownedReportEntryData = z.infer<
	typeof unownedReportEntryDataSchema
>;

export type NewReportEntry = ReportEntryData &
	Pick<ReportEntry, "createdAt" | "updatedAt">;

export async function insertReportEntry(
	reportEntryData: ReportEntryData,
): Promise<ReportEntry> {
	const reportEntries = getCollection("reportEntries");

	const now = new Date();

	const newReportEntry: NewReportEntry = {
		ownerId: reportEntryData.ownerId,
		date: reportEntryData.date,
		time: reportEntryData.time,
		duration: reportEntryData.duration,
		project: reportEntryData.project,
		activity: reportEntryData.activity,
		description: reportEntryData.description,
		createdAt: now,
		updatedAt: now,
	};

	const result = await reportEntries.insertOne(newReportEntry);
	const reportEntry: ReportEntry = {
		...newReportEntry,
		_id: result.insertedId,
	};
	return reportEntry;
}

export async function findReportEntriesByOwner(
	ownerId: ObjectId,
): Promise<Array<ReportEntry>> {
	const users = getCollection<ReportEntry>("reportEntries");
	return await users.find({ ownerId }).toArray();
}

export async function findReportEntriesByOwnerAndDate(
	ownerId: ObjectId,
	date: string,
): Promise<Array<ReportEntry>> {
	const users = getCollection<ReportEntry>("reportEntries");
	return await users.find({ date, ownerId }).toArray();
}
