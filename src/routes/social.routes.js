import { Router } from "express";
import * as socialController from "../controllers/social.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// Rewards overview (points, streak, badges, milestones, active challenges)
router.get("/rewards", socialController.getRewards);

// Friend-scoped leaderboard (referral-linked users)
router.get("/leaderboard", socialController.getLeaderboard);

// List all challenges with user status
router.get("/challenges", socialController.getChallenges);

// Accept a challenge
router.post("/challenges/accept", socialController.acceptChallenge);

// Calendar view (goal-met / partial / no-activity per day + challenge indicators)
router.get("/calendar", socialController.getCalendar);

// Mark all new badges as seen
router.post("/badges/seen", socialController.markBadgesSeen);

// Get share/referral link
router.get("/share-link", socialController.getShareLink);

export default router;
