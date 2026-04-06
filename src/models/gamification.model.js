import mongoose from "mongoose";

// UserRewardProfile — stores points and streak data per user
// Badges and challenges are now in separate collections
const gamificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        unique: true
    },
    totalPoints: {
        type: Number,
        default: 0
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    lastGoalDate: {
        type: Date,
        default: null // last date the user met their daily water goal
    },
    lastLogDate: {
        type: Date,
        default: null
    },
    profileComplete: {
        type: Boolean,
        default: false // set true when +25 profile completion points awarded
    },
    // Track which streak milestones have been awarded to avoid duplicates
    streakMilestonesAwarded: {
        type: [Number], // e.g. [7, 14]
        default: []
    },
    // Track consecutive goal-met days for badge B-03 (3 days) and B-08 (7 days)
    consecutiveGoalDays: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Gamification = mongoose.model("gamification", gamificationSchema);

export default Gamification;
