import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    challengeId: {
        type: String,
        required: true
    },
    challengeName: {
        type: String,
        required: true
    },
    icon: {
        type: String
    },
    totalDays: {
        type: Number,
        required: true
    },
    daysCompleted: {
        type: Number,
        default: 0
    },
    progressPercent: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["in_progress", "completed", "failed"],
        default: "in_progress"
    }
}, { timestamps: true });

milestoneSchema.index({ user: 1, challengeId: 1 });

const Milestone = mongoose.model("milestones", milestoneSchema);

export default Milestone;
