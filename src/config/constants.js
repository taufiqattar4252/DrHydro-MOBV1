// ─── DrHydro Gamification Constants ───────────────────────────────────────────

export const CHALLENGES = [
    {
        challengeId: "CH-01",
        name: "Early Bird",
        description: "Drink 300ml before 8 AM",
        dailyGoal: "Drink 300ml before 8 AM",
        durationDays: 7,
        badgeOnComplete: "B-09",
        badgeOnAccept: null, 
        icon: "🌅",
        condition: "EARLY_BIRD" // used by evaluator
    },
    {
        challengeId: "CH-02",
        name: "Desk Sip",
        description: "Log every 1 hour during work hours",
        dailyGoal: "Log every 1h during work (9AM-5PM)",
        durationDays: 5,
        badgeOnComplete: "B-10",
        badgeOnAccept: null,
        icon: "💻",
        condition: "DESK_SIP"
    },
    {
        challengeId: "CH-03",
        name: "Hydration Hero",
        description: "Hit 100% goal for 5 days",
        dailyGoal: "Hit 100% daily water goal",
        durationDays: 5,
        badgeOnComplete: "B-11",
        badgeOnAccept: null,
        icon: "🦸",
        condition: "GOAL_MET"
    },
    {
        challengeId: "CH-04",
        name: "Week Warrior",
        description: "Hit 100% goal for 7 days",
        dailyGoal: "Hit 100% daily water goal",
        durationDays: 7,
        badgeOnComplete: "B-12",
        badgeOnAccept: null,
        icon: "⚔️",
        condition: "GOAL_MET"
    },
    {
        challengeId: "CH-05",
        name: "Alcohol Recovery",
        description: "Replace alcohol with water for 3 days",
        dailyGoal: "Log only water / non-alcohol drinks",
        durationDays: 3,
        badgeOnComplete: "B-13",
        badgeOnAccept: null,
        icon: "🌿",
        condition: "GOAL_MET"
    }
];

export const BADGES = [
    { badgeId: "B-01", name: "First Sip",        icon: "💧", trigger: "First drink logged" },
    { badgeId: "B-02", name: "Wave Maker",       icon: "🌊", trigger: "7-day streak achieved" },
    { badgeId: "B-03", name: "Energized",         icon: "⚡", trigger: "Hit 100% goal for 3 consecutive days" },
    { badgeId: "B-04", name: "Champion",          icon: "🏆", trigger: "30-day streak achieved" },
    { badgeId: "B-05", name: "Night Owl",         icon: "🌙", trigger: "Drink logged after 10 PM" },
    { badgeId: "B-06", name: "Early Bird",        icon: "🌅", trigger: "Drink logged before 8 AM" },
    { badgeId: "B-07", name: "Consistent",        icon: "💪", trigger: "14-day streak achieved" },
    { badgeId: "B-08", name: "On Target",         icon: "🎯", trigger: "7 consecutive days of 100% goal" },
    { badgeId: "B-09", name: "Early Bird Ch.",    icon: "🌅", trigger: "Challenge CH-01 completed" },
    { badgeId: "B-10", name: "Desk Sip Ch.",      icon: "💻", trigger: "Challenge CH-02 completed" },
    { badgeId: "B-11", name: "Hero Badge",        icon: "🦸", trigger: "Challenge CH-03 completed" },
    { badgeId: "B-12", name: "Warrior Badge",     icon: "⚔️", trigger: "Challenge CH-04 completed" },
    { badgeId: "B-13", name: "Recovery Badge",    icon: "🌿", trigger: "Challenge CH-05 completed" },
    { badgeId: "B-14", name: "Referral Badge",    icon: "🤝", trigger: "User shares and 1 friend joins" }
];

export const POINTS = {
    LOG_DRINK: 5,
    DAILY_GOAL_MET: 20,
    ACCEPT_CHALLENGE: 50,
    COMPLETE_CHALLENGE: 200,
    STREAK_7: 100,
    STREAK_14: 250,
    STREAK_30: 500,
    EARN_BADGE: 30,
    REFERRAL: 75,
    COMPLETE_PROFILE: 25
};

export const STREAK_MILESTONES = [
    { days: 7,  badgeId: "B-02", points: 100 },
    { days: 14, badgeId: "B-07", points: 250 },
    { days: 30, badgeId: "B-04", points: 500 }
];

// Badge IDs awarded when a challenge is ACCEPTED
export const CHALLENGE_ACCEPT_BADGES = {
    // None per updated requirement
};

// Badge IDs awarded when a challenge is COMPLETED
export const CHALLENGE_COMPLETE_BADGES = {
    "CH-01": "B-09",
    "CH-02": "B-10",
    "CH-03": "B-11",
    "CH-04": "B-12",
    "CH-05": "B-13"
};
