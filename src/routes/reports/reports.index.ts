import createApp from "../../lib/createApp";
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
	const date = c.req.param("date");

	const report = await findReportsByDateAndOwnerId({
		date: date,
		ownerId: user._id,
	});

	return c.json({
		report,
	});
});

app.openapi(putReportByDateRoute, async (c) => {
	const user = c.get("user") as User;
	const date = c.req.param("date");

	const unowwnedReportData = await c.req.json<UnownedReportData>();

	const report = await upsertReportByDateAndOwnerId({
		dateStr: date,
		ownerId: user._id,
		reportData: unowwnedReportData,
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
