import WaterIntake from "../models/waterIntake.model.js";
import Gamification from "../models/gamification.model.js";
import Profile from "../models/profile.model.js";
import moment from "moment";
import { evaluateOnDrinkLog } from "../services/gamification.service.js";

export const logDrink = async (req, res) => {
    try {
        const { amount, drinkType, timestamp, utcOffset } = req.body;
        
        if (!amount || !drinkType) {
            return res.status(400).json({ message: "Amount and drink type are required" });
        }

        let intakeTime = new Date();
        if (timestamp) {
            const parsed = new Date(timestamp);
            if (!isNaN(parsed.getTime())) {
                intakeTime = parsed;
            } else {
                return res.status(400).json({ message: "Invalid timestamp provided" });
            }
        }

        const intake = await WaterIntake.create({
            user: req.user._id,
            amount,
            drinkType,
            timestamp: intakeTime
        });

        // Update profile with utcOffset and lastLogDate
        const profileUpdate = { lastLogDate: intakeTime };
        if (utcOffset !== undefined) {
            profileUpdate.utcOffset = utcOffset;
        }

        await Profile.findOneAndUpdate(
            { user: req.user._id },
            { $set: profileUpdate },
            { upsert: true }
        );

        // Ensure gamification profile exists
        let gam = await Gamification.findOne({ user: req.user._id });
        if (!gam) {
            gam = await Gamification.create({ user: req.user._id });
        }

        // Run all gamification evaluations (badges, points, challenges)
        const newBadges = await evaluateOnDrinkLog(req.user._id, intake);

        // Reload gam to get updated points
        const updatedGam = await Gamification.findOne({ user: req.user._id });

        res.status(201).json({
            status: "success",
            message: `${amount}ml of ${drinkType} logged!`,
            data: intake,
            reward: {
                pointsEarned: 5,
                totalPoints: updatedGam?.totalPoints || 0,
                currentStreak: updatedGam?.currentStreak || 0,
                newBadges: newBadges.map(b => ({
                    badgeId: b.badgeId,
                    name: b.name,
                    icon: b.icon
                }))
            }
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

export const getTodayProgress = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user._id });
        const userOffset = profile?.utcOffset || 0;

        const startOfDay = moment().utcOffset(userOffset).startOf('day').toDate();
        const endOfDay = moment().utcOffset(userOffset).endOf('day').toDate();

        const logs = await WaterIntake.find({
            user: req.user._id,
            timestamp: { $gte: startOfDay, $lte: endOfDay }
        });

        const totalDrunk = logs.reduce((sum, log) => sum + log.amount, 0);
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

export const getHourlyStats = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user._id });
        const userOffset = profile?.utcOffset || 0;

        const startOfDay = moment().utcOffset(userOffset).startOf('day').toDate();
        const endOfDay = moment().utcOffset(userOffset).endOf('day').toDate();

        const logs = await WaterIntake.find({
            user: req.user._id,
            timestamp: { $gte: startOfDay, $lte: endOfDay }
        });

        const hourlyData = logs.reduce((acc, log) => {
            const hour = moment(log.timestamp).utcOffset(userOffset).format('h A');
            acc[hour] = (acc[hour] || 0) + log.amount;
            return acc;
        }, {});

        res.status(200).json({
            status: "success",
            data: hourlyData
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

        const profile = await Profile.findOne({ user: userId });
        const userOffset = profile?.utcOffset || 0;
        const goal = profile?.dailyWaterGoal || 2500;

        // 2. Average Logs Per Day
        const uniqueDates = new Set(allLogs.map(log => moment(log.timestamp).utcOffset(userOffset).format('YYYY-MM-DD')));
        const averageLogsPerDay = Math.round(allLogs.length / uniqueDates.size * 10) / 10;

        // 3. Peak Intake Time
        const hourCounts = allLogs.reduce((acc, log) => {
            const hour = moment(log.timestamp).utcOffset(userOffset).hour();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {});
        const peakHour = Object.keys(hourCounts).length > 0 
            ? Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b)
            : 12;
        const peakIntakeTime = moment().utcOffset(userOffset).hour(peakHour).format('h A');

        // 4. Weekly Average Intake Percentage
        const sevenDaysAgo = moment().utcOffset(userOffset).subtract(7, 'days').startOf('day').toDate();
        const weeklyLogs = await WaterIntake.find({
            user: userId,
            timestamp: { $gte: sevenDaysAgo }
        });
        
        const dailyTotals = weeklyLogs.reduce((acc, log) => {
            const date = moment(log.timestamp).utcOffset(userOffset).format('YYYY-MM-DD');
            acc[date] = (acc[date] || 0) + log.amount;
            return acc;
        }, {});
        
        const daysCount = Object.keys(dailyTotals).length || 1;
        const totalWeeklyIntake = Object.values(dailyTotals).reduce((sum, val) => sum + val, 0);
        const averageWeeklyIntake = totalWeeklyIntake / daysCount;
        const averageIntakePercentage = Math.round((averageWeeklyIntake / goal) * 100);

        res.status(200).json({
            status: "success",
            data: {
                averageIntake,
                averageLogsPerDay,
                peakIntakeTime,
                totalDrunkAllTime: totalAmount,
                averageIntakePercentage
            }
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

export const getWeeklyProgress = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user._id });
        const userOffset = profile?.utcOffset || 0;

        const startOfWeekly = moment().utcOffset(userOffset).startOf('isoWeek').toDate(); // Monday
        const endOfWeekly = moment().utcOffset(userOffset).endOf('isoWeek').toDate(); // Sunday

        const logs = await WaterIntake.find({
            user: req.user._id,
            timestamp: { $gte: startOfWeekly, $lte: endOfWeekly }
        });

        // Group by day for the current week (Monday to Sunday)
        const dailyTotals = {};
        for (let i = 0; i < 7; i++) {
            const date = moment().utcOffset(userOffset).startOf('isoWeek').add(i, 'days').format('YYYY-MM-DD');
            dailyTotals[date] = 0;
        }

        logs.forEach(log => {
            const date = moment(log.timestamp).utcOffset(userOffset).format('YYYY-MM-DD');
            if (dailyTotals[date] !== undefined) {
                dailyTotals[date] += log.amount;
            }
        });

        res.status(200).json({
            status: "success",
            data: Object.keys(dailyTotals).map(date => ({
                date,
                total: dailyTotals[date],
                dayName: moment(date).format('ddd')
            }))
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

export const getMonthlyProgress = async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user._id });
        const userOffset = profile?.utcOffset || 0;

        const startOfMonth = moment().utcOffset(userOffset).startOf('month').toDate();
        const endOfMonth = moment().utcOffset(userOffset).endOf('month').toDate();

        const logs = await WaterIntake.find({
            user: req.user._id,
            timestamp: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const weeklyTotals = {
            "Week 1": 0,
            "Week 2": 0,
            "Week 3": 0,
            "Week 4": 0
        };

        logs.forEach(log => {
            const day = moment(log.timestamp).utcOffset(userOffset).date();
            if (day <= 7) weeklyTotals["Week 1"] += log.amount;
            else if (day <= 14) weeklyTotals["Week 2"] += log.amount;
            else if (day <= 21) weeklyTotals["Week 3"] += log.amount;
            else weeklyTotals["Week 4"] += log.amount;
        });

        res.status(200).json({
            status: "success",
            data: Object.keys(weeklyTotals).map(week => ({
                label: week,
                total: weeklyTotals[week]
            }))
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};

export const getMonthlyHistory = async (req, res) => {
    try {
        const { year, month } = req.query;
        if (!year || !month) {
            return res.status(400).json({ message: "Year and month are required" });
        }

        const profile = await Profile.findOne({ user: req.user._id });
        const userOffset = profile?.utcOffset || 0;
        const goal = profile?.dailyWaterGoal || 2500;

        const startOfMonth = moment(`${year}-${month}-01`, "YYYY-MM-DD").utcOffset(userOffset).startOf('month').toDate();
        const endOfMonth = moment(`${year}-${month}-01`, "YYYY-MM-DD").utcOffset(userOffset).endOf('month').toDate();

        const logs = await WaterIntake.find({
            user: req.user._id,
            timestamp: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // Group by day
        const dailyTotals = logs.reduce((acc, log) => {
            const date = moment(log.timestamp).utcOffset(userOffset).format('YYYY-MM-DD');
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
