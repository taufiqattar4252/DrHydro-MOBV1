import Gamification from "../models/gamification.model.js";
import WaterIntake from "../models/waterIntake.model.js";
import Profile from "../models/profile.model.js";
import moment from "moment";

export const evaluateAchievements = async (userId, newLog) => {
    try {
        const gamification = await Gamification.findOne({ user: userId });
        if (!gamification) return;

        const today = moment().startOf('day');
        const logsToday = await WaterIntake.find({
            user: userId,
            timestamp: { $gte: today.toDate(), $lte: moment().endOf('day').toDate() }
        });

        // --- BADGE LOGIC ---

        // 1. First Sip
        if (!gamification.badges.find(b => b.name === "First Sip")) {
            gamification.badges.push({ name: "First Sip", unlockedAt: new Date() });
        }

        // 2. Wave Maker (5+ drinks in a day)
        if (logsToday.length >= 5 && !gamification.badges.find(b => b.name === "Wave Maker")) {
            gamification.badges.push({ name: "Wave Maker", unlockedAt: new Date() });
        }

        // 3. Goal Getter (Hit 100% daily goal)
        const profile = await Profile.findOne({ user: userId });
        const goal = profile?.dailyWaterGoal || 2500;
        const totalDrunkToday = logsToday.reduce((sum, log) => sum + log.amount, 0);

        if (totalDrunkToday >= goal && !gamification.badges.find(b => b.name === "Goal Getter")) {
            gamification.badges.push({ name: "Goal Getter", unlockedAt: new Date() });
        }

        // 4. Night Owl (Drink after 10 PM)
        if (moment().hour() >= 22 && !gamification.badges.find(b => b.name === "Night Owl")) {
            gamification.badges.push({ name: "Night Owl", unlockedAt: new Date() });
        }

        // --- CHALLENGE LOGIC ---

        // 1. Early Bird (Drink before 8 AM)
        const earlyBirdIdx = gamification.challenges.findIndex(c => c.challengeId === "early_bird");
        if (moment().hour() < 8) {
            if (earlyBirdIdx === -1) {
                gamification.challenges.push({ challengeId: "early_bird", status: "Completed", progress: 100 });
            } else if (gamification.challenges[earlyBirdIdx].status !== "Completed") {
                gamification.challenges[earlyBirdIdx].status = "Completed";
                gamification.challenges[earlyBirdIdx].progress = 100;
            }
        }

        // 2. Hydration Hero (7 days streak)
        if (gamification.currentStreak >= 7) {
            const heroIdx = gamification.challenges.findIndex(c => c.challengeId === "hydration_hero");
            if (heroIdx === -1) {
                gamification.challenges.push({ challengeId: "hydration_hero", status: "Completed", progress: 100 });
            } else {
                gamification.challenges[heroIdx].status = "Completed";
                gamification.challenges[heroIdx].progress = 100;
            }
        }

        // 3. Variety King (3+ different drink types in a day)
        const uniqueDrinks = new Set(logsToday.map(l => l.drinkType));
        if (uniqueDrinks.size >= 3) {
            const varietyIdx = gamification.challenges.findIndex(c => c.challengeId === "variety_king");
            if (varietyIdx === -1) {
                gamification.challenges.push({ challengeId: "variety_king", status: "Completed", progress: 100 });
            } else {
                gamification.challenges[varietyIdx].status = "Completed";
                gamification.challenges[varietyIdx].progress = 100;
            }
        }

        await gamification.save();
        return gamification;
    } catch (err) {
        console.error("Gamification error:", err.message);
    }
};
