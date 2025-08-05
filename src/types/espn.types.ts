/**
 * ESPN API specific types and interfaces
 */

import { GameScore, BettingLine } from './game.types';
import { Player } from './player.types';
import { Team } from './team.types';
import { GameStatus, Position, InjuryStatus } from './common.types';

/**
 * ESPN API response wrapper
 */
export interface ESPNResponse<T> {
  sports: T[];
  leagues: ESPNLeague[];
  season: ESPNSeason;
  events: ESPNEvent[];
}

/**
 * ESPN League structure
 */
export interface ESPNLeague {
  id: string;
  uid: string;
  name: string;
  abbreviation: string;
  slug: string;
  season: ESPNSeason;
  logos: ESPNLogo[];
  calendarType: string;
  calendarIsWhitelist: boolean;
  calendarStartDate: string;
  calendarEndDate: string;
}

/**
 * ESPN Season structure
 */
export interface ESPNSeason {
  year: number;
  startDate: string;
  endDate: string;
  displayName: string;
  type: {
    id: string;
    type: number;
    name: string;
    abbreviation: string;
  };
}

/**
 * ESPN Event (Game) structure
 */
export interface ESPNEvent {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  season: {
    year: number;
    type: number;
  };
  week: {
    number: number;
  };
  competitions: ESPNCompetition[];
  links: ESPNLink[];
  weather?: ESPNWeather;
  status: ESPNStatus;
}

/**
 * ESPN Competition structure
 */
export interface ESPNCompetition {
  id: string;
  uid: string;
  date: string;
  attendance: number;
  type: {
    id: string;
    abbreviation: string;
  };
  timeValid: boolean;
  neutralSite: boolean;
  conferenceCompetition: boolean;
  playByPlayAvailable: boolean;
  recent: boolean;
  venue: ESPNVenue;
  competitors: ESPNCompetitor[];
  notes: ESPNNote[];
  status: ESPNStatus;
  broadcasts: ESPNBroadcast[];
  leaders?: ESPNLeader[];
  format: {
    regulation: {
      periods: number;
    };
  };
  startDate: string;
  geoBroadcasts: ESPNGeoBroadcast[];
  headlines?: ESPNHeadline[];
}

/**
 * ESPN Competitor (Team) structure
 */
export interface ESPNCompetitor {
  id: string;
  uid: string;
  type: string;
  order: number;
  homeAway: 'home' | 'away';
  winner?: boolean;
  team: ESPNTeam;
  score: string;
  linescores?: ESPNLineScore[];
  statistics?: ESPNStatistic[];
  leaders?: ESPNLeader[];
  curatedRank?: {
    current: number;
  };
  records?: ESPNRecord[];
}

/**
 * ESPN Team structure
 */
export interface ESPNTeam {
  id: string;
  uid: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color: string;
  alternateColor: string;
  isActive: boolean;
  venue: {
    id: string;
  };
  links: ESPNLink[];
  logo: string;
  logos: ESPNLogo[];
}

/**
 * ESPN Status structure
 */
export interface ESPNStatus {
  clock: number;
  displayClock: string;
  period: number;
  type: {
    id: string;
    name: string;
    state: string;
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
  };
}

/**
 * ESPN Venue structure
 */
export interface ESPNVenue {
  id: string;
  fullName: string;
  address: {
    city: string;
    state: string;
  };
  capacity: number;
  indoor: boolean;
}

/**
 * ESPN Weather structure
 */
export interface ESPNWeather {
  displayValue: string;
  temperature: number;
  highTemperature: number;
  conditionId: string;
  link: {
    language: string;
    rel: string[];
    href: string;
    text: string;
    shortText: string;
    isExternal: boolean;
    isPremium: boolean;
  };
}

/**
 * ESPN Line Score structure
 */
export interface ESPNLineScore {
  value: number;
  displayValue: string;
}

/**
 * ESPN Statistic structure
 */
export interface ESPNStatistic {
  name: string;
  abbreviation: string;
  displayValue: string;
  rankDisplayValue?: string;
}

/**
 * ESPN Leader structure
 */
export interface ESPNLeader {
  name: string;
  displayName: string;
  shortDisplayName: string;
  abbreviation: string;
  leaders: ESPNLeaderEntry[];
}

/**
 * ESPN Leader Entry structure
 */
export interface ESPNLeaderEntry {
  displayValue: string;
  value: number;
  athlete: ESPNAthlete;
  team: {
    id: string;
  };
}

/**
 * ESPN Athlete (Player) structure
 */
export interface ESPNAthlete {
  id: string;
  uid: string;
  displayName: string;
  shortName: string;
  links: ESPNLink[];
  headshot: string;
  jersey: string;
  position: {
    abbreviation: string;
  };
  team: {
    id: string;
  };
  active: boolean;
}

/**
 * ESPN Record structure
 */
export interface ESPNRecord {
  name: string;
  abbreviation?: string;
  type: string;
  summary: string;
}

/**
 * ESPN Note structure
 */
export interface ESPNNote {
  type: string;
  headline: string;
}

/**
 * ESPN Broadcast structure
 */
export interface ESPNBroadcast {
  market: string;
  names: string[];
}

/**
 * ESPN Geo Broadcast structure
 */
export interface ESPNGeoBroadcast {
  type: {
    id: string;
    shortName: string;
  };
  market: {
    id: string;
    type: string;
  };
  media: {
    shortName: string;
  };
  lang: string;
  region: string;
}

/**
 * ESPN Headline structure
 */
export interface ESPNHeadline {
  description: string;
  type: string;
  shortLinkText: string;
  video?: ESPNVideo[];
}

/**
 * ESPN Video structure
 */
export interface ESPNVideo {
  id: number;
  source: string;
  headline: string;
  caption: string;
  description: string;
  premium: boolean;
  ad: {
    sport: string;
    bundle: string;
  };
  tracking: {
    sportName: string;
    leagueName: string;
    coverageType: string;
    trackingName: string;
    trackingId: string;
  };
  cerebroId: string;
  lastModified: string;
  originalPublishDate: string;
  timeRestrictions: {
    embargoDate: string;
    expirationDate: string;
  };
  deviceRestrictions: {
    type: string;
    devices: string[];
  };
  links: {
    api: {
      self: {
        href: string;
      };
      artwork: {
        href: string;
      };
    };
    web: {
      href: string;
      short: {
        href: string;
      };
      self: {
        href: string;
      };
    };
    source: {
      mezzanine: {
        href: string;
      };
      flash: {
        href: string;
      };
      hds: {
        href: string;
      };
      HLS: {
        href: string;
        HD: {
          href: string;
        };
      };
      HD: {
        href: string;
      };
      full: {
        href: string;
      };
      href: string;
    };
    mobile: {
      alert: {
        href: string;
      };
      source: {
        href: string;
      };
      href: string;
      streaming: {
        href: string;
      };
      progressiveDownload: {
        href: string;
      };
    };
  };
  thumbnail: string;
  poster: string;
  images: ESPNImage[];
  duration: number;
  keywords: string[];
}

/**
 * ESPN Image structure
 */
export interface ESPNImage {
  name: string;
  url: string;
  alt: string;
  caption: string;
  credit: string;
  width: number;
  height: number;
}

/**
 * ESPN Link structure
 */
export interface ESPNLink {
  language?: string;
  rel: string[];
  href: string;
  text: string;
  shortText?: string;
  isExternal: boolean;
  isPremium: boolean;
}

/**
 * ESPN Logo structure
 */
export interface ESPNLogo {
  href: string;
  width: number;
  height: number;
  alt: string;
  rel: string[];
  lastUpdated: string;
}

/**
 * ESPN API endpoints configuration
 */
export interface ESPNEndpoints {
  collegeFootball: {
    scoreboard: string;
    teams: string;
    games: string;
    rankings: string;
    news: string;
  };
  nfl: {
    scoreboard: string;
    teams: string;
    games: string;
    news: string;
  };
}

/**
 * ESPN API configuration
 */
export interface ESPNConfig {
  baseUrl: string;
  endpoints: ESPNEndpoints;
  rateLimit: {
    requestsPerMinute: number;
  };
}

/**
 * Utility functions for converting ESPN data to internal types
 */
export class ESPNMapper {
  static mapGameStatus(status: ESPNStatus): GameStatus {
    const state = status.type.state.toLowerCase();
    const completed = status.type.completed;

    if (completed) {
      return GameStatus.FINAL;
    }

    switch (state) {
      case 'pre':
        return GameStatus.SCHEDULED;
      case 'in':
        // Check if it's halftime based on period and clock
        if (status.period === 2 && status.clock === 0) {
          return GameStatus.HALFTIME;
        }
        return GameStatus.IN_PROGRESS;
      case 'post':
        return GameStatus.FINAL;
      default:
        return GameStatus.SCHEDULED;
    }
  }

  static mapPosition(position: string): Position {
    const pos = position.toUpperCase();
    return Position[pos as keyof typeof Position] || Position.QB;
  }

  static parseDate(dateString: string): Date {
    return new Date(dateString);
  }

  static mapTeamToInternal(espnTeam: ESPNTeam, competitor: ESPNCompetitor): Team {
    return {
      id: espnTeam.id,
      name: espnTeam.name,
      abbreviation: espnTeam.abbreviation,
      city: espnTeam.location,
      conference: '', // Would need additional API call to get conference
      division: undefined,
      logo: espnTeam.logo || (espnTeam.logos.length > 0 ? espnTeam.logos[0].href : ''),
      primaryColor: espnTeam.color,
      secondaryColor: espnTeam.alternateColor,
      roster: [], // Would need separate API call
      coaching: {
        headCoach: {
          id: `${espnTeam.id}-hc`,
          name: 'Unknown',
          position: 'Head Coach',
          experience: 0,
          previousTeams: []
        },
        offensiveCoordinator: {
          id: `${espnTeam.id}-oc`,
          name: 'Unknown',
          position: 'Offensive Coordinator',
          experience: 0,
          previousTeams: []
        },
        defensiveCoordinator: {
          id: `${espnTeam.id}-dc`,
          name: 'Unknown',
          position: 'Defensive Coordinator',
          experience: 0,
          previousTeams: []
        },
        specialTeamsCoordinator: {
          id: `${espnTeam.id}-st`,
          name: 'Unknown',
          position: 'Special Teams Coordinator',
          experience: 0,
          previousTeams: []
        },
        assistants: []
      },
      statistics: {
        season: new Date().getFullYear(),
        games: 0,
        wins: 0,
        losses: 0,
        pointsPerGame: 0,
        yardsPerGame: 0,
        passingYardsPerGame: 0,
        rushingYardsPerGame: 0,
        turnoversPerGame: 0,
        thirdDownConversion: 0,
        redZoneEfficiency: 0,
        pointsAllowedPerGame: 0,
        yardsAllowedPerGame: 0,
        passingYardsAllowedPerGame: 0,
        rushingYardsAllowedPerGame: 0,
        takeawaysPerGame: 0,
        thirdDownDefense: 0,
        redZoneDefense: 0,
        fieldGoalPercentage: 0,
        puntAverage: 0,
        kickReturnAverage: 0,
        puntReturnAverage: 0,
        strengthOfSchedule: 0,
        powerRating: 0,
        eloRating: 1500
      },
      homeVenue: espnTeam.venue?.id || ''
    };
  }

  static mapGameScoreToInternal(event: ESPNEvent): GameScore {
    const competition = event.competitions[0];
    const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');
    const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');

    return {
      gameId: event.id,
      homeScore: parseInt(homeCompetitor?.score || '0', 10),
      awayScore: parseInt(awayCompetitor?.score || '0', 10),
      quarter: competition.status.period,
      timeRemaining: {
        quarter: competition.status.period,
        minutes: Math.floor(competition.status.clock / 60),
        seconds: competition.status.clock % 60
      },
      lastUpdated: new Date(),
      final: competition.status.type.completed
    };
  }

  static extractWeatherFromEvent(event: ESPNEvent) {
    const competition = event.competitions[0];
    if (!event.weather) return null;

    return {
      temperature: event.weather.temperature,
      humidity: 0, // ESPN doesn't provide humidity
      windSpeed: 0, // ESPN doesn't provide wind speed
      windDirection: 0, // ESPN doesn't provide wind direction
      precipitation: 0, // ESPN doesn't provide precipitation
      conditions: event.weather.displayValue,
      visibility: 10 // Default visibility
    };
  }
}