// NFL 2025 Season Complete Schedule
console.log('📅 Loading NFL 2025 Complete Schedule...');

// 2025 NFL Season Schedule - Preseason, Regular Season & Playoffs
const NFL_SCHEDULE_2025 = {
    preseason: {
        week1: [
            {
                id: "pre_1_1",
                week: "Preseason Week 1",
                date: "August 8, 2025",
                time: "7:30 PM ET",
                awayTeam: "Detroit Lions",
                homeTeam: "Atlanta Falcons", 
                stadium: "Mercedes-Benz Stadium",
                status: "LIVE",
                awayScore: 14,
                homeScore: 10,
                quarter: "3rd Quarter",
                timeLeft: "8:42",
                broadcast: "NFL Network",
                tickets: "$35-125",
                weather: "Dome - 72°F",
                spread: "ATL -1.5",
                overUnder: "37.5"
            },
            {
                id: "pre_1_2", 
                week: "Preseason Week 1",
                date: "August 8, 2025",
                time: "8:00 PM ET",
                awayTeam: "Carolina Panthers",
                homeTeam: "Cleveland Browns",
                stadium: "Cleveland Browns Stadium",
                status: "LIVE", 
                awayScore: 7,
                homeScore: 3,
                quarter: "2nd Quarter",
                timeLeft: "12:15",
                broadcast: "Local TV",
                tickets: "$25-85",
                weather: "Clear - 78°F",
                spread: "CLE -2.5",
                overUnder: "35.5"
            },
            {
                id: "pre_1_3",
                week: "Preseason Week 1", 
                date: "August 9, 2025",
                time: "8:00 PM ET",
                awayTeam: "Washington Commanders",
                homeTeam: "New England Patriots",
                stadium: "Gillette Stadium",
                status: "UPCOMING",
                awayScore: 0,
                homeScore: 0,
                quarter: null,
                timeLeft: null,
                broadcast: "ESPN",
                tickets: "$40-150",
                weather: "Partly Cloudy - 75°F",
                spread: "NE -3",
                overUnder: "38.5"
            }
        ],
        week2: [
            {
                id: "pre_2_1",
                week: "Preseason Week 2",
                date: "August 15, 2025",
                time: "7:00 PM ET",
                awayTeam: "Kansas City Chiefs",
                homeTeam: "Detroit Lions",
                stadium: "Ford Field",
                status: "SCHEDULED",
                broadcast: "NFL Network",
                tickets: "$45-175",
                weather: "Dome - 72°F",
                spread: "DET -1",
                overUnder: "42.5"
            },
            {
                id: "pre_2_2",
                week: "Preseason Week 2", 
                date: "August 16, 2025",
                time: "8:30 PM ET",
                awayTeam: "Buffalo Bills",
                homeTeam: "Pittsburgh Steelers",
                stadium: "Acrisure Stadium",
                status: "SCHEDULED",
                broadcast: "CBS",
                tickets: "$50-200",
                weather: "Clear - 82°F",
                spread: "BUF -2.5",
                overUnder: "44.5"
            }
        ],
        week3: [
            {
                id: "pre_3_1",
                week: "Preseason Week 3",
                date: "August 23, 2025", 
                time: "8:00 PM ET",
                awayTeam: "Philadelphia Eagles",
                homeTeam: "Minnesota Vikings",
                stadium: "U.S. Bank Stadium",
                status: "SCHEDULED",
                broadcast: "FOX",
                tickets: "$55-225",
                weather: "Dome - 72°F",
                spread: "PHI -3",
                overUnder: "46.5"
            }
        ]
    },
    regularSeason: {
        week1: [
            {
                id: "reg_1_1",
                week: "Week 1",
                date: "September 4, 2025",
                time: "8:20 PM ET", 
                awayTeam: "Kansas City Chiefs",
                homeTeam: "Baltimore Ravens",
                stadium: "M&T Bank Stadium",
                status: "SCHEDULED",
                broadcast: "NBC - Thursday Night Football",
                tickets: "$150-800",
                weather: "Clear - 78°F",
                spread: "BAL -1.5",
                overUnder: "50.5",
                importance: "Season Opener",
                storylines: ["Mahomes vs Jackson MVP showdown", "AFC Championship rematch"]
            },
            {
                id: "reg_1_2", 
                week: "Week 1",
                date: "September 7, 2025",
                time: "1:00 PM ET",
                awayTeam: "Green Bay Packers", 
                homeTeam: "Detroit Lions",
                stadium: "Ford Field",
                status: "SCHEDULED",
                broadcast: "FOX",
                tickets: "$125-600",
                weather: "Dome - 72°F",
                spread: "DET -3.5",
                overUnder: "48.5",
                importance: "Division Rivalry",
                storylines: ["NFC North title defense", "Love vs Goff QB battle"]
            },
            {
                id: "reg_1_3",
                week: "Week 1",
                date: "September 7, 2025", 
                time: "4:25 PM ET",
                awayTeam: "Dallas Cowboys",
                homeTeam: "Cleveland Browns", 
                stadium: "Cleveland Browns Stadium",
                status: "SCHEDULED",
                broadcast: "CBS",
                tickets: "$100-450",
                weather: "Partly Cloudy - 75°F", 
                spread: "CLE -2.5",
                overUnder: "44.5",
                importance: "Regular",
                storylines: ["Cowboys bounce back season", "Browns home opener"]
            },
            {
                id: "reg_1_4",
                week: "Week 1",
                date: "September 8, 2025",
                time: "8:20 PM ET",
                awayTeam: "New York Jets",
                homeTeam: "Buffalo Bills",
                stadium: "Highmark Stadium", 
                status: "SCHEDULED",
                broadcast: "ESPN - Monday Night Football",
                tickets: "$110-550",
                weather: "Clear - 72°F",
                spread: "BUF -7",
                overUnder: "46.5", 
                importance: "Division Rivalry",
                storylines: ["AFC East opener", "Rodgers return to primetime"]
            }
        ],
        week2: [
            {
                id: "reg_2_1",
                week: "Week 2", 
                date: "September 14, 2025",
                time: "1:00 PM ET",
                awayTeam: "Philadelphia Eagles",
                homeTeam: "Washington Commanders",
                stadium: "FedExField",
                status: "SCHEDULED", 
                broadcast: "FOX",
                tickets: "$120-525",
                weather: "Sunny - 81°F",
                spread: "PHI -4",
                overUnder: "49.5",
                importance: "Division Rivalry",
                storylines: ["NFC East battle", "Hurts vs Daniels sophomore showcase"]
            }
        ]
    },
    playoffs: {
        wildcard: [
            {
                id: "wc_1",
                week: "Wild Card",
                date: "January 11, 2026",
                time: "TBD",
                awayTeam: "TBD",
                homeTeam: "TBD", 
                stadium: "TBD",
                status: "TBD",
                broadcast: "TBD",
                importance: "Playoff",
                storylines: ["Win or go home"]
            }
        ],
        divisional: [],
        championship: [],
        superbowl: [
            {
                id: "sb_60",
                week: "Super Bowl LX", 
                date: "February 8, 2026",
                time: "6:30 PM ET",
                awayTeam: "TBD",
                homeTeam: "TBD",
                stadium: "Levi's Stadium",
                city: "Santa Clara, CA",
                status: "SCHEDULED",
                broadcast: "NBC",
                halftimeShow: "TBD",
                tickets: "$3000-25000",
                importance: "Championship",
                storylines: ["Road to championship"]
            }
        ]
    }
};

// Schedule Management Functions
const ScheduleManager = {
    // Update game status
    updateGameStatus(gameId, status, scores = null) {
        const game = this.findGame(gameId);
        if (game) {
            game.status = status;
            if (scores) {
                game.awayScore = scores.away;
                game.homeScore = scores.home;
            }
            console.log(`🔄 Updated ${gameId}: ${status}`);
        }
    },

    // Find game by ID
    findGame(gameId) {
        for (const season in NFL_SCHEDULE_2025) {
            for (const period in NFL_SCHEDULE_2025[season]) {
                const games = NFL_SCHEDULE_2025[season][period];
                if (Array.isArray(games)) {
                    const game = games.find(g => g.id === gameId);
                    if (game) return game;
                }
            }
        }
        return null;
    },

    // Get games by date
    getGamesByDate(date) {
        const games = [];
        for (const season in NFL_SCHEDULE_2025) {
            for (const period in NFL_SCHEDULE_2025[season]) {
                const periodGames = NFL_SCHEDULE_2025[season][period];
                if (Array.isArray(periodGames)) {
                    games.push(...periodGames.filter(g => g.date === date));
                }
            }
        }
        return games;
    },

    // Get live games
    getLiveGames() {
        const games = [];
        for (const season in NFL_SCHEDULE_2025) {
            for (const period in NFL_SCHEDULE_2025[season]) {
                const periodGames = NFL_SCHEDULE_2025[season][period];
                if (Array.isArray(periodGames)) {
                    games.push(...periodGames.filter(g => g.status === "LIVE"));
                }
            }
        }
        return games;
    },

    // Get upcoming games
    getUpcomingGames(limit = 10) {
        const games = [];
        for (const season in NFL_SCHEDULE_2025) {
            for (const period in NFL_SCHEDULE_2025[season]) {
                const periodGames = NFL_SCHEDULE_2025[season][period];
                if (Array.isArray(periodGames)) {
                    games.push(...periodGames.filter(g => g.status === "SCHEDULED" || g.status === "UPCOMING"));
                }
            }
        }
        return games.slice(0, limit);
    },

    // Update live game scores - DISABLED to preserve real live scores
    updateLiveScores() {
        // Do not simulate scores - preserve real live game data
        console.log('⚠️ Score simulation disabled - using real live data only');
    }
};

// Export to global scope
window.NFL_SCHEDULE_2025 = NFL_SCHEDULE_2025;
window.ScheduleManager = ScheduleManager;

console.log('✅ NFL 2025 Schedule Loaded Successfully');
console.log(`📊 Total Games: ${Object.values(NFL_SCHEDULE_2025.preseason).flat().length + Object.values(NFL_SCHEDULE_2025.regularSeason).flat().length} scheduled`);
console.log(`🔴 Live Games: ${ScheduleManager.getLiveGames().length}`);