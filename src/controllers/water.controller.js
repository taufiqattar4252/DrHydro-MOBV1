import WaterIntake from "../models/waterIntake.model.js";
import Gamification from "../models/gamification.model.js";
import Profile from "../models/profile.model.js";
import moment from "moment";

export const logDrink = async (req, res) => {
    try {
        const { amount, drinkType } = req.body;
        
        if (!amount || !drinkType) {
            return res.status(400).json({ message: "Amount and drink type are required" });
        }

        const intake = await WaterIntake.create({
            user: req.user._id,
            amount,
            drinkType,
            timestamp: new Date()
        });

        // Points Logic: 10 points per 100ml
        const pointsEarned = Math.floor(amount / 10); 
        
        // Streak Logic
        const gamification = await Gamification.findOne({ user: req.user._id });
        const today = moment().startOf('day');
        let streakUpdated = false;

        if (gamification) {
            const lastLogDate = gamification.lastLogDate ? moment(gamification.lastLogDate).startOf('day') : null;
            
            if (!lastLogDate) {
                gamification.currentStreak = 1;
            } else if (today.diff(lastLogDate, 'days') === 1) {
                gamification.currentStreak += 1;
            } else if (today.diff(lastLogDate, 'days') > 1) {
                gamification.currentStreak = 1;
            }
            
            if (gamification.currentStreak > gamification.longestStreak) {
                gamification.longestStreak = gamification.currentStreak;
            }

            gamification.points += pointsEarned;
            gamification.lastLogDate = new Date();
            await gamification.save();
            streakUpdated = true;
        }

        res.status(201).json({
            status: "success",
            message: `${amount}ml of ${drinkType} logged!`,
            data: intake,
            reward: {
                pointsEarned,
                currentStreak: gamification?.currentStreak || 0
            }
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

export const getTodayProgress = async (req, res) => {
    try {
        const startOfDay = moment().startOf('day').toDate();
        const endOfDay = moment().endOf('day').toDate();

        const logs = await WaterIntake.find({
            user: req.user._id,
            timestamp: { $gte: startOfDay, $lte: endOfDay }
        });

        const totalDrunk = logs.reduce((sum, log) => sum + log.amount, 0);
        const profile = await Profile.findOne({ user: req.user._id });
        const goal = profile?.dailyWaterGoal || 2500;

        // Breakdown by drink type
        const breakdown = logs.reduce((acc, log) => {
            acc[log.drinkType] = (acc[log.drinkType] || 0) + log.amount;
            return acc;
        }, {});

        res.status(200).json({
            status: "success",
            totalDrunk,
            goal,
            percentage: Math.min(Math.round((totalDrunk / goal) * 100), 100),
            breakdown
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

export const getStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const allLogs = await WaterIntake.find({ user: userId });

        if (allLogs.length === 0) {
            return res.status(200).json({
                status: "success",
                data: {
                    averageIntake: 0,
                    averageLogsPerDay: 0,
                    peakIntakeTime: "N/A",
                    averageGoalReach: 0
                }
            });
        }

        // 1. Average Intake Per Log
        const totalAmount = allLogs.reduce((sum, log) => sum + log.amount, 0);
        const averageIntake = Math.round(totalAmount / allLogs.length);

        // 2. Average Logs Per Day
        const uniqueDates = new Set(allLogs.map(log => moment(log.timestamp).format('YYYY-MM-DD')));
        const averageLogsPerDay = Math.round(allLogs.length / uniqueDates.size * 10) / 10;

        // 3. Peak Intake Time
        const hourCounts = allLogs.reduce((acc, log) => {
            const hour = moment(log.timestamp).hour();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {});
        const peakHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b);
        const peakIntakeTime = moment().hour(peakHour).format('h A');

        res.status(200).json({
            status: "success",
            data: {
                averageIntake,
                averageLogsPerDay,
                peakIntakeTime,
                totalDrunkAllTime: totalAmount
            }
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

export const getMonthlyHistory = async (req, res) => {
    try {
        const { year, month } = req.query; // e.g. 2026, 02 (1-indexed or 0-indexed depending on preference, we'll use 1-indexed)
        if (!year || !month) {
            return res.status(400).json({ message: "Year and month are required" });
        }

        const startOfMonth = moment(`${year}-${month}-01`, "YYYY-MM-DD").startOf('month').toDate();
        const endOfMonth = moment(`${year}-${month}-01`, "YYYY-MM-DD").endOf('month').toDate();

        const logs = await WaterIntake.find({
            user: req.user._id,
            timestamp: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const profile = await Profile.findOne({ user: req.user._id });
        const goal = profile?.dailyWaterGoal || 2500;

        // Group by day
        const dailyTotals = logs.reduce((acc, log) => {
            const date = moment(log.timestamp).format('YYYY-MM-DD');
            acc[date] = (acc[date] || 0) + log.amount;
            return acc;
        }, {});

        const history = Object.keys(dailyTotals).map(date => ({
            date,
            total: dailyTotals[date],
            status: dailyTotals[date] >= goal ? "Goal Met" : "Partial"
        }));

        res.status(200).json({
            status: "success",
            data: history
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};
