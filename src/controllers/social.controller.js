import Gamification from "../models/gamification.model.js";
import Badge from "../models/badge.model.js";
import UserChallenge from "../models/userChallenge.model.js";
import Milestone from "../models/milestone.model.js";
import Challenge from "../models/challenge.model.js";
import WaterIntake from "../models/waterIntake.model.js";
import Profile from "../models/profile.model.js";
import userModel from "../models/user.model.js";
import moment from "moment";
import { acceptChallengeForUser } from "../services/gamification.service.js";

// ─── GET /social/rewards ─────────────────────────────────────────────────────

export const getRewards = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get points & streak
        const gam = await Gamification.findOne({ user: userId });

        // Get all badges
        const badges = await Badge.find({ user: userId }).sort({ awardedAt: -1 });

        // Get milestones
        const milestones = await Milestone.find({ user: userId });

        // Get active challenges
        const activeChallenges = await UserChallenge.find({
            user: userId,
            status: { $in: ["accepted", "in_progress"] }
        });

        res.status(200).json({
            status: "success",
            data: {
                points: gam?.totalPoints || 0,
                streak: {
                    current: gam?.currentStreak || 0,
                    longest: gam?.longestStreak || 0,
                    consecutiveGoalDays: gam?.consecutiveGoalDays || 0
                },
                badges: badges.map(b => ({
                    badgeId: b.badgeId,
                    name: b.name,
                    icon: b.icon,
                    trigger: b.trigger,
                    awardedAt: b.awardedAt,
                    isNew: b.isNewBadge
                })),
                milestones: milestones.map(m => ({
                    challengeId: m.challengeId,
                    challengeName: m.challengeName,
                    icon: m.icon,
                    totalDays: m.totalDays,
                    daysCompleted: m.daysCompleted,
                    progressPercent: m.progressPercent,
                    status: m.status
                })),
                activeChallenges: activeChallenges.map(c => ({
                    challengeId: c.challengeId,
                    status: c.status,
                    startDate: c.startDate,
                    endDate: c.endDate,
                    daysCompleted: c.daysCompleted,
                    totalDays: c.totalDays
                }))
            }
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

// ─── GET /social/leaderboard ─────────────────────────────────────────────────

export const getLeaderboard = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await userModel.findById(userId);

        // Build friend list: user themselves + referredUsers + referredBy
        const friendIds = [userId];

        if (user.referredBy) {
            friendIds.push(user.referredBy);
        }

        if (user.referredUsers && user.referredUsers.length > 0) {
            friendIds.push(...user.referredUsers);
        }

        // Fetch gamification profiles for all friends
        const gamProfiles = await Gamification.find({
            user: { $in: friendIds }
        }).populate({
            path: "user",
            select: "name email avatar username"
        }).sort({ totalPoints: -1 });

        const leaderboard = gamProfiles
            .filter(g => g.user) // filter orphaned
            .map((g, index) => ({
                rank: index + 1,
                name: g.user.name,
                username: g.user.username,
                avatar: g.user.avatar,
                points: g.totalPoints,
                streak: g.currentStreak,
                isMe: g.user._id.toString() === userId.toString()
            }));

        res.status(200).json({
            status: "success",
            data: leaderboard
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

// ─── GET /social/challenges ──────────────────────────────────────────────────

export const getChallenges = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get all challenge definitions
        const allChallenges = await Challenge.find();

        // Get user's challenge instances
        const userChallenges = await UserChallenge.find({ user: userId });

        const result = allChallenges.map(ch => {
            // Find the most recent user instance for this challenge
            const userInstance = userChallenges
                .filter(uc => uc.challengeId === ch.challengeId)
                .sort((a, b) => b.createdAt - a.createdAt)[0];

            return {
                challengeId: ch.challengeId,
                name: ch.name,
                description: ch.description,
                dailyGoal: ch.dailyGoal,
                durationDays: ch.durationDays,
                icon: ch.icon,
                // User-specific status
                userStatus: userInstance ? userInstance.status : "not_started",
                daysCompleted: userInstance?.daysCompleted || 0,
                startDate: userInstance?.startDate || null,
                endDate: userInstance?.endDate || null,
                canAccept: !userInstance || userInstance.status === "failed"
            };
        });

        res.status(200).json({
            status: "success",
            data: result
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

// ─── POST /social/challenges/accept ──────────────────────────────────────────

export const acceptChallenge = async (req, res) => {
    try {
        const userId = req.user._id;
        const { challengeId } = req.body;

        if (!challengeId) {
            return res.status(400).json({ status: "error", message: "challengeId is required" });
        }

        // Get challenge definition
        const challengeDef = await Challenge.findOne({ challengeId });
        if (!challengeDef) {
            return res.status(404).json({ status: "error", message: "Challenge not found" });
        }

        const { userChallenge, newBadge } = await acceptChallengeForUser(userId, challengeId, challengeDef);

        res.status(201).json({
            status: "success",
            message: `Challenge "${challengeDef.name}" accepted! Let's go! 💪`,
            data: {
                challenge: {
                    challengeId: userChallenge.challengeId,
                    status: userChallenge.status,
                    startDate: userChallenge.startDate,
                    endDate: userChallenge.endDate,
                    totalDays: userChallenge.totalDays
                },
                pointsEarned: 50,
                newBadge: newBadge ? {
                    badgeId: newBadge.badgeId,
                    name: newBadge.name,
                    icon: newBadge.icon
                } : null
            }
        });
    } catch (err) {
        if (err.message.includes("already")) {
            return res.status(409).json({ status: "error", message: err.message });
        }
        res.status(500).json({ status: "error", message: err.message });
    }
};

// ─── GET /social/calendar ────────────────────────────────────────────────────

export const getCalendar = async (req, res) => {
    try {
        const userId = req.user._id;
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({ status: "error", message: "year and month are required" });
        }

        const startOfMonth = moment(`${year}-${month}-01`, "YYYY-MM-DD").startOf("month");
        const endOfMonth = moment(`${year}-${month}-01`, "YYYY-MM-DD").endOf("month");
        const daysInMonth = endOfMonth.date();

        // Get all water logs for the month
        const logs = await WaterIntake.find({
            user: userId,
            timestamp: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() }
        });

        // Get user's daily goal
        const profile = await Profile.findOne({ user: userId });
        const goal = profile?.dailyWaterGoal || 2500;

        // Group logs by day
        const dailyTotals = {};
        logs.forEach(log => {
            const day = moment(log.timestamp).format("YYYY-MM-DD");
            dailyTotals[day] = (dailyTotals[day] || 0) + log.amount;
        });

        // Get active challenges during this month
        const activeChallenges = await UserChallenge.find({
            user: userId,
            $or: [
                { startDate: { $lte: endOfMonth.toDate() }, endDate: { $gte: startOfMonth.toDate() } }
            ]
        });

        // Build challenge day map
        const challengeDays = {};
        activeChallenges.forEach(uc => {
            uc.calendarDays.forEach(cd => {
                const dayStr = moment(cd.date).format("YYYY-MM-DD");
                if (!challengeDays[dayStr]) challengeDays[dayStr] = [];
                challengeDays[dayStr].push({
                    challengeId: uc.challengeId,
                    met: cd.met
                });
            });
        });

        // Build calendar response
        const calendar = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = moment(`${year}-${month}-${d}`, "YYYY-MM-D").format("YYYY-MM-DD");
            const total = dailyTotals[dateStr] || 0;

            let status = "no_activity";
            if (total >= goal) {
                status = "goal_met";
            } else if (total > 0) {
                status = "partial";
            }

            calendar.push({
                date: dateStr,
                total,
                status,
                challenges: challengeDays[dateStr] || []
            });
        }

        res.status(200).json({
            status: "success",
            data: {
                year: parseInt(year),
                month: parseInt(month),
                goal,
                days: calendar
            }
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

// ─── POST /social/badges/seen ────────────────────────────────────────────────

export const markBadgesSeen = async (req, res) => {
    try {
        const userId = req.user._id;

        await Badge.updateMany(
            { user: userId, isNewBadge: true },
            { $set: { isNewBadge: false } }
        );

        res.status(200).json({
            status: "success",
            message: "All badges marked as seen"
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

// ─── GET /social/share-link ──────────────────────────────────────────────────

export const getShareLink = async (req, res) => {
    try {
        const user = await userModel.findById(req.user._id);

        if (!user.referralCode) {
            // Generate one if missing (for legacy users)
            user.referralCode = "DHYD-" + Math.random().toString(36).substring(2, 6).toUpperCase();
            await user.save();
        }

        res.status(200).json({
            status: "success",
            data: {
                referralCode: user.referralCode,
                shareLink: `https://drhydro.app/join?ref=${user.referralCode}`,
                referralCount: user.referralCount
            }
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};
