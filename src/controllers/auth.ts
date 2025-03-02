import type { Context } from "hono";
import { sign } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import {
	findUserByUsername,
	findUserByEmail,
	findUserByGithubId,
	createUser,
	validatePassword,
	hashPassword,
	type User,
} from "../models/user";
import { getCollection } from "../db/connection";
import type { JWTPayload } from "hono/utils/jwt/types";

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";
const GITHUB_CLIENT_ID =
	process.env.GITHUB_CLIENT_ID || "your-github-client-id";
const GITHUB_CLIENT_SECRET =
	process.env.GITHUB_CLIENT_SECRET || "your-github-client-secret";
const REDIRECT_URI =
	process.env.REDIRECT_URI || "http://localhost:3000/auth/github/callback";

export async function register(c: Context) {
	const body = await c.req.json();

	// Check if username exists
	const existingUsername = await findUserByUsername(body.username);
	if (existingUsername) {
		throw new HTTPException(400, { message: "Username already exists" });
	}

	// Check if email exists
	const existingEmail = await findUserByEmail(body.email);
	if (existingEmail) {
		throw new HTTPException(400, { message: "Email already exists" });
	}

	// Hash password
	const hashedPassword = await hashPassword(body.password);

	// Create user
	const user = await createUser({
		username: body.username,
		email: body.email,
		password: hashedPassword,
	});

	// Generate JWT
	const token = await generateJWT(user);

	return c.json(
		{
			token,
			user: {
				username: user.username,
				email: user.email,
			},
		},
		201,
	);
}

export async function login(c: Context) {
	const body = await c.req.json();

	// Find user
	const user = await findUserByUsername(body.username);
	if (!user) {
		throw new HTTPException(401, { message: "Invalid credentials" });
	}

	// Validate password
	const isPasswordValid = await validatePassword(user, body.password);
	if (!isPasswordValid) {
		throw new HTTPException(401, { message: "Invalid credentials" });
	}

	// Generate JWT
	const token = await generateJWT(user);

	return c.json({
		token,
		user: {
			username: user.username,
			email: user.email,
		},
	});
}

export async function githubAuth(c: Context) {
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
}

export async function githubCallback(c: Context) {
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

	const token = await generateJWT(user);

	return c.json({
		token,
		user: {
			username: user.username,
			email: user.email,
		},
	});
}

export async function logout(c: Context) {
	return c.json(
		{
			message: "Logged out successfully",
		},
		200,
	);
}

export async function getProfile(c: Context) {
	const user = c.get("user") as User;

	return c.json({
		username: user.username,
		email: user.email,
	});
}

async function generateJWT(user: User) {
	const payload: JWTPayload = {
		username: user.username,
		email: user.email,
	};
	return await sign(payload, JWT_SECRET);
}
