import { startOfDay } from "date-fns";
import createApp from "../../lib/createApp";
import { parseDateString } from "../../lib/date-strings";
import {
	type UnownedReportData,
	findReportsByDateAndOwnerId,
	findReportsByOwner,
	insertReport,
	updateReportByIdAndOwnerId,
	upsertReportByDateAndOwnerId,
} from "../../models/report";
import type { User } from "../../models/user";
import {
	getReportByDateRoute,
	getReportsRoute,
	postReportRoute,
	putReportByDateRoute,
	putReportRoute,
} from "./reports.routes";

const app = createApp();

app.openapi(getReportsRoute, async (c) => {
	const user = c.get("user") as User;

	const reports = await findReportsByOwner({ ownerId: user._id });

	return c.json({
		reports,
	});
});

app.openapi(getReportByDateRoute, async (c) => {
	const user = c.get("user") as User;
	const dateStr = c.req.param("date");

	const report = await findReportsByDateAndOwnerId({
		date: startOfDay(parseDateString(dateStr)),
		ownerId: user._id,
	});

	return c.json({
		report,
	});
});

app.openapi(putReportByDateRoute, async (c) => {
	const user = c.get("user") as User;
	const dateStr = c.req.param("date");

	const unownedReportData = await c.req.json<UnownedReportData>();

	const report = await upsertReportByDateAndOwnerId({
		date: startOfDay(parseDateString(dateStr)),
		ownerId: user._id,
		reportData: unownedReportData,
	});

	return c.json({
		report,
	});
});

app.openapi(postReportRoute, async (c) => {
	const user = c.get("user") as User;

	const unowwnedReportData = await c.req.json<UnownedReportData>();

	const report = await insertReport({
		reportData: {
			...unowwnedReportData,
			date: startOfDay(unowwnedReportData.date),
			ownerId: user._id,
		},
	});

	return c.json({
		report,
	});
});

app.openapi(putReportRoute, async (c) => {
	const { id } = c.req.valid("param");
	const user = c.get("user") as User;

	const unowwnedReportData = await c.req.json<UnownedReportData>();

	const report = await updateReportByIdAndOwnerId({
		id: id,
		ownerId: user._id,
		reportData: {
			...unowwnedReportData,
		},
	});

	return c.json({
		report,
	});
});

export default app;
