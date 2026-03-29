import mongoose from "mongoose";
import config from "./config.js";

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    const uri = config.MONGO_URI?.trim();
    if (!uri) {
        throw new Error("MONGO_URI is not defined");
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
            console.log("Connected to DB");
            return mongoose;
        }).catch((err) => {
            console.error("Database connection failed:", err.message);
            cached.promise = null;
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}


export default connectDB;