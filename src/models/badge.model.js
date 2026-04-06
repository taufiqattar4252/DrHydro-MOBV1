import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    badgeId: {
        type: String,
        required: true // "B-01" to "B-14"
    },
    name: {
        type: String,
        required: true
    },
    icon: {
        type: String
    },
    trigger: {
        type: String
    },
    awardedAt: {
        type: Date,
        default: Date.now
    },
    isNewBadge: {
        type: Boolean,
        default: true // true until user has seen the badge
    }
}, { timestamps: true });

// Each badge can only be awarded ONCE per user
badgeSchema.index({ user: 1, badgeId: 1 }, { unique: true });

const Badge = mongoose.model("badges", badgeSchema);

export default Badge;
