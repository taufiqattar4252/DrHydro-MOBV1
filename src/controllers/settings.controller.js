import Settings from "../models/settings.model.js";

export const getAppSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne({ user: req.user._id });
        res.status(200).json({ status: "success", data: settings });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

export const updateAppSettings = async (req, res) => {
    try {
        const settings = await Settings.findOneAndUpdate(
            { user: req.user._id },
            { $set: req.body },
            { new: true, upsert: true }
        );
        res.status(200).json({ status: "success", data: settings });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};
