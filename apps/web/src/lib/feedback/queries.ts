import { feedback } from "@/lib/db";
import { getDb } from "@/lib/db/lazy";
import { generateUUID } from "@/utils/id";
import type { FeedbackEntry, SubmitFeedbackInput } from "./types";

export async function submitFeedback({
	message,
}: SubmitFeedbackInput): Promise<FeedbackEntry> {
	const id = generateUUID();
	const now = new Date();

	const db = getDb();
	if (db) {
		await db.insert(feedback).values({ id, message, createdAt: now });
	}

	return { id, message, createdAt: now.toISOString() };
}
