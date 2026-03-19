// import app from "./src/app.js";
// import connectDB from "./src/config/database.js";
// import dotenv from "dotenv";
// dotenv.config();

// await connectDB();

// app.listen(process.env.PORT, () => {
//     console.log(`Server is running on port ${process.env.PORT}`);
// })



import app from "./src/app.js";
import connectDB from "./src/config/database.js";
import serverless from "serverless-http";

// Connect DB per request (for Vercel)
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// 👇 If running locally → start server
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;

    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    });
}

// 👇 For Vercel
export default serverless(app);