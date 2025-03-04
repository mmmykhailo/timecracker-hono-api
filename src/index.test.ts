import { describe, expect, test } from "bun:test";

const API_URL: string = "http://localhost:3000";

interface User {
	username: string;
	password: string;
	email: string;
}

interface TokenResponse {
	accessToken: string;
	refreshToken: string;
}

interface ReportEntry {
	time: { start: string; end: string };
	duration: number;
	project: string;
	activity: string | null;
	description: string;
}

interface Report {
	_id: string;
	ownerId: string;
	date: string;
	entries: ReportEntry[];
	createdAt: string;
	updatedAt: string;
}

async function request<T>(
	method: string,
	path: string,
	body: object | null = null,
	token: string | null = null,
): Promise<T> {
	const headers: HeadersInit = { "Content-Type": "application/json" };
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const res = await fetch(`${API_URL}${path}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : null,
	});
	return res.json();
}

describe("Auth Endpoints", () => {
	let tokens: TokenResponse;
	const testUser: User = {
		username: "testuser",
		password: "password123",
		email: "test@example.com",
	};

	test("Register user", async () => {
		const res = await request<TokenResponse>(
			"POST",
			"/auth/register",
			testUser,
		);
		expect(res).toHaveProperty("accessToken");
		expect(res).toHaveProperty("refreshToken");
		tokens = res;
	});

	test("Login user", async () => {
		const res = await request<TokenResponse>("POST", "/auth/login", {
			username: testUser.username,
			password: testUser.password,
		});
		expect(res).toHaveProperty("accessToken");
		expect(res).toHaveProperty("refreshToken");
		tokens = res;
	});

	test("Refresh token", async () => {
		const res = await request<TokenResponse>("POST", "/auth/refresh", {
			refreshToken: tokens.refreshToken,
		});
		expect(res).toHaveProperty("accessToken");
	});

	test("Logout user", async () => {
		const res = await request<{ message: string }>(
			"POST",
			"/auth/logout",
			null,
			tokens.accessToken,
		);
		expect(res).toHaveProperty("message");
	});
});

describe("Reports Endpoints", () => {
	let reportId: string;
	let authToken: string;

	test("Create report", async () => {
		authToken = (
			await request<TokenResponse>("POST", "/auth/login", {
				username: "testuser",
				password: "password123",
			})
		).accessToken;
		const reportData = {
			date: "20240304",
			entries: [
				{
					time: { start: "08:00", end: "10:00" },
					duration: 120,
					project: "Test Project",
					activity: "Coding",
					description: "Worked on API",
				},
			],
		};
		const res = await request<{ report: Report }>(
			"POST",
			"/reports",
			reportData,
			authToken,
		);
		expect(res).toHaveProperty("report");
		reportId = res.report._id;
	});

	test("Get reports", async () => {
		const res = await request<{ reportEntries: Report[] }>(
			"GET",
			"/reports",
			null,
			authToken,
		);
		expect(res).toHaveProperty("reports");
	});

	test("Update report", async () => {
		const updateData = {
			date: "20240304",
			entries: [
				{
					time: { start: "09:00", end: "11:00" },
					duration: 120,
					project: "Updated Project",
					activity: "Debugging",
					description: "Fixed bugs",
				},
			],
		};
		const res = await request<{ report: Report }>(
			"PATCH",
			`/reports/${reportId}`,
			updateData,
			authToken,
		);
		expect(res).toHaveProperty("report");
	});
});
