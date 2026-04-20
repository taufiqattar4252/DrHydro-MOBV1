import Gamification from "../models/gamification.model.js";
import WaterIntake from "../models/waterIntake.model.js";
import UserChallenge from "../models/userChallenge.model.js";
import Milestone from "../models/milestone.model.js";
import Profile from "../models/profile.model.js";
import userModel from "../models/user.model.js";
import moment from "moment";
import { awardBadge, addPoints, failChallenge } from "./gamification.service.js";
import { STREAK_MILESTONES } from "../config/constants.js";

/**
 * Daily streak evaluation — called by cron at 00:01.
 * For each user: check yesterday's water intake vs daily goal.
 * Increments or resets streak, awards streak milestone badges and points.
 */
export async function evaluateAllStreaks() {
    console.log("⏰ Running daily streak evaluation...");

    try {
        const users = await Gamification.find();

        for (const gam of users) {
            try {
                // Get user's profile for timezone and goal
                const profile = await Profile.findOne({ user: gam.user });
                const userOffset = profile?.utcOffset || 0;
                const goal = profile?.dailyWaterGoal || 2500;

                // Time definitions in user's timezone
                const yesterday = moment().utcOffset(userOffset).subtract(1, "day");
                const startOfYesterday = yesterday.startOf("day").toDate();
                const endOfYesterday = yesterday.endOf("day").toDate();
                const today = moment().utcOffset(userOffset).startOf("day");

                // Calculate yesterday's total intake
                const logs = await WaterIntake.find({
                    user: gam.user,
                    timestamp: { $gte: startOfYesterday, $lte: endOfYesterday }
                });

                const totalDrunk = logs.reduce((sum, l) => sum + l.amount, 0);

                if (totalDrunk >= goal) {
                    // Goal met — increment streak
                    gam.currentStreak += 1;
                    gam.lastGoalDate = startOfYesterday;

                    if (gam.currentStreak > gam.longestStreak) {
                        gam.longestStreak = gam.currentStreak;
                    }

                    // Check streak milestones
                    for (const milestone of STREAK_MILESTONES) {
                        if (
                            gam.currentStreak >= milestone.days &&
                            !gam.streakMilestonesAwarded.includes(milestone.days)
                        ) {
                            await awardBadge(gam.user, milestone.badgeId);
                            await addPoints(gam.user, milestone.points);
                            gam.streakMilestonesAwarded.push(milestone.days);
                        }
                    }
                } else {
                    // Goal not met — reset streak
                    gam.currentStreak = 0;
                    // Also reset consecutive goal days
                    gam.consecutiveGoalDays = 0;
                }

                await gam.save();

                // ── Fail-Fast and Expired challenges ──
                const activeChallenges = await UserChallenge.find({
                    user: gam.user,
                    status: { $in: ["accepted", "in_progress"] }
                });

                for (const uc of activeChallenges) {
                    // 1. Check if expired
                    // Note: We use isSameOrAfter(today) to keep it active until the very end of its last day
                    if (moment(uc.endDate).utcOffset(userOffset).startOf("day").isBefore(today)) {
                        if (uc.daysCompleted < uc.totalDays) {
                            await failChallenge(gam.user, uc.challengeId);
                        }
                        continue;
                    }

                    // 2. Check if impossible to complete (Fail-Fast)
                    // Count remaining days (today included as it hasn't been evaluated by cron yet)
                    const daysRemaining = uc.calendarDays.filter(
                        d => moment(d.date).utcOffset(userOffset).startOf("day").isSameOrAfter(today)
                    ).length;

                    const daysNeeded = uc.totalDays - uc.daysCompleted;

                    if (daysNeeded > daysRemaining) {
                        await failChallenge(gam.user, uc.challengeId);
                    }
                }

            } catch (err) {
                console.error(`Streak error for user ${gam.user}:`, err.message);
            }
        }

        console.log(`✅ Streak evaluation complete for ${users.length} users.`);
    } catch (err) {
        console.error("❌ evaluateAllStreaks error:", err.message);
    }
}
