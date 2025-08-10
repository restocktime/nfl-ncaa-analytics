/**
 * Fantasy Football News Service
 * Integrates live injury reports and fantasy-relevant news
 */

class FantasyNewsService {
    constructor() {
        this.newsFeeds = [
            {
                name: 'ESPN Fantasy',
                url: 'https://www.espn.com/espn/rss/news',
                active: true,
                priority: 'high'
            },
            {
                name: 'NFL.com Fantasy',
                url: 'https://www.nfl.com/feeds/rss_news',
                active: true,
                priority: 'high'
            },
            {
                name: 'FantasyPros',
                url: 'https://www.fantasypros.com/rss/news.xml',
                active: true,
                priority: 'medium'
            },
            {
                name: 'Rotoworld',
                url: 'https://www.rotoworld.com/rss/fantasy-football.xml',
                active: true,
                priority: 'high'
            }
        ];
        
        this.injuryData = new Map();
        this.newsCache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
        
        console.log('📰 Fantasy News Service initialized');
        
        // Start monitoring
        this.startNewsMonitoring();
    }

    async startNewsMonitoring() {
        console.log('📡 Starting fantasy news monitoring...');
        
        // Initial load
        await this.fetchAllNews();
        await this.updateInjuryReports();
        
        // Update every 10 minutes
        setInterval(() => {
            this.fetchAllNews();
            this.updateInjuryReports();
        }, 10 * 60 * 1000);
    }

    async fetchAllNews() {
        try {
            console.log('🔄 Fetching fantasy news...');
            
            // Simulate fetching from multiple sources
            const allNews = await this.simulateNewsApiCalls();
            
            // Cache the news
            this.newsCache.set('all_news', {
                data: allNews,
                timestamp: Date.now()
            });
            
            console.log(`✅ Fetched ${allNews.length} fantasy news items`);
            
            return allNews;
        } catch (error) {
            console.error('❌ Error fetching fantasy news:', error);
            return this.getFallbackNews();
        }
    }

    async simulateNewsApiCalls() {
        // Simulate real fantasy news data
        return [
            {
                id: 'news_1',
                headline: 'Josh Allen limited in practice with shoulder injury',
                summary: 'Bills QB Josh Allen was limited in Wednesday practice with a shoulder injury. Monitor his status through the week.',
                player: 'Josh Allen',
                team: 'BUF',
                position: 'QB',
                impact: 'Monitor',
                severity: 'Minor',
                timestamp: new Date().toISOString(),
                source: 'ESPN Fantasy',
                fantasyRelevance: 'High'
            },
            {
                id: 'news_2',
                headline: 'Christian McCaffrey expected to return this week',
                summary: 'San Francisco RB Christian McCaffrey is expected to return from injury this week after missing two games.',
                player: 'Christian McCaffrey',
                team: 'SF',
                position: 'RB',
                impact: 'Start',
                severity: 'None',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                source: 'NFL.com',
                fantasyRelevance: 'High'
            },
            {
                id: 'news_3',
                headline: 'Tyreek Hill dealing with ankle injury',
                summary: 'Dolphins WR Tyreek Hill is dealing with an ankle injury but expected to play through it this week.',
                player: 'Tyreek Hill',
                team: 'MIA',
                position: 'WR',
                impact: 'Start',
                severity: 'Minor',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                source: 'FantasyPros',
                fantasyRelevance: 'High'
            },
            {
                id: 'news_4',
                headline: 'Jayden Reed trending up for expanded role',
                summary: 'Green Bay WR Jayden Reed is expected to see increased targets with other receivers dealing with injuries.',
                player: 'Jayden Reed',
                team: 'GB',
                position: 'WR',
                impact: 'Start',
                severity: 'None',
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                source: 'Rotoworld',
                fantasyRelevance: 'Medium'
            },
            {
                id: 'news_5',
                headline: 'Travis Kelce on pace for bounce-back week',
                summary: 'Chiefs TE Travis Kelce has favorable matchup and is expected to have increased involvement in game plan.',
                player: 'Travis Kelce',
                team: 'KC',
                position: 'TE',
                impact: 'Start',
                severity: 'None',
                timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
                source: 'ESPN Fantasy',
                fantasyRelevance: 'High'
            },
            {
                id: 'news_6',
                headline: 'Saquon Barkley questionable with hamstring',
                summary: 'Eagles RB Saquon Barkley is questionable for this weeks game with a hamstring injury sustained in practice.',
                player: 'Saquon Barkley',
                team: 'PHI',
                position: 'RB',
                impact: 'Monitor',
                severity: 'Moderate',
                timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                source: 'NFL.com',
                fantasyRelevance: 'High'
            }
        ];
    }

    async updateInjuryReports() {
        try {
            console.log('🏥 Updating injury reports...');
            
            const injuryReports = await this.fetchInjuryData();
            
            // Update injury cache
            this.injuryData.clear();
            injuryReports.forEach(injury => {
                this.injuryData.set(injury.player, injury);
            });
            
            console.log(`✅ Updated ${injuryReports.length} injury reports`);
            
            return injuryReports;
        } catch (error) {
            console.error('❌ Error updating injury reports:', error);
            return this.getFallbackInjuries();
        }
    }

    async fetchInjuryData() {
        // Simulate real injury API data
        return [
            {
                player: 'Josh Allen',
                team: 'BUF',
                position: 'QB',
                injury: 'Shoulder',
                status: 'Limited',
                gameStatus: 'Probable',
                lastUpdate: new Date().toISOString(),
                practiceStatus: ['DNP', 'Limited', 'Limited'],
                expectedReturn: null,
                severity: 'Minor',
                fantasyImpact: 'Low'
            },
            {
                player: 'Christian McCaffrey',
                team: 'SF',
                position: 'RB',
                injury: 'Achilles',
                status: 'Healthy',
                gameStatus: 'Active',
                lastUpdate: new Date().toISOString(),
                practiceStatus: ['Full', 'Full', 'Full'],
                expectedReturn: 'This Week',
                severity: 'None',
                fantasyImpact: 'None'
            },
            {
                player: 'Saquon Barkley',
                team: 'PHI',
                position: 'RB',
                injury: 'Hamstring',
                status: 'Questionable',
                gameStatus: 'Questionable',
                lastUpdate: new Date().toISOString(),
                practiceStatus: ['DNP', 'Limited', 'Questionable'],
                expectedReturn: 'This Week',
                severity: 'Moderate',
                fantasyImpact: 'Medium'
            },
            {
                player: 'Tyreek Hill',
                team: 'MIA',
                position: 'WR',
                injury: 'Ankle',
                status: 'Probable',
                gameStatus: 'Probable',
                lastUpdate: new Date().toISOString(),
                practiceStatus: ['Limited', 'Limited', 'Full'],
                expectedReturn: null,
                severity: 'Minor',
                fantasyImpact: 'Low'
            }
        ];
    }

    getPlayerNews(playerName = null, position = null, team = null) {
        const cached = this.newsCache.get('all_news');
        if (!cached || Date.now() - cached.timestamp > this.cacheTimeout) {
            return [];
        }
        
        let news = cached.data;
        
        // Filter by criteria
        if (playerName) {
            news = news.filter(item => 
                item.player.toLowerCase().includes(playerName.toLowerCase())
            );
        }
        
        if (position) {
            news = news.filter(item => item.position === position);
        }
        
        if (team) {
            news = news.filter(item => item.team === team);
        }
        
        return news.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    getInjuryReport(playerName = null) {
        if (playerName) {
            return this.injuryData.get(playerName) || null;
        }
        
        return Array.from(this.injuryData.values())
            .sort((a, b) => {
                // Sort by severity (more severe first)
                const severityOrder = { 'Major': 3, 'Moderate': 2, 'Minor': 1, 'None': 0 };
                return severityOrder[b.severity] - severityOrder[a.severity];
            });
    }

    getBreakingNews(limit = 5) {
        const allNews = this.getPlayerNews();
        
        // Get news from last 24 hours
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        const recentNews = allNews.filter(news => 
            new Date(news.timestamp).getTime() > twentyFourHoursAgo
        );
        
        // Sort by relevance and recency
        return recentNews
            .sort((a, b) => {
                // High relevance first, then by timestamp
                if (a.fantasyRelevance === 'High' && b.fantasyRelevance !== 'High') return -1;
                if (b.fantasyRelevance === 'High' && a.fantasyRelevance !== 'High') return 1;
                return new Date(b.timestamp) - new Date(a.timestamp);
            })
            .slice(0, limit);
    }

    getInjuryAlerts() {
        const injuries = this.getInjuryReport();
        
        // Return injuries that need monitoring
        return injuries.filter(injury => 
            ['Questionable', 'Doubtful', 'Out'].includes(injury.gameStatus) ||
            injury.severity !== 'None'
        ).slice(0, 5);
    }

    getWaiverWireNews() {
        const allNews = this.getPlayerNews();
        
        // Look for opportunity-related news
        const opportunityKeywords = [
            'expanded role', 'increased targets', 'starting', 'opportunity',
            'trending up', 'breakout', 'available', 'pickup'
        ];
        
        return allNews.filter(news => 
            opportunityKeywords.some(keyword => 
                news.headline.toLowerCase().includes(keyword) ||
                news.summary.toLowerCase().includes(keyword)
            )
        ).slice(0, 3);
    }

    getTradeNews() {
        const allNews = this.getPlayerNews();
        
        // Look for trade-relevant news
        const tradeKeywords = [
            'trade', 'acquire', 'deal', 'value', 'buy low', 'sell high',
            'schedule', 'matchup', 'playoff'
        ];
        
        return allNews.filter(news => 
            tradeKeywords.some(keyword => 
                news.headline.toLowerCase().includes(keyword) ||
                news.summary.toLowerCase().includes(keyword)
            )
        ).slice(0, 3);
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const newsTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - newsTime) / 60000);
        
        if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)}h ago`;
        } else {
            return `${Math.floor(diffInMinutes / 1440)}d ago`;
        }
    }

    getStatusIcon(status) {
        switch (status) {
            case 'Active':
            case 'Healthy':
                return '✅';
            case 'Probable':
                return '🟡';
            case 'Questionable':
                return '🟠';
            case 'Doubtful':
            case 'Out':
                return '🔴';
            default:
                return '❓';
        }
    }

    getSeverityColor(severity) {
        switch (severity) {
            case 'None':
                return '#4ade80';
            case 'Minor':
                return '#fbbf24';
            case 'Moderate':
                return '#f97316';
            case 'Major':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    }

    // Fallback data methods
    getFallbackNews() {
        return [
            {
                id: 'fallback_1',
                headline: 'Fantasy football news will load when connection is restored',
                summary: 'Live fantasy football news and injury reports will appear here when the connection is restored.',
                player: 'System',
                team: 'N/A',
                position: 'N/A',
                impact: 'None',
                severity: 'None',
                timestamp: new Date().toISOString(),
                source: 'System',
                fantasyRelevance: 'Low'
            }
        ];
    }

    getFallbackInjuries() {
        return [
            {
                player: 'No Data',
                team: 'N/A',
                position: 'N/A',
                injury: 'Connection',
                status: 'Loading',
                gameStatus: 'Loading',
                lastUpdate: new Date().toISOString(),
                practiceStatus: ['Loading'],
                expectedReturn: 'When Connected',
                severity: 'None',
                fantasyImpact: 'None'
            }
        ];
    }
}

// Initialize the fantasy news service
window.fantasyNewsService = new FantasyNewsService();