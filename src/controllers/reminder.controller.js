import Reminder from "../models/reminder.model.js";

export const getSettings = async (req, res) => {
    try {
        const settings = await Reminder.findOne({ user: req.user._id });
        res.status(200).json({ status: "success", data: settings });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const settings = await Reminder.findOneAndUpdate(
            { user: req.user._id },
            { $set: req.body },
            { new: true, upsert: true }
        );
        res.status(200).json({ status: "success", data: settings });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};
