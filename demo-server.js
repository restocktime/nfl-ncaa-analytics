const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const WebSocket = require('ws');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Simple demo server for Football Analytics System
 * Shows the system working with sample data
 */

// Comprehensive College Football Dataset
const teams = [
  // SEC Conference
  {
    id: '1',
    name: 'Alabama Crimson Tide',
    abbreviation: 'ALA',
    conference: 'SEC',
    division: 'West',
    logoUrl: 'https://example.com/alabama-logo.png',
    primaryColor: '#9E1B32',
    secondaryColor: '#FFFFFF',
    venue: 'Bryant-Denny Stadium',
    city: 'Tuscaloosa',
    state: 'Alabama',
    capacity: 101821,
    founded: 1831,
    mascot: 'Big Al'
  },
  {
    id: '2',
    name: 'Georgia Bulldogs',
    abbreviation: 'UGA',
    conference: 'SEC',
    division: 'East',
    logoUrl: 'https://example.com/georgia-logo.png',
    primaryColor: '#BA0C2F',
    secondaryColor: '#000000',
    venue: 'Sanford Stadium',
    city: 'Athens',
    state: 'Georgia',
    capacity: 92746,
    founded: 1785,
    mascot: 'Uga'
  },
  {
    id: '3',
    name: 'LSU Tigers',
    abbreviation: 'LSU',
    conference: 'SEC',
    division: 'West',
    logoUrl: 'https://example.com/lsu-logo.png',
    primaryColor: '#461D7C',
    secondaryColor: '#FDD023',
    venue: 'Tiger Stadium',
    city: 'Baton Rouge',
    state: 'Louisiana',
    capacity: 102321,
    founded: 1860,
    mascot: 'Mike the Tiger'
  },
  {
    id: '4',
    name: 'Florida Gators',
    abbreviation: 'FLA',
    conference: 'SEC',
    division: 'East',
    logoUrl: 'https://example.com/florida-logo.png',
    primaryColor: '#0021A5',
    secondaryColor: '#FA4616',
    venue: 'Ben Hill Griffin Stadium',
    city: 'Gainesville',
    state: 'Florida',
    capacity: 88548,
    founded: 1853,
    mascot: 'Albert and Alberta'
  },
  {
    id: '5',
    name: 'Auburn Tigers',
    abbreviation: 'AUB',
    conference: 'SEC',
    division: 'West',
    logoUrl: 'https://example.com/auburn-logo.png',
    primaryColor: '#0C2340',
    secondaryColor: '#DD550C',
    venue: 'Jordan-Hare Stadium',
    city: 'Auburn',
    state: 'Alabama',
    capacity: 87451,
    founded: 1856,
    mascot: 'Aubie'
  },
  {
    id: '6',
    name: 'Tennessee Volunteers',
    abbreviation: 'TENN',
    conference: 'SEC',
    division: 'East',
    logoUrl: 'https://example.com/tennessee-logo.png',
    primaryColor: '#FF8200',
    secondaryColor: '#FFFFFF',
    venue: 'Neyland Stadium',
    city: 'Knoxville',
    state: 'Tennessee',
    capacity: 102455,
    founded: 1794,
    mascot: 'Smokey'
  },
  
  // Big Ten Conference
  {
    id: '7',
    name: 'Michigan Wolverines',
    abbreviation: 'MICH',
    conference: 'Big Ten',
    division: 'East',
    logoUrl: 'https://example.com/michigan-logo.png',
    primaryColor: '#00274C',
    secondaryColor: '#FFCB05',
    venue: 'Michigan Stadium',
    city: 'Ann Arbor',
    state: 'Michigan',
    capacity: 107601,
    founded: 1817,
    mascot: 'Wolverine'
  },
  {
    id: '8',
    name: 'Ohio State Buckeyes',
    abbreviation: 'OSU',
    conference: 'Big Ten',
    division: 'East',
    logoUrl: 'https://example.com/ohio-state-logo.png',
    primaryColor: '#BB0000',
    secondaryColor: '#CCCCCC',
    venue: 'Ohio Stadium',
    city: 'Columbus',
    state: 'Ohio',
    capacity: 104944,
    founded: 1870,
    mascot: 'Brutus Buckeye'
  },
  {
    id: '9',
    name: 'Penn State Nittany Lions',
    abbreviation: 'PSU',
    conference: 'Big Ten',
    division: 'East',
    logoUrl: 'https://example.com/penn-state-logo.png',
    primaryColor: '#041E42',
    secondaryColor: '#FFFFFF',
    venue: 'Beaver Stadium',
    city: 'University Park',
    state: 'Pennsylvania',
    capacity: 106572,
    founded: 1855,
    mascot: 'Nittany Lion'
  },
  {
    id: '10',
    name: 'Wisconsin Badgers',
    abbreviation: 'WIS',
    conference: 'Big Ten',
    division: 'West',
    logoUrl: 'https://example.com/wisconsin-logo.png',
    primaryColor: '#C5050C',
    secondaryColor: '#FFFFFF',
    venue: 'Camp Randall Stadium',
    city: 'Madison',
    state: 'Wisconsin',
    capacity: 80321,
    founded: 1848,
    mascot: 'Bucky Badger'
  },
  
  // Big 12 Conference
  {
    id: '11',
    name: 'Texas Longhorns',
    abbreviation: 'TEX',
    conference: 'Big 12',
    division: '',
    logoUrl: 'https://example.com/texas-logo.png',
    primaryColor: '#BF5700',
    secondaryColor: '#FFFFFF',
    venue: 'Darrell K Royal Stadium',
    city: 'Austin',
    state: 'Texas',
    capacity: 100119,
    founded: 1883,
    mascot: 'Bevo'
  },
  {
    id: '12',
    name: 'Oklahoma Sooners',
    abbreviation: 'OU',
    conference: 'Big 12',
    division: '',
    logoUrl: 'https://example.com/oklahoma-logo.png',
    primaryColor: '#841617',
    secondaryColor: '#FDF9D8',
    venue: 'Gaylord Family Oklahoma Memorial Stadium',
    city: 'Norman',
    state: 'Oklahoma',
    capacity: 80126,
    founded: 1890,
    mascot: 'Sooner Schooner'
  },
  {
    id: '13',
    name: 'Oklahoma State Cowboys',
    abbreviation: 'OKST',
    conference: 'Big 12',
    division: '',
    logoUrl: 'https://example.com/oklahoma-state-logo.png',
    primaryColor: '#FF7300',
    secondaryColor: '#000000',
    venue: 'Boone Pickens Stadium',
    city: 'Stillwater',
    state: 'Oklahoma',
    capacity: 60218,
    founded: 1890,
    mascot: 'Pistol Pete'
  },
  
  // ACC Conference
  {
    id: '14',
    name: 'Clemson Tigers',
    abbreviation: 'CLEM',
    conference: 'ACC',
    division: 'Atlantic',
    logoUrl: 'https://example.com/clemson-logo.png',
    primaryColor: '#F56600',
    secondaryColor: '#522D80',
    venue: 'Memorial Stadium',
    city: 'Clemson',
    state: 'South Carolina',
    capacity: 81500,
    founded: 1889,
    mascot: 'The Tiger'
  },
  {
    id: '15',
    name: 'Florida State Seminoles',
    abbreviation: 'FSU',
    conference: 'ACC',
    division: 'Atlantic',
    logoUrl: 'https://example.com/florida-state-logo.png',
    primaryColor: '#782F40',
    secondaryColor: '#CEB888',
    venue: 'Doak Campbell Stadium',
    city: 'Tallahassee',
    state: 'Florida',
    capacity: 79560,
    founded: 1851,
    mascot: 'Osceola and Renegade'
  },
  {
    id: '16',
    name: 'Miami Hurricanes',
    abbreviation: 'MIA',
    conference: 'ACC',
    division: 'Coastal',
    logoUrl: 'https://example.com/miami-logo.png',
    primaryColor: '#F47321',
    secondaryColor: '#046A38',
    venue: 'Hard Rock Stadium',
    city: 'Miami Gardens',
    state: 'Florida',
    capacity: 65326,
    founded: 1925,
    mascot: 'Sebastian the Ibis'
  },
  
  // Pac-12 Conference
  {
    id: '17',
    name: 'USC Trojans',
    abbreviation: 'USC',
    conference: 'Pac-12',
    division: 'South',
    logoUrl: 'https://example.com/usc-logo.png',
    primaryColor: '#990000',
    secondaryColor: '#FFCC00',
    venue: 'Los Angeles Memorial Coliseum',
    city: 'Los Angeles',
    state: 'California',
    capacity: 77500,
    founded: 1880,
    mascot: 'Tommy Trojan'
  },
  {
    id: '18',
    name: 'Oregon Ducks',
    abbreviation: 'ORE',
    conference: 'Pac-12',
    division: 'North',
    logoUrl: 'https://example.com/oregon-logo.png',
    primaryColor: '#154733',
    secondaryColor: '#FEE123',
    venue: 'Autzen Stadium',
    city: 'Eugene',
    state: 'Oregon',
    capacity: 54000,
    founded: 1876,
    mascot: 'The Oregon Duck'
  },
  {
    id: '19',
    name: 'Washington Huskies',
    abbreviation: 'WASH',
    conference: 'Pac-12',
    division: 'North',
    logoUrl: 'https://example.com/washington-logo.png',
    primaryColor: '#4B2E83',
    secondaryColor: '#B7A57A',
    venue: 'Husky Stadium',
    city: 'Seattle',
    state: 'Washington',
    capacity: 70138,
    founded: 1861,
    mascot: 'Harry the Husky'
  },
  {
    id: '20',
    name: 'Stanford Cardinal',
    abbreviation: 'STAN',
    conference: 'Pac-12',
    division: 'North',
    logoUrl: 'https://example.com/stanford-logo.png',
    primaryColor: '#8C1515',
    secondaryColor: '#FFFFFF',
    venue: 'Stanford Stadium',
    city: 'Stanford',
    state: 'California',
    capacity: 50424,
    founded: 1885,
    mascot: 'Stanford Tree'
  }
];

const players = [
  // Alabama Players
  {
    id: '1',
    name: 'Bryce Young',
    teamId: '1',
    position: 'QB',
    jerseyNumber: 9,
    height: 72,
    weight: 194,
    year: 'Junior',
    hometown: 'Pasadena, CA',
    stats: { passingYards: 3328, touchdowns: 32, interceptions: 5, completionPct: 66.9 }
  },
  {
    id: '2',
    name: 'Jahmyr Gibbs',
    teamId: '1',
    position: 'RB',
    jerseyNumber: 1,
    height: 69,
    weight: 200,
    year: 'Junior',
    hometown: 'Dalton, GA',
    stats: { rushingYards: 926, touchdowns: 7, yardsPerCarry: 6.4, receptions: 44 }
  },
  {
    id: '3',
    name: 'Will Anderson Jr.',
    teamId: '1',
    position: 'LB',
    jerseyNumber: 31,
    height: 75,
    weight: 243,
    year: 'Junior',
    hometown: 'Hampton, GA',
    stats: { tackles: 101, sacks: 17.5, tacklesForLoss: 31, forcedFumbles: 4 }
  },
  {
    id: '4',
    name: 'Jordan Battle',
    teamId: '1',
    position: 'S',
    jerseyNumber: 9,
    height: 72,
    weight: 210,
    year: 'Senior',
    hometown: 'Fort Lauderdale, FL',
    stats: { tackles: 86, interceptions: 3, passBreakups: 8, forcedFumbles: 1 }
  },

  // Georgia Players
  {
    id: '5',
    name: 'Stetson Bennett',
    teamId: '2',
    position: 'QB',
    jerseyNumber: 13,
    height: 71,
    weight: 190,
    year: 'Senior',
    hometown: 'Blackshear, GA',
    stats: { passingYards: 3425, touchdowns: 27, interceptions: 7, completionPct: 68.5 }
  },
  {
    id: '6',
    name: 'Kenny McIntosh',
    teamId: '2',
    position: 'RB',
    jerseyNumber: 6,
    height: 72,
    weight: 210,
    year: 'Senior',
    hometown: 'Sunrise, FL',
    stats: { rushingYards: 1312, touchdowns: 13, yardsPerCarry: 5.8, receptions: 27 }
  },
  {
    id: '7',
    name: 'Jalen Carter',
    teamId: '2',
    position: 'DT',
    jerseyNumber: 88,
    height: 76,
    weight: 310,
    year: 'Junior',
    hometown: 'Apopka, FL',
    stats: { tackles: 37, sacks: 3, tacklesForLoss: 7.5, forcedFumbles: 1 }
  },
  {
    id: '8',
    name: 'Christopher Smith',
    teamId: '2',
    position: 'S',
    jerseyNumber: 29,
    height: 72,
    weight: 195,
    year: 'Senior',
    hometown: 'Atlanta, GA',
    stats: { tackles: 72, interceptions: 2, passBreakups: 6, forcedFumbles: 2 }
  },

  // LSU Players
  {
    id: '9',
    name: 'Jayden Daniels',
    teamId: '3',
    position: 'QB',
    jerseyNumber: 5,
    height: 75,
    weight: 210,
    year: 'Junior',
    hometown: 'Murrieta, CA',
    stats: { passingYards: 2913, touchdowns: 17, interceptions: 3, completionPct: 65.8 }
  },
  {
    id: '10',
    name: 'Josh Williams',
    teamId: '3',
    position: 'RB',
    jerseyNumber: 23,
    height: 71,
    weight: 224,
    year: 'Senior',
    hometown: 'New Orleans, LA',
    stats: { rushingYards: 990, touchdowns: 6, yardsPerCarry: 4.9, receptions: 18 }
  },
  {
    id: '11',
    name: 'BJ Ojulari',
    teamId: '3',
    position: 'LB',
    jerseyNumber: 18,
    height: 74,
    weight: 248,
    year: 'Senior',
    hometown: 'Marietta, GA',
    stats: { tackles: 57, sacks: 7, tacklesForLoss: 11.5, forcedFumbles: 2 }
  },

  // Florida Players
  {
    id: '12',
    name: 'Anthony Richardson',
    teamId: '4',
    position: 'QB',
    jerseyNumber: 15,
    height: 76,
    weight: 232,
    year: 'Sophomore',
    hometown: 'Gainesville, FL',
    stats: { passingYards: 2549, touchdowns: 17, interceptions: 9, completionPct: 59.4 }
  },
  {
    id: '13',
    name: 'Montrell Johnson',
    teamId: '4',
    position: 'RB',
    jerseyNumber: 6,
    height: 71,
    weight: 225,
    year: 'Junior',
    hometown: 'New Orleans, LA',
    stats: { rushingYards: 817, touchdowns: 7, yardsPerCarry: 5.1, receptions: 15 }
  },

  // Auburn Players
  {
    id: '14',
    name: 'Robby Ashford',
    teamId: '5',
    position: 'QB',
    jerseyNumber: 9,
    height: 75,
    weight: 213,
    year: 'Sophomore',
    hometown: 'Hoover, AL',
    stats: { passingYards: 2145, touchdowns: 14, interceptions: 8, completionPct: 57.2 }
  },
  {
    id: '15',
    name: 'Tank Bigsby',
    teamId: '5',
    position: 'RB',
    jerseyNumber: 4,
    height: 72,
    weight: 213,
    year: 'Junior',
    hometown: 'LaGrange, GA',
    stats: { rushingYards: 1099, touchdowns: 10, yardsPerCarry: 4.8, receptions: 20 }
  },

  // Tennessee Players
  {
    id: '16',
    name: 'Hendon Hooker',
    teamId: '6',
    position: 'QB',
    jerseyNumber: 5,
    height: 76,
    weight: 218,
    year: 'Senior',
    hometown: 'Greensboro, NC',
    stats: { passingYards: 3135, touchdowns: 27, interceptions: 2, completionPct: 69.6 }
  },
  {
    id: '17',
    name: 'Jabari Small',
    teamId: '6',
    position: 'RB',
    jerseyNumber: 2,
    height: 70,
    weight: 208,
    year: 'Junior',
    hometown: 'Memphis, TN',
    stats: { rushingYards: 1180, touchdowns: 12, yardsPerCarry: 5.3, receptions: 23 }
  },

  // Michigan Players
  {
    id: '18',
    name: 'J.J. McCarthy',
    teamId: '7',
    position: 'QB',
    jerseyNumber: 9,
    height: 75,
    weight: 205,
    year: 'Sophomore',
    hometown: 'La Grange Park, IL',
    stats: { passingYards: 2719, touchdowns: 22, interceptions: 5, completionPct: 64.7 }
  },
  {
    id: '19',
    name: 'Blake Corum',
    teamId: '7',
    position: 'RB',
    jerseyNumber: 2,
    height: 68,
    weight: 200,
    year: 'Junior',
    hometown: 'Marshall, VA',
    stats: { rushingYards: 1463, touchdowns: 18, yardsPerCarry: 5.6, receptions: 16 }
  },
  {
    id: '20',
    name: 'Aidan Hutchinson',
    teamId: '7',
    position: 'DE',
    jerseyNumber: 97,
    height: 78,
    weight: 265,
    year: 'Senior',
    hometown: 'Plymouth, MI',
    stats: { tackles: 67, sacks: 14, tacklesForLoss: 16.5, forcedFumbles: 2 }
  },

  // Ohio State Players
  {
    id: '21',
    name: 'C.J. Stroud',
    teamId: '8',
    position: 'QB',
    jerseyNumber: 7,
    height: 75,
    weight: 218,
    year: 'Junior',
    hometown: 'Rancho Cucamonga, CA',
    stats: { passingYards: 3862, touchdowns: 38, interceptions: 6, completionPct: 69.3 }
  },
  {
    id: '22',
    name: 'TreVeyon Henderson',
    teamId: '8',
    position: 'RB',
    jerseyNumber: 32,
    height: 71,
    weight: 215,
    year: 'Sophomore',
    hometown: 'Hopewell, VA',
    stats: { rushingYards: 1248, touchdowns: 15, yardsPerCarry: 6.1, receptions: 27 }
  },

  // Penn State Players
  {
    id: '23',
    name: 'Sean Clifford',
    teamId: '9',
    position: 'QB',
    jerseyNumber: 14,
    height: 74,
    weight: 218,
    year: 'Senior',
    hometown: 'Cincinnati, OH',
    stats: { passingYards: 3107, touchdowns: 21, interceptions: 8, completionPct: 61.5 }
  },
  {
    id: '24',
    name: 'Nicholas Singleton',
    teamId: '9',
    position: 'RB',
    jerseyNumber: 10,
    height: 71,
    weight: 210,
    year: 'Freshman',
    hometown: 'Reading, PA',
    stats: { rushingYards: 1061, touchdowns: 10, yardsPerCarry: 5.7, receptions: 12 }
  },

  // Wisconsin Players
  {
    id: '25',
    name: 'Graham Mertz',
    teamId: '10',
    position: 'QB',
    jerseyNumber: 5,
    height: 75,
    weight: 220,
    year: 'Junior',
    hometown: 'Blue Valley, KS',
    stats: { passingYards: 2136, touchdowns: 10, interceptions: 11, completionPct: 59.5 }
  },
  {
    id: '26',
    name: 'Braelon Allen',
    teamId: '10',
    position: 'RB',
    jerseyNumber: 0,
    height: 74,
    weight: 238,
    year: 'Sophomore',
    hometown: 'Fond du Lac, WI',
    stats: { rushingYards: 1268, touchdowns: 12, yardsPerCarry: 5.1, receptions: 10 }
  },

  // Texas Players
  {
    id: '27',
    name: 'Quinn Ewers',
    teamId: '11',
    position: 'QB',
    jerseyNumber: 3,
    height: 75,
    weight: 206,
    year: 'Sophomore',
    hometown: 'Southlake, TX',
    stats: { passingYards: 2177, touchdowns: 15, interceptions: 6, completionPct: 65.7 }
  },
  {
    id: '28',
    name: 'Bijan Robinson',
    teamId: '11',
    position: 'RB',
    jerseyNumber: 5,
    height: 72,
    weight: 215,
    year: 'Junior',
    hometown: 'Tucson, AZ',
    stats: { rushingYards: 1580, touchdowns: 18, yardsPerCarry: 6.0, receptions: 26 }
  },

  // Oklahoma Players
  {
    id: '29',
    name: 'Dillon Gabriel',
    teamId: '12',
    position: 'QB',
    jerseyNumber: 8,
    height: 73,
    weight: 200,
    year: 'Senior',
    hometown: 'Mililani, HI',
    stats: { passingYards: 3168, touchdowns: 25, interceptions: 4, completionPct: 61.9 }
  },
  {
    id: '30',
    name: 'Eric Gray',
    teamId: '12',
    position: 'RB',
    jerseyNumber: 0,
    height: 70,
    weight: 211,
    year: 'Senior',
    hometown: 'Memphis, TN',
    stats: { rushingYards: 1366, touchdowns: 13, yardsPerCarry: 5.0, receptions: 35 }
  }
];

const games = [
  // Week 1 Games
  {
    id: '1',
    homeTeamId: '1', // Alabama
    awayTeamId: '2', // Georgia
    scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Bryant-Denny Stadium',
    city: 'Tuscaloosa',
    state: 'Alabama',
    weather: {
      temperature: 75,
      humidity: 65,
      windSpeed: 8,
      conditions: 'Partly Cloudy',
      precipitation: 0
    },
    season: 2024,
    week: 1,
    gameType: 'Regular Season',
    status: 'Scheduled',
    importance: 'High',
    tvNetwork: 'CBS'
  },
  {
    id: '2',
    homeTeamId: '7', // Michigan
    awayTeamId: '8', // Ohio State
    scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Michigan Stadium',
    city: 'Ann Arbor',
    state: 'Michigan',
    weather: {
      temperature: 68,
      humidity: 70,
      windSpeed: 12,
      conditions: 'Clear',
      precipitation: 0
    },
    season: 2024,
    week: 1,
    gameType: 'Regular Season',
    status: 'Scheduled',
    importance: 'High',
    tvNetwork: 'FOX'
  },
  {
    id: '3',
    homeTeamId: '11', // Texas
    awayTeamId: '12', // Oklahoma
    scheduledTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Cotton Bowl',
    city: 'Dallas',
    state: 'Texas',
    weather: {
      temperature: 82,
      humidity: 55,
      windSpeed: 6,
      conditions: 'Sunny',
      precipitation: 0
    },
    season: 2024,
    week: 1,
    gameType: 'Regular Season',
    status: 'Scheduled',
    importance: 'High',
    tvNetwork: 'ABC'
  },
  {
    id: '4',
    homeTeamId: '14', // Clemson
    awayTeamId: '15', // Florida State
    scheduledTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Memorial Stadium',
    city: 'Clemson',
    state: 'South Carolina',
    weather: {
      temperature: 79,
      humidity: 72,
      windSpeed: 5,
      conditions: 'Partly Cloudy',
      precipitation: 10
    },
    season: 2024,
    week: 1,
    gameType: 'Regular Season',
    status: 'Scheduled',
    importance: 'Medium',
    tvNetwork: 'ESPN'
  },
  {
    id: '5',
    homeTeamId: '17', // USC
    awayTeamId: '18', // Oregon
    scheduledTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Los Angeles Memorial Coliseum',
    city: 'Los Angeles',
    state: 'California',
    weather: {
      temperature: 73,
      humidity: 60,
      windSpeed: 4,
      conditions: 'Clear',
      precipitation: 0
    },
    season: 2024,
    week: 1,
    gameType: 'Regular Season',
    status: 'Scheduled',
    importance: 'Medium',
    tvNetwork: 'PAC-12 Network'
  },

  // Week 2 Games
  {
    id: '6',
    homeTeamId: '3', // LSU
    awayTeamId: '5', // Auburn
    scheduledTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Tiger Stadium',
    city: 'Baton Rouge',
    state: 'Louisiana',
    weather: {
      temperature: 84,
      humidity: 78,
      windSpeed: 7,
      conditions: 'Humid',
      precipitation: 20
    },
    season: 2024,
    week: 2,
    gameType: 'Regular Season',
    status: 'Scheduled',
    importance: 'Medium',
    tvNetwork: 'SEC Network'
  },
  {
    id: '7',
    homeTeamId: '4', // Florida
    awayTeamId: '6', // Tennessee
    scheduledTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Ben Hill Griffin Stadium',
    city: 'Gainesville',
    state: 'Florida',
    weather: {
      temperature: 81,
      humidity: 75,
      windSpeed: 9,
      conditions: 'Thunderstorms',
      precipitation: 60
    },
    season: 2024,
    week: 2,
    gameType: 'Regular Season',
    status: 'Scheduled',
    importance: 'Medium',
    tvNetwork: 'ESPN'
  },
  {
    id: '8',
    homeTeamId: '9', // Penn State
    awayTeamId: '10', // Wisconsin
    scheduledTime: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Beaver Stadium',
    city: 'University Park',
    state: 'Pennsylvania',
    weather: {
      temperature: 65,
      humidity: 68,
      windSpeed: 11,
      conditions: 'Overcast',
      precipitation: 30
    },
    season: 2024,
    week: 2,
    gameType: 'Regular Season',
    status: 'Scheduled',
    importance: 'Medium',
    tvNetwork: 'Big Ten Network'
  },
  {
    id: '9',
    homeTeamId: '16', // Miami
    awayTeamId: '14', // Clemson
    scheduledTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Hard Rock Stadium',
    city: 'Miami Gardens',
    state: 'Florida',
    weather: {
      temperature: 86,
      humidity: 82,
      windSpeed: 8,
      conditions: 'Hot and Humid',
      precipitation: 40
    },
    season: 2024,
    week: 2,
    gameType: 'Regular Season',
    status: 'Scheduled',
    importance: 'High',
    tvNetwork: 'ABC'
  },
  {
    id: '10',
    homeTeamId: '19', // Washington
    awayTeamId: '20', // Stanford
    scheduledTime: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Husky Stadium',
    city: 'Seattle',
    state: 'Washington',
    weather: {
      temperature: 62,
      humidity: 85,
      windSpeed: 15,
      conditions: 'Rainy',
      precipitation: 80
    },
    season: 2024,
    week: 2,
    gameType: 'Regular Season',
    status: 'Scheduled',
    importance: 'Low',
    tvNetwork: 'PAC-12 Network'
  },

  // Week 3 Games
  {
    id: '11',
    homeTeamId: '13', // Oklahoma State
    awayTeamId: '11', // Texas
    scheduledTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Boone Pickens Stadium',
    city: 'Stillwater',
    state: 'Oklahoma',
    weather: {
      temperature: 78,
      humidity: 58,
      windSpeed: 12,
      conditions: 'Windy',
      precipitation: 0
    },
    season: 2024,
    week: 3,
    gameType: 'Regular Season',
    status: 'Scheduled',
    importance: 'Medium',
    tvNetwork: 'ESPN'
  },
  {
    id: '12',
    homeTeamId: '2', // Georgia
    awayTeamId: '3', // LSU
    scheduledTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Sanford Stadium',
    city: 'Athens',
    state: 'Georgia',
    weather: {
      temperature: 77,
      humidity: 69,
      windSpeed: 6,
      conditions: 'Partly Cloudy',
      precipitation: 15
    },
    season: 2024,
    week: 3,
    gameType: 'Regular Season',
    status: 'Scheduled',
    importance: 'High',
    tvNetwork: 'CBS'
  },

  // Championship Games
  {
    id: '13',
    homeTeamId: '1', // Alabama
    awayTeamId: '7', // Michigan
    scheduledTime: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Mercedes-Benz Stadium',
    city: 'Atlanta',
    state: 'Georgia',
    weather: {
      temperature: 72,
      humidity: 45,
      windSpeed: 3,
      conditions: 'Perfect',
      precipitation: 0
    },
    season: 2024,
    week: 16,
    gameType: 'Championship',
    status: 'Scheduled',
    importance: 'Championship',
    tvNetwork: 'ESPN'
  },
  {
    id: '14',
    homeTeamId: '8', // Ohio State
    awayTeamId: '2', // Georgia
    scheduledTime: new Date(Date.now() + 67 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Rose Bowl',
    city: 'Pasadena',
    state: 'California',
    weather: {
      temperature: 75,
      humidity: 50,
      windSpeed: 2,
      conditions: 'Sunny',
      precipitation: 0
    },
    season: 2024,
    week: 17,
    gameType: 'Playoff',
    status: 'Scheduled',
    importance: 'Playoff',
    tvNetwork: 'ESPN'
  },
  {
    id: '15',
    homeTeamId: '11', // Texas
    awayTeamId: '14', // Clemson
    scheduledTime: new Date(Date.now() + 74 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Sugar Bowl',
    city: 'New Orleans',
    state: 'Louisiana',
    weather: {
      temperature: 68,
      humidity: 72,
      windSpeed: 8,
      conditions: 'Mild',
      precipitation: 20
    },
    season: 2024,
    week: 17,
    gameType: 'Playoff',
    status: 'Scheduled',
    importance: 'Playoff',
    tvNetwork: 'ESPN'
  }
];

// Generate probabilities
function generateProbabilities(gameId) {
  const homeWinProb = 0.45 + Math.random() * 0.3;
  const awayWinProb = 1 - homeWinProb;
  
  return {
    gameId,
    homeTeamWinProbability: homeWinProb,
    awayTeamWinProbability: awayWinProb,
    overUnderProbability: {
      over: 0.48 + Math.random() * 0.04,
      under: 0.48 + Math.random() * 0.04
    },
    spreadProbability: {
      home: homeWinProb * 0.8,
      away: awayWinProb * 0.8
    },
    confidence: 0.75 + Math.random() * 0.2,
    lastUpdated: new Date().toISOString(),
    factors: {
      homeFieldAdvantage: 0.03,
      recentForm: Math.random() * 0.1 - 0.05,
      injuries: Math.random() * 0.05,
      weather: Math.random() * 0.02,
      motivation: Math.random() * 0.03
    }
  };
}

// User management
const users = new Map();
const JWT_SECRET = process.env.JWT_SECRET || 'demo-jwt-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'demo-refresh-secret-key';

// Helper function to generate player stats
function generatePlayerStats(position) {
  switch (position) {
    case 'QB':
      return {
        passingYards: Math.floor(Math.random() * 2000 + 2500),
        passingTDs: Math.floor(Math.random() * 20 + 15),
        interceptions: Math.floor(Math.random() * 8 + 3),
        completionPct: (Math.random() * 15 + 60).toFixed(1),
        qbRating: (Math.random() * 40 + 80).toFixed(1)
      };
    case 'RB':
      return {
        rushingYards: Math.floor(Math.random() * 800 + 600),
        rushingTDs: Math.floor(Math.random() * 10 + 5),
        yardsPerCarry: (Math.random() * 2 + 3.5).toFixed(1),
        receptions: Math.floor(Math.random() * 30 + 20),
        receivingYards: Math.floor(Math.random() * 300 + 200)
      };
    case 'WR':
    case 'TE':
      return {
        receptions: Math.floor(Math.random() * 50 + 40),
        receivingYards: Math.floor(Math.random() * 800 + 600),
        receivingTDs: Math.floor(Math.random() * 8 + 4),
        yardsPerReception: (Math.random() * 5 + 10).toFixed(1),
        targets: Math.floor(Math.random() * 70 + 60)
      };
    default:
      return {
        tackles: Math.floor(Math.random() * 60 + 40),
        sacks: Math.floor(Math.random() * 8 + 2),
        interceptions: Math.floor(Math.random() * 4 + 1),
        passBreakups: Math.floor(Math.random() * 10 + 5),
        forcedFumbles: Math.floor(Math.random() * 3 + 1)
      };
  }
}

// Helper functions
function generateTokens(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return {
    accessToken,
    refreshToken,
    expiresIn: 24 * 60 * 60 // 24 hours in seconds
  };
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Generate live update
function generateLiveUpdate(gameId) {
  const probabilities = generateProbabilities(gameId);
  
  return {
    type: 'probability-update',
    gameId,
    timestamp: new Date().toISOString(),
    probabilities: {
      homeWin: probabilities.homeTeamWinProbability,
      awayWin: probabilities.awayTeamWinProbability,
      confidence: probabilities.confidence
    },
    gameState: {
      quarter: Math.floor(Math.random() * 4) + 1,
      timeRemaining: `${Math.floor(Math.random() * 15)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      homeScore: Math.floor(Math.random() * 35),
      awayScore: Math.floor(Math.random() * 35),
      possession: Math.random() > 0.5 ? 'home' : 'away'
    }
  };
}

// NFL API integration
async function fetchRealNFLGames() {
  try {
    // ESPN NFL API endpoint for current preseason games
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
    const data = await response.json();
    
    if (data.events && data.events.length > 0) {
      return data.events.map(event => ({
        id: event.id,
        homeTeamId: event.competitions[0].competitors.find(c => c.homeAway === 'home')?.team.id,
        awayTeamId: event.competitions[0].competitors.find(c => c.homeAway === 'away')?.team.id,
        homeTeam: event.competitions[0].competitors.find(c => c.homeAway === 'home')?.team,
        awayTeam: event.competitions[0].competitors.find(c => c.homeAway === 'away')?.team,
        scheduledTime: event.date,
        status: event.status.type.name,
        venue: event.competitions[0].venue?.fullName || 'TBD',
        city: event.competitions[0].venue?.address?.city || 'TBD',
        state: event.competitions[0].venue?.address?.state || 'TBD',
        season: event.season.year,
        week: event.week?.number || 1,
        gameType: event.season.type === 1 ? 'Preseason' : 'Regular Season',
        importance: 'Medium',
        tvNetwork: event.competitions[0].broadcasts?.[0]?.names?.[0] || 'TBD',
        homeScore: event.competitions[0].competitors.find(c => c.homeAway === 'home')?.score || '0',
        awayScore: event.competitions[0].competitors.find(c => c.homeAway === 'away')?.score || '0',
        weather: {
          temperature: 72,
          humidity: 60,
          windSpeed: 5,
          conditions: 'Clear',
          precipitation: 0
        }
      }));
    }
  } catch (error) {
    console.log('Failed to fetch real NFL data, using demo data:', error.message);
  }
  return [];
}

// Create Express app
const app = express();
const port = 3000;
const wsPort = 8082;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Football Analytics API',
    version: '1.0.0'
  });
});

app.get('/ready', (req, res) => {
  res.json({
    ready: true,
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      cache: 'connected',
      external_apis: 'connected'
    }
  });
});

app.get('/api-docs', (req, res) => {
  res.json({
    title: 'Football Analytics API',
    version: '1.0.0',
    description: 'Real-time football analytics and predictions',
    endpoints: {
      'GET /health': 'Health check',
      'GET /ready': 'Readiness check',
      'GET /api/v1/teams': 'Get all teams',
      'GET /api/v1/games': 'Get all games',
      'GET /api/v1/games/:id': 'Get specific game',
      'GET /api/v1/predictions/:gameId': 'Get game predictions',
      'GET /api/v1/players': 'Get all players'
    }
  });
});

app.get('/api/v1/teams', async (req, res) => {
  try {
    // Try to fetch real NFL teams first
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams');
    const data = await response.json();
    
    if (data.sports && data.sports[0] && data.sports[0].leagues && data.sports[0].leagues[0] && data.sports[0].leagues[0].teams) {
      const nflTeams = data.sports[0].leagues[0].teams.map(teamData => ({
        id: teamData.team.id,
        name: teamData.team.displayName,
        abbreviation: teamData.team.abbreviation,
        conference: teamData.team.conferenceId === '1' ? 'AFC' : 'NFC',
        division: teamData.team.name,
        logoUrl: teamData.team.logos?.[0]?.href || '',
        primaryColor: teamData.team.color || '#000000',
        venue: teamData.team.venue?.fullName || 'TBD',
        city: teamData.team.venue?.address?.city || 'TBD',
        state: teamData.team.venue?.address?.state || 'TBD'
      }));
      
      console.log(`✅ Fetched ${nflTeams.length} real NFL teams`);
      res.json({
        success: true,
        data: nflTeams,
        count: nflTeams.length,
        timestamp: new Date().toISOString(),
        source: 'ESPN NFL API'
      });
    } else {
      throw new Error('No NFL teams data available');
    }
  } catch (error) {
    console.error('Error fetching NFL teams:', error);
    res.json({
      success: true,
      data: teams,
      count: teams.length,
      timestamp: new Date().toISOString(),
      source: 'Demo Data (Fallback)'
    });
  }
});

app.get('/api/v1/games', async (req, res) => {
  try {
    // Try to fetch real NFL games first
    const realGames = await fetchRealNFLGames();
    
    if (realGames.length > 0) {
      console.log(`✅ Fetched ${realGames.length} real NFL games`);
      res.json({
        success: true,
        data: realGames,
        count: realGames.length,
        timestamp: new Date().toISOString(),
        source: 'ESPN NFL API'
      });
    } else {
      // Fallback to demo data
      res.json({
        success: true,
        data: games,
        count: games.length,
        timestamp: new Date().toISOString(),
        source: 'Demo Data'
      });
    }
  } catch (error) {
    console.error('Error fetching games:', error);
    res.json({
      success: true,
      data: games,
      count: games.length,
      timestamp: new Date().toISOString(),
      source: 'Demo Data (Fallback)'
    });
  }
});

app.get('/api/v1/games/:id', (req, res) => {
  const game = games.find(g => g.id === req.params.id);
  
  if (!game) {
    return res.status(404).json({
      success: false,
      error: 'Game not found',
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    data: game,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/predictions/:gameId', (req, res) => {
  const game = games.find(g => g.id === req.params.gameId);
  
  if (!game) {
    return res.status(404).json({
      success: false,
      error: 'Game not found',
      timestamp: new Date().toISOString()
    });
  }

  const probabilities = generateProbabilities(req.params.gameId);
  res.json({
    success: true,
    data: {
      gameId: req.params.gameId,
      probabilities,
      lastUpdated: new Date().toISOString(),
      model: 'ensemble-v1.0',
      confidence: probabilities.confidence
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/players', async (req, res) => {
  try {
    // Generate realistic NFL player data
    const nflPlayers = [];
    const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K'];
    const realTeams = ['KC', 'BUF', 'GB', 'TB', 'LAR', 'SF', 'DAL', 'NE', 'PIT', 'BAL', 'SEA', 'DEN', 'LV', 'LAC', 'IND', 'TEN', 'JAX', 'HOU', 'CLE', 'CIN', 'MIA', 'NYJ', 'PHI', 'NYG', 'WAS', 'CAR', 'ATL', 'NO', 'CHI', 'DET', 'MIN', 'ARI'];
    
    const playerNames = [
      'Patrick Mahomes', 'Josh Allen', 'Aaron Rodgers', 'Tom Brady', 'Matthew Stafford',
      'Jimmy Garoppolo', 'Dak Prescott', 'Mac Jones', 'Ben Roethlisberger', 'Lamar Jackson',
      'Russell Wilson', 'Drew Lock', 'Derek Carr', 'Justin Herbert', 'Carson Wentz',
      'Ryan Tannehill', 'Trevor Lawrence', 'Davis Mills', 'Baker Mayfield', 'Joe Burrow',
      'Tua Tagovailoa', 'Zach Wilson', 'Jalen Hurts', 'Daniel Jones', 'Taylor Heinicke',
      'Sam Darnold', 'Matt Ryan', 'Jameis Winston', 'Justin Fields', 'Jared Goff',
      'Kirk Cousins', 'Kyler Murray', 'Derrick Henry', 'Jonathan Taylor', 'Nick Chubb',
      'Dalvin Cook', 'Alvin Kamara', 'Austin Ekeler', 'Joe Mixon', 'Ezekiel Elliott',
      'Cooper Kupp', 'Davante Adams', 'Tyreek Hill', 'Stefon Diggs', 'DeAndre Hopkins',
      'Mike Evans', 'Chris Godwin', 'Keenan Allen', 'DK Metcalf', 'Tyler Lockett'
    ];
    
    for (let i = 0; i < Math.min(playerNames.length, 50); i++) {
      const position = i < 32 ? positions[Math.floor(i / 4)] : positions[Math.floor(Math.random() * positions.length)];
      const team = realTeams[i % realTeams.length];
      
      nflPlayers.push({
        id: `nfl_player_${i + 1}`,
        name: playerNames[i] || `Player ${i + 1}`,
        position: position,
        teamId: team,
        team: team,
        jerseyNumber: Math.floor(Math.random() * 99) + 1,
        height: Math.floor(Math.random() * 12) + 66,
        weight: Math.floor(Math.random() * 100) + 180,
        age: Math.floor(Math.random() * 15) + 21,
        experience: Math.floor(Math.random() * 15) + 1,
        stats: generatePlayerStats(position)
      });
    }
    
    res.json({
      success: true,
      data: nflPlayers,
      count: nflPlayers.length,
      timestamp: new Date().toISOString(),
      source: 'Generated NFL Player Data'
    });
  } catch (error) {
    console.error('Error generating NFL players:', error);
    res.json({
      success: true,
      data: players, // Fallback to demo data
      count: players.length,
      timestamp: new Date().toISOString(),
      source: 'Demo Data (Fallback)'
    });
  }
});

// NFL teams endpoint
app.get('/api/v1/nfl/teams', async (req, res) => {
  try {
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams');
    const data = await response.json();
    
    if (data.sports && data.sports[0] && data.sports[0].leagues && data.sports[0].leagues[0] && data.sports[0].leagues[0].teams) {
      const nflTeams = data.sports[0].leagues[0].teams.map(teamData => ({
        id: teamData.team.id,
        name: teamData.team.displayName,
        abbreviation: teamData.team.abbreviation,
        conference: teamData.team.conferenceId === '1' ? 'AFC' : 'NFC',
        division: teamData.team.name,
        logoUrl: teamData.team.logos?.[0]?.href || '',
        primaryColor: teamData.team.color || '#000000',
        venue: teamData.team.venue?.fullName || 'TBD',
        city: teamData.team.venue?.address?.city || 'TBD',
        state: teamData.team.venue?.address?.state || 'TBD'
      }));
      
      res.json({
        success: true,
        data: nflTeams,
        count: nflTeams.length,
        timestamp: new Date().toISOString(),
        source: 'ESPN NFL API'
      });
    } else {
      throw new Error('No NFL teams data available');
    }
  } catch (error) {
    console.error('Error fetching NFL teams:', error);
    res.json({
      success: true,
      data: teams.slice(0, 32), // Use first 32 demo teams as fallback
      count: 32,
      timestamp: new Date().toISOString(),
      source: 'Demo Data (Fallback)'
    });
  }
});

// New endpoint specifically for NFL games
app.get('/api/v1/nfl/games', async (req, res) => {
  try {
    const realGames = await fetchRealNFLGames();
    
    if (realGames.length > 0) {
      console.log(`✅ Fetched ${realGames.length} real NFL games`);
      
      // Generate predictions for real games
      const gamesWithPredictions = realGames.map(game => ({
        ...game,
        predictions: generateProbabilities(game.id)
      }));
      
      res.json({
        success: true,
        data: gamesWithPredictions,
        count: gamesWithPredictions.length,
        timestamp: new Date().toISOString(),
        source: 'ESPN NFL API',
        message: 'Real NFL preseason games with ML predictions'
      });
    } else {
      res.json({
        success: false,
        error: 'No NFL games available',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error fetching NFL games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NFL games',
      timestamp: new Date().toISOString()
    });
  }
});

// Auth endpoints for demo login
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // Demo login - accept any valid email/password combo
    if (email.includes('@') && password.length >= 6) {
      const userData = {
        id: generateId(),
        name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        email: email,
        role: 'Pro Analyst'
      };
      
      const tokens = generateTokens(userData);
      
      res.json({
        success: true,
        data: {
          user: userData,
          tokens
        },
        message: 'Login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email and password are required'
      });
    }
    
    // Demo registration - accept any valid data
    if (email.includes('@') && password.length >= 6) {
      const userData = {
        id: generateId(),
        name: name,
        email: email,
        role: 'Pro Analyst'
      };
      
      const tokens = generateTokens(userData);
      
      res.json({
        success: true,
        data: {
          user: userData,
          tokens
        },
        message: 'Registration successful'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid registration data'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

app.get('/api/v1/system/status', (req, res) => {
  res.json({
    success: true,
    data: {
      system: 'Football Analytics Pro',
      status: 'operational',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        'api-gateway': 'healthy',
        'websocket-service': 'healthy',
        'probability-engine': 'healthy',
        'data-ingestion': 'healthy',
        'ml-models': 'healthy',
        'monte-carlo': 'healthy',
        'authentication': 'healthy'
      },
      features: {
        'real-time-updates': true,
        'monte-carlo-simulations': true,
        'ml-predictions': true,
        'historical-analysis': true,
        'user-authentication': true,
        'team-comparison': true,
        'player-comparison': true,
        'advanced-charts': true
      },
      metrics: {
        'active-users': users.size,
        'total-predictions': games.length * 100,
        'accuracy-rate': 87.3,
        'uptime-percentage': 99.9
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Authentication endpoints
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Check if user already exists
    const existingUser = Array.from(users.values()).find(u => u.email === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email',
        code: 'USER_EXISTS'
      });
    }
    
    // Validate password
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = {
      id: generateId(),
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      provider: 'local',
      role: 'user',
      preferences: {
        theme: 'dark',
        notifications: true,
        autoRefresh: true,
        language: 'en'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      emailVerified: false
    };
    
    // Save user
    users.set(user.id, user);
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    // Remove password from response
    const { password: _, ...userResponse } = user;
    
    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        tokens
      },
      message: 'Account created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'REGISTRATION_FAILED'
    });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    // Find user
    const user = Array.from(users.values()).find(u => u.email === email.toLowerCase() && u.provider === 'local');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }
    
    // Update last login
    user.lastLoginAt = new Date().toISOString();
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    // Remove password from response
    const { password: _, ...userResponse } = user;
    
    res.json({
      success: true,
      data: {
        user: userResponse,
        tokens
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'LOGIN_FAILED'
    });
  }
});

app.post('/api/v1/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token && users.has(token)) {
    users.delete(token);
  }
  
  res.json({
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString()
  });
});

// Google OAuth endpoints (real implementation)
app.get('/api/v1/auth/google', (req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || 'your_google_client_id_here';
  const redirectUri = 'http://localhost:3000/auth/google/callback';
  
  const authUrl = `https://accounts.google.com/oauth/authorize?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email%20profile&response_type=code&access_type=offline&prompt=consent`;
  
  res.json({
    success: true,
    data: { authUrl },
    message: 'Google OAuth URL generated'
  });
});

app.get('/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    const errorUrl = new URL('http://localhost:3000');
    errorUrl.searchParams.set('error', `Google OAuth error: ${error}`);
    return res.redirect(errorUrl.toString());
  }
  
  if (!code) {
    const errorUrl = new URL('http://localhost:3000');
    errorUrl.searchParams.set('error', 'Authorization code not provided');
    return res.redirect(errorUrl.toString());
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id_here',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret_here',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:3000/auth/google/callback'
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get user profile
    const profileResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`);
    
    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const profile = await profileResponse.json();
    
    // Check if user already exists
    let user = Array.from(users.values()).find(u => u.email === profile.email.toLowerCase());
    let isNewUser = false;
    
    if (!user) {
      // Create new user
      user = {
        id: generateId(),
        email: profile.email.toLowerCase(),
        name: profile.name,
        avatar: profile.picture,
        provider: 'google',
        providerId: profile.id,
        role: 'user',
        preferences: {
          theme: 'dark',
          notifications: true,
          autoRefresh: true,
          language: 'en'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        emailVerified: true
      };
      
      users.set(user.id, user);
      isNewUser = true;
    } else {
      // Update existing user with Google info
      user.avatar = profile.picture;
      user.providerId = profile.id;
      user.lastLoginAt = new Date().toISOString();
      users.set(user.id, user);
    }
    
    // Generate JWT tokens
    const tokens = generateTokens(user);
    
    // Redirect to frontend with tokens
    const redirectUrl = new URL('http://localhost:3000');
    redirectUrl.searchParams.set('token', tokens.accessToken);
    redirectUrl.searchParams.set('refresh_token', tokens.refreshToken);
    if (isNewUser) {
      redirectUrl.searchParams.set('new_user', 'true');
    }
    
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const errorUrl = new URL('http://localhost:3000');
    errorUrl.searchParams.set('error', `Authentication failed: ${error.message}`);
    res.redirect(errorUrl.toString());
  }
});

app.get('/api/v1/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }
    
    const decoded = verifyToken(token);
    const user = users.get(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Remove password from response
    const { password, ...userResponse } = user;
    
    res.json({
      success: true,
      data: { user: userResponse },
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
});

// Enhanced team comparison endpoint
app.get('/api/v1/compare/teams/:teamAId/:teamBId', (req, res) => {
  const { teamAId, teamBId } = req.params;
  
  const teamA = teams.find(t => t.id === teamAId);
  const teamB = teams.find(t => t.id === teamBId);
  
  if (!teamA || !teamB) {
    return res.status(404).json({
      success: false,
      error: 'One or both teams not found',
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate comparison metrics
  const comparison = {
    teamA: {
      ...teamA,
      metrics: {
        offense: 85 + Math.random() * 10,
        defense: 80 + Math.random() * 15,
        specialTeams: 75 + Math.random() * 20,
        coaching: 85 + Math.random() * 10,
        overall: 82 + Math.random() * 12
      }
    },
    teamB: {
      ...teamB,
      metrics: {
        offense: 85 + Math.random() * 10,
        defense: 80 + Math.random() * 15,
        specialTeams: 75 + Math.random() * 20,
        coaching: 85 + Math.random() * 10,
        overall: 82 + Math.random() * 12
      }
    },
    prediction: {
      favorite: Math.random() > 0.5 ? teamA.name : teamB.name,
      spread: (Math.random() * 14 + 1).toFixed(1),
      confidence: (Math.random() * 0.2 + 0.8).toFixed(3)
    }
  };
  
  res.json({
    success: true,
    data: comparison,
    timestamp: new Date().toISOString()
  });
});

// Enhanced player comparison endpoint
app.get('/api/v1/compare/players/:playerAId/:playerBId', (req, res) => {
  const { playerAId, playerBId } = req.params;
  
  const playerA = players.find(p => p.id === playerAId);
  const playerB = players.find(p => p.id === playerBId);
  
  if (!playerA || !playerB) {
    return res.status(404).json({
      success: false,
      error: 'One or both players not found',
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate comparison stats
  const comparison = {
    playerA: {
      ...playerA,
      stats: {
        passingYards: Math.floor(Math.random() * 3000 + 2000),
        touchdowns: Math.floor(Math.random() * 25 + 15),
        completionPercentage: (Math.random() * 0.2 + 0.6).toFixed(3),
        rating: (Math.random() * 40 + 120).toFixed(1)
      }
    },
    playerB: {
      ...playerB,
      stats: {
        passingYards: Math.floor(Math.random() * 3000 + 2000),
        touchdowns: Math.floor(Math.random() * 25 + 15),
        completionPercentage: (Math.random() * 0.2 + 0.6).toFixed(3),
        rating: (Math.random() * 40 + 120).toFixed(1)
      }
    }
  };
  
  res.json({
    success: true,
    data: comparison,
    timestamp: new Date().toISOString()
  });
});

// WebSocket server
const wsServer = createServer();
const wss = new WebSocket.Server({ server: wsServer });

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection established');

  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Football Analytics WebSocket',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message:', message);

      if (message.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
      } else if (message.type === 'subscribe') {
        ws.send(JSON.stringify({
          type: 'subscription-confirmed',
          channel: message.channel,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Send live updates every 5 seconds
setInterval(() => {
  games.forEach(game => {
    const update = generateLiveUpdate(game.id);
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(update));
      }
    });
  });
}, 5000);

// Start servers
app.listen(port, () => {
  console.log('🚀 Football Analytics System - Demo Server');
  console.log('===========================================');
  console.log(`📊 API Server:     http://localhost:${port}`);
  console.log(`🔌 WebSocket:      ws://localhost:${wsPort}`);
  console.log('');
  console.log('🔍 Try these endpoints:');
  console.log(`  Health:          http://localhost:${port}/health`);
  console.log(`  API Docs:        http://localhost:${port}/api-docs`);
  console.log(`  Teams:           http://localhost:${port}/api/v1/teams`);
  console.log(`  Games:           http://localhost:${port}/api/v1/games`);
  console.log(`  Predictions:     http://localhost:${port}/api/v1/predictions/1`);
  console.log(`  System Status:   http://localhost:${port}/api/v1/system/status`);
  console.log('');
  console.log('🎉 Ready for connections!');
});

wsServer.listen(wsPort, () => {
  console.log(`🔌 WebSocket server running on ws://localhost:${wsPort}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  process.exit(0);
});

// NFL players endpoint
app.get('/api/v1/nfl/players', async (req, res) => {
  try {
    // Generate realistic NFL player data
    const nflPlayers = [];
    const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K'];
    const teams = ['KC', 'BUF', 'GB', 'TB', 'LAR', 'SF', 'DAL', 'NE', 'PIT', 'BAL'];
    
    for (let i = 0; i < 100; i++) {
      const position = positions[Math.floor(Math.random() * positions.length)];
      const team = teams[Math.floor(Math.random() * teams.length)];
      
      nflPlayers.push({
        id: `nfl_player_${i + 1}`,
        name: `Player ${i + 1}`,
        position: position,
        team: team,
        jerseyNumber: Math.floor(Math.random() * 99) + 1,
        height: Math.floor(Math.random() * 12) + 66, // 5'6" to 6'6"
        weight: Math.floor(Math.random() * 100) + 180, // 180-280 lbs
        age: Math.floor(Math.random() * 15) + 21, // 21-35 years old
        experience: Math.floor(Math.random() * 15) + 1, // 1-15 years
        stats: generatePlayerStats(position)
      });
    }
    
    res.json({
      success: true,
      data: nflPlayers,
      count: nflPlayers.length,
      timestamp: new Date().toISOString(),
      source: 'Generated NFL Player Data'
    });
  } catch (error) {
    console.error('Error generating NFL players:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate NFL players data'
    });
  }
});

// NFL statistics endpoint
app.get('/api/v1/nfl/statistics', (req, res) => {
  const stats = {
    teamStats: {
      topOffense: [
        { team: 'KC', stat: 'Points Per Game', value: 29.2 },
        { team: 'BUF', stat: 'Total Yards', value: 396.4 },
        { team: 'GB', stat: 'Passing Yards', value: 278.1 }
      ],
      topDefense: [
        { team: 'SF', stat: 'Points Allowed', value: 16.8 },
        { team: 'PIT', stat: 'Total Yards Allowed', value: 298.4 },
        { team: 'LAR', stat: 'Sacks', value: 50 }
      ]
    },
    playerLeaders: {
      passing: [
        { player: 'Josh Allen', team: 'BUF', stat: 4544, label: 'Passing Yards' },
        { player: 'Patrick Mahomes', team: 'KC', stat: 41, label: 'Passing TDs' },
        { player: 'Aaron Rodgers', team: 'GB', stat: 68.9, label: 'Completion %' }
      ],
      rushing: [
        { player: 'Derrick Henry', team: 'TEN', stat: 1538, label: 'Rushing Yards' },
        { player: 'Jonathan Taylor', team: 'IND', stat: 18, label: 'Rushing TDs' },
        { player: 'Nick Chubb', team: 'CLE', stat: 5.5, label: 'Yards Per Carry' }
      ],
      receiving: [
        { player: 'Cooper Kupp', team: 'LAR', stat: 145, label: 'Receptions' },
        { player: 'Davante Adams', team: 'LV', stat: 1516, label: 'Receiving Yards' },
        { player: 'Mike Evans', team: 'TB', stat: 14, label: 'Receiving TDs' }
      ]
    }
  };
  
  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  });
});

// Enhanced team statistics endpoint
app.get('/api/v1/teams/:id/stats', (req, res) => {
  const team = teams.find(t => t.id === req.params.id);
  
  if (!team) {
    return res.status(404).json({
      success: false,
      error: 'Team not found',
      timestamp: new Date().toISOString()
    });
  }

  // Generate comprehensive team stats
  const stats = {
    teamId: team.id,
    season: 2024,
    record: {
      wins: Math.floor(Math.random() * 8) + 4,
      losses: Math.floor(Math.random() * 4),
      ties: 0
    },
    offense: {
      pointsPerGame: (Math.random() * 15 + 25).toFixed(1),
      yardsPerGame: (Math.random() * 100 + 350).toFixed(0),
      passingYardsPerGame: (Math.random() * 80 + 200).toFixed(0),
      rushingYardsPerGame: (Math.random() * 80 + 120).toFixed(0),
      turnoversLost: Math.floor(Math.random() * 10) + 5,
      thirdDownConversion: (Math.random() * 20 + 35).toFixed(1) + '%',
      redZoneEfficiency: (Math.random() * 25 + 65).toFixed(1) + '%'
    },
    defense: {
      pointsAllowedPerGame: (Math.random() * 12 + 15).toFixed(1),
      yardsAllowedPerGame: (Math.random() * 80 + 280).toFixed(0),
      passingYardsAllowed: (Math.random() * 60 + 180).toFixed(0),
      rushingYardsAllowed: (Math.random() * 60 + 100).toFixed(0),
      turnoversForced: Math.floor(Math.random() * 12) + 8,
      sacks: Math.floor(Math.random() * 20) + 15,
      interceptions: Math.floor(Math.random() * 8) + 5
    },
    specialTeams: {
      fieldGoalPercentage: (Math.random() * 20 + 75).toFixed(1) + '%',
      puntAverage: (Math.random() * 8 + 40).toFixed(1),
      kickoffReturnAverage: (Math.random() * 5 + 20).toFixed(1),
      puntReturnAverage: (Math.random() * 3 + 8).toFixed(1)
    },
    rankings: {
      national: Math.floor(Math.random() * 25) + 1,
      conference: Math.floor(Math.random() * 8) + 1,
      strengthOfSchedule: Math.floor(Math.random() * 50) + 1
    }
  };

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  });
});

// Player statistics endpoint
app.get('/api/v1/players/:id/stats', (req, res) => {
  const player = players.find(p => p.id === req.params.id);
  
  if (!player) {
    return res.status(404).json({
      success: false,
      error: 'Player not found',
      timestamp: new Date().toISOString()
    });
  }

  // Return player with enhanced stats
  const enhancedPlayer = {
    ...player,
    seasonStats: player.stats || {},
    careerStats: {
      gamesPlayed: Math.floor(Math.random() * 30) + 20,
      gamesStarted: Math.floor(Math.random() * 25) + 15,
      ...player.stats
    },
    awards: [
      'All-Conference Team',
      'Academic All-American'
    ].slice(0, Math.floor(Math.random() * 3))
  };

  res.json({
    success: true,
    data: enhancedPlayer,
    timestamp: new Date().toISOString()
  });
});

// Conference standings endpoint
app.get('/api/v1/conferences/:conference/standings', (req, res) => {
  const conference = req.params.conference;
  const conferenceTeams = teams.filter(t => t.conference.toLowerCase() === conference.toLowerCase());
  
  if (conferenceTeams.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Conference not found',
      timestamp: new Date().toISOString()
    });
  }

  const standings = conferenceTeams.map(team => ({
    ...team,
    record: {
      wins: Math.floor(Math.random() * 8) + 4,
      losses: Math.floor(Math.random() * 4),
      conferenceWins: Math.floor(Math.random() * 6) + 2,
      conferenceLosses: Math.floor(Math.random() * 3)
    },
    pointsFor: Math.floor(Math.random() * 200) + 250,
    pointsAgainst: Math.floor(Math.random() * 150) + 180
  })).sort((a, b) => {
    const aWinPct = a.record.wins / (a.record.wins + a.record.losses);
    const bWinPct = b.record.wins / (b.record.wins + b.record.losses);
    return bWinPct - aWinPct;
  });

  res.json({
    success: true,
    data: {
      conference: conference,
      standings: standings
    },
    timestamp: new Date().toISOString()
  });
});

// Live scores endpoint (simulated)
app.get('/api/v1/games/live', (req, res) => {
  const liveGames = games.filter(game => {
    const gameTime = new Date(game.scheduledTime);
    const now = new Date();
    const timeDiff = Math.abs(gameTime - now);
    return timeDiff < 4 * 60 * 60 * 1000; // Within 4 hours
  }).map(game => ({
    ...game,
    status: 'Live',
    quarter: Math.floor(Math.random() * 4) + 1,
    timeRemaining: `${Math.floor(Math.random() * 15)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
    homeScore: Math.floor(Math.random() * 35),
    awayScore: Math.floor(Math.random() * 35),
    possession: Math.random() > 0.5 ? 'home' : 'away',
    down: Math.floor(Math.random() * 4) + 1,
    distance: Math.floor(Math.random() * 15) + 1,
    yardLine: Math.floor(Math.random() * 100) + 1
  }));

  res.json({
    success: true,
    data: liveGames,
    count: liveGames.length,
    timestamp: new Date().toISOString()
  });
});

// Team roster endpoint
app.get('/api/v1/teams/:id/roster', (req, res) => {
  const teamId = req.params.id;
  const team = teams.find(t => t.id === teamId);
  
  if (!team) {
    return res.status(404).json({
      success: false,
      error: 'Team not found',
      timestamp: new Date().toISOString()
    });
  }

  const roster = players.filter(p => p.teamId === teamId);

  res.json({
    success: true,
    data: {
      team: team,
      players: roster,
      totalPlayers: roster.length
    },
    timestamp: new Date().toISOString()
  });
});

// Game predictions with detailed analysis
app.get('/api/v1/predictions/:gameId/detailed', (req, res) => {
  const game = games.find(g => g.id === req.params.gameId);
  
  if (!game) {
    return res.status(404).json({
      success: false,
      error: 'Game not found',
      timestamp: new Date().toISOString()
    });
  }

  const homeWinProb = 0.35 + Math.random() * 0.4;
  const awayWinProb = 1 - homeWinProb;
  
  const detailedPrediction = {
    gameId: req.params.gameId,
    predictions: {
      homeTeamWinProbability: homeWinProb,
      awayTeamWinProbability: awayWinProb,
      confidence: 0.75 + Math.random() * 0.2,
      predictedScore: {
        home: Math.floor(Math.random() * 20) + 20,
        away: Math.floor(Math.random() * 20) + 15
      },
      spreadPrediction: {
        favorite: homeWinProb > awayWinProb ? 'home' : 'away',
        spread: Math.abs(Math.random() * 14 + 1).toFixed(1),
        confidence: Math.random() * 0.3 + 0.6
      },
      overUnder: {
        total: Math.floor(Math.random() * 20) + 45,
        recommendation: Math.random() > 0.5 ? 'over' : 'under',
        confidence: Math.random() * 0.2 + 0.7
      }
    },
    modelBreakdown: {
      xgboost: {
        homeWinProb: homeWinProb + (Math.random() - 0.5) * 0.1,
        weight: 0.35,
        accuracy: 0.892
      },
      neuralNetwork: {
        homeWinProb: homeWinProb + (Math.random() - 0.5) * 0.15,
        weight: 0.25,
        accuracy: 0.867
      },
      ensemble: {
        homeWinProb: homeWinProb,
        weight: 0.40,
        accuracy: 0.914
      }
    },
    factors: {
      homeFieldAdvantage: 0.03,
      recentForm: (Math.random() - 0.5) * 0.1,
      injuries: Math.random() * 0.05,
      weather: Math.random() * 0.02,
      motivation: Math.random() * 0.03,
      headToHead: (Math.random() - 0.5) * 0.04,
      strengthOfSchedule: (Math.random() - 0.5) * 0.02
    },
    keyMatchups: [
      'Offensive Line vs Pass Rush',
      'Secondary vs Passing Attack',
      'Running Game vs Run Defense',
      'Special Teams Battle'
    ],
    lastUpdated: new Date().toISOString()
  };

  res.json({
    success: true,
    data: detailedPrediction,
    timestamp: new Date().toISOString()
  });
});

// ML Model performance endpoint
app.get('/api/v1/models/performance', (req, res) => {
  const modelPerformance = {
    models: [
      {
        name: 'XGBoost Classifier',
        type: 'Gradient Boosting',
        accuracy: 0.892,
        precision: 0.878,
        recall: 0.901,
        f1Score: 0.889,
        lastTrained: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        features: 64,
        status: 'active',
        predictions: 1247
      },
      {
        name: 'Neural Network',
        type: 'Deep Learning',
        accuracy: 0.867,
        precision: 0.854,
        recall: 0.881,
        f1Score: 0.867,
        lastTrained: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        features: 64,
        status: 'active',
        predictions: 1247
      },
      {
        name: 'Ensemble Model',
        type: 'Ensemble',
        accuracy: 0.914,
        precision: 0.908,
        recall: 0.920,
        f1Score: 0.914,
        lastTrained: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        features: 64,
        status: 'active',
        predictions: 1247
      },
      {
        name: 'Random Forest',
        type: 'Tree Ensemble',
        accuracy: 0.845,
        precision: 0.832,
        recall: 0.859,
        f1Score: 0.845,
        lastTrained: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        features: 64,
        status: 'active',
        predictions: 1247
      },
      {
        name: 'SVM',
        type: 'Support Vector Machine',
        accuracy: 0.823,
        precision: 0.815,
        recall: 0.831,
        f1Score: 0.823,
        lastTrained: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        features: 64,
        status: 'active',
        predictions: 1247
      }
    ],
    overallStats: {
      totalPredictions: 6235,
      averageAccuracy: 0.868,
      bestModel: 'Ensemble Model',
      lastModelUpdate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    }
  };

  res.json({
    success: true,
    data: modelPerformance,
    timestamp: new Date().toISOString()
  });
});

// Historical matchups endpoint
app.get('/api/v1/teams/:homeId/vs/:awayId/history', (req, res) => {
  const { homeId, awayId } = req.params;
  const homeTeam = teams.find(t => t.id === homeId);
  const awayTeam = teams.find(t => t.id === awayId);
  
  if (!homeTeam || !awayTeam) {
    return res.status(404).json({
      success: false,
      error: 'One or both teams not found',
      timestamp: new Date().toISOString()
    });
  }

  // Generate historical matchup data
  const historicalGames = Array.from({ length: 10 }, (_, i) => ({
    year: 2023 - i,
    homeTeam: Math.random() > 0.5 ? homeTeam.name : awayTeam.name,
    awayTeam: Math.random() > 0.5 ? awayTeam.name : homeTeam.name,
    homeScore: Math.floor(Math.random() * 35) + 10,
    awayScore: Math.floor(Math.random() * 35) + 10,
    venue: Math.random() > 0.5 ? homeTeam.venue : awayTeam.venue
  }));

  const homeWins = historicalGames.filter(g => 
    (g.homeTeam === homeTeam.name && g.homeScore > g.awayScore) ||
    (g.awayTeam === homeTeam.name && g.awayScore > g.homeScore)
  ).length;

  res.json({
    success: true,
    data: {
      homeTeam,
      awayTeam,
      overallRecord: {
        homeTeamWins: homeWins,
        awayTeamWins: historicalGames.length - homeWins,
        ties: 0
      },
      recentGames: historicalGames.slice(0, 5),
      averageScore: {
        home: (historicalGames.reduce((sum, g) => sum + g.homeScore, 0) / historicalGames.length).toFixed(1),
        away: (historicalGames.reduce((sum, g) => sum + g.awayScore, 0) / historicalGames.length).toFixed(1)
      }
    },
    timestamp: new Date().toISOString()
  });
});