import { sign, verify } from "hono/jwt";
import type { JWTPayload } from "hono/utils/jwt/types";
import type { User } from "../models/user";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-secret";

export const generateJwt = async (user: User) => {
	const accessTokenPayload: JWTPayload = {
		username: user.username,
		email: user.email,
		exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 mins
	};
	const refreshTokenPayload: JWTPayload = {
		username: user.username,
		email: user.email,
		exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 1 week
	};
	const [accessToken, refreshToken] = await Promise.all([
		sign(accessTokenPayload, JWT_SECRET),
		sign(refreshTokenPayload, JWT_REFRESH_SECRET),
	]);
	return { accessToken, refreshToken };
};

export const verifyAccessToken = async (accessToken: string) => {
	return await verify(accessToken, JWT_SECRET);
};
export const verifyRefreshToken = async (refreshToken: string) => {
	return await verify(refreshToken, JWT_REFRESH_SECRET);
};
