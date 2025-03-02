import { HTTPException } from "hono/http-exception";
import { getCollection } from "../../db/connection";
import createApp from "../../lib/createApp";
import { generateJwt, verifyRefreshToken } from "../../lib/jwt";
import {
	createUser,
	findUserByEmail,
	findUserByGithubId,
	findUserByRefreshToken,
	findUserByUsername,
	hashPassword,
	updateUserRefreshToken,
	validatePassword,
} from "../../models/user";
import {
	githubAuthCallbackRoute,
	githubAuthRoute,
	loginRoute,
	logoutRoute,
	refreshTokenRoute,
	registerRoute,
} from "./auth.routes";

const GITHUB_CLIENT_ID =
	process.env.GITHUB_CLIENT_ID || "your-github-client-id";
const GITHUB_CLIENT_SECRET =
	process.env.GITHUB_CLIENT_SECRET || "your-github-client-secret";
const REDIRECT_URI =
	process.env.REDIRECT_URI || "http://localhost:3000/auth/github/callback";

const app = createApp();

app.openapi(registerRoute, async (c) => {
	const body = await c.req.json();

	const existingUsername = await findUserByUsername(body.username);
	if (existingUsername) {
		throw new HTTPException(400, { message: "Username already exists" });
	}

	const existingEmail = await findUserByEmail(body.email);
	if (existingEmail) {
		throw new HTTPException(400, { message: "Email already exists" });
	}

	const hashedPassword = await hashPassword(body.password);

	const user = await createUser({
		username: body.username,
		email: body.email,
		password: hashedPassword,
	});

	const { accessToken, refreshToken } = await generateJwt(user);

	await updateUserRefreshToken(user._id, refreshToken);

	return c.json(
		{
			accessToken,
			refreshToken,
			user: {
				username: user.username,
				email: user.email,
			},
		},
		201,
	);
});

app.openapi(loginRoute, async (c) => {
	const body = await c.req.json();

	const user = await findUserByUsername(body.username);
	if (!user) {
		throw new HTTPException(401, { message: "Invalid credentials" });
	}

	const isPasswordValid = await validatePassword(user, body.password);
	if (!isPasswordValid) {
		throw new HTTPException(401, { message: "Invalid credentials" });
	}

	const { accessToken, refreshToken } = await generateJwt(user);

	await updateUserRefreshToken(user._id, refreshToken);

	return c.json(
		{
			accessToken,
			refreshToken,
			user: {
				username: user.username,
				email: user.email,
			},
		},
		200,
	);
});

app.openapi(githubAuthRoute, async (c) => {
	const sessions = getCollection("sessions");

	const state = Math.random().toString(36).substring(2);

	await sessions.insertOne({
		state,
		createdAt: new Date(),
		expiresAt: new Date(Date.now() + 1000 * 60 * 10), // 10 minutes
	});

	const url = new URL("https://github.com/login/oauth/authorize");
	url.searchParams.append("client_id", GITHUB_CLIENT_ID);
	url.searchParams.append("redirect_uri", REDIRECT_URI);
	url.searchParams.append("state", state);
	url.searchParams.append("scope", "user:email");

	return c.redirect(url.toString(), 302);
});

app.openapi(githubAuthCallbackRoute, async (c) => {
	const { code, state } = c.req.query();

	const sessions = getCollection("sessions");
	const session = await sessions.findOne({ state });

	if (!session) {
		throw new HTTPException(400, { message: "Invalid state" });
	}

	await sessions.deleteOne({ state });

	const tokenResponse = await fetch(
		"https://github.com/login/oauth/access_token",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				client_id: GITHUB_CLIENT_ID,
				client_secret: GITHUB_CLIENT_SECRET,
				code,
				redirect_uri: REDIRECT_URI,
			}),
		},
	);

	const tokenData = await tokenResponse.json();

	if (!tokenData.access_token) {
		throw new HTTPException(400, { message: "Failed to get GitHub token" });
	}

	const userResponse = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `token ${tokenData.access_token}`,
			Accept: "application/json",
		},
	});

	const githubUser = await userResponse.json();

	const emailResponse = await fetch("https://api.github.com/user/emails", {
		headers: {
			Authorization: `token ${tokenData.access_token}`,
			Accept: "application/json",
		},
	});

	const emails: Array<{
		email: string;
		primary: boolean;
		verified: boolean;
		visibility: string;
	}> = await emailResponse.json();
	const primaryEmail =
		emails.find((email) => email.primary)?.email || emails[0]?.email;

	if (!primaryEmail) {
		throw new HTTPException(400, { message: "Could not get GitHub email" });
	}

	let user = await findUserByGithubId(githubUser.id);

	if (!user) {
		user = await findUserByEmail(primaryEmail);
	}

	if (!user) {
		user = await createUser({
			username: githubUser.login,
			email: primaryEmail,
			githubId: githubUser.id,
		});
	} else if (!user.githubId) {
		const users = getCollection("users");
		await users.updateOne(
			{ _id: user._id },
			{
				$set: {
					githubId: githubUser.id,
					updatedAt: new Date(),
				},
			},
		);
	}

	const { accessToken, refreshToken } = await generateJwt(user);

	await updateUserRefreshToken(user._id, refreshToken);

	return c.json(
		{
			accessToken,
			refreshToken,
			user: {
				username: user.username,
				email: user.email,
			},
		},
		200,
	);
});

app.openapi(refreshTokenRoute, async (c) => {
	const body = await c.req.json();

	const refreshToken = body.refreshToken;
	if (!refreshToken) {
		return c.json({ error: "Refresh token is required" }, 401);
	}

	const payload = await verifyRefreshToken(refreshToken);
	if (!payload) {
		return c.json({ error: "Invalid refresh token" }, 401);
	}

	const user = await findUserByRefreshToken(refreshToken);
	if (!user) {
		return c.json({ error: "User not found or token revoked" }, 401);
	}

	const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
		await generateJwt(user);

	await updateUserRefreshToken(user._id, refreshToken);

	return c.json(
		{
			accessToken: newAccessToken,
			refreshToken: newRefreshToken,
			user: {
				username: user.username,
				email: user.email,
			},
		},
		200,
	);
});

app.openapi(logoutRoute, (c) => {
	// todo: make it for real
	return c.json(
		{
			message: "Logged out successfully",
		},
		200,
	);
});

export default app;
