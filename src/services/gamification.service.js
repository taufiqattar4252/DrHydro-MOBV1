import Gamification from "../models/gamification.model.js";
import Badge from "../models/badge.model.js";
import WaterIntake from "../models/waterIntake.model.js";
import UserChallenge from "../models/userChallenge.model.js";
import Milestone from "../models/milestone.model.js";
import Profile from "../models/profile.model.js";
import moment from "moment";
import {
    BADGES, POINTS, STREAK_MILESTONES,
    CHALLENGE_ACCEPT_BADGES, CHALLENGE_COMPLETE_BADGES
} from "../config/constants.js";

// ─── POINTS ──────────────────────────────────────────────────────────────────

/**
 * Safely add points to a user. Points only go up, never down.
 */
export async function addPoints(userId, points) {
    if (points <= 0) return;
    await Gamification.findOneAndUpdate(
        { user: userId },
        { $inc: { totalPoints: points } },
        { upsert: true }
    );
}

// ─── BADGES ──────────────────────────────────────────────────────────────────

/**
 * Award a badge to a user. Idempotent — skips if already awarded.
 * Returns the badge doc if newly awarded, null if already existed.
 */
export async function awardBadge(userId, badgeId) {
    const badgeDef = BADGES.find(b => b.badgeId === badgeId);
    if (!badgeDef) return null;

    try {
        const badge = await Badge.create({
            user: userId,
            badgeId: badgeDef.badgeId,
            name: badgeDef.name,
            icon: badgeDef.icon,
            trigger: badgeDef.trigger,
            awardedAt: new Date(),
            isNewBadge: true
        });

        // Award bonus points for earning a badge
        await addPoints(userId, POINTS.EARN_BADGE);
        return badge;
    } catch (err) {
        // Duplicate key error (11000) = badge already awarded — this is expected
        if (err.code === 11000) return null;
        throw err;
    }
}

// ─── MASTER EVENT: ON DRINK LOG ──────────────────────────────────────────────

/**
 * Called after every water log. Evaluates all badge/point triggers.
 * Returns an array of newly awarded badges for the API response.
 */
export async function evaluateOnDrinkLog(userId, intake) {
    const newBadges = [];

    try {
        // Ensure gamification profile exists
        let gam = await Gamification.findOne({ user: userId });
        if (!gam) {
            gam = await Gamification.create({ user: userId });
        }

        // +5 points per log
        await addPoints(userId, POINTS.LOG_DRINK);

        // ── B-01: First Sip (first ever drink log) ──
        const totalLogs = await WaterIntake.countDocuments({ user: userId });
        if (totalLogs === 1) {
            const b = await awardBadge(userId, "B-01");
            if (b) newBadges.push(b);
        }

        // ── B-05: Night Owl (drink after 10 PM) ──
        const logHour = moment(intake.timestamp).hour();
        if (logHour >= 22) {
            const b = await awardBadge(userId, "B-05");
            if (b) newBadges.push(b);
        }

        // ── B-06: Early Bird (drink before 8 AM) ──
        if (logHour < 8) {
            const b = await awardBadge(userId, "B-06");
            if (b) newBadges.push(b);
        }

        // ── Check daily goal ──
        const startOfDay = moment(intake.timestamp).startOf("day").toDate();
        const endOfDay = moment(intake.timestamp).endOf("day").toDate();

        const logsToday = await WaterIntake.find({
            user: userId,
            timestamp: { $gte: startOfDay, $lte: endOfDay }
        });

        const totalToday = logsToday.reduce((sum, l) => sum + l.amount, 0);
        const profile = await Profile.findOne({ user: userId });
        const goal = profile?.dailyWaterGoal || 2500;

        if (totalToday >= goal) {
            // Award daily goal points (only once per day)
            const todayStr = moment(intake.timestamp).format("YYYY-MM-DD");
            const lastGoalStr = gam.lastGoalDate ? moment(gam.lastGoalDate).format("YYYY-MM-DD") : null;

            if (todayStr !== lastGoalStr) {
                await addPoints(userId, POINTS.DAILY_GOAL_MET);

                // Update consecutive goal days
                const yesterday = moment(intake.timestamp).subtract(1, "day").format("YYYY-MM-DD");
                if (lastGoalStr === yesterday) {
                    gam.consecutiveGoalDays += 1;
                } else {
                    gam.consecutiveGoalDays = 1;
                }

                gam.lastGoalDate = intake.timestamp;
                await gam.save();

                // ── B-03: Energized (3 consecutive goal-met days) ──
                if (gam.consecutiveGoalDays >= 3) {
                    const b = await awardBadge(userId, "B-03");
                    if (b) newBadges.push(b);
                }

                // ── B-08: On Target (7 consecutive goal-met days) ──
                if (gam.consecutiveGoalDays >= 7) {
                    const b = await awardBadge(userId, "B-08");
                    if (b) newBadges.push(b);
                }
            }
        }

        // ── Evaluate active challenges ──
        const activeChallenges = await UserChallenge.find({
            user: userId,
            status: { $in: ["accepted", "in_progress"] }
        });

        for (const uc of activeChallenges) {
            await evaluateChallengeDay(userId, uc, intake, totalToday, goal, logsToday);
        }

    } catch (err) {
        console.error("evaluateOnDrinkLog error:", err.message);
    }

    return newBadges;
}

// ─── CHALLENGE DAY EVALUATION ────────────────────────────────────────────────

/**
 * Check if today's logs satisfy a specific challenge condition for the given day.
 */
async function evaluateChallengeDay(userId, userChallenge, intake, totalToday, goal, logsToday) {
    try {
        const today = moment(intake.timestamp).startOf("day");
        const challengeStart = moment(userChallenge.startDate).startOf("day");
        const challengeEnd = moment(userChallenge.endDate).startOf("day");

        // Only evaluate if today is within challenge period
        if (today.isBefore(challengeStart) || today.isAfter(challengeEnd)) return;

        // Find today's calendar entry
        const dayIndex = userChallenge.calendarDays.findIndex(
            d => moment(d.date).startOf("day").isSame(today)
        );
        if (dayIndex === -1) return;

        // Already met for today
        if (userChallenge.calendarDays[dayIndex].met) return;

        let conditionMet = false;

        switch (userChallenge.challengeId) {
            case "CH-01": // Early Bird — 300ml before 8 AM
            {
                const earlyLogs = logsToday.filter(l => moment(l.timestamp).hour() < 8);
                const earlyTotal = earlyLogs.reduce((s, l) => s + l.amount, 0);
                conditionMet = earlyTotal >= 300;
                break;
            }

            case "CH-02": // Desk Sip — log every hour during work (9AM–5PM)
            {
                const workHours = new Set();
                logsToday.forEach(l => {
                    const h = moment(l.timestamp).hour();
                    if (h >= 9 && h < 17) workHours.add(h);
                });
                // Need at least 8 unique hours covered (9,10,11,12,13,14,15,16)
                conditionMet = workHours.size >= 8;
                break;
            }

            case "CH-03": // Hydration Hero — 100% goal
            case "CH-04": // Week Warrior — 100% goal
            case "CH-05": // Alcohol Recovery — 100% goal (simplified)
            {
                conditionMet = totalToday >= goal;
                break;
            }
        }

        if (conditionMet) {
            userChallenge.calendarDays[dayIndex].met = true;
            userChallenge.daysCompleted += 1;

            if (userChallenge.status === "accepted") {
                userChallenge.status = "in_progress";
            }

            // Check if challenge is now complete
            if (userChallenge.daysCompleted >= userChallenge.totalDays) {
                userChallenge.status = "completed";
                userChallenge.completedAt = intake.timestamp;

                // Award completion badge & points
                const completeBadgeId = CHALLENGE_COMPLETE_BADGES[userChallenge.challengeId];
                if (completeBadgeId) {
                    await awardBadge(userId, completeBadgeId);
                }
                await addPoints(userId, POINTS.COMPLETE_CHALLENGE);
            }

            await userChallenge.save();

            // Update milestone
            await Milestone.findOneAndUpdate(
                { user: userId, challengeId: userChallenge.challengeId },
                {
                    daysCompleted: userChallenge.daysCompleted,
                    progressPercent: Math.round((userChallenge.daysCompleted / userChallenge.totalDays) * 100),
                    status: userChallenge.status === "completed" ? "completed" : "in_progress"
                }
            );
        }
    } catch (err) {
        console.error("evaluateChallengeDay error:", err.message);
    }
}

// ─── CHALLENGE ACCEPTANCE ────────────────────────────────────────────────────

/**
 * Accept a challenge for a user. Creates UserChallenge + Milestone + awards badge + points.
 */
export async function acceptChallengeForUser(userId, challengeId, challengeDef) {
    // Check if user already has an active or completed instance
    const existing = await UserChallenge.findOne({
        user: userId,
        challengeId,
        status: { $in: ["accepted", "in_progress", "completed"] }
    });

    if (existing) {
        if (existing.status === "completed") {
            throw new Error("Challenge already completed");
        }
        throw new Error("Challenge already in progress");
    }

    // Build calendar days array
    const startDate = new Date();
    const calendarDays = [];
    for (let i = 0; i < challengeDef.durationDays; i++) {
        calendarDays.push({
            date: moment(startDate).add(i, "days").startOf("day").toDate(),
            met: false
        });
    }

    const endDate = moment(startDate).add(challengeDef.durationDays - 1, "days").endOf("day").toDate();

    // Create UserChallenge
    const userChallenge = await UserChallenge.create({
        user: userId,
        challengeId,
        status: "accepted",
        startDate,
        endDate,
        daysCompleted: 0,
        totalDays: challengeDef.durationDays,
        calendarDays
    });

    // Create Milestone
    await Milestone.create({
        user: userId,
        challengeId,
        challengeName: challengeDef.name,
        icon: challengeDef.icon,
        totalDays: challengeDef.durationDays,
        daysCompleted: 0,
        progressPercent: 0,
        status: "in_progress"
    });

    // Award accepted badge (CH-01 → B-09, CH-02 → B-10)
    const acceptBadgeId = CHALLENGE_ACCEPT_BADGES[challengeId];
    let newBadge = null;
    if (acceptBadgeId) {
        newBadge = await awardBadge(userId, acceptBadgeId);
    }

    // Award accept points
    await addPoints(userId, POINTS.ACCEPT_CHALLENGE);

    return { userChallenge, newBadge };
}
