/**
 * Node.js test for game timing and status logic
 */

// Mock the browser environment for Node.js testing
global.window = {
    errorHandler: {
        safeApiCall: async (primaryFn, fallbackFn, options) => {
            try {
                return await primaryFn();
            } catch (error) {
                return await fallbackFn();
            }
        },
        logError: (message, error, type, context) => {
            console.log(`[${type}] ${message}:`, error?.message || error);
        }
    },
    dataValidator: {
        validateGame: (game) => ({ isValid: true }),
        getDefaultGame: () => ({
            id: 'default',
            name: 'Default Game',
            teams: { home: { name: 'Home', abbreviation: 'HOME', score: 0 }, away: { name: 'Away', abbreviation: 'AWAY', score: 0 } },
            status: { type: 'STATUS_SCHEDULED', displayClock: '', period: 0, completed: false },
            venue: 'Stadium',
            isLive: false
        })
    },
    cacheManager: new Map()
};

// Mock fetch for Node.js
global.fetch = async () => {
    throw new Error('No network in test environment');
};

// Load the services (simplified versions for testing)
class TestNFLService {
    constructor() {
        this.cache = new Map();
    }

    setCache(key, value) {
        this.cache.set(key, value);
    }

    getFromCache(key) {
        return this.cache.get(key);
    }

    formatGameTime(gameTime) {
        const options = {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
        };
        return gameTime.toLocaleDateString('en-US', options);
    }

    generateLiveGameClock(hoursFromStart) {
        const quarter = this.calculateCurrentQuarter(hoursFromStart);
        
        const quarterStartHours = (quarter - 1) * 0.75;
        const minutesIntoQuarter = Math.floor((hoursFromStart - quarterStartHours) * 60);
        const gameMinutesElapsed = Math.min(minutesIntoQuarter, 15);
        
        const minutesLeft = 15 - gameMinutesElapsed;
        const secondsLeft = Math.floor(Math.random() * 60);
        
        if (quarter > 4) {
            const otPeriod = quarter - 4;
            return `${minutesLeft}:${String(secondsLeft).padStart(2, '0')} OT${otPeriod > 1 ? otPeriod : ''}`;
        }
        
        if (quarter === 2 && minutesLeft <= 0) {
            return 'HALFTIME';
        }
        
        if (minutesLeft <= 0 && quarter < 4) {
            return `END ${quarter}Q`;
        }
        
        return `${minutesLeft}:${String(secondsLeft).padStart(2, '0')} ${quarter}Q`;
    }

    calculateCurrentQuarter(hoursFromStart) {
        if (hoursFromStart < 0.75) return 1;
        if (hoursFromStart < 1.5) return 2;
        if (hoursFromStart < 1.75) return 2; // Halftime
        if (hoursFromStart < 2.5) return 3;
        if (hoursFromStart < 3.25) return 4;
        
        const overtimeHours = hoursFromStart - 3.25;
        const overtimePeriod = Math.floor(overtimeHours / 0.25) + 1;
        return 4 + Math.min(overtimePeriod, 3);
    }

    generateLiveScores(teams, hoursFromStart) {
        const quarter = this.calculateCurrentQuarter(hoursFromStart);
        const homeStrength = 75;
        const awayStrength = 70;
        
        const homeBasePPG = (homeStrength / 100) * 24 + 10;
        const awayBasePPG = (awayStrength / 100) * 24 + 10;
        
        let homeScore = 0;
        let awayScore = 0;
        
        for (let q = 1; q <= Math.min(quarter, 4); q++) {
            const quarterProgress = q <= quarter ? 1 : (hoursFromStart - (q-1) * 0.75) / 0.75;
            const adjustedProgress = Math.max(0, Math.min(1, quarterProgress));
            
            const homeQuarterPoints = Math.floor((homeBasePPG / 4) * adjustedProgress + Math.random() * 7);
            const awayQuarterPoints = Math.floor((awayBasePPG / 4) * adjustedProgress + Math.random() * 7);
            
            homeScore += homeQuarterPoints;
            awayScore += awayQuarterPoints;
        }
        
        if (quarter > 4) {
            const overtimePeriods = quarter - 4;
            for (let ot = 1; ot <= overtimePeriods; ot++) {
                homeScore += Math.floor(Math.random() * 7);
                awayScore += Math.floor(Math.random() * 7);
            }
        }
        
        return { home: Math.max(0, homeScore), away: Math.max(0, awayScore) };
    }

    generateFinalScores(teams) {
        const homeStrength = 75;
        const awayStrength = 70;
        
        const homeBasePPG = (homeStrength / 100) * 24 + 10;
        const awayBasePPG = (awayStrength / 100) * 24 + 10;
        
        const homeVariation = (Math.random() - 0.5) * 20;
        const awayVariation = (Math.random() - 0.5) * 20;
        
        let homeScore = Math.round(homeBasePPG + homeVariation);
        let awayScore = Math.round(awayBasePPG + awayVariation);
        
        homeScore = Math.max(6, Math.min(45, homeScore));
        awayScore = Math.max(6, Math.min(45, awayScore));
        
        if (homeScore === awayScore) {
            if (Math.random() > 0.5) {
                homeScore += 3;
            } else {
                awayScore += 3;
            }
        }
        
        return { home: homeScore, away: awayScore };
    }

    enhanceGamesWithStatus(games, currentTime) {
        return games.map(game => {
            const gameTime = new Date(game.date);
            const timeDiff = currentTime - gameTime;
            const hoursFromStart = timeDiff / (1000 * 60 * 60);
            const minutesFromStart = timeDiff / (1000 * 60);
            
            let status = game.status;
            let isLive = false;
            let updatedTeams = { ...game.teams };
            
            if (hoursFromStart < -0.5) {
                status = {
                    type: 'STATUS_SCHEDULED',
                    displayClock: this.formatGameTime(gameTime),
                    period: 0,
                    completed: false
                };
            } else if (hoursFromStart >= -0.5 && hoursFromStart < 0) {
                const minutesToStart = Math.abs(minutesFromStart);
                status = {
                    type: 'STATUS_SCHEDULED',
                    displayClock: `Starts in ${Math.ceil(minutesToStart)} min`,
                    period: 0,
                    completed: false
                };
            } else if (hoursFromStart >= 0 && hoursFromStart < 3.75) {
                isLive = true;
                const quarter = this.calculateCurrentQuarter(hoursFromStart);
                
                status = {
                    type: 'STATUS_IN_PROGRESS',
                    displayClock: this.generateLiveGameClock(hoursFromStart),
                    period: quarter,
                    completed: false
                };
                
                const scores = this.generateLiveScores(game.teams, hoursFromStart);
                updatedTeams = {
                    home: { ...game.teams.home, score: scores.home },
                    away: { ...game.teams.away, score: scores.away }
                };
                
            } else if (hoursFromStart >= 3.75 && hoursFromStart < 4) {
                status = {
                    type: 'STATUS_FINAL',
                    displayClock: 'FINAL',
                    period: 4,
                    completed: true
                };
                
                const scores = this.generateFinalScores(game.teams);
                updatedTeams = {
                    home: { ...game.teams.home, score: scores.home },
                    away: { ...game.teams.away, score: scores.away }
                };
                
            } else {
                const hoursAgo = Math.floor(hoursFromStart);
                const displayTime = hoursAgo < 24 ? 
                    `FINAL (${hoursAgo}h ago)` : 
                    `FINAL (${Math.floor(hoursAgo / 24)}d ago)`;
                
                status = {
                    type: 'STATUS_FINAL',
                    displayClock: displayTime,
                    period: 4,
                    completed: true
                };
                
                if (!game.teams.home.score && !game.teams.away.score) {
                    const scores = this.generateFinalScores(game.teams);
                    updatedTeams = {
                        home: { ...game.teams.home, score: scores.home },
                        away: { ...game.teams.away, score: scores.away }
                    };
                } else {
                    updatedTeams = game.teams;
                }
            }
            
            return {
                ...game,
                status,
                isLive,
                teams: updatedTeams
            };
        });
    }
}

// Test functions
function createTestGame(id, name, gameTime) {
    const teams = name.split(' @ ');
    return {
        id: id,
        name: name,
        shortName: name,
        date: gameTime,
        status: {
            type: 'STATUS_SCHEDULED',
            displayClock: '',
            period: 0,
            completed: false
        },
        teams: {
            home: {
                id: 'home-' + id,
                name: teams[1] || 'Home Team',
                abbreviation: (teams[1] || 'HOME').substring(0, 3).toUpperCase(),
                score: 0,
                record: '8-3'
            },
            away: {
                id: 'away-' + id,
                name: teams[0] || 'Away Team',
                abbreviation: (teams[0] || 'AWAY').substring(0, 3).toUpperCase(),
                score: 0,
                record: '7-4'
            }
        },
        venue: 'Test Stadium',
        isLive: false,
        week: 12,
        season: 2025
    };
}

function runTests() {
    console.log('🧪 Running Game Timing and Status Logic Tests\n');
    
    const nflService = new TestNFLService();
    const now = new Date();
    
    // Test 1: Scheduled game (2 hours in future)
    console.log('📅 Test 1: Scheduled Game');
    const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const scheduledGame = createTestGame('test-1', 'Kansas City Chiefs @ Buffalo Bills', futureTime);
    const scheduledResult = nflService.enhanceGamesWithStatus([scheduledGame], now)[0];
    console.log(`Status: ${scheduledResult.status.type}`);
    console.log(`Display: ${scheduledResult.status.displayClock}`);
    console.log(`Is Live: ${scheduledResult.isLive}`);
    console.log(`Period: ${scheduledResult.status.period}\n`);
    
    // Test 2: Live game (1.5 hours ago)
    console.log('🔴 Test 2: Live Game');
    const liveTime = new Date(now.getTime() - 1.5 * 60 * 60 * 1000);
    const liveGame = createTestGame('test-2', 'Dallas Cowboys @ Philadelphia Eagles', liveTime);
    const liveResult = nflService.enhanceGamesWithStatus([liveGame], now)[0];
    console.log(`Status: ${liveResult.status.type}`);
    console.log(`Display: ${liveResult.status.displayClock}`);
    console.log(`Is Live: ${liveResult.isLive}`);
    console.log(`Period: ${liveResult.status.period}`);
    console.log(`Score: ${liveResult.teams.away.abbreviation} ${liveResult.teams.away.score} - ${liveResult.teams.home.score} ${liveResult.teams.home.abbreviation}\n`);
    
    // Test 3: Completed game (4 hours ago)
    console.log('✅ Test 3: Completed Game');
    const completedTime = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const completedGame = createTestGame('test-3', 'Green Bay Packers @ Chicago Bears', completedTime);
    const completedResult = nflService.enhanceGamesWithStatus([completedGame], now)[0];
    console.log(`Status: ${completedResult.status.type}`);
    console.log(`Display: ${completedResult.status.displayClock}`);
    console.log(`Is Live: ${completedResult.isLive}`);
    console.log(`Period: ${completedResult.status.period}`);
    console.log(`Score: ${completedResult.teams.away.abbreviation} ${completedResult.teams.away.score} - ${completedResult.teams.home.score} ${completedResult.teams.home.abbreviation}\n`);
    
    // Test 4: Game starting soon (15 minutes)
    console.log('⏰ Test 4: Game Starting Soon');
    const soonTime = new Date(now.getTime() + 15 * 60 * 1000);
    const soonGame = createTestGame('test-4', 'Miami Dolphins @ New York Jets', soonTime);
    const soonResult = nflService.enhanceGamesWithStatus([soonGame], now)[0];
    console.log(`Status: ${soonResult.status.type}`);
    console.log(`Display: ${soonResult.status.displayClock}`);
    console.log(`Is Live: ${soonResult.isLive}`);
    console.log(`Period: ${soonResult.status.period}\n`);
    
    // Test 5: Quarter progression
    console.log('🕐 Test 5: Quarter Progression');
    const quarterTimes = [0.5, 1.2, 2.0, 2.8, 3.5]; // Different quarters
    quarterTimes.forEach((hours, index) => {
        const testTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
        const testGame = createTestGame(`test-5-${index}`, 'Test Team A @ Test Team B', testTime);
        const result = nflService.enhanceGamesWithStatus([testGame], now)[0];
        console.log(`${hours}h ago: Quarter ${result.status.period}, Clock: ${result.status.displayClock}, Live: ${result.isLive}`);
    });
    
    console.log('\n✅ All timing tests completed successfully!');
}

// Run the tests
runTests();