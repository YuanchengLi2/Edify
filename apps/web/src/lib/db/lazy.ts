import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";
import { webEnv } from "@/lib/env/web";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
	if (!_db) {
		try {
			const client = postgres(webEnv.DATABASE_URL, {
				connect_timeout: 2,
			});
			_db = drizzle(client, { schema });
		} catch (e) {
			console.warn("Database unavailable:", e);
		}
	}
	return _db;
}
