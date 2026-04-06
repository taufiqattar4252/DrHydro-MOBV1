import { Router } from "express";
import { evaluateAllStreaks } from "../services/streak.service.js";

const router = Router();

/**
 * POST /api/cron/streak
 * Vercel Cron endpoint — triggers daily streak evaluation.
 * Protect with a secret header in production.
 */
router.post("/streak", async (req, res) => {
    try {
        // Optional: verify cron secret for security
        const cronSecret = req.headers["x-cron-secret"];
        if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
            return res.status(401).json({ status: "error", message: "Unauthorized" });
        }

        await evaluateAllStreaks();
        res.status(200).json({ status: "success", message: "Streak evaluation complete" });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

export default router;
