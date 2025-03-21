import { utc } from "@date-fns/utc";
import {
	endOfDay as originalEndOfDay,
	startOfDay as originalStartOfDay,
} from "date-fns";

export const startOfDay = (date: Date) => {
	return originalStartOfDay(date, {
		in: utc,
	});
};

export const endOfDay = (date: Date) => {
	return originalEndOfDay(date, {
		in: utc,
	});
};
