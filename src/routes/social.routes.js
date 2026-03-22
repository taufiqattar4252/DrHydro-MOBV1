import { Router } from "express";
import * as socialController from "../controllers/social.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/leaderboard", socialController.getLeaderboard);
router.get("/rewards", socialController.getRewards);

export default router;
