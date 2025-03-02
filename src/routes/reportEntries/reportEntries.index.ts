import createApp from "../../lib/createApp";
import {
	type UnownedReportEntryData,
	findReportEntriesByOwner,
	insertReportEntry,
} from "../../models/reportEntry";
import type { User } from "../../models/user";
import {
	createReportEntryRoute,
	getReportEntriesRoute,
} from "./reportEntries.routes";

const app = createApp();

app.openapi(getReportEntriesRoute, async (c) => {
	const user = c.get("user") as User;

	console.log(user._id);

	const reportEntries = await findReportEntriesByOwner(user._id);

	console.log(reportEntries);

	return c.json({
		reportEntries,
	});
});

app.openapi(createReportEntryRoute, async (c) => {
	const user = c.get("user") as User;

	const unowwnedReportEntryData = await c.req.json<UnownedReportEntryData>();

	const reportEntry = await insertReportEntry({
		...unowwnedReportEntryData,
		ownerId: user._id,
	});

	return c.json({
		reportEntry,
	});
});

export default app;
