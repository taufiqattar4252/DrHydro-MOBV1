import Gamification from "../models/gamification.model.js";
import Profile from "../models/profile.model.js";

export const getLeaderboard = async (req, res) => {
    try {
        const topPlayers = await Gamification.find()
            .sort({ points: -1 })
            .limit(10)
            .populate({
                path: 'user',
                select: 'name email avatar'
            });

        const leaderboard = topPlayers
            .filter(player => player.user) // Filter out orphaned records
            .map(player => ({
                name: player.user.name,
                points: player.points,
                avatar: player.user.avatar,
                isMe: player.user._id.toString() === req.user._id.toString()
            }));

        res.status(200).json({
            status: "success",
            data: leaderboard
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

export const getRewards = async (req, res) => {
    try {
        const gamification = await Gamification.findOne({ user: req.user._id });
        
        res.status(200).json({
            status: "success",
            data: gamification || { points: 0, currentStreak: 0, badges: [], challenges: [] }
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};
