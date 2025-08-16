/**
 * Voice Assistant API Routes
 * Defines the routing structure for voice platform webhooks
 */

import { Router } from 'express';
import { VoiceGatewayService } from '../services/voice-gateway.service';
import { AlexaRequest, AlexaResponse } from '../types/alexa.types';
import { GoogleRequest, GoogleResponse } from '../types/google.types';
import { SiriRequest, SiriResponse } from '../types/siri.types';

export class VoiceRoutes {
  private router: Router;
  private voiceGateway: VoiceGatewayService;

  constructor() {
    this.router = Router();
    this.voiceGateway = new VoiceGatewayService();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Alexa Skills Kit webhook
    this.router.post('/alexa', async (req, res) => {
      try {
        const alexaRequest: AlexaRequest = req.body;
        const response: AlexaResponse = await this.voiceGateway.handleAlexaRequest(alexaRequest);
        res.json(response);
      } catch (error) {
        console.error('Alexa request error:', error);
        res.status(500).json({
          version: '1.0',
          response: {
            outputSpeech: {
              type: 'PlainText',
              text: 'Sorry, I encountered an error processing your request.'
            },
            shouldEndSession: true
          }
        });
      }
    });

    // Google Assistant Actions webhook
    this.router.post('/google', async (req, res) => {
      try {
        const googleRequest: GoogleRequest = req.body;
        const response: GoogleResponse = await this.voiceGateway.handleGoogleRequest(googleRequest);
        res.json(response);
      } catch (error) {
        console.error('Google Assistant request error:', error);
        res.status(500).json({
          fulfillmentText: 'Sorry, I encountered an error processing your request.'
        });
      }
    });

    // Siri Shortcuts webhook
    this.router.post('/siri', async (req, res) => {
      try {
        const siriRequest: SiriRequest = req.body;
        const response: SiriResponse = await this.voiceGateway.handleSiriRequest(siriRequest);
        res.json(response);
      } catch (error) {
        console.error('Siri request error:', error);
        res.status(500).json({
          responseCode: 'failure',
          error: {
            code: 'INTERNAL_ERROR',
            localizedDescription: 'Sorry, I encountered an error processing your request.'
          }
        });
      }
    });

    // Health check endpoint
    this.router.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        platforms: {
          alexa: 'available',
          google: 'available',
          siri: 'available'
        }
      });
    });

    // Voice capabilities endpoint
    this.router.get('/capabilities', (req, res) => {
      res.json({
        supportedPlatforms: ['alexa', 'google', 'siri'],
        supportedIntents: [
          'GetTeamStatus',
          'GetPlayerProjection',
          'SetLineup',
          'GetWaiverTargets',
          'AnalyzeTrade',
          'GetMatchupAnalysis'
        ],
        features: {
          multiTurnConversation: true,
          contextAwareness: true,
          playerNameResolution: true,
          lineupManagement: true,
          tradeAnalysis: true,
          waiverWireRecommendations: true
        }
      });
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default VoiceRoutes;