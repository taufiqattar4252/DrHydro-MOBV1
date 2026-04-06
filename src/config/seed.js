import Challenge from "../models/challenge.model.js";
import { CHALLENGES } from "./constants.js";

/**
 * Seeds the 5 pre-defined challenges into the database if they don't exist.
 * Called once at app startup.
 */
export async function seedChallenges() {
    try {
        for (const ch of CHALLENGES) {
            const exists = await Challenge.findOne({ challengeId: ch.challengeId });
            if (!exists) {
                await Challenge.create({
                    challengeId: ch.challengeId,
                    name: ch.name,
                    description: ch.description,
                    dailyGoal: ch.dailyGoal,
                    durationDays: ch.durationDays,
                    badgeOnComplete: ch.badgeOnComplete,
                    icon: ch.icon,
                    condition: ch.condition
                });
                console.log(`✅ Seeded challenge: ${ch.challengeId} — ${ch.name}`);
            }
        }
        console.log("🌱 Challenge seed complete.");
    } catch (err) {
        console.error("❌ Seed error:", err.message);
    }
}
