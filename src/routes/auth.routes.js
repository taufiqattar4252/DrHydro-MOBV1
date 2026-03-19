import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";


const authRouter = Router();



/**
 * POST /api/auth/register
 */
authRouter.post("/register", authController.register)


/**
 * POST /api/auth/login
 */
authRouter.post("/login", authController.login)



/**
 * POST /api/auth/google
 */
authRouter.post("/google", authController.googleAuth)

/**
 * POST /api/auth/apple
 */
authRouter.post("/apple", authController.appleAuth)

/**
 * GET /api/auth/get-me
 */
authRouter.get("/get-me", authController.getMe)

/**
 * GET /api/auth/refresh-token
 */
authRouter.get("/refresh-token", authController.refreshToken)


/**
 * GET /api/auth/logout
 */
authRouter.get("/logout", authController.logout)


/**
 * GET /api/auth/logout-all
 */
authRouter.get("/logout-all", authController.logoutAll)

/**
 * POST /api/auth/verify-email
 */
authRouter.post("/verify-email", authController.verifyEmail)


/**
 * POST /api/auth/forgot-password
 */
authRouter.post("/forgot-password", authController.forgotPassword)

/**
 * POST /api/auth/reset-password
 */
authRouter.post("/reset-password", authController.resetPassword)

export default authRouter;