import { utc } from "@date-fns/utc";
import { format, startOfDay as originalStartOfDay } from "date-fns";

export const startOfDay = (date: Date) => {
	return originalStartOfDay(date, {
		in: utc,
	});
};
