import { Router } from "express";
import * as settingsController from "../controllers/settings.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", settingsController.getAppSettings);
router.put("/", settingsController.updateAppSettings);

export default router;
