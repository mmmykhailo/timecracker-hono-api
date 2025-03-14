export function parseTimeIntoMinutes(timeStr: string): number {
	const [hours, minutes] = timeStr.split(":").map(Number);
	return hours * 60 + minutes;
}

export function formatTime(hours: number, minutes: number) {
	return [
		hours.toString().padStart(2, "0"),
		minutes.toString().padStart(2, "0"),
	].join(":");
}

export function calculateDuration(
	startTimeStr: string,
	endTimeStr: string,
): number {
	const startMinutes = parseTimeIntoMinutes(startTimeStr);
	const endMinutes = parseTimeIntoMinutes(endTimeStr);
	return endMinutes - startMinutes;
}
