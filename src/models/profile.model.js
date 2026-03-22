import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        min: 1,
        max: 120
    },
    weight: {
        type: Number, // in kg
        min: 1
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"]
    },
    dailyWaterGoal: {
        type: Number, // in mL
        default: 2500
    },
    avatar: {
        type: String // URL to image
    }
}, { timestamps: true });

const Profile = mongoose.model("profiles", profileSchema);

export default Profile;
