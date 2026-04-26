import { toNextJsHandler } from "better-auth/next-js";
import { betterAuth, type RateLimit } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Redis } from "@upstash/redis";
import { getDb } from "@/lib/db/lazy";
import { webEnv } from "@/lib/env/web";

let _handler: ReturnType<typeof toNextJsHandler> | null = null;

function getHandler() {
	if (!_handler) {
		const db = getDb();
		if (!db) return null;
		let auth;
		try {
			const redis = new Redis({
				url: webEnv.UPSTASH_REDIS_REST_URL,
				token: webEnv.UPSTASH_REDIS_REST_TOKEN,
			});

			auth = betterAuth({
				database: drizzleAdapter(db, {
					provider: "pg",
					usePlural: true,
				}),
				secret: webEnv.BETTER_AUTH_SECRET,
				user: { deleteUser: { enabled: true } },
				emailAndPassword: { enabled: true },
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
		} catch {
			auth = null;
		}
		_handler = auth ? toNextJsHandler(auth) : null;
	}
	return _handler;
}

export async function POST(request: Request) {
	const handler = getHandler();
	if (!handler) return new Response("Auth unavailable", { status: 503 });
	return handler.POST(request);
}

export async function GET(request: Request) {
	const handler = getHandler();
	if (!handler) return new Response("Auth unavailable", { status: 503 });
	return handler.GET(request);
}
