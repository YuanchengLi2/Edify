import { z } from "zod";

const webEnvSchema = z.object({
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	ANALYZE: z.string().optional(),
	NEXT_RUNTIME: z.enum(["nodejs", "edge"]).optional(),

	NEXT_PUBLIC_SITE_URL: z.string().default("http://localhost:3000"),
	NEXT_PUBLIC_MARBLE_API_URL: z.string().default(""),

	DATABASE_URL: z.string().default("postgresql://localhost:5432/placeholder"),
	BETTER_AUTH_SECRET: z.string().default("dev-secret"),
	UPSTASH_REDIS_REST_URL: z.string().default("http://localhost:8079"),
	UPSTASH_REDIS_REST_TOKEN: z.string().default("placeholder"),
	MARBLE_WORKSPACE_KEY: z.string().default(""),
	FREESOUND_CLIENT_ID: z.string().default(""),
	FREESOUND_API_KEY: z.string().default(""),

	NEXT_PUBLIC_OPENAI_API_KEY: z.string().default(""),
	NEXT_PUBLIC_OPENAI_BASE_URL: z.string().default("https://api.openai.com/v1"),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export const webEnv = webEnvSchema.parse(process.env);
