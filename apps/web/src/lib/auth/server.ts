import { betterAuth, type RateLimit } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Redis } from "@upstash/redis";
import { getDb } from "@/lib/db/lazy";
import { webEnv } from "@/lib/env/web";

let _auth: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
	if (!_auth) {
		const db = getDb();
		if (!db) return null;

		const redis = new Redis({
			url: webEnv.UPSTASH_REDIS_REST_URL,
			token: webEnv.UPSTASH_REDIS_REST_TOKEN,
		});

		_auth = betterAuth({
			database: drizzleAdapter(db, {
				provider: "pg",
				usePlural: true,
			}),
			secret: webEnv.BETTER_AUTH_SECRET,
			user: {
				deleteUser: {
					enabled: true,
				},
			},
			emailAndPassword: {
				enabled: true,
			},
			rateLimit: {
				storage: "secondary-storage",
				customStorage: {
					get: async (key) => {
						const value = await redis.get(key);
						return value as RateLimit | undefined;
					},
					set: async (key, value) => {
						await redis.set(key, value);
					},
				},
			},
			baseURL: webEnv.NEXT_PUBLIC_SITE_URL,
			appName: "Edify",
			trustedOrigins: [webEnv.NEXT_PUBLIC_SITE_URL],
		});
	}
	return _auth;
}

export type Auth = ReturnType<typeof betterAuth>;
