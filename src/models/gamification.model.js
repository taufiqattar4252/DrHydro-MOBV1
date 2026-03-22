import mongoose from "mongoose";

const gamificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        unique: true
    },
    points: {
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
    lastLogDate: {
        type: Date
    },
    badges: [
        {
            name: { type: String, required: true },
            unlockedAt: { type: Date, default: Date.now }
        }
    ],
    challenges: [
        {
            challengeId: { type: String, required: true },
            status: { 
                type: String, 
                enum: ["Not Started", "In Progress", "Completed"], 
                default: "Not Started" 
            },
            progress: { type: Number, default: 0 } // Percentage or count
        }
    ]
}, { timestamps: true });

const Gamification = mongoose.model("gamification", gamificationSchema);

export default Gamification;
