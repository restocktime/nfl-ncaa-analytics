/**
 * Fantasy Football Helper - Complete Usage Example
 * 
 * This example demonstrates how to use all the fantasy football features
 * including lineup optimization, waiver wire analysis, trade evaluation,
 * and player projections.
 */

import { FantasyService } from '../core/fantasy-service';
import { FantasyMLEngine } from '../core/fantasy-ml-engine';
import { LineupOptimizer } from '../core/lineup-optimizer';
import { WaiverWireAnalyzer } from '../core/waiver-wire-analyzer';
import { TradeAnalyzer } from '../core/trade-analyzer';
import { MLModelService } from '../core/ml-model-service';
import { PlayerRepository } from '../repositories/PlayerRepository';
import { WeatherAPIConnector } from '../core/weather-api-connector';
import { DatabaseService } from '../core/database-service';

async function runFantasyFootballExample() {
  console.log('🏈 Fantasy Football Helper - Complete Example');
  console.log('================================================');

  // Initialize services (in real app, these would be dependency injected)
  const databaseService = new DatabaseService();
  const mlModelService = new MLModelService();
  const playerRepository = new PlayerRepository(databaseService);
  const weatherConnector = new WeatherAPIConnector();

  const fantasyMLEngine = new FantasyMLEngine(
    mlModelService,
    weatherConnector,
    databaseService
  );

  const fantasyService = new FantasyService(
    mlModelService,
    playerRepository,
    weatherConnector,
    databaseService
  );

  const lineupOptimizer = new LineupOptimizer();
  const waiverAnalyzer = new WaiverWireAnalyzer(
    databaseService,
    fantasyMLEngine,
    playerRepository
  );
  const tradeAnalyzer = new TradeAnalyzer(
    databaseService,
    fantasyMLEngine,
    playerRepository
  );

  try {
    // Example 1: Get Player Projections
    console.log('\n📊 Example 1: Player Projections');
    console.log('----------------------------------');
    
    const projectionResult = await fantasyService.getPlayerProjections('josh-allen', 12);
    
    if (projectionResult.success) {
      const projection = projectionResult.data;
      console.log(`Player: Josh Allen (QB)`);
      console.log(`Week 12 Projection: ${projection.projectedPoints} points`);
      console.log(`Ceiling: ${projection.ceiling} | Floor: ${projection.floor}`);
      console.log(`Confidence Interval: ${projection.confidenceInterval[0]} - ${projection.confidenceInterval[1]}`);
      console.log(`Matchup Rating: ${projection.matchupRating.overall}/10`);
      console.log(`Injury Risk: ${projection.injuryRisk.level} (${(projection.injuryRisk.probability * 100).toFixed(1)}%)`);
      
      if (projection.weatherImpact.impact !== 0) {
        console.log(`Weather Impact: ${projection.weatherImpact.impact > 0 ? '+' : ''}${(projection.weatherImpact.impact * 100).toFixed(1)}%`);
        console.log(`Weather: ${projection.weatherImpact.temperature}°F, ${projection.weatherImpact.windSpeed}mph wind`);
      }
    }

    // Example 2: Lineup Optimization
    console.log('\n⚡ Example 2: Lineup Optimization');
    console.log('----------------------------------');
    
    const lineupRequest = {
      userId: 'user123',
      leagueId: 'league456',
      week: 12,
      constraints: {
        maxRisk: 'MODERATE' as const,
        mustStart: ['josh-allen'], // Must start Josh Allen
        stackingPreference: {
          enabled: true,
          qbWrStack: true,
          qbTeStack: false,
          gameStack: false
        }
      }
    };

    const lineupResult = await fantasyService.getLineupRecommendations(lineupRequest);
    
    if (lineupResult.success && lineupResult.data.length > 0) {
      const recommendation = lineupResult.data[0];
      console.log(`Optimal Lineup (${recommendation.projectedPoints} projected points):`);
      console.log(`QB: ${recommendation.lineup.QB?.name} (${recommendation.lineup.QB?.projectedPoints} pts)`);
      
      recommendation.lineup.RB.forEach((rb, i) => {
        console.log(`RB${i + 1}: ${rb.name} (${rb.projectedPoints} pts)`);
      });
      
      recommendation.lineup.WR.forEach((wr, i) => {
        console.log(`WR${i + 1}: ${wr.name} (${wr.projectedPoints} pts)`);
      });
      
      if (recommendation.lineup.TE) {
        console.log(`TE: ${recommendation.lineup.TE.name} (${recommendation.lineup.TE.projectedPoints} pts)`);
      }
      
      if (recommendation.lineup.FLEX) {
        console.log(`FLEX: ${recommendation.lineup.FLEX.name} (${recommendation.lineup.FLEX.projectedPoints} pts)`);
      }
      
      if (recommendation.lineup.K) {
        console.log(`K: ${recommendation.lineup.K.name} (${recommendation.lineup.K.projectedPoints} pts)`);
      }
      
      if (recommendation.lineup.DEF) {
        console.log(`DEF: ${recommendation.lineup.DEF.name} (${recommendation.lineup.DEF.projectedPoints} pts)`);
      }
      
      console.log(`\nConfidence: ${(recommendation.confidence * 100).toFixed(1)}%`);
      console.log(`Risk Level: ${recommendation.riskLevel}`);
      console.log('\nReasoning:');
      recommendation.reasoning.forEach(reason => console.log(`  • ${reason}`));
      
      if (recommendation.alternatives.length > 0) {
        console.log('\nAlternative Options:');
        recommendation.alternatives.slice(0, 3).forEach(alt => {
          console.log(`  • ${alt.player.name} (${alt.position}): ${alt.reasoning}`);
        });
      }
    }

    // Example 3: Waiver Wire Analysis
    console.log('\n🔍 Example 3: Waiver Wire Analysis');
    console.log('-----------------------------------');
    
    const waiverRequest = {
      userId: 'user123',
      leagueId: 'league456',
      week: 12,
      availablePlayers: [
        'jaylen-warren',
        'romeo-doubs',
        'tyler-higbee',
        'deon-jackson',
        'kendrick-bourne'
      ],
      rosterNeeds: ['RB', 'WR']
    };

    const waiverResult = await fantasyService.getWaiverWireTargets(waiverRequest);
    
    if (waiverResult.success) {
      console.log('Top Waiver Wire Targets:');
      waiverResult.data.slice(0, 5).forEach((target, i) => {
        console.log(`\n${i + 1}. ${target.player.name} (${target.player.position}) - ${target.player.team}`);
        console.log(`   Priority: ${target.priority}/10`);
        console.log(`   Opportunity Score: ${target.opportunityScore}`);
        console.log(`   Add %: ${target.addPercentage}%`);
        if (target.faabBid) {
          console.log(`   Suggested FAAB Bid: $${target.faabBid}`);
        }
        console.log('   Reasoning:');
        target.reasoning.forEach(reason => console.log(`     • ${reason}`));
        
        if (target.dropCandidates.length > 0) {
          console.log('   Drop Candidates:');
          target.dropCandidates.slice(0, 2).forEach(candidate => {
            console.log(`     • ${candidate.name} (${candidate.position})`);
          });
        }
      });
    }

    // Example 4: Trade Analysis
    console.log('\n🔄 Example 4: Trade Analysis');
    console.log('-----------------------------');
    
    const tradeProposal = {
      id: 'trade789',
      givingPlayers: [
        {
          playerId: 'saquon-barkley',
          name: 'Saquon Barkley',
          position: 'RB' as const,
          team: 'PHI',
          fantasyPosition: 'RB' as const,
          isStarter: true,
          projectedPoints: 18.2,
          seasonProjection: 290,
          value: 88,
          trend: 'UP' as const,
          injuryStatus: 'HEALTHY' as const,
          byeWeek: 7
        }
      ],
      receivingPlayers: [
        {
          playerId: 'ceedee-lamb',
          name: 'CeeDee Lamb',
          position: 'WR' as const,
          team: 'DAL',
          fantasyPosition: 'WR' as const,
          isStarter: true,
          projectedPoints: 15.8,
          seasonProjection: 280,
          value: 85,
          trend: 'STABLE' as const,
          injuryStatus: 'HEALTHY' as const,
          byeWeek: 7
        },
        {
          playerId: 'david-montgomery',
          name: 'David Montgomery',
          position: 'RB' as const,
          team: 'DET',
          fantasyPosition: 'RB' as const,
          isStarter: false,
          projectedPoints: 12.4,
          seasonProjection: 200,
          value: 68,
          trend: 'DOWN' as const,
          injuryStatus: 'HEALTHY' as const,
          byeWeek: 5
        }
      ],
      proposedBy: 'opponent123',
      proposedTo: 'user123',
      status: 'PENDING' as const,
      createdAt: new Date()
    };

    const tradeRequest = {
      userId: 'user123',
      leagueId: 'league456',
      trade: tradeProposal
    };

    const tradeResult = await fantasyService.analyzeTradeProposal(tradeRequest);
    
    if (tradeResult.success) {
      const analysis = tradeResult.data;
      console.log('Trade Analysis Results:');
      console.log(`\nYou Give: ${tradeProposal.givingPlayers.map(p => p.name).join(', ')}`);
      console.log(`You Receive: ${tradeProposal.receivingPlayers.map(p => p.name).join(', ')}`);
      console.log(`\nRecommendation: ${analysis.recommendation}`);
      console.log(`Fair Value: ${analysis.fairValue > 0 ? '+' : ''}${(analysis.fairValue * 100).toFixed(1)}%`);
      
      console.log('\nImpact Analysis:');
      console.log(`  Short Term (4 weeks): ${analysis.impactAnalysis.shortTerm > 0 ? '+' : ''}${(analysis.impactAnalysis.shortTerm * 100).toFixed(1)}%`);
      console.log(`  Long Term (ROS): ${analysis.impactAnalysis.longTerm > 0 ? '+' : ''}${(analysis.impactAnalysis.longTerm * 100).toFixed(1)}%`);
      console.log(`  Playoff Impact: ${analysis.impactAnalysis.playoffImpact > 0 ? '+' : ''}${(analysis.impactAnalysis.playoffImpact * 100).toFixed(1)}%`);
      
      console.log('\nReasoning:');
      analysis.reasoning.forEach(reason => console.log(`  • ${reason}`));
      
      if (analysis.alternativeOffers && analysis.alternativeOffers.length > 0) {
        console.log('\nAlternative Offers:');
        analysis.alternativeOffers.forEach((alt, i) => {
          console.log(`  ${i + 1}. Give: ${alt.givingPlayers.map(p => p.name).join(', ')}`);
          console.log(`     Receive: ${alt.receivingPlayers.map(p => p.name).join(', ')}`);
        });
      }
    }

    // Example 5: Weekly Strategy
    console.log('\n📋 Example 5: Weekly Strategy');
    console.log('------------------------------');
    
    const strategyResult = await fantasyService.getWeeklyStrategy('user123', 12);
    
    if (strategyResult.success) {
      const strategy = strategyResult.data;
      console.log(`Week ${strategy.week} Strategy:`);
      
      console.log('\nPriorities:');
      strategy.priorities.forEach((priority, i) => {
        console.log(`  ${i + 1}. ${priority}`);
      });
      
      if (strategy.lineupRecommendations.length > 0) {
        const lineup = strategy.lineupRecommendations[0];
        console.log(`\nRecommended Lineup: ${lineup.projectedPoints} projected points`);
        console.log(`Risk Level: ${lineup.riskLevel}`);
        console.log(`Confidence: ${(lineup.confidence * 100).toFixed(1)}%`);
      }
      
      if (strategy.waiverTargets.length > 0) {
        console.log('\nTop Waiver Targets:');
        strategy.waiverTargets.slice(0, 3).forEach(target => {
          console.log(`  • ${target.player.name} (${target.player.position}) - Priority ${target.priority}`);
        });
      }
      
      if (strategy.tradeOpportunities.length > 0) {
        console.log('\nTrade Opportunities:');
        strategy.tradeOpportunities.slice(0, 2).forEach(opp => {
          console.log(`  • Target: ${opp.targetTeam}`);
          console.log(`    Mutual Benefit: ${(opp.mutualBenefit * 100).toFixed(1)}%`);
          console.log(`    Likelihood: ${(opp.likelihood * 100).toFixed(1)}%`);
        });
      }
      
      if (strategy.byeWeekStrategy) {
        console.log('\nBye Week Strategy:');
        console.log(`Affected Positions: ${strategy.byeWeekStrategy.affectedPositions.join(', ')}`);
        
        if (strategy.byeWeekStrategy.recommendations.waiver.length > 0) {
          console.log('Waiver Recommendations:');
          strategy.byeWeekStrategy.recommendations.waiver.forEach(rec => {
            console.log(`  • ${rec.player.name} (${rec.player.position})`);
          });
        }
        
        if (strategy.byeWeekStrategy.recommendations.streaming.length > 0) {
          console.log('Streaming Options:');
          strategy.byeWeekStrategy.recommendations.streaming.forEach(stream => {
            console.log(`  • ${stream.player.name} - Weeks ${stream.weeks.join(', ')}`);
            console.log(`    ${stream.reasoning}`);
          });
        }
      }
    }

    // Example 6: Advanced Analytics
    console.log('\n📈 Example 6: Advanced Analytics');
    console.log('---------------------------------');
    
    // Demonstrate breakout candidate identification
    const breakoutCandidates = await waiverAnalyzer.identifyBreakoutCandidates(
      ['rookie-rb-1', 'backup-wr-2', 'handcuff-rb-3'],
      12
    );
    
    if (breakoutCandidates.length > 0) {
      console.log('Breakout Candidates:');
      breakoutCandidates.slice(0, 3).forEach(candidate => {
        console.log(`\n• ${candidate.player.name} (${candidate.player.position})`);
        console.log(`  Breakout Probability: ${(candidate.breakoutProbability * 100).toFixed(1)}%`);
        console.log('  Catalysts:');
        candidate.catalysts.forEach(catalyst => {
          console.log(`    - ${catalyst}`);
        });
      });
    }

    // Demonstrate injury replacement analysis
    const injuredPlayer = {
      playerId: 'injured-rb',
      name: 'Injured RB',
      position: 'RB' as const,
      team: 'TEST',
      fantasyPosition: 'RB' as const,
      isStarter: true,
      projectedPoints: 0,
      seasonProjection: 200,
      value: 75,
      trend: 'DOWN' as const,
      injuryStatus: 'OUT' as const,
      byeWeek: 10
    };

    const replacements = await waiverAnalyzer.calculateInjuryReplacementValue(
      injuredPlayer,
      ['backup-rb-1', 'backup-rb-2', 'backup-rb-3'],
      12
    );

    if (replacements.length > 0) {
      console.log('\nInjury Replacement Options:');
      replacements.slice(0, 3).forEach(replacement => {
        console.log(`• ${replacement.player.name}`);
        console.log(`  Replacement Value: ${(replacement.replacementValue * 100).toFixed(1)}%`);
        console.log(`  Projected Impact: ${replacement.projectedImpact.toFixed(1)} points`);
      });
    }

    console.log('\n✅ Fantasy Football Example completed successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('• Player projections with ML-based analysis');
    console.log('• Lineup optimization with constraints');
    console.log('• Waiver wire intelligence and opportunity scoring');
    console.log('• Trade analysis with fair value assessment');
    console.log('• Weekly strategy generation');
    console.log('• Breakout candidate identification');
    console.log('• Injury replacement analysis');
    console.log('• Weather and matchup impact calculations');
    console.log('• Risk assessment and confidence intervals');

  } catch (error) {
    console.error('❌ Error in fantasy football example:', error);
  } finally {
    // Cleanup
    await databaseService.close();
  }
}

// Export for use in other modules
export { runFantasyFootballExample };

// Run example if this file is executed directly
if (require.main === module) {
  runFantasyFootballExample().catch(console.error);
}