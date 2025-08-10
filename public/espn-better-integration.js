/**
 * Better ESPN Fantasy Integration
 * Uses multiple approaches: URL parsing, league links, and simplified API calls
 */

class ESPNBetterIntegration {
    constructor() {
        this.proxyUrl = 'https://api.allorigins.win/raw?url=';
        this.corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://cors-anywhere.herokuapp.com/'
        ];
    }

    // METHOD 1: Parse ESPN Fantasy URL (Easiest for Users)
    async connectViaURL(espnUrl) {
        try {
            console.log('🔗 Parsing ESPN Fantasy URL...');
            
            // Extract league ID and team ID from URL
            const urlData = this.parseESPNUrl(espnUrl);
            if (!urlData.leagueId) {
                throw new Error('Invalid ESPN Fantasy URL. Please copy the URL from your ESPN Fantasy page.');
            }

            console.log(`📊 Found League ID: ${urlData.leagueId}, Season: ${urlData.seasonId}`);

            // Try to get league data using the parsed info
            const leagueData = await this.getLeagueDataWithProxy(urlData.leagueId, urlData.seasonId);
            
            return {
                success: true,
                method: 'url_parsing',
                leagueId: urlData.leagueId,
                seasonId: urlData.seasonId,
                league: leagueData,
                message: `Connected to ${leagueData.settings?.name || 'ESPN League'}`
            };

        } catch (error) {
            console.error('❌ URL parsing failed:', error);
            throw error;
        }
    }

    // METHOD 2: League ID + Public League Access (No cookies needed)
    async connectPublicLeague(leagueId, seasonId = new Date().getFullYear()) {
        try {
            console.log(`🏈 Connecting to public ESPN league: ${leagueId}`);
            
            const leagueData = await this.getLeagueDataWithProxy(leagueId, seasonId);
            
            // Check if league is public
            if (leagueData.settings?.isPublic !== false) {
                return {
                    success: true,
                    method: 'public_league',
                    leagueId: leagueId,
                    seasonId: seasonId,
                    league: leagueData,
                    teams: leagueData.teams || [],
                    message: `Connected to public league: ${leagueData.settings?.name}`
                };
            } else {
                throw new Error('This appears to be a private league. Use the URL method or provide cookies.');
            }

        } catch (error) {
            console.error('❌ Public league connection failed:', error);
            throw error;
        }
    }

    // METHOD 3: Simplified Cookie Method (Better UX)
    async connectWithSimplifiedAuth(leagueId, seasonId, cookies) {
        try {
            console.log('🍪 Using simplified cookie authentication...');

            // Parse cookies more flexibly
            const parsedCookies = this.parseCookieString(cookies);
            
            const headers = {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; Fantasy App)'
            };

            if (parsedCookies.espn_s2 || parsedCookies.SWID) {
                headers['Cookie'] = this.buildCookieHeader(parsedCookies);
            }

            const leagueData = await this.getLeagueDataWithHeaders(leagueId, seasonId, headers);
            
            return {
                success: true,
                method: 'cookie_auth',
                leagueId: leagueId,
                league: leagueData,
                message: 'Connected to private ESPN league'
            };

        } catch (error) {
            console.error('❌ Cookie authentication failed:', error);
            throw error;
        }
    }

    // UTILITY: Parse ESPN Fantasy URL
    parseESPNUrl(url) {
        const patterns = [
            // Standard ESPN Fantasy URL
            /espn\.com\/fantasy\/football\/league.*leagueId=(\d+).*seasonId=(\d+)/,
            // Alternative patterns
            /espn\.com\/fantasy\/football\/.*\/(\d+)/,
            // Team page URLs
            /espn\.com\/fantasy\/football\/team.*leagueId=(\d+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return {
                    leagueId: match[1],
                    seasonId: match[2] || new Date().getFullYear().toString(),
                    teamId: this.extractTeamId(url)
                };
            }
        }

        // Try to extract just numbers from URL as league ID
        const numberMatch = url.match(/(\d{6,})/);
        if (numberMatch) {
            return {
                leagueId: numberMatch[1],
                seasonId: new Date().getFullYear().toString()
            };
        }

        throw new Error('Could not parse ESPN Fantasy URL');
    }

    extractTeamId(url) {
        const teamMatch = url.match(/teamId=(\d+)/);
        return teamMatch ? teamMatch[1] : null;
    }

    // Get league data with CORS proxy fallback
    async getLeagueDataWithProxy(leagueId, seasonId) {
        const espnUrl = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${seasonId}/segments/0/leagues/${leagueId}`;
        
        for (const proxy of this.corsProxies) {
            try {
                console.log(`🌐 Trying proxy: ${proxy.substring(0, 30)}...`);
                
                const response = await fetch(`${proxy}${encodeURIComponent(espnUrl)}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                console.log(`✅ Successfully fetched league data via proxy`);
                return data;

            } catch (error) {
                console.warn(`⚠️ Proxy ${proxy.substring(0, 20)}... failed:`, error.message);
                continue;
            }
        }

        throw new Error('All proxy attempts failed. League may be private or invalid.');
    }

    // Get league data with custom headers (for private leagues)
    async getLeagueDataWithHeaders(leagueId, seasonId, headers) {
        const espnUrl = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${seasonId}/segments/0/leagues/${leagueId}`;
        
        try {
            // Try direct connection first
            const response = await fetch(espnUrl, { 
                method: 'GET', 
                headers,
                mode: 'cors',
                credentials: 'include'
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Direct connection failed, trying proxy...');
        }

        // Fallback to proxy with headers
        for (const proxy of this.corsProxies) {
            try {
                const response = await fetch(`${proxy}${encodeURIComponent(espnUrl)}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                continue;
            }
        }

        throw new Error('Unable to access league data');
    }

    // Parse cookie string flexibly
    parseCookieString(cookieStr) {
        const cookies = {};
        
        if (!cookieStr) return cookies;

        // Handle different cookie formats
        const cookiePairs = cookieStr.split(/[;&]/).map(c => c.trim());
        
        for (const pair of cookiePairs) {
            const [key, ...valueParts] = pair.split('=');
            if (key && valueParts.length > 0) {
                const cleanKey = key.trim();
                const cleanValue = valueParts.join('=').trim();
                
                if (cleanKey === 'espn_s2' || cleanKey === 'SWID') {
                    cookies[cleanKey] = cleanValue;
                }
            }
        }

        return cookies;
    }

    buildCookieHeader(cookies) {
        const parts = [];
        if (cookies.espn_s2) parts.push(`espn_s2=${cookies.espn_s2}`);
        if (cookies.SWID) parts.push(`SWID=${cookies.SWID}`);
        return parts.join('; ');
    }

    // Get roster data for a team
    async getTeamRoster(leagueId, seasonId, teamId) {
        try {
            const espnUrl = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${seasonId}/segments/0/leagues/${leagueId}?view=mRoster&view=mTeam`;
            
            const leagueData = await this.getLeagueDataWithProxy(leagueId, seasonId);
            
            // Find the specific team
            const team = leagueData.teams?.find(t => t.id.toString() === teamId.toString());
            if (!team) {
                throw new Error(`Team ${teamId} not found in league`);
            }

            // Convert ESPN format to fantasy system format
            const fantasyRoster = this.convertESPNToFantasyFormat(team, leagueData);
            
            return {
                success: true,
                team: team,
                fantasyRoster: fantasyRoster,
                playerCount: team.roster?.entries?.length || 0,
                message: `Imported roster for ${team.location} ${team.nickname}`
            };

        } catch (error) {
            console.error('❌ Error getting team roster:', error);
            throw error;
        }
    }

    // Convert ESPN roster to fantasy system format
    convertESPNToFantasyFormat(team, leagueData) {
        const players = [];
        
        if (team.roster?.entries) {
            team.roster.entries.forEach(entry => {
                const player = entry.playerPoolEntry?.player;
                if (player) {
                    players.push({
                        playerId: player.id.toString(),
                        name: player.fullName,
                        position: this.mapESPNPosition(player.defaultPositionId),
                        team: this.mapESPNTeam(player.proTeamId),
                        projectedPoints: entry.playerPoolEntry?.ratings?.[0]?.totalRating || 0,
                        actualPoints: entry.playerPoolEntry?.appliedStatTotal || 0,
                        isStarter: entry.lineupSlotId < 20, // ESPN uses slot IDs
                        injury: this.mapInjuryStatus(player.injuryStatus),
                        espnData: {
                            playerId: player.id,
                            slotId: entry.lineupSlotId,
                            acquisitionDate: entry.acquisitionDate,
                            acquisitionType: entry.acquisitionType
                        }
                    });
                }
            });
        }

        return {
            userId: `espn_${team.id}`,
            teamName: `${team.location} ${team.nickname}`,
            leagueId: leagueData.id?.toString(),
            leagueName: leagueData.settings?.name,
            platform: 'espn',
            roster: players,
            record: {
                wins: team.record?.overall?.wins || 0,
                losses: team.record?.overall?.losses || 0,
                ties: team.record?.overall?.ties || 0
            },
            pointsFor: team.record?.overall?.pointsFor || 0,
            pointsAgainst: team.record?.overall?.pointsAgainst || 0,
            playoffSeed: team.playoffSeed || team.currentProjectedRank || 1,
            weeklyProjection: this.calculateWeeklyProjection(players),
            importedFrom: 'espn',
            importDate: new Date().toISOString(),
            espnData: team
        };
    }

    mapESPNPosition(positionId) {
        const positions = {
            1: 'QB', 2: 'RB', 3: 'WR', 4: 'TE', 
            5: 'K', 16: 'DEF', 17: 'FLEX'
        };
        return positions[positionId] || 'FLEX';
    }

    mapESPNTeam(teamId) {
        // ESPN team ID mapping - simplified version
        const teams = {
            1: 'ATL', 2: 'BUF', 3: 'CHI', 4: 'CIN', 5: 'CLE', 6: 'DAL', 7: 'DEN', 8: 'DET',
            9: 'GB', 10: 'TEN', 11: 'IND', 12: 'KC', 13: 'LV', 14: 'LAR', 15: 'MIA', 16: 'MIN',
            17: 'NE', 18: 'NO', 19: 'NYG', 20: 'NYJ', 21: 'PHI', 22: 'ARI', 23: 'PIT', 24: 'LAC',
            25: 'SF', 26: 'SEA', 27: 'TB', 28: 'WAS', 29: 'CAR', 30: 'JAX', 33: 'BAL', 34: 'HOU'
        };
        return teams[teamId] || 'FA';
    }

    mapInjuryStatus(status) {
        const statusMap = {
            'ACTIVE': 'Healthy',
            'QUESTIONABLE': 'Questionable',
            'DOUBTFUL': 'Doubtful',
            'OUT': 'Out',
            'INJURY_RESERVE': 'IR',
            'PHYSICALLY_UNABLE_TO_PERFORM': 'PUP'
        };
        return statusMap[status] || 'Healthy';
    }

    calculateWeeklyProjection(players) {
        return players.reduce((sum, player) => sum + (player.projectedPoints || 0), 0);
    }

    // Get all teams in league (for team selection)
    async getLeagueTeams(leagueId, seasonId) {
        try {
            const leagueData = await this.getLeagueDataWithProxy(leagueId, seasonId);
            
            return leagueData.teams?.map(team => ({
                id: team.id,
                name: `${team.location} ${team.nickname}`,
                owner: team.primaryOwner,
                record: `${team.record?.overall?.wins || 0}-${team.record?.overall?.losses || 0}`,
                points: team.record?.overall?.pointsFor || 0
            })) || [];

        } catch (error) {
            console.error('❌ Error getting league teams:', error);
            throw error;
        }
    }
}

// Export for use
window.ESPNBetterIntegration = ESPNBetterIntegration;
console.log('✅ ESPN Better Integration loaded');