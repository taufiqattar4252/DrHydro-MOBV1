import mongoose from "mongoose";

const userChallengeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    challengeId: {
        type: String,
        required: true // e.g. "CH-01"
    },
    status: {
        type: String,
        enum: ["accepted", "in_progress", "completed", "failed"],
        default: "accepted"
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    daysCompleted: {
        type: Number,
        default: 0
    },
    totalDays: {
        type: Number,
        required: true
    },
    calendarDays: [{
        date: { type: Date, required: true },
        met: { type: Boolean, default: false }
    }],
    completedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// A user can only have one active (accepted/in_progress) instance of a challenge
userChallengeSchema.index({ user: 1, challengeId: 1 });

const UserChallenge = mongoose.model("userChallenges", userChallengeSchema);

export default UserChallenge;
