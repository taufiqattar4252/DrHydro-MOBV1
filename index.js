import app from "./src/app.js";
import dotenv from "dotenv";
dotenv.config();

// Vercel serverless functions don't need app.listen()
if (!process.env.VERCEL) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

export default app;