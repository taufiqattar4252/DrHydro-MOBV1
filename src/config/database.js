import mongoose from "mongoose";
import config from "./config.js";


async function connectDB() {
    try {
        const uri = config.MONGO_URI?.trim();
        if (!uri) {
            throw new Error("MONGO_URI is not defined");
        }
        await mongoose.connect(uri);
        console.log("Connected to DB");
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1); 
    }
}

export default connectDB;