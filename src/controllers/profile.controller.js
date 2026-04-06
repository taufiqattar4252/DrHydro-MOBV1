import Profile from "../models/profile.model.js";
import Settings from "../models/settings.model.js";
import Reminder from "../models/reminder.model.js";
import Gamification from "../models/gamification.model.js";
import { addPoints } from "../services/gamification.service.js";
import { POINTS } from "../config/constants.js";

export const getProfile = async (req, res) => {
    try {
        let profile = await Profile.findOne({ user: req.user._id });
        
        if (!profile) {
            // Create default profile if it doesn't exist
            profile = await Profile.create({
                user: req.user._id,
                fullName: req.user.name,
                dailyWaterGoal: 2500
            });
            
            // Also initialize other relative models for first-time use
            await Settings.findOneAndUpdate({ user: req.user._id }, {}, { upsert: true });
            await Reminder.findOneAndUpdate({ user: req.user._id }, {}, { upsert: true });
            await Gamification.findOneAndUpdate({ user: req.user._id }, {}, { upsert: true });
        }

        res.status(200).json({
            status: "success",
            data: profile
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const profile = await Profile.findOneAndUpdate(
            { user: req.user._id },
            { $set: req.body },
            { new: true, upsert: true }
        );

        // ── Check profile completion for +25 points ──
        const gam = await Gamification.findOne({ user: req.user._id });
        if (gam && !gam.profileComplete) {
            const isComplete = !!(
                profile.fullName &&
                profile.age &&
                profile.weight &&
                profile.gender &&
                profile.dailyWaterGoal
            );

            if (isComplete) {
                gam.profileComplete = true;
                await gam.save();
                await addPoints(req.user._id, POINTS.COMPLETE_PROFILE);
            }
        }

        res.status(200).json({
            status: "success",
            data: profile
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};
