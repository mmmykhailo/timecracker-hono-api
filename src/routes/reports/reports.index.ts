import createApp from "../../lib/createApp";
import {
	type UnownedReportData,
	findReportsByOwner,
	insertReport,
	updateReportByIdAndOwnerId,
} from "../../models/report";
import type { User } from "../../models/user";
import {
	getReportsRoute,
	patchReportRoute,
	postReportRoute,
} from "./reports.routes";

const app = createApp();

app.openapi(getReportsRoute, async (c) => {
	const user = c.get("user") as User;

	console.log(user._id);

	const reports = await findReportsByOwner(user._id);

	return c.json({
		reports,
	});
});

app.openapi(postReportRoute, async (c) => {
	const user = c.get("user") as User;

	const unowwnedReportData = await c.req.json<UnownedReportData>();

	const report = await insertReport({
		...unowwnedReportData,
		ownerId: user._id,
	});

	return c.json({
		report,
	});
});

app.openapi(patchReportRoute, async (c) => {
	const { id } = c.req.valid("param");
	const user = c.get("user") as User;

	const unowwnedReportData = await c.req.json<UnownedReportData>();

	const report = await updateReportByIdAndOwnerId(id, user._id, {
		...unowwnedReportData,
	});

	return c.json({
		report,
	});
});

export default app;
