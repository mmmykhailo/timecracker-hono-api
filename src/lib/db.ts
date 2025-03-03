import { type Db, type Document, MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/api";

const client = new MongoClient(MONGODB_URI);
let dbInstance: Db | null = null;

export type DbCollection = "users" | "sessions" | "reportEntries";

export async function connectDatabase() {
	try {
		await client.connect();
		dbInstance = client.db();
		return dbInstance;
	} catch (error) {
		console.error("Database connection error:", error);
		throw error;
	}
}

export function getDatabase() {
	if (!dbInstance) {
		throw new Error("Database not initialized. Call connectDatabase first");
	}
	return dbInstance;
}

export function getCollection<T extends Document>(name: DbCollection) {
	return getDatabase().collection<T>(name);
}
