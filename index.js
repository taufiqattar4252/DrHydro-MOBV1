import app from "./src/app.js";
import dotenv from "dotenv";
import connectDB from "./src/config/database.js";

dotenv.config();

// Vercel serverless functions don't need app.listen()
if (!process.env.VERCEL) {
    const port = process.env.PORT || 3000;
    app.listen(port, async () => {
        console.log(`Server is running on port ${port}`);

        try {
            // Ensure DB is connected before starting crons
            await connectDB();
            
            const { startCronJobs } = await import("./src/config/cron.js");
            startCronJobs();
        } catch (err) {
            console.error("Failed to initialize server background tasks:", err.message);
        }
    });
}

export default app;