import { getCollection } from "../db/connection";
import type { ObjectId, WithId } from "mongodb";

export type User = {
	_id: ObjectId;
	username: string;
	email: string;
	password?: string;
	githubId?: number;
	createdAt: Date;
	updatedAt: Date;
};
export type UserData = Omit<User, "_id" | "createdAt" | "updatedAt">;
export type NewUser = UserData & Pick<User, "createdAt" | "updatedAt">;

export async function findUserByUsername(
	username: string,
): Promise<User | null> {
	const users = getCollection<User>("users");
	return await users.findOne({ username });
}

export async function findUserByEmail(email: string): Promise<User | null> {
	const users = getCollection<User>("users");
	return await users.findOne({ email });
}

export async function findUserByGithubId(
	githubId: number,
): Promise<User | null> {
	const users = getCollection<User>("users");
	return await users.findOne({ githubId });
}

export async function createUser(userData: UserData): Promise<User> {
	const users = getCollection("users");

	const now = new Date();

	const newUser: NewUser = {
		username: userData.username,
		email: userData.email,
		password: userData.password,
		githubId: userData.githubId,
		createdAt: now,
		updatedAt: now,
	};

	const result = await users.insertOne(newUser);
	const user: User = { ...newUser, _id: result.insertedId };
	return user;
}

export async function findUserByRefreshToken(
	refreshToken: string,
): Promise<User | null> {
	const users = getCollection<User>("users");
	return await users.findOne({ refreshToken });
}

export async function updateUserRefreshToken(
	userId: ObjectId,
	refreshToken: string,
): Promise<void> {
	const users = getCollection<User>("users");
	await users.updateOne(
		{ _id: userId },
		{ $set: { refreshToken, updatedAt: new Date() } },
	);
}

export async function validatePassword(
	user: User,
	password: string,
): Promise<boolean> {
	if (!user.password) return false;
	return await Bun.password.verify(password, user.password);
}

export async function hashPassword(password: string): Promise<string> {
	return await Bun.password.hash(password);
}
