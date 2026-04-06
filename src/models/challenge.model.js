import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema({
    challengeId: {
        type: String,
        required: true,
        unique: true // CH-01 to CH-05
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    dailyGoal: {
        type: String,
        required: true
    },
    durationDays: {
        type: Number,
        required: true
    },
    badgeOnComplete: {
        type: String // badge ID awarded on completion
    },
    icon: {
        type: String
    },
    condition: {
        type: String,
        enum: ["EARLY_BIRD", "DESK_SIP", "GOAL_MET"],
        required: true
    }
}, { timestamps: true });

const Challenge = mongoose.model("challenges", challengeSchema);

export default Challenge;
