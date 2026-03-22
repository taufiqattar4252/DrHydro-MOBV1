import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        unique: true
    },
    activeHours: {
        start: { type: String, default: "09:00" }, // HH:mm
        end: { type: String, default: "23:00" }     // HH:mm
    },
    interval: {
        type: Number,
        enum: [15, 30, 45, 60, 120], // in minutes
        default: 60
    },
    pushNotifications: {
        type: Boolean,
        default: true
    },
    commuteReminder: {
        enabled: { type: Boolean, default: false },
        leaveTime: { type: String, default: "09:00" }
    }
}, { timestamps: true });

const Reminder = mongoose.model("reminders", reminderSchema);

export default Reminder;
