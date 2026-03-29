import { Router } from "express";
import * as waterController from "../controllers/water.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/log", waterController.logDrink);
router.get("/today", waterController.getTodayProgress);
router.get("/hourly-stats", waterController.getHourlyStats);
router.get("/weekly", waterController.getWeeklyProgress);
router.get("/monthly", waterController.getMonthlyProgress);
router.get("/stats", waterController.getStats);
router.get("/calendar", waterController.getMonthlyHistory);

export default router;
