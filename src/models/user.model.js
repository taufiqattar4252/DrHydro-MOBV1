import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
    },
    username: {
        type: String,
        required: [true, "Username is required"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email must be unique"]
    },
    password: {
        type: String,
        required: false // Optional for OAuth users
    },
    verified: {
        type: Boolean,
        default: false
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'apple'],
        default: 'local'
    },
    authProviderId: {
        type: String,
        required: false
    },
    avatar: {
        type: String,
        required: false
    },
    // ─── Referral System ──────────────────────────────────────
    referralCode: {
        type: String,
        unique: true,
        sparse: true // allows null for legacy users until migrated
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null
    },
    referredUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }],
    referralCount: {
        type: Number,
        default: 0
    }
})

// Generate referral code before saving if not set
userSchema.pre("save", async function () {
    if (!this.referralCode) {
        // Generate code like "DHYD-X7K2" — 4 random alphanumeric chars
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // exclude confusable chars
        let code = "DHYD-";
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.referralCode = code;
    }
});

const userModel = mongoose.model("users", userSchema)

export default userModel;