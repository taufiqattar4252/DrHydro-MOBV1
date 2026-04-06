import cron from "node-cron";
import { evaluateAllStreaks } from "../services/streak.service.js";

/**
 * Register all cron jobs.
 * Streak evaluation runs daily at 00:01 AM.
 */
export function startCronJobs() {
    // Daily streak evaluation at 00:01
    cron.schedule("1 0 * * *", async () => {
        console.log("🕐 Cron: Starting daily streak evaluation...");
        await evaluateAllStreaks();
    });

    console.log("⏰ Cron jobs registered.");
}
