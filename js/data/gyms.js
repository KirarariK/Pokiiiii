/** Arènes / Champions — Kanto → Paldea (45 défis : 4 arènes + 1 champion × 9) */

export const REGION_ORDER = [
  'kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea',
];

export const REGION_LABELS = {
  kanto: 'Kanto', johto: 'Johto', hoenn: 'Hoenn', sinnoh: 'Sinnoh',
  unova: 'Unys', kalos: 'Kalos', alola: 'Alola', galar: 'Galar', paldea: 'Paldea',
};

export const GYMS = [
  { id:'kanto-pierre', region:'kanto', gen:1, name:'Arène d’Argenta', type:'rock', leaderName:'Pierre', minTeamLevel:10, rewardMoney:1200, badgeId:'boulder', order:1, pokemon:[{speciesId:74,level:11},{speciesId:138,level:13}] },
  { id:'kanto-ondine', region:'kanto', gen:1, name:'Arène d’Azuria', type:'water', leaderName:'Ondine', minTeamLevel:16, rewardMoney:2200, badgeId:'cascade', order:2, pokemon:[{speciesId:120,level:18},{speciesId:121,level:21}] },
  { id:'kanto-bob', region:'kanto', gen:1, name:'Arène de Carmin', type:'electric', leaderName:'Major Bob', minTeamLevel:22, rewardMoney:3500, badgeId:'thunder', order:3, pokemon:[{speciesId:100,level:21},{speciesId:25,level:24},{speciesId:26,level:26}] },
  { id:'kanto-erika', region:'kanto', gen:1, name:'Arène de Céladopole', type:'grass', leaderName:'Erika', minTeamLevel:28, rewardMoney:4800, badgeId:'rainbow', order:4, pokemon:[{speciesId:44,level:29},{speciesId:114,level:31},{speciesId:45,level:33}] },
  { id:'kanto-champion', region:'kanto', gen:1, name:'Ligue — Champion Blue', type:'dragon', leaderName:'Blue', minTeamLevel:40, rewardMoney:12000, badgeId:'kanto-champ', order:5, champion:true, pokemon:[{speciesId:18,level:47},{speciesId:65,level:47},{speciesId:112,level:49},{speciesId:130,level:51},{speciesId:59,level:53}] },

  { id:'johto-albert', region:'johto', gen:2, name:'Arène d’Écorcia', type:'flying', leaderName:'Albert', minTeamLevel:14, rewardMoney:1600, badgeId:'zephyr', order:1, pokemon:[{speciesId:16,level:9},{speciesId:17,level:13}] },
  { id:'johto-blanche', region:'johto', gen:2, name:'Arène d’Azalea', type:'bug', leaderName:'Blanche', minTeamLevel:18, rewardMoney:2400, badgeId:'hive', order:2, pokemon:[{speciesId:11,level:15},{speciesId:14,level:15},{speciesId:123,level:17}] },
  { id:'johto-morty', region:'johto', gen:2, name:'Arène de Rosalia', type:'ghost', leaderName:'Mortimer', minTeamLevel:24, rewardMoney:3800, badgeId:'fog', order:3, pokemon:[{speciesId:92,level:21},{speciesId:93,level:23},{speciesId:94,level:25}] },
  { id:'johto-jasmine', region:'johto', gen:2, name:'Arène d’Oliville', type:'steel', leaderName:'Jasmine', minTeamLevel:32, rewardMoney:5200, badgeId:'mineral', order:4, pokemon:[{speciesId:81,level:30},{speciesId:82,level:32},{speciesId:208,level:35}] },
  { id:'johto-champion', region:'johto', gen:2, name:'Ligue — Champion Peter', type:'dragon', leaderName:'Peter', minTeamLevel:45, rewardMoney:14000, badgeId:'johto-champ', order:5, champion:true, pokemon:[{speciesId:130,level:44},{speciesId:142,level:46},{speciesId:230,level:48},{speciesId:149,level:50},{speciesId:248,level:52}] },

  { id:'hoenn-roxanne', region:'hoenn', gen:3, name:'Arène de Rosyères', type:'rock', leaderName:'Roxanne', minTeamLevel:14, rewardMoney:1800, badgeId:'stone', order:1, pokemon:[{speciesId:299,level:14},{speciesId:76,level:15}] },
  { id:'hoenn-brawly', region:'hoenn', gen:3, name:'Arène de Myokara', type:'fighting', leaderName:'Bastien', minTeamLevel:18, rewardMoney:2600, badgeId:'knuckle', order:2, pokemon:[{speciesId:66,level:16},{speciesId:296,level:19}] },
  { id:'hoenn-wattson', region:'hoenn', gen:3, name:'Arène de Lavandia', type:'electric', leaderName:'Voltère', minTeamLevel:24, rewardMoney:4000, badgeId:'dynamo', order:3, pokemon:[{speciesId:100,level:22},{speciesId:309,level:24},{speciesId:310,level:26}] },
  { id:'hoenn-flannery', region:'hoenn', gen:3, name:'Arène de Vermilava', type:'fire', leaderName:'Adriane', minTeamLevel:30, rewardMoney:5500, badgeId:'heat', order:4, pokemon:[{speciesId:322,level:28},{speciesId:218,level:30},{speciesId:324,level:33}] },
  { id:'hoenn-champion', region:'hoenn', gen:3, name:'Ligue — Champion Steven', type:'steel', leaderName:'Pierre Rocha', minTeamLevel:48, rewardMoney:16000, badgeId:'hoenn-champ', order:5, champion:true, pokemon:[{speciesId:227,level:50},{speciesId:344,level:52},{speciesId:346,level:52},{speciesId:348,level:54},{speciesId:376,level:57}] },

  { id:'sinnoh-roark', region:'sinnoh', gen:4, name:'Arène de Charbourg', type:'rock', leaderName:'Pierrick', minTeamLevel:14, rewardMoney:2000, badgeId:'coal', order:1, pokemon:[{speciesId:74,level:12},{speciesId:95,level:14},{speciesId:408,level:16}] },
  { id:'sinnoh-gardenia', region:'sinnoh', gen:4, name:'Arène de Floraville', type:'grass', leaderName:'Flo', minTeamLevel:20, rewardMoney:3000, badgeId:'forest', order:2, pokemon:[{speciesId:315,level:20},{speciesId:407,level:22},{speciesId:420,level:24}] },
  { id:'sinnoh-fantina', region:'sinnoh', gen:4, name:'Arène de Voilallery', type:'ghost', leaderName:'Kiméra', minTeamLevel:28, rewardMoney:4800, badgeId:'relic', order:3, pokemon:[{speciesId:425,level:26},{speciesId:93,level:28},{speciesId:429,level:30}] },
  { id:'sinnoh-wake', region:'sinnoh', gen:4, name:'Arène de Rivamar', type:'water', leaderName:'Lovis', minTeamLevel:34, rewardMoney:6200, badgeId:'fen', order:4, pokemon:[{speciesId:419,level:33},{speciesId:130,level:34},{speciesId:340,level:37}] },
  { id:'sinnoh-champion', region:'sinnoh', gen:4, name:'Ligue — Champion Cynthia', type:'dragon', leaderName:'Cynthia', minTeamLevel:52, rewardMoney:18000, badgeId:'sinnoh-champ', order:5, champion:true, pokemon:[{speciesId:442,level:54},{speciesId:448,level:56},{speciesId:407,level:56},{speciesId:468,level:58},{speciesId:445,level:62}] },

  { id:'unova-chili', region:'unova', gen:5, name:'Arène d’Ondes-sur-Mer', type:'fire', leaderName:'Carmin', minTeamLevel:14, rewardMoney:2200, badgeId:'trio', order:1, pokemon:[{speciesId:554,level:14},{speciesId:555,level:16}] },
  { id:'unova-lenora', region:'unova', gen:5, name:'Arène de Maillard', type:'normal', leaderName:'Aloe', minTeamLevel:20, rewardMoney:3200, badgeId:'basic', order:2, pokemon:[{speciesId:504,level:18},{speciesId:505,level:20},{speciesId:507,level:22}] },
  { id:'unova-burgh', region:'unova', gen:5, name:'Arène d’Entrelas', type:'bug', leaderName:'Artie', minTeamLevel:26, rewardMoney:4500, badgeId:'insect', order:3, pokemon:[{speciesId:541,level:24},{speciesId:543,level:26},{speciesId:545,level:28}] },
  { id:'unova-elesa', region:'unova', gen:5, name:'Arène de Flocombe', type:'electric', leaderName:'Inezia', minTeamLevel:34, rewardMoney:6500, badgeId:'bolt', order:4, pokemon:[{speciesId:522,level:32},{speciesId:523,level:34},{speciesId:587,level:36}] },
  { id:'unova-champion', region:'unova', gen:5, name:'Ligue — Champion Iris', type:'dragon', leaderName:'Iris', minTeamLevel:55, rewardMoney:20000, badgeId:'unova-champ', order:5, champion:true, pokemon:[{speciesId:612,level:55},{speciesId:635,level:57},{speciesId:621,level:57},{speciesId:230,level:59},{speciesId:149,level:61}] },

  { id:'kalos-viola', region:'kalos', gen:6, name:'Arène de Relifacarn', type:'bug', leaderName:'Verna', minTeamLevel:14, rewardMoney:2400, badgeId:'bug', order:1, pokemon:[{speciesId:664,level:12},{speciesId:666,level:14}] },
  { id:'kalos-grant', region:'kalos', gen:6, name:'Arène d’Otoyama', type:'rock', leaderName:'Lino', minTeamLevel:22, rewardMoney:3600, badgeId:'cliff', order:2, pokemon:[{speciesId:696,level:25},{speciesId:698,level:25}] },
  { id:'kalos-korrina', region:'kalos', gen:6, name:'Arène de Neuville', type:'fighting', leaderName:'Cornélia', minTeamLevel:30, rewardMoney:5200, badgeId:'rumble', order:3, pokemon:[{speciesId:66,level:29},{speciesId:67,level:31},{speciesId:701,level:33}] },
  { id:'kalos-ramos', region:'kalos', gen:6, name:'Arène de Fort-Vanitas', type:'grass', leaderName:'Amaro', minTeamLevel:36, rewardMoney:7000, badgeId:'plant', order:4, pokemon:[{speciesId:455,level:34},{speciesId:70,level:36},{speciesId:71,level:38}] },
  { id:'kalos-champion', region:'kalos', gen:6, name:'Ligue — Champion Diantha', type:'fairy', leaderName:'Dianthéa', minTeamLevel:58, rewardMoney:22000, badgeId:'kalos-champ', order:5, champion:true, pokemon:[{speciesId:701,level:58},{speciesId:448,level:58},{speciesId:706,level:60},{speciesId:681,level:60},{speciesId:282,level:64}] },

  { id:'alola-ilima', region:'alola', gen:7, name:'Épreuve d’Ilima', type:'normal', leaderName:'Ilima', minTeamLevel:14, rewardMoney:2600, badgeId:'normalium', order:1, pokemon:[{speciesId:734,level:12},{speciesId:19,level:14}] },
  { id:'alola-lana', region:'alola', gen:7, name:'Épreuve de Lana', type:'water', leaderName:'Néphie', minTeamLevel:20, rewardMoney:3800, badgeId:'waterium', order:2, pokemon:[{speciesId:751,level:18},{speciesId:752,level:21}] },
  { id:'alola-kiawe', region:'alola', gen:7, name:'Épreuve de Kiawe', type:'fire', leaderName:'Kiawe', minTeamLevel:28, rewardMoney:5400, badgeId:'firium', order:3, pokemon:[{speciesId:105,level:26},{speciesId:58,level:28},{speciesId:59,level:30}] },
  { id:'alola-sophocles', region:'alola', gen:7, name:'Épreuve de Sophocles', type:'electric', leaderName:'Sophocles', minTeamLevel:36, rewardMoney:7200, badgeId:'electrium', order:4, pokemon:[{speciesId:777,level:34},{speciesId:737,level:36},{speciesId:738,level:38}] },
  { id:'alola-champion', region:'alola', gen:7, name:'Ligue — Champion Kukui', type:'fighting', leaderName:'Prof. Kukui', minTeamLevel:58, rewardMoney:24000, badgeId:'alola-champ', order:5, champion:true, pokemon:[{speciesId:745,level:56},{speciesId:448,level:58},{speciesId:130,level:58},{speciesId:727,level:60},{speciesId:784,level:62}] },

  { id:'galar-milo', region:'galar', gen:8, name:'Stade de Turffield', type:'grass', leaderName:'Percy', minTeamLevel:16, rewardMoney:2800, badgeId:'grass', order:1, pokemon:[{speciesId:829,level:16},{speciesId:830,level:20}] },
  { id:'galar-nessa', region:'galar', gen:8, name:'Stade de Hulbury', type:'water', leaderName:'Donna', minTeamLevel:22, rewardMoney:4000, badgeId:'water', order:2, pokemon:[{speciesId:846,level:22},{speciesId:847,level:24},{speciesId:834,level:26}] },
  { id:'galar-kabu', region:'galar', gen:8, name:'Stade de Motostoke', type:'fire', leaderName:'Kabu', minTeamLevel:30, rewardMoney:5800, badgeId:'fire', order:3, pokemon:[{speciesId:850,level:28},{speciesId:38,level:30},{speciesId:851,level:33}] },
  { id:'galar-bea', region:'galar', gen:8, name:'Stade de Stow-on-Side', type:'fighting', leaderName:'Faïza', minTeamLevel:38, rewardMoney:7800, badgeId:'fighting', order:4, pokemon:[{speciesId:852,level:36},{speciesId:853,level:38},{speciesId:870,level:40}] },
  { id:'galar-champion', region:'galar', gen:8, name:'Ligue — Champion Leon', type:'dragon', leaderName:'Tarak', minTeamLevel:60, rewardMoney:26000, badgeId:'galar-champ', order:5, champion:true, pokemon:[{speciesId:823,level:58},{speciesId:861,level:60},{speciesId:887,level:60},{speciesId:130,level:62},{speciesId:6,level:65}] },

  { id:'paldea-katy', region:'paldea', gen:9, name:'Arène de Capharnaüm', type:'bug', leaderName:'Okuba', minTeamLevel:16, rewardMoney:3000, badgeId:'bug-p', order:1, pokemon:[{speciesId:917,level:14},{speciesId:918,level:16},{speciesId:48,level:18}] },
  { id:'paldea-brassius', region:'paldea', gen:9, name:'Arène d’Artazon', type:'grass', leaderName:'Colza', minTeamLevel:22, rewardMoney:4200, badgeId:'grass-p', order:2, pokemon:[{speciesId:928,level:20},{speciesId:929,level:22},{speciesId:185,level:24}] },
  { id:'paldea-iono', region:'paldea', gen:9, name:'Arène de Levincia', type:'electric', leaderName:'Mashynn', minTeamLevel:30, rewardMoney:6000, badgeId:'electric-p', order:3, pokemon:[{speciesId:921,level:28},{speciesId:922,level:30},{speciesId:923,level:32}] },
  { id:'paldea-larry', region:'paldea', gen:9, name:'Arène de Medali', type:'normal', leaderName:'Okapi', minTeamLevel:38, rewardMoney:8200, badgeId:'normal-p', order:4, pokemon:[{speciesId:962,level:36},{speciesId:982,level:38},{speciesId:925,level:40}] },
  { id:'paldea-champion', region:'paldea', gen:9, name:'Ligue — Champion Geeta', type:'dragon', leaderName:'Alisma', minTeamLevel:62, rewardMoney:30000, badgeId:'paldea-champ', order:5, champion:true, pokemon:[{speciesId:908,level:60},{speciesId:911,level:60},{speciesId:914,level:62},{speciesId:967,level:62},{speciesId:1000,level:65}] },
];

export function getGym(id) {
  return GYMS.find((g) => g.id === id) || null;
}

export function gymsByRegion(region) {
  return GYMS.filter((g) => g.region === region).sort((a, b) => a.order - b.order);
}

export function previousGym(gym) {
  if (!gym || gym.order <= 1) return null;
  return GYMS.find((g) => g.region === gym.region && g.order === gym.order - 1) || null;
}

export function badgeCount() {
  return GYMS.length;
}
