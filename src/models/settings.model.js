import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        unique: true
    },
    theme: {
        appearance: { 
            type: String, 
            enum: ["Light", "Dark", "Auto"], 
            default: "Light" 
        },
        accentColor: { type: String, default: "Blue" },
        textSize: { type: Number, default: 100 }, // Percentage
        isAutomatic: { type: Boolean, default: false },
        eyeComfortMode: { type: Boolean, default: false }
    },
    language: {
        type: String,
        default: "English"
    },
    region: {
        type: String,
        default: "India"
    }
}, { timestamps: true });

const Settings = mongoose.model("settings", settingsSchema);

export default Settings;
