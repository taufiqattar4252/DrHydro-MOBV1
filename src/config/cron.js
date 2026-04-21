import cron from "node-cron";
import { evaluateAllStreaks } from "../services/streak.service.js";
import { evaluateAllActiveChallenges } from "../services/gamification.service.js";

/**
 * Register all cron jobs.
 * Streak evaluation runs daily at 00:01 AM.
 * Challenge failure evaluation runs every hour.
 */
export function startCronJobs() {
    // Daily streak evaluation at 00:01
    cron.schedule("1 0 * * *", async () => {
        console.log("🕐 Cron: Starting daily streak evaluation...");
        await evaluateAllStreaks();
    });

    // Hourly challenge evaluation (at minute 0)
    cron.schedule("0 * * * *", async () => {
        console.log("🕐 Cron: Starting hourly challenge evaluation...");
        await evaluateAllActiveChallenges();
    });

    console.log("⏰ Cron jobs registered.");
}
