import express from 'express';
import morgan from 'morgan';
import authRouter from './routes/auth.routes.js';
import profileRouter from './routes/profile.routes.js';
import waterRouter from './routes/water.routes.js';
import socialRouter from './routes/social.routes.js';
import reminderRouter from './routes/reminder.routes.js';
import settingsRouter from './routes/settings.routes.js';

import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();


app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

// Ensure database connection is established before handling any requests
// This is critical for serverless environments like Vercel
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        next(err);
    }
});


app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/water", waterRouter);
app.use("/api/social", socialRouter);
app.use("/api/reminders", reminderRouter);
app.use("/api/settings", settingsRouter);

app.get("/", (req, res) => {
    res.json({ status: "success", message: "Server is healthy" });
});
app.use(errorHandler);

export default app;