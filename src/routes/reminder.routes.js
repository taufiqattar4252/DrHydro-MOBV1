import { Router } from "express";
import * as reminderController from "../controllers/reminder.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", reminderController.getSettings);
router.put("/", reminderController.updateSettings);

export default router;
