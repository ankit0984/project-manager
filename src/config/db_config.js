import mongoose from "mongoose";
import logger from "@/logger/logger";
import { prod_databaseUrl } from "@/env_config/env_conf";

const MONGO_URI = prod_databaseUrl;

if (!MONGO_URI) {
	throw new Error("MongoDB URI missing for current environment");
}

// Cache connection across hot reloads
let cached = globalThis.mongoose;

if (!cached) {
	cached = globalThis.mongoose = { conn: null, promise: null };
}

export async function connectionDb() {
	if (cached.conn) {
		return cached.conn;
	}

	if (!cached.promise) {
		cached.promise = mongoose.connect(MONGO_URI, {
			bufferCommands: false,
			maxPoolSize: 10,
		});
	}

	try {
		cached.conn = await cached.promise;
		logger.info("MongoDB connected successfully");

		const connection = cached.conn.connection;
		connection.once("error", (err) =>
			logger.error("MongoDB runtime error:", err),
		);
		connection.once("disconnected", () => logger.warn("MongoDB disconnected"));
		connection.once("reconnected", () => logger.info("MongoDB reconnected"));

		process.once("SIGINT", async () => {
			await cached.conn.connection.close();
			logger.info("MongoDB connection closed (app termination)");
			process.exit(0);
		});
	} catch (err) {
		cached.promise = null;
		logger.error("MongoDB connection failed:", err);
		throw err;
	}

	return cached.conn;
}
