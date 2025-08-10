/**
 * Revolutionary Fantasy Hub - Advanced Data Visualization
 * Interactive charts and graphs for fantasy football analytics
 */

class FantasyCharts {
    constructor() {
        this.chartInstances = new Map();
        this.colorScheme = {
            primary: '#667eea',
            secondary: '#764ba2',
            success: '#4ade80',
            warning: '#fbbf24',
            danger: '#f87171',
            info: '#06b6d4',
            background: '#1a202c',
            surface: '#2d3748'
        };
        this.initializeCharts();
    }

    initializeCharts() {
        console.log('📊 Initializing Fantasy Charts...');
        this.loadChartLibrary();
    }

    loadChartLibrary() {
        // Load Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => {
                console.log('📈 Chart.js loaded successfully');
                this.configureChartDefaults();
            };
            document.head.appendChild(script);
        } else {
            this.configureChartDefaults();
        }
    }

    configureChartDefaults() {
        if (typeof Chart !== 'undefined') {
            Chart.defaults.color = '#a0aec0';
            Chart.defaults.backgroundColor = this.colorScheme.primary;
            Chart.defaults.borderColor = this.colorScheme.primary;
            Chart.defaults.plugins.legend.labels.color = '#a0aec0';
        }
    }

    // Player Performance Trend Chart
    createPerformanceTrendChart(containerId, playerData) {
        const ctx = document.getElementById(containerId);
        if (!ctx) return null;

        const weeks = playerData.gameLog.map(game => `Week ${game.week}`);
        const points = playerData.gameLog.map(game => game.points);
        const projections = playerData.gameLog.map(game => game.projection);

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeks,
                datasets: [
                    {
                        label: 'Actual Points',
                        data: points,
                        borderColor: this.colorScheme.success,
                        backgroundColor: this.colorScheme.success + '20',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Projected Points',
                        data: projections,
                        borderColor: this.colorScheme.warning,
                        backgroundColor: this.colorScheme.warning + '20',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${playerData.name} - Performance Trend`,
                        color: this.colorScheme.primary,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top',
                        labels: { color: '#a0aec0' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#374151' },
                        ticks: { color: '#a0aec0' }
                    },
                    x: {
                        grid: { color: '#374151' },
                        ticks: { color: '#a0aec0' }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        this.chartInstances.set(containerId, chart);
        return chart;
    }

    // Target Share Evolution Chart
    createTargetShareChart(containerId, playerData) {
        const ctx = document.getElementById(containerId);
        if (!ctx) return null;

        const weeks = playerData.gameLog.map(game => `Week ${game.week}`);
        const targetShare = playerData.gameLog.map(game => game.targetShare * 100);
        const snapShare = playerData.gameLog.map(game => game.snapShare * 100);

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeks,
                datasets: [
                    {
                        label: 'Target Share %',
                        data: targetShare,
                        backgroundColor: this.colorScheme.primary + '80',
                        borderColor: this.colorScheme.primary,
                        borderWidth: 1
                    },
                    {
                        label: 'Snap Share %',
                        data: snapShare,
                        backgroundColor: this.colorScheme.info + '80',
                        borderColor: this.colorScheme.info,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Target & Snap Share Evolution',
                        color: this.colorScheme.primary,
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: '#374151' },
                        ticks: { 
                            color: '#a0aec0',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: { color: '#374151' },
                        ticks: { color: '#a0aec0' }
                    }
                }
            }
        });

        this.chartInstances.set(containerId, chart);
        return chart;
    }

    // Matchup Difficulty Radar Chart
    createMatchupRadarChart(containerId, matchupData) {
        const ctx = document.getElementById(containerId);
        if (!ctx) return null;

        const chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: [
                    'Pass Defense Rank',
                    'Rush Defense Rank', 
                    'Red Zone Defense',
                    'Pace of Play',
                    'Game Script',
                    'Weather Conditions'
                ],
                datasets: [{
                    label: 'Matchup Favorability',
                    data: [
                        matchupData.passDefenseRank,
                        matchupData.rushDefenseRank,
                        matchupData.redZoneDefense,
                        matchupData.paceOfPlay,
                        matchupData.gameScript,
                        matchupData.weatherConditions
                    ],
                    backgroundColor: this.colorScheme.success + '30',
                    borderColor: this.colorScheme.success,
                    borderWidth: 2,
                    pointBackgroundColor: this.colorScheme.success,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: this.colorScheme.success
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Matchup Analysis Radar',
                        color: this.colorScheme.primary,
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: '#374151' },
                        angleLines: { color: '#374151' },
                        pointLabels: { color: '#a0aec0', font: { size: 12 } },
                        ticks: { 
                            color: '#a0aec0',
                            backdropColor: 'transparent'
                        }
                    }
                }
            }
        });

        this.chartInstances.set(containerId, chart);
        return chart;
    }

    // Portfolio Risk/Reward Scatter Plot
    createRiskRewardChart(containerId, playersData) {
        const ctx = document.getElementById(containerId);
        if (!ctx) return null;

        const datasets = playersData.map((player, index) => ({
            label: player.name,
            data: [{
                x: player.riskScore,
                y: player.projectedPoints
            }],
            backgroundColor: this.getPlayerColor(index),
            borderColor: this.getPlayerColor(index),
            pointRadius: 8,
            pointHoverRadius: 12
        }));

        const chart = new Chart(ctx, {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Risk vs Reward Analysis',
                        color: this.colorScheme.primary,
                        font: { size: 16, weight: 'bold' }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const player = playersData[context.datasetIndex];
                                return `${player.name}: ${context.parsed.y} pts (Risk: ${context.parsed.x})`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Risk Score',
                            color: '#a0aec0'
                        },
                        grid: { color: '#374151' },
                        ticks: { color: '#a0aec0' }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Projected Points',
                            color: '#a0aec0'
                        },
                        grid: { color: '#374151' },
                        ticks: { color: '#a0aec0' }
                    }
                }
            }
        });

        this.chartInstances.set(containerId, chart);
        return chart;
    }

    // Lineup Optimization Comparison Chart
    createLineupComparisonChart(containerId, lineupOptions) {
        const ctx = document.getElementById(containerId);
        if (!ctx) return null;

        const labels = lineupOptions.map(option => option.name);
        const projections = lineupOptions.map(option => option.projection);
        const floors = lineupOptions.map(option => option.floor);
        const ceilings = lineupOptions.map(option => option.ceiling);

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Floor',
                        data: floors,
                        backgroundColor: this.colorScheme.danger + '60',
                        borderColor: this.colorScheme.danger,
                        borderWidth: 1
                    },
                    {
                        label: 'Projection',
                        data: projections,
                        backgroundColor: this.colorScheme.primary + '80',
                        borderColor: this.colorScheme.primary,
                        borderWidth: 2
                    },
                    {
                        label: 'Ceiling',
                        data: ceilings,
                        backgroundColor: this.colorScheme.success + '60',
                        borderColor: this.colorScheme.success,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Lineup Options Comparison',
                        color: this.colorScheme.primary,
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#374151' },
                        ticks: { color: '#a0aec0' }
                    },
                    x: {
                        grid: { color: '#374151' },
                        ticks: { color: '#a0aec0' }
                    }
                }
            }
        });

        this.chartInstances.set(containerId, chart);
        return chart;
    }

    // Waiver Wire Opportunity Heatmap
    createWaiverHeatmap(containerId, waiverData) {
        const ctx = document.getElementById(containerId);
        if (!ctx) return null;

        // Create a matrix-style visualization
        const positions = ['QB', 'RB', 'WR', 'TE'];
        const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        
        const datasets = positions.map((position, posIndex) => ({
            label: position,
            data: weeks.map((week, weekIndex) => ({
                x: weekIndex,
                y: posIndex,
                v: waiverData[position]?.[weekIndex] || 0
            })),
            backgroundColor: function(context) {
                const value = context.parsed.v;
                const alpha = value / 100;
                return `rgba(102, 126, 234, ${alpha})`;
            },
            borderColor: this.colorScheme.primary,
            borderWidth: 1
        }));

        const chart = new Chart(ctx, {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Waiver Wire Opportunity Heatmap',
                        color: this.colorScheme.primary,
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: -0.5,
                        max: 3.5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return weeks[value] || '';
                            },
                            color: '#a0aec0'
                        },
                        grid: { color: '#374151' }
                    },
                    y: {
                        type: 'linear',
                        min: -0.5,
                        max: 3.5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return positions[value] || '';
                            },
                            color: '#a0aec0'
                        },
                        grid: { color: '#374151' }
                    }
                }
            }
        });

        this.chartInstances.set(containerId, chart);
        return chart;
    }

    // Trade Value Timeline Chart
    createTradeValueChart(containerId, tradeData) {
        const ctx = document.getElementById(containerId);
        if (!ctx) return null;

        const weeks = tradeData.timeline.map(point => `Week ${point.week}`);
        const playerAValue = tradeData.timeline.map(point => point.playerAValue);
        const playerBValue = tradeData.timeline.map(point => point.playerBValue);

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeks,
                datasets: [
                    {
                        label: tradeData.playerA.name,
                        data: playerAValue,
                        borderColor: this.colorScheme.primary,
                        backgroundColor: this.colorScheme.primary + '20',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: tradeData.playerB.name,
                        data: playerBValue,
                        borderColor: this.colorScheme.success,
                        backgroundColor: this.colorScheme.success + '20',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Trade Value Timeline',
                        color: this.colorScheme.primary,
                        font: { size: 16, weight: 'bold' }
                    },
                    intersection: {
                        intersect: false,
                        mode: 'index'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#374151' },
                        ticks: { color: '#a0aec0' }
                    },
                    x: {
                        grid: { color: '#374151' },
                        ticks: { color: '#a0aec0' }
                    }
                }
            }
        });

        this.chartInstances.set(containerId, chart);
        return chart;
    }

    // Helper Methods
    getPlayerColor(index) {
        const colors = [
            this.colorScheme.primary,
            this.colorScheme.success,
            this.colorScheme.warning,
            this.colorScheme.danger,
            this.colorScheme.info,
            this.colorScheme.secondary
        ];
        return colors[index % colors.length];
    }

    destroyChart(containerId) {
        const chart = this.chartInstances.get(containerId);
        if (chart) {
            chart.destroy();
            this.chartInstances.delete(containerId);
        }
    }

    destroyAllCharts() {
        this.chartInstances.forEach((chart, id) => {
            chart.destroy();
        });
        this.chartInstances.clear();
    }

    updateChart(containerId, newData) {
        const chart = this.chartInstances.get(containerId);
        if (chart) {
            chart.data = newData;
            chart.update();
        }
    }

    // Animation helpers
    animateChart(containerId, animationType = 'easeInOutQuart') {
        const chart = this.chartInstances.get(containerId);
        if (chart) {
            chart.options.animation = {
                duration: 1000,
                easing: animationType
            };
            chart.update();
        }
    }

    // Export chart as image
    exportChart(containerId, filename = 'chart.png') {
        const chart = this.chartInstances.get(containerId);
        if (chart) {
            const url = chart.toBase64Image();
            const link = document.createElement('a');
            link.download = filename;
            link.href = url;
            link.click();
        }
    }
}

// Export for use in the main application
window.FantasyCharts = FantasyCharts;

// Initialize the charts system
window.fantasyCharts = new FantasyCharts();

console.log('📊 Revolutionary Fantasy Charts loaded successfully!');