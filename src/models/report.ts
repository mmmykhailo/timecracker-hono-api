import { z } from "@hono/zod-openapi";
import { ObjectId } from "mongodb";
import { formatDateString } from "../lib/date-utils";
import { startOfDay } from "../lib/date-utils";
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
	.openapi("ReportEntry");

export const reportSchema = z
	.object({
		_id: z.instanceof(ObjectId).openapi({ type: "string" }),
		ownerId: z.instanceof(ObjectId).openapi({ type: "string" }),
		date: z.string().transform((str) => new Date(str)),
		duration: z.number().int().min(0),
		entries: z.array(reportEntrySchema),
	})
	.openapi("Report");

export const reportDataSchema = reportSchema
	.omit({
		_id: true,
		duration: true,
	})
	.extend({
		entries: z.array(reportEntrySchema.omit({ duration: true })),
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

	const newReport = refineReportDuration(reportData);

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
				...refineReportDuration(reportData),
			},
		},
		{ returnDocument: "after" },
	);

	return result;
}

export async function upsertReportByDateAndOwnerId({
	date,
	ownerId,
	reportData,
}: {
	date: Date;
	ownerId: string | ObjectId;
	reportData: Omit<UnownedReportData, "date">;
}) {
	const reports = getCollection<Report>("reports");

	const result = await reports.findOneAndUpdate(
		{ date: startOfDay(date), ownerId: new ObjectId(ownerId) },
		{
			$set: {
				...refineReportDuration(reportData),
				date: startOfDay(date),
			},
		},
		{ returnDocument: "after", upsert: true },
	);

	return result;
}

export async function findReportsByOwner({
	ownerId,
}: { ownerId: ObjectId }): Promise<Array<Report>> {
	const reports = getCollection<Report>("reports");
	return await reports.find({ ownerId }).toArray();
}

export async function findReportsByDateAndOwnerId({
	date,
	ownerId,
}: { date: Date; ownerId: ObjectId }): Promise<Report | null> {
	const reports = getCollection<Report>("reports");
	return await reports.findOne({
		date: startOfDay(date),
		ownerId: ownerId,
	});
}

function refineReportDuration<
	T extends ReportData | UnownedReportData | Omit<UnownedReportData, "date">,
>(reportData: T) {
	let reportDuration = 0;
	const entries = reportData.entries.map((entry) => {
		const entryDuration =
			parseTimeIntoMinutes(entry.time.end) -
			parseTimeIntoMinutes(entry.time.start);

		reportDuration += entryDuration;

		return {
			...entry,
			duration: entryDuration,
		};
	});

	return {
		...reportData,
		duration: reportDuration,
		entries: entries,
	};
}

export async function findDailyDurationsByOwner({
	ownerId,
	from,
	to,
}: { ownerId: ObjectId; from: Date; to: Date }) {
	const users = getCollection<Report>("reports");
	const durationsArray = await users
		.find({
			ownerId,
			date: {
				$gte: from,
				$lte: to,
			},
		})
		.project<Pick<Report, "date" | "duration">>({
			_id: 0,
			date: 1,
			duration: 1,
		})
		.toArray();

	const dailyDurations: Record<string, number> = {};

	for (const item of durationsArray) {
		dailyDurations[formatDateString(item.date)] = item.duration;
	}

	return dailyDurations;
}
