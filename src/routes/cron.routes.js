import { Router } from "express";
import { evaluateAllStreaks } from "../services/streak.service.js";
import { evaluateAllActiveChallenges } from "../services/gamification.service.js";

const router = Router();

/**
 * POST /api/cron/streak
 * Vercel Cron endpoint — triggers daily streak evaluation.
 */
router.post("/streak", async (req, res) => {
    try {
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

/**
 * POST /api/cron/cron-challenges
 * Vercel Cron endpoint — triggers challenge failure evaluation.
 */
router.post("/cron-challenges", async (req, res) => {
    try {
        const cronSecret = req.headers["x-cron-secret"];
        if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
            return res.status(401).json({ status: "error", message: "Unauthorized" });
        }

        await evaluateAllActiveChallenges();
        res.status(200).json({ status: "success", message: "Challenge evaluation complete" });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

export default router;
