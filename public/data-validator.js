/**
 * Data Validator
 * Ensures all game objects and API responses have required fields and valid data
 */

class DataValidator {
    constructor() {
        this.validationRules = this.initializeValidationRules();
        this.sanitizationRules = this.initializeSanitizationRules();
        
        console.log('✅ Data Validator initialized');
    }
    
    /**
     * Initialize validation rules for different data types
     */
    initializeValidationRules() {
        return {
            game: {
                required: ['id', 'name', 'teams', 'date', 'status'],
                optional: ['shortName', 'venue', 'isLive', 'week', 'season'],
                types: {
                    id: 'string',
                    name: 'string',
                    shortName: 'string',
                    date: ['string', 'object'], // Date object or ISO string
                    venue: 'string',
                    isLive: 'boolean',
                    week: 'number',
                    season: 'number'
                }
            },
            team: {
                required: ['name', 'abbreviation'],
                optional: ['id', 'logo', 'score', 'record'],
                types: {
                    id: 'string',
                    name: 'string',
                    abbreviation: 'string',
                    logo: 'string',
                    score: 'number',
                    record: 'string'
                }
            },
            gameStatus: {
                required: ['type'],
                optional: ['displayClock', 'period', 'completed'],
                types: {
                    type: 'string',
                    displayClock: 'string',
                    period: 'number',
                    completed: 'boolean'
                }
            },
            aiPrediction: {
                required: ['homeWinProbability', 'awayWinProbability', 'confidence'],
                optional: ['predictedSpread', 'predictedScore', 'recommendation', 'analysis'],
                types: {
                    homeWinProbability: 'number',
                    awayWinProbability: 'number',
                    confidence: 'number',
                    predictedSpread: 'string',
                    recommendation: 'string',
                    analysis: 'string'
                }
            },
            bettingLines: {
                required: ['spread', 'moneyline', 'total'],
                optional: ['sportsbooks', 'lastUpdated'],
                types: {
                    lastUpdated: ['string', 'object']
                }
            }
        };
    }
    
    /**
     * Initialize sanitization rules
     */
    initializeSanitizationRules() {
        return {
            string: (value, defaultValue = '') => {
                if (typeof value === 'string') return value.trim();
                if (value !== null && value !== undefined) return String(value).trim();
                return defaultValue;
            },
            number: (value, defaultValue = 0) => {
                const num = Number(value);
                return isNaN(num) ? defaultValue : num;
            },
            boolean: (value, defaultValue = false) => {
                if (typeof value === 'boolean') return value;
                if (typeof value === 'string') {
                    return value.toLowerCase() === 'true' || value === '1';
                }
                return Boolean(value) || defaultValue;
            },
            date: (value, defaultValue = null) => {
                if (value instanceof Date) return value;
                if (typeof value === 'string') {
                    const date = new Date(value);
                    return isNaN(date.getTime()) ? (defaultValue || new Date()) : date;
                }
                return defaultValue || new Date();
            }
        };
    }
    
    /**
     * Validate a complete game object
     */
    validateGame(game) {
        const errors = [];
        
        try {
            // Check if game is an object
            if (!game || typeof game !== 'object') {
                errors.push('Game must be an object');
                return { isValid: false, errors, sanitized: null };
            }
            
            // Validate main game fields
            const gameValidation = this.validateObject(game, this.validationRules.game);
            errors.push(...gameValidation.errors);
            
            // Validate teams
            if (game.teams) {
                if (!game.teams.home || !game.teams.away) {
                    errors.push('Game must have both home and away teams');
                } else {
                    const homeValidation = this.validateObject(game.teams.home, this.validationRules.team);
                    const awayValidation = this.validateObject(game.teams.away, this.validationRules.team);
                    
                    errors.push(...homeValidation.errors.map(e => `Home team: ${e}`));
                    errors.push(...awayValidation.errors.map(e => `Away team: ${e}`));
                }
            } else {
                errors.push('Game must have teams object');
            }
            
            // Validate status
            if (game.status) {
                const statusValidation = this.validateObject(game.status, this.validationRules.gameStatus);
                errors.push(...statusValidation.errors.map(e => `Status: ${e}`));
            }
            
            // Validate AI prediction if present
            if (game.aiPrediction) {
                const aiValidation = this.validateObject(game.aiPrediction, this.validationRules.aiPrediction);
                errors.push(...aiValidation.errors.map(e => `AI Prediction: ${e}`));
            }
            
            // Validate betting lines if present
            if (game.bettingLines) {
                const bettingValidation = this.validateObject(game.bettingLines, this.validationRules.bettingLines);
                errors.push(...bettingValidation.errors.map(e => `Betting Lines: ${e}`));
            }
            
            const isValid = errors.length === 0;
            const sanitized = isValid ? game : this.sanitizeGame(game);
            
            return { isValid, errors, sanitized };
            
        } catch (error) {
            window.errorHandler?.logError('Game validation error', error, 'VALIDATION_ERROR');
            return { 
                isValid: false, 
                errors: ['Validation process failed'], 
                sanitized: this.getDefaultGame() 
            };
        }
    }
    
    /**
     * Validate an object against rules
     */
    validateObject(obj, rules) {
        const errors = [];
        
        // Check required fields
        for (const field of rules.required) {
            if (!(field in obj) || obj[field] === null || obj[field] === undefined) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        // Check field types
        for (const [field, expectedType] of Object.entries(rules.types || {})) {
            if (field in obj && obj[field] !== null && obj[field] !== undefined) {
                const actualType = typeof obj[field];
                const expectedTypes = Array.isArray(expectedType) ? expectedType : [expectedType];
                
                if (!expectedTypes.includes(actualType)) {
                    // Special case for dates
                    if (expectedTypes.includes('object') && field === 'date') {
                        if (!(obj[field] instanceof Date) && typeof obj[field] !== 'string') {
                            errors.push(`Field ${field} must be a Date object or ISO string`);
                        }
                    } else {
                        errors.push(`Field ${field} must be of type ${expectedTypes.join(' or ')}, got ${actualType}`);
                    }
                }
            }
        }
        
        return { errors };
    }
    
    /**
     * Sanitize a game object to ensure it has all required fields
     */
    sanitizeGame(game) {
        try {
            const sanitized = {
                id: this.sanitizeField(game.id, 'string', `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
                name: this.sanitizeField(game.name, 'string', 'TBD vs TBD'),
                shortName: this.sanitizeField(game.shortName, 'string', 'TBD @ TBD'),
                date: this.sanitizeField(game.date, 'date', new Date()),
                status: this.sanitizeGameStatus(game.status),
                teams: {
                    home: this.sanitizeTeam(game.teams?.home, 'Home Team', 'HOME'),
                    away: this.sanitizeTeam(game.teams?.away, 'Away Team', 'AWAY')
                },
                venue: this.sanitizeField(game.venue, 'string', 'TBD'),
                isLive: this.sanitizeField(game.isLive, 'boolean', false),
                week: this.sanitizeField(game.week, 'number', 1),
                season: this.sanitizeField(game.season, 'number', new Date().getFullYear())
            };
            
            // Preserve additional fields if they exist and are valid
            if (game.aiPrediction) {
                sanitized.aiPrediction = this.sanitizeAIPrediction(game.aiPrediction);
            }
            
            if (game.bettingLines) {
                sanitized.bettingLines = this.sanitizeBettingLines(game.bettingLines);
            }
            
            if (game.mlAlgorithms) {
                sanitized.mlAlgorithms = game.mlAlgorithms; // Pass through for now
            }
            
            return sanitized;
            
        } catch (error) {
            window.errorHandler?.logError('Game sanitization error', error, 'SANITIZATION_ERROR');
            return this.getDefaultGame();
        }
    }
    
    /**
     * Sanitize a team object
     */
    sanitizeTeam(team, defaultName, defaultAbbr) {
        if (!team || typeof team !== 'object') {
            return {
                id: `team-${defaultAbbr.toLowerCase()}`,
                name: defaultName,
                abbreviation: defaultAbbr,
                logo: '',
                score: 0,
                record: '0-0'
            };
        }
        
        return {
            id: this.sanitizeField(team.id, 'string', `team-${defaultAbbr.toLowerCase()}`),
            name: this.sanitizeField(team.name, 'string', defaultName),
            abbreviation: this.sanitizeField(team.abbreviation, 'string', defaultAbbr),
            logo: this.sanitizeField(team.logo, 'string', ''),
            score: this.sanitizeField(team.score, 'number', 0),
            record: this.sanitizeField(team.record, 'string', '0-0')
        };
    }
    
    /**
     * Sanitize game status
     */
    sanitizeGameStatus(status) {
        if (!status || typeof status !== 'object') {
            return {
                type: 'STATUS_SCHEDULED',
                displayClock: '',
                period: 0,
                completed: false
            };
        }
        
        return {
            type: this.sanitizeField(status.type, 'string', 'STATUS_SCHEDULED'),
            displayClock: this.sanitizeField(status.displayClock, 'string', ''),
            period: this.sanitizeField(status.period, 'number', 0),
            completed: this.sanitizeField(status.completed, 'boolean', false)
        };
    }
    
    /**
     * Sanitize AI prediction
     */
    sanitizeAIPrediction(prediction) {
        if (!prediction || typeof prediction !== 'object') {
            return null;
        }
        
        return {
            homeWinProbability: this.sanitizeField(prediction.homeWinProbability, 'number', 50),
            awayWinProbability: this.sanitizeField(prediction.awayWinProbability, 'number', 50),
            confidence: this.sanitizeField(prediction.confidence, 'number', 70),
            predictedSpread: this.sanitizeField(prediction.predictedSpread, 'string', 'Pick \'em'),
            predictedScore: prediction.predictedScore || { home: 21, away: 21 },
            recommendation: this.sanitizeField(prediction.recommendation, 'string', 'No recommendation'),
            analysis: this.sanitizeField(prediction.analysis, 'string', 'Analysis unavailable')
        };
    }
    
    /**
     * Sanitize betting lines
     */
    sanitizeBettingLines(lines) {
        if (!lines || typeof lines !== 'object') {
            return null;
        }
        
        return {
            spread: lines.spread || { home: 'PK', away: 'PK', odds: '-110' },
            moneyline: lines.moneyline || { home: '-110', away: '-110' },
            total: lines.total || { over: 'O 44.5', under: 'U 44.5', odds: '-110' },
            sportsbooks: Array.isArray(lines.sportsbooks) ? lines.sportsbooks : ['DraftKings'],
            lastUpdated: this.sanitizeField(lines.lastUpdated, 'date', new Date())
        };
    }
    
    /**
     * Sanitize a field based on its expected type
     */
    sanitizeField(value, type, defaultValue) {
        const sanitizer = this.sanitizationRules[type];
        if (sanitizer) {
            return sanitizer(value, defaultValue);
        }
        return value !== null && value !== undefined ? value : defaultValue;
    }
    
    /**
     * Validate an array of games
     */
    validateGames(games) {
        if (!Array.isArray(games)) {
            return {
                isValid: false,
                errors: ['Games must be an array'],
                sanitized: []
            };
        }
        
        const results = games.map(game => this.validateGame(game));
        const allValid = results.every(result => result.isValid);
        const allErrors = results.flatMap(result => result.errors);
        const sanitizedGames = results.map(result => result.sanitized).filter(Boolean);
        
        return {
            isValid: allValid,
            errors: allErrors,
            sanitized: sanitizedGames,
            validCount: results.filter(r => r.isValid).length,
            totalCount: games.length
        };
    }
    
    /**
     * Get a default game object
     */
    getDefaultGame() {
        return {
            id: `default-game-${Date.now()}`,
            name: 'Game Data Unavailable',
            shortName: 'N/A @ N/A',
            date: new Date(),
            status: {
                type: 'STATUS_SCHEDULED',
                displayClock: 'Data Loading...',
                period: 0,
                completed: false
            },
            teams: {
                home: {
                    id: 'default-home',
                    name: 'Home Team',
                    abbreviation: 'HOME',
                    logo: '',
                    score: 0,
                    record: '0-0'
                },
                away: {
                    id: 'default-away',
                    name: 'Away Team',
                    abbreviation: 'AWAY',
                    logo: '',
                    score: 0,
                    record: '0-0'
                }
            },
            venue: 'TBD',
            isLive: false,
            week: 1,
            season: new Date().getFullYear()
        };
    }
    
    /**
     * Validate API response structure
     */
    validateApiResponse(response, expectedStructure = 'games') {
        try {
            if (!response) {
                return { isValid: false, error: 'Response is null or undefined' };
            }
            
            switch (expectedStructure) {
                case 'games':
                    if (Array.isArray(response)) {
                        return { isValid: true };
                    }
                    if (response.events || response.games || response.data) {
                        return { isValid: true };
                    }
                    return { isValid: false, error: 'Response does not contain games data' };
                    
                case 'espn':
                    if (response.events && Array.isArray(response.events)) {
                        return { isValid: true };
                    }
                    return { isValid: false, error: 'ESPN response missing events array' };
                    
                case 'ncaa':
                    if (response.games && Array.isArray(response.games)) {
                        return { isValid: true };
                    }
                    return { isValid: false, error: 'NCAA response missing games array' };
                    
                default:
                    return { isValid: true }; // Generic validation passed
            }
            
        } catch (error) {
            return { isValid: false, error: error.message };
        }
    }
    
    /**
     * Clean and validate team abbreviations
     */
    validateTeamAbbreviation(abbr) {
        if (!abbr || typeof abbr !== 'string') {
            return 'TBD';
        }
        
        // Clean the abbreviation
        const cleaned = abbr.trim().toUpperCase();
        
        // Ensure it's reasonable length (2-5 characters)
        if (cleaned.length < 2 || cleaned.length > 5) {
            return cleaned.substring(0, 4) || 'TBD';
        }
        
        return cleaned;
    }
    
    /**
     * Validate and sanitize scores
     */
    validateScore(score) {
        const num = Number(score);
        if (isNaN(num) || num < 0) {
            return 0;
        }
        if (num > 100) { // Unrealistic score
            return Math.min(num, 100);
        }
        return Math.floor(num);
    }
    
    /**
     * Validate game timing
     */
    validateGameTiming(date, status) {
        const gameDate = new Date(date);
        const now = new Date();
        
        // If game date is invalid, use current date
        if (isNaN(gameDate.getTime())) {
            return {
                date: now,
                status: 'STATUS_SCHEDULED'
            };
        }
        
        // Validate status based on timing
        let validStatus = status;
        if (gameDate > now && status === 'STATUS_FINAL') {
            validStatus = 'STATUS_SCHEDULED'; // Future game can't be final
        }
        
        return {
            date: gameDate,
            status: validStatus
        };
    }
}

// Initialize global data validator
window.dataValidator = new DataValidator();

console.log('✅ Data Validator loaded and active');