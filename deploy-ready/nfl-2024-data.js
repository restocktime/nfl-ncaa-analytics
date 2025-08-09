// NFL 2024 Season & 2025 Preseason Complete Data
console.log('🏈 Loading NFL 2024/2025 Complete Data...');

// All 32 NFL Teams with 2024 Records and Logos
const NFL_TEAMS_2024 = [
    // AFC East
    { id: 1, name: "Buffalo Bills", abbreviation: "BUF", conference: "AFC", division: "East", wins: 13, losses: 4, city: "Buffalo, NY", stadium: "Highmark Stadium", coach: "Sean McDermott", founded: 1960, colors: ["#00338D", "#C60C30"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png" },
    { id: 2, name: "Miami Dolphins", abbreviation: "MIA", conference: "AFC", division: "East", wins: 11, losses: 6, city: "Miami Gardens, FL", stadium: "Hard Rock Stadium", coach: "Mike McDaniel", founded: 1966, colors: ["#008E97", "#FC4C02"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/mia.png" },
    { id: 3, name: "New York Jets", abbreviation: "NYJ", conference: "AFC", division: "East", wins: 7, losses: 10, city: "East Rutherford, NJ", stadium: "MetLife Stadium", coach: "Robert Saleh", founded: 1960, colors: ["#125740", "#000000"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png" },
    { id: 4, name: "New England Patriots", abbreviation: "NE", conference: "AFC", division: "East", wins: 4, losses: 13, city: "Foxborough, MA", stadium: "Gillette Stadium", coach: "Jerod Mayo", founded: 1960, colors: ["#002244", "#C60C30"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ne.png" },
    
    // AFC North
    { id: 5, name: "Baltimore Ravens", abbreviation: "BAL", conference: "AFC", division: "North", wins: 12, losses: 5, city: "Baltimore, MD", stadium: "M&T Bank Stadium", coach: "John Harbaugh", founded: 1996, colors: ["#241773", "#000000"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/bal.png" },
    { id: 6, name: "Pittsburgh Steelers", abbreviation: "PIT", conference: "AFC", division: "North", wins: 10, losses: 7, city: "Pittsburgh, PA", stadium: "Acrisure Stadium", coach: "Mike Tomlin", founded: 1933, colors: ["#FFB612", "#000000"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/pit.png" },
    { id: 7, name: "Cleveland Browns", abbreviation: "CLE", conference: "AFC", division: "North", wins: 11, losses: 6, city: "Cleveland, OH", stadium: "Cleveland Browns Stadium", coach: "Kevin Stefanski", founded: 1946, colors: ["#311D00", "#FF3C00"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cle.png" },
    { id: 8, name: "Cincinnati Bengals", abbreviation: "CIN", conference: "AFC", division: "North", wins: 9, losses: 8, city: "Cincinnati, OH", stadium: "Paycor Stadium", coach: "Zac Taylor", founded: 1968, colors: ["#FB4F14", "#000000"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/cin.png" },
    
    // AFC South
    { id: 9, name: "Houston Texans", abbreviation: "HOU", conference: "AFC", division: "South", wins: 10, losses: 7, city: "Houston, TX", stadium: "NRG Stadium", coach: "DeMeco Ryans", founded: 2002, colors: ["#03202F", "#A71930"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/hou.png" },
    { id: 10, name: "Indianapolis Colts", abbreviation: "IND", conference: "AFC", division: "South", wins: 9, losses: 8, city: "Indianapolis, IN", stadium: "Lucas Oil Stadium", coach: "Shane Steichen", founded: 1953, colors: ["#002C5F", "#A2AAAD"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ind.png" },
    { id: 11, name: "Jacksonville Jaguars", abbreviation: "JAX", conference: "AFC", division: "South", wins: 4, losses: 13, city: "Jacksonville, FL", stadium: "TIAA Bank Field", coach: "Doug Pederson", founded: 1995, colors: ["#006778", "#D7A22A"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/jax.png" },
    { id: 12, name: "Tennessee Titans", abbreviation: "TEN", conference: "AFC", division: "South", wins: 6, losses: 11, city: "Nashville, TN", stadium: "Nissan Stadium", coach: "Brian Callahan", founded: 1960, colors: ["#0C2340", "#4B92DB"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ten.png" },
    
    // AFC West
    { id: 13, name: "Kansas City Chiefs", abbreviation: "KC", conference: "AFC", division: "West", wins: 15, losses: 2, city: "Kansas City, MO", stadium: "Arrowhead Stadium", coach: "Andy Reid", founded: 1960, colors: ["#E31837", "#FFB81C"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png" },
    { id: 14, name: "Los Angeles Chargers", abbreviation: "LAC", conference: "AFC", division: "West", wins: 11, losses: 6, city: "Los Angeles, CA", stadium: "SoFi Stadium", coach: "Jim Harbaugh", founded: 1960, colors: ["#0080C6", "#FFC20E"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lac.png" },
    { id: 15, name: "Denver Broncos", abbreviation: "DEN", conference: "AFC", division: "West", wins: 10, losses: 7, city: "Denver, CO", stadium: "Empower Field at Mile High", coach: "Sean Payton", founded: 1960, colors: ["#FB4F14", "#002244"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/den.png" },
    { id: 16, name: "Las Vegas Raiders", abbreviation: "LV", conference: "AFC", division: "West", wins: 4, losses: 13, city: "Las Vegas, NV", stadium: "Allegiant Stadium", coach: "Antonio Pierce", founded: 1960, colors: ["#000000", "#A5ACAF"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lv.png" },
    
    // NFC East
    { id: 17, name: "Philadelphia Eagles", abbreviation: "PHI", conference: "NFC", division: "East", wins: 14, losses: 3, city: "Philadelphia, PA", stadium: "Lincoln Financial Field", coach: "Nick Sirianni", founded: 1933, colors: ["#004C54", "#A5ACAF"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png" },
    { id: 18, name: "Washington Commanders", abbreviation: "WAS", conference: "NFC", division: "East", wins: 12, losses: 5, city: "Landover, MD", stadium: "FedExField", coach: "Dan Quinn", founded: 1932, colors: ["#5A1414", "#FFB612"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png" },
    { id: 19, name: "Dallas Cowboys", abbreviation: "DAL", conference: "NFC", division: "East", wins: 7, losses: 10, city: "Arlington, TX", stadium: "AT&T Stadium", coach: "Mike McCarthy", founded: 1960, colors: ["#003594", "#869397"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png" },
    { id: 20, name: "New York Giants", abbreviation: "NYG", conference: "NFC", division: "East", wins: 3, losses: 14, city: "East Rutherford, NJ", stadium: "MetLife Stadium", coach: "Brian Daboll", founded: 1925, colors: ["#0B2265", "#A71930"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png" },
    
    // NFC North
    { id: 21, name: "Detroit Lions", abbreviation: "DET", conference: "NFC", division: "North", wins: 15, losses: 2, city: "Detroit, MI", stadium: "Ford Field", coach: "Dan Campbell", founded: 1930, colors: ["#0076B6", "#B0B7BC"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/det.png" },
    { id: 22, name: "Minnesota Vikings", abbreviation: "MIN", conference: "NFC", division: "North", wins: 14, losses: 3, city: "Minneapolis, MN", stadium: "U.S. Bank Stadium", coach: "Kevin O'Connell", founded: 1961, colors: ["#4F2683", "#FFC62F"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/min.png" },
    { id: 23, name: "Green Bay Packers", abbreviation: "GB", conference: "NFC", division: "North", wins: 11, losses: 6, city: "Green Bay, WI", stadium: "Lambeau Field", coach: "Matt LaFleur", founded: 1919, colors: ["#203731", "#FFB612"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/gb.png" },
    { id: 24, name: "Chicago Bears", abbreviation: "CHI", conference: "NFC", division: "North", wins: 5, losses: 12, city: "Chicago, IL", stadium: "Soldier Field", coach: "Matt Eberflus", founded: 1920, colors: ["#0B162A", "#C83803"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/chi.png" },
    
    // NFC South
    { id: 25, name: "Tampa Bay Buccaneers", abbreviation: "TB", conference: "NFC", division: "South", wins: 10, losses: 7, city: "Tampa, FL", stadium: "Raymond James Stadium", coach: "Todd Bowles", founded: 1976, colors: ["#D50A0A", "#FF7900"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png" },
    { id: 26, name: "Atlanta Falcons", abbreviation: "ATL", conference: "NFC", division: "South", wins: 8, losses: 9, city: "Atlanta, GA", stadium: "Mercedes-Benz Stadium", coach: "Raheem Morris", founded: 1966, colors: ["#A71930", "#000000"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/atl.png" },
    { id: 27, name: "New Orleans Saints", abbreviation: "NO", conference: "NFC", division: "South", wins: 5, losses: 12, city: "New Orleans, LA", stadium: "Caesars Superdome", coach: "Dennis Allen", founded: 1967, colors: ["#D3BC8D", "#101820"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/no.png" },
    { id: 28, name: "Carolina Panthers", abbreviation: "CAR", conference: "NFC", division: "South", wins: 5, losses: 12, city: "Charlotte, NC", stadium: "Bank of America Stadium", coach: "Dave Canales", founded: 1995, colors: ["#0085CA", "#101820"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/car.png" },
    
    // NFC West
    { id: 29, name: "Los Angeles Rams", abbreviation: "LAR", conference: "NFC", division: "West", wins: 10, losses: 7, city: "Los Angeles, CA", stadium: "SoFi Stadium", coach: "Sean McVay", founded: 1936, colors: ["#003594", "#FFA300"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/lar.png" },
    { id: 30, name: "Seattle Seahawks", abbreviation: "SEA", conference: "NFC", division: "West", wins: 10, losses: 7, city: "Seattle, WA", stadium: "Lumen Field", coach: "Mike Macdonald", founded: 1976, colors: ["#002244", "#69BE28"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sea.png" },
    { id: 31, name: "Arizona Cardinals", abbreviation: "ARI", conference: "NFC", division: "West", wins: 8, losses: 9, city: "Glendale, AZ", stadium: "State Farm Stadium", coach: "Jonathan Gannon", founded: 1898, colors: ["#97233F", "#000000"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/ari.png" },
    { id: 32, name: "San Francisco 49ers", abbreviation: "SF", conference: "NFC", division: "West", wins: 6, losses: 11, city: "Santa Clara, CA", stadium: "Levi's Stadium", coach: "Kyle Shanahan", founded: 1946, colors: ["#AA0000", "#B3995D"], logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png" }
];

// Top NFL Players 2024 Season with Images (50+ players across all positions)
const NFL_PLAYERS_2024 = [
    // Quarterbacks
    { id: 1, name: "Josh Allen", position: "QB", team: "Buffalo Bills", jerseyNumber: 17, age: 28, height: 77, weight: 237, college: "Wyoming", experience: 7, stats2024: { passingYards: 4306, passingTDs: 28, interceptions: 6, rushingYards: 523, rushingTDs: 15 }, image: "https://a.espncdn.com/i/headshots/nfl/players/full/3139477.png" },
    { id: 2, name: "Lamar Jackson", position: "QB", team: "Baltimore Ravens", jerseyNumber: 8, age: 27, height: 74, weight: 212, college: "Louisville", experience: 7, stats2024: { passingYards: 3678, passingTDs: 40, interceptions: 4, rushingYards: 915, rushingTDs: 3 }, image: "https://a.espncdn.com/i/headshots/nfl/players/full/3916387.png" },
    { id: 3, name: "Patrick Mahomes", position: "QB", team: "Kansas City Chiefs", jerseyNumber: 15, age: 29, height: 75, weight: 230, college: "Texas Tech", experience: 8, stats2024: { passingYards: 4183, passingTDs: 26, interceptions: 11, rushingYards: 417, rushingTDs: 2 }, image: "https://a.espncdn.com/i/headshots/nfl/players/full/3139477.png" },
    { id: 4, name: "Jalen Hurts", position: "QB", team: "Philadelphia Eagles", jerseyNumber: 1, age: 26, height: 73, weight: 223, college: "Oklahoma", experience: 5, stats2024: { passingYards: 3858, passingTDs: 15, interceptions: 5, rushingYards: 630, rushingTDs: 14 }, image: "https://a.espncdn.com/i/headshots/nfl/players/full/4040715.png" },
    { id: 5, name: "Jayden Daniels", position: "QB", team: "Washington Commanders", jerseyNumber: 5, age: 24, height: 76, weight: 210, college: "LSU", experience: 1, stats2024: { passingYards: 3568, passingTDs: 25, interceptions: 9, rushingYards: 891, rushingTDs: 6 }, image: "https://a.espncdn.com/i/headshots/nfl/players/full/4866023.png" },
    { id: 6, name: "Jared Goff", position: "QB", team: "Detroit Lions", jerseyNumber: 16, age: 30, height: 76, weight: 222, college: "California", experience: 9, stats2024: { passingYards: 4629, passingTDs: 37, interceptions: 12, rushingYards: 72, rushingTDs: 3 } },
    { id: 7, name: "Sam Darnold", position: "QB", team: "Minnesota Vikings", jerseyNumber: 14, age: 27, height: 75, weight: 225, college: "USC", experience: 7, stats2024: { passingYards: 4319, passingTDs: 35, interceptions: 12, rushingYards: 203, rushingTDs: 5 } },
    { id: 8, name: "Jordan Love", position: "QB", team: "Green Bay Packers", jerseyNumber: 10, age: 26, height: 76, weight: 224, college: "Utah State", experience: 5, stats2024: { passingYards: 3389, passingTDs: 25, interceptions: 11, rushingYards: 247, rushingTDs: 1 } },
    { id: 9, name: "Baker Mayfield", position: "QB", team: "Tampa Bay Buccaneers", jerseyNumber: 6, age: 29, height: 73, weight: 215, college: "Oklahoma", experience: 7, stats2024: { passingYards: 4500, passingTDs: 41, interceptions: 16, rushingYards: 184, rushingTDs: 3 } },
    { id: 10, name: "Tua Tagovailoa", position: "QB", team: "Miami Dolphins", jerseyNumber: 1, age: 26, height: 73, weight: 217, college: "Alabama", experience: 5, stats2024: { passingYards: 2867, passingTDs: 19, interceptions: 7, rushingYards: 64, rushingTDs: 1 } },
    
    // Running Backs
    { id: 11, name: "Saquon Barkley", position: "RB", team: "Philadelphia Eagles", jerseyNumber: 26, age: 27, height: 72, weight: 233, college: "Penn State", experience: 7, stats2024: { rushingYards: 2005, rushingTDs: 13, receptions: 33, receivingYards: 278, receivingTDs: 2 } },
    { id: 12, name: "Derrick Henry", position: "RB", team: "Baltimore Ravens", jerseyNumber: 22, age: 30, height: 75, weight: 247, college: "Alabama", experience: 9, stats2024: { rushingYards: 1921, rushingTDs: 16, receptions: 11, receivingYards: 137, receivingTDs: 1 } },
    { id: 13, name: "Josh Jacobs", position: "RB", team: "Green Bay Packers", jerseyNumber: 8, age: 26, height: 70, weight: 220, college: "Alabama", experience: 6, stats2024: { rushingYards: 1329, rushingTDs: 15, receptions: 15, receivingYards: 145, receivingTDs: 1 } },
    { id: 14, name: "Jahmyr Gibbs", position: "RB", team: "Detroit Lions", jerseyNumber: 26, age: 22, height: 69, weight: 199, college: "Alabama", experience: 2, stats2024: { rushingYards: 1412, rushingTDs: 16, receptions: 52, receivingYards: 517, receivingTDs: 1 } },
    { id: 15, name: "Kenneth Walker III", position: "RB", team: "Seattle Seahawks", jerseyNumber: 9, age: 24, height: 70, weight: 211, college: "Michigan State", experience: 3, stats2024: { rushingYards: 1204, rushingTDs: 12, receptions: 23, receivingYards: 145, receivingTDs: 0 } },
    
    // Wide Receivers
    { id: 16, name: "CeeDee Lamb", position: "WR", team: "Dallas Cowboys", jerseyNumber: 88, age: 25, height: 74, weight: 198, college: "Oklahoma", experience: 5, stats2024: { receptions: 101, receivingYards: 1194, receivingTDs: 6, rushingYards: 24, rushingTDs: 0 } },
    { id: 17, name: "A.J. Brown", position: "WR", team: "Philadelphia Eagles", jerseyNumber: 11, age: 27, height: 73, weight: 226, college: "Ole Miss", experience: 6, stats2024: { receptions: 67, receivingYards: 1079, receivingTDs: 7, rushingYards: 18, rushingTDs: 0 } },
    { id: 18, name: "Amon-Ra St. Brown", position: "WR", team: "Detroit Lions", jerseyNumber: 14, age: 25, height: 70, weight: 197, college: "USC", experience: 4, stats2024: { receptions: 115, receivingYards: 1263, receivingTDs: 12, rushingYards: 37, rushingTDs: 1 } },
    { id: 19, name: "Justin Jefferson", position: "WR", team: "Minnesota Vikings", jerseyNumber: 18, age: 25, height: 73, weight: 202, college: "LSU", experience: 5, stats2024: { receptions: 103, receivingYards: 1533, receivingTDs: 10, rushingYards: 21, rushingTDs: 0 } },
    { id: 20, name: "Ja'Marr Chase", position: "WR", team: "Cincinnati Bengals", jerseyNumber: 1, age: 24, height: 72, weight: 201, college: "LSU", experience: 4, stats2024: { receptions: 117, receivingYards: 1708, receivingTDs: 16, rushingYards: 33, rushingTDs: 1 } },
    { id: 21, name: "Tyreek Hill", position: "WR", team: "Miami Dolphins", jerseyNumber: 10, age: 30, height: 70, weight: 185, college: "West Alabama", experience: 9, stats2024: { receptions: 81, receivingYards: 959, receivingTDs: 6, rushingYards: 38, rushingTDs: 1 } },
    { id: 22, name: "Mike Evans", position: "WR", team: "Tampa Bay Buccaneers", jerseyNumber: 13, age: 31, height: 77, weight: 231, college: "Texas A&M", experience: 11, stats2024: { receptions: 79, receivingYards: 1004, receivingTDs: 11, rushingYards: 8, rushingTDs: 0 } },
    { id: 23, name: "Terry McLaurin", position: "WR", team: "Washington Commanders", jerseyNumber: 17, age: 29, height: 72, weight: 208, college: "Ohio State", experience: 6, stats2024: { receptions: 82, receivingYards: 1096, receivingTDs: 13, rushingYards: 26, rushingTDs: 0 } },
    { id: 24, name: "Puka Nacua", position: "WR", team: "Los Angeles Rams", jerseyNumber: 17, age: 23, height: 74, weight: 212, college: "BYU", experience: 2, stats2024: { receptions: 79, receivingYards: 1486, receivingTDs: 3, rushingYards: 46, rushingTDs: 0 } },
    { id: 25, name: "Jaylen Waddle", position: "WR", team: "Miami Dolphins", jerseyNumber: 17, age: 26, height: 70, weight: 182, college: "Alabama", experience: 4, stats2024: { receptions: 60, receivingYards: 618, receivingTDs: 2, rushingYards: 9, rushingTDs: 0 } },
    
    // Tight Ends
    { id: 26, name: "Travis Kelce", position: "TE", team: "Kansas City Chiefs", jerseyNumber: 87, age: 35, height: 77, weight: 250, college: "Cincinnati", experience: 12, stats2024: { receptions: 97, receivingYards: 823, receivingTDs: 3, rushingYards: 0, rushingTDs: 0 } },
    { id: 27, name: "George Kittle", position: "TE", team: "San Francisco 49ers", jerseyNumber: 85, age: 31, height: 76, weight: 250, college: "Iowa", experience: 8, stats2024: { receptions: 65, receivingYards: 560, receivingTDs: 8, rushingYards: 17, rushingTDs: 0 } },
    { id: 28, name: "Mark Andrews", position: "TE", team: "Baltimore Ravens", jerseyNumber: 89, age: 29, height: 77, weight: 256, college: "Oklahoma", experience: 7, stats2024: { receptions: 55, receivingYards: 673, receivingTDs: 11, rushingYards: 0, rushingTDs: 0 } },
    { id: 29, name: "Sam LaPorta", position: "TE", team: "Detroit Lions", jerseyNumber: 87, age: 23, height: 76, weight: 249, college: "Iowa", experience: 2, stats2024: { receptions: 86, receivingYards: 889, receivingTDs: 9, rushingYards: 0, rushingTDs: 0 } },
    { id: 30, name: "Trey McBride", position: "TE", team: "Arizona Cardinals", jerseyNumber: 85, age: 25, height: 76, weight: 246, college: "Colorado State", experience: 3, stats2024: { receptions: 96, receivingYards: 1024, receivingTDs: 1, rushingYards: 0, rushingTDs: 0 } },
    
    // Defensive Players
    { id: 31, name: "T.J. Watt", position: "OLB", team: "Pittsburgh Steelers", jerseyNumber: 90, age: 30, height: 73, weight: 252, college: "Wisconsin", experience: 8, stats2024: { tackles: 62, sacks: 11.5, interceptions: 1, forcedFumbles: 4, defensiveTDs: 0 } },
    { id: 32, name: "Myles Garrett", position: "DE", team: "Cleveland Browns", jerseyNumber: 95, age: 29, height: 76, weight: 272, college: "Texas A&M", experience: 8, stats2024: { tackles: 42, sacks: 14.0, interceptions: 0, forcedFumbles: 3, defensiveTDs: 0 } },
    { id: 33, name: "Aaron Donald", position: "DT", team: "Los Angeles Rams", jerseyNumber: 99, age: 33, height: 73, weight: 280, college: "Pittsburgh", experience: 11, stats2024: { tackles: 40, sacks: 8.5, interceptions: 0, forcedFumbles: 1, defensiveTDs: 0 } },
    { id: 34, name: "Micah Parsons", position: "LB", team: "Dallas Cowboys", jerseyNumber: 11, age: 25, height: 75, weight: 245, college: "Penn State", experience: 4, stats2024: { tackles: 64, sacks: 11.0, interceptions: 0, forcedFumbles: 2, defensiveTDs: 0 } },
    { id: 35, name: "Nick Bosa", position: "DE", team: "San Francisco 49ers", jerseyNumber: 97, age: 27, height: 76, weight: 266, college: "Ohio State", experience: 6, stats2024: { tackles: 61, sacks: 10.5, interceptions: 0, forcedFumbles: 2, defensiveTDs: 0 } },
    { id: 36, name: "Roquan Smith", position: "LB", team: "Baltimore Ravens", jerseyNumber: 0, age: 27, height: 73, weight: 232, college: "Georgia", experience: 7, stats2024: { tackles: 110, sacks: 6.0, interceptions: 1, forcedFumbles: 2, defensiveTDs: 0 } },
    { id: 37, name: "Jalen Ramsey", position: "CB", team: "Miami Dolphins", jerseyNumber: 5, age: 30, height: 73, weight: 194, college: "Florida State", experience: 9, stats2024: { tackles: 69, sacks: 0, interceptions: 3, passDeflections: 14, defensiveTDs: 0 } },
    { id: 38, name: "Sauce Gardner", position: "CB", team: "New York Jets", jerseyNumber: 1, age: 24, height: 73, weight: 190, college: "Cincinnati", experience: 3, stats2024: { tackles: 70, sacks: 0, interceptions: 2, passDeflections: 20, defensiveTDs: 0 } },
    { id: 39, name: "Minkah Fitzpatrick", position: "S", team: "Pittsburgh Steelers", jerseyNumber: 39, age: 28, height: 73, weight: 207, college: "Alabama", experience: 7, stats2024: { tackles: 91, sacks: 0, interceptions: 3, passDeflections: 10, defensiveTDs: 1 } },
    { id: 40, name: "Derwin James", position: "S", team: "Los Angeles Chargers", jerseyNumber: 3, age: 28, height: 74, weight: 215, college: "Florida State", experience: 7, stats2024: { tackles: 105, sacks: 1.0, interceptions: 1, passDeflections: 8, defensiveTDs: 0 } },
    
    // Kickers & Punters
    { id: 41, name: "Justin Tucker", position: "K", team: "Baltimore Ravens", jerseyNumber: 9, age: 35, height: 73, weight: 183, college: "Texas", experience: 13, stats2024: { fieldGoalsMade: 24, fieldGoalsAttempted: 30, extraPointsMade: 33, extraPointsAttempted: 34, longestFieldGoal: 56 } },
    { id: 42, name: "Harrison Butker", position: "K", team: "Kansas City Chiefs", jerseyNumber: 7, age: 29, height: 76, weight: 196, college: "Georgia Tech", experience: 8, stats2024: { fieldGoalsMade: 33, fieldGoalsAttempted: 35, extraPointsMade: 38, extraPointsAttempted: 38, longestFieldGoal: 54 } },
    { id: 43, name: "Jake Elliott", position: "K", team: "Philadelphia Eagles", jerseyNumber: 4, age: 29, height: 71, weight: 167, college: "Memphis", experience: 8, stats2024: { fieldGoalsMade: 30, fieldGoalsAttempted: 35, extraPointsMade: 47, extraPointsAttempted: 48, longestFieldGoal: 57 } },
    { id: 44, name: "Chris Boswell", position: "K", team: "Pittsburgh Steelers", jerseyNumber: 9, age: 33, height: 74, weight: 185, college: "Rice", experience: 10, stats2024: { fieldGoalsMade: 41, fieldGoalsAttempted: 44, extraPointsMade: 36, extraPointsAttempted: 36, longestFieldGoal: 57 } },
    { id: 45, name: "Brandon McManus", position: "K", team: "Washington Commanders", jerseyNumber: 6, age: 33, height: 75, weight: 201, college: "Temple", experience: 11, stats2024: { fieldGoalsMade: 30, fieldGoalsAttempted: 34, extraPointsMade: 43, extraPointsAttempted: 43, longestFieldGoal: 56 } },
    
    // Additional Star Players
    { id: 46, name: "Dak Prescott", position: "QB", team: "Dallas Cowboys", jerseyNumber: 4, age: 31, height: 74, weight: 238, college: "Mississippi State", experience: 9, stats2024: { passingYards: 3304, passingTDs: 29, interceptions: 11, rushingYards: 105, rushingTDs: 2 } },
    { id: 47, name: "Russell Wilson", position: "QB", team: "Pittsburgh Steelers", jerseyNumber: 3, age: 36, height: 71, weight: 215, college: "Wisconsin", experience: 13, stats2024: { passingYards: 2482, passingTDs: 16, interceptions: 5, rushingYards: 120, rushingTDs: 3 } },
    { id: 48, name: "Caleb Williams", position: "QB", team: "Chicago Bears", jerseyNumber: 18, age: 23, height: 73, weight: 214, college: "USC", experience: 1, stats2024: { passingYards: 3541, passingTDs: 20, interceptions: 6, rushingYards: 489, rushingTDs: 4 } },
    { id: 49, name: "C.J. Stroud", position: "QB", team: "Houston Texans", jerseyNumber: 7, age: 23, height: 75, weight: 218, college: "Ohio State", experience: 2, stats2024: { passingYards: 3727, passingTDs: 20, interceptions: 12, rushingYards: 167, rushingTDs: 1 } },
    { id: 50, name: "Bo Nix", position: "QB", team: "Denver Broncos", jerseyNumber: 10, age: 25, height: 74, weight: 214, college: "Oregon", experience: 1, stats2024: { passingYards: 3775, passingTDs: 29, interceptions: 12, rushingYards: 430, rushingTDs: 4 } }
];

// 2025 Preseason Schedule (Sample games)
const PRESEASON_2025_SCHEDULE = [
    { id: 1, week: 1, date: "2025-08-08", time: "20:00", homeTeam: "Chicago Bears", awayTeam: "Houston Texans", stadium: "Tom Benson Hall of Fame Stadium", city: "Canton, OH", gameType: "Hall of Fame Game" },
    { id: 2, week: 1, date: "2025-08-10", time: "19:00", homeTeam: "Detroit Lions", awayTeam: "New York Giants", stadium: "Ford Field", city: "Detroit, MI", gameType: "Preseason Week 1" },
    { id: 3, week: 1, date: "2025-08-10", time: "20:00", homeTeam: "Atlanta Falcons", awayTeam: "Miami Dolphins", stadium: "Mercedes-Benz Stadium", city: "Atlanta, GA", gameType: "Preseason Week 1" },
    { id: 4, week: 1, date: "2025-08-11", time: "13:00", homeTeam: "Pittsburgh Steelers", awayTeam: "Houston Texans", stadium: "Acrisure Stadium", city: "Pittsburgh, PA", gameType: "Preseason Week 1" },
    { id: 5, week: 1, date: "2025-08-11", time: "16:00", homeTeam: "New England Patriots", awayTeam: "Carolina Panthers", stadium: "Gillette Stadium", city: "Foxborough, MA", gameType: "Preseason Week 1" },
    { id: 6, week: 1, date: "2025-08-11", time: "19:00", homeTeam: "Philadelphia Eagles", awayTeam: "Baltimore Ravens", stadium: "Lincoln Financial Field", city: "Philadelphia, PA", gameType: "Preseason Week 1" },
    { id: 7, week: 1, date: "2025-08-11", time: "20:00", homeTeam: "Las Vegas Raiders", awayTeam: "Minnesota Vikings", stadium: "Allegiant Stadium", city: "Las Vegas, NV", gameType: "Preseason Week 1" },
    { id: 8, week: 2, date: "2025-08-17", time: "19:00", homeTeam: "Kansas City Chiefs", awayTeam: "Detroit Lions", stadium: "Arrowhead Stadium", city: "Kansas City, MO", gameType: "Preseason Week 2" },
    { id: 9, week: 2, date: "2025-08-17", time: "20:00", homeTeam: "Buffalo Bills", awayTeam: "Pittsburgh Steelers", stadium: "Highmark Stadium", city: "Buffalo, NY", gameType: "Preseason Week 2" },
    { id: 10, week: 2, date: "2025-08-18", time: "20:00", homeTeam: "Los Angeles Rams", awayTeam: "Los Angeles Chargers", stadium: "SoFi Stadium", city: "Los Angeles, CA", gameType: "Preseason Week 2" },
    { id: 11, week: 3, date: "2025-08-24", time: "19:00", homeTeam: "Green Bay Packers", awayTeam: "Seattle Seahawks", stadium: "Lambeau Field", city: "Green Bay, WI", gameType: "Preseason Week 3" },
    { id: 12, week: 3, date: "2025-08-24", time: "20:00", homeTeam: "Dallas Cowboys", awayTeam: "Los Angeles Chargers", stadium: "AT&T Stadium", city: "Arlington, TX", gameType: "Preseason Week 3" },
    { id: 13, week: 3, date: "2025-08-25", time: "19:30", homeTeam: "Tampa Bay Buccaneers", awayTeam: "Miami Dolphins", stadium: "Raymond James Stadium", city: "Tampa, FL", gameType: "Preseason Week 3" }
];

// 2024 Season Statistics Leaders
const SEASON_LEADERS_2024 = {
    passing: [
        { player: "Jared Goff", team: "Detroit Lions", stat: "Passing Yards", value: 4629 },
        { player: "Baker Mayfield", team: "Tampa Bay Buccaneers", stat: "Passing TDs", value: 41 },
        { player: "Lamar Jackson", team: "Baltimore Ravens", stat: "Passing TDs", value: 40 },
        { player: "Jared Goff", team: "Detroit Lions", stat: "Passing TDs", value: 37 }
    ],
    rushing: [
        { player: "Saquon Barkley", team: "Philadelphia Eagles", stat: "Rushing Yards", value: 2005 },
        { player: "Derrick Henry", team: "Baltimore Ravens", stat: "Rushing Yards", value: 1921 },
        { player: "Jahmyr Gibbs", team: "Detroit Lions", stat: "Rushing TDs", value: 16 },
        { player: "Derrick Henry", team: "Baltimore Ravens", stat: "Rushing TDs", value: 16 }
    ],
    receiving: [
        { player: "Ja'Marr Chase", team: "Cincinnati Bengals", stat: "Receiving Yards", value: 1708 },
        { player: "Justin Jefferson", team: "Minnesota Vikings", stat: "Receiving Yards", value: 1533 },
        { player: "Ja'Marr Chase", team: "Cincinnati Bengals", stat: "Receiving TDs", value: 16 },
        { player: "Terry McLaurin", team: "Washington Commanders", stat: "Receiving TDs", value: 13 }
    ],
    defense: [
        { player: "Myles Garrett", team: "Cleveland Browns", stat: "Sacks", value: 14.0 },
        { player: "T.J. Watt", team: "Pittsburgh Steelers", stat: "Sacks", value: 11.5 },
        { player: "Micah Parsons", team: "Dallas Cowboys", stat: "Sacks", value: 11.0 },
        { player: "Roquan Smith", team: "Baltimore Ravens", stat: "Tackles", value: 110 }
    ]
};

// Playoff Picture 2024
const PLAYOFF_PICTURE_2024 = {
    afc: {
        seeds: [
            { seed: 1, team: "Kansas City Chiefs", record: "15-2", clinched: "AFC West, #1 Seed" },
            { seed: 2, team: "Buffalo Bills", record: "13-4", clinched: "AFC East, #2 Seed" },
            { seed: 3, team: "Baltimore Ravens", record: "12-5", clinched: "AFC North, #3 Seed" },
            { seed: 4, team: "Houston Texans", record: "10-7", clinched: "AFC South, #4 Seed" },
            { seed: 5, team: "Los Angeles Chargers", record: "11-6", clinched: "Wild Card" },
            { seed: 6, team: "Pittsburgh Steelers", record: "10-7", clinched: "Wild Card" },
            { seed: 7, team: "Denver Broncos", record: "10-7", clinched: "Wild Card" }
        ]
    },
    nfc: {
        seeds: [
            { seed: 1, team: "Detroit Lions", record: "15-2", clinched: "NFC North, #1 Seed" },
            { seed: 2, team: "Philadelphia Eagles", record: "14-3", clinched: "NFC East, #2 Seed" },
            { seed: 3, team: "Los Angeles Rams", record: "10-7", clinched: "NFC West, #3 Seed" },
            { seed: 4, team: "Tampa Bay Buccaneers", record: "10-7", clinched: "NFC South, #4 Seed" },
            { seed: 5, team: "Minnesota Vikings", record: "14-3", clinched: "Wild Card" },
            { seed: 6, team: "Washington Commanders", record: "12-5", clinched: "Wild Card" },
            { seed: 7, team: "Green Bay Packers", record: "11-6", clinched: "Wild Card" }
        ]
    }
};

// Export data for use in other files
window.NFL_TEAMS_2024 = NFL_TEAMS_2024;
window.NFL_PLAYERS_2024 = NFL_PLAYERS_2024;
window.PRESEASON_2025_SCHEDULE = PRESEASON_2025_SCHEDULE;
window.SEASON_LEADERS_2024 = SEASON_LEADERS_2024;
window.PLAYOFF_PICTURE_2024 = PLAYOFF_PICTURE_2024;

console.log('✅ NFL 2024/2025 Complete Data Loaded Successfully!');
console.log(`📊 Loaded: ${NFL_TEAMS_2024.length} teams, ${NFL_PLAYERS_2024.length} players, ${PRESEASON_2025_SCHEDULE.length} preseason games`);