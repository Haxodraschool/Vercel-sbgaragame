const fs = require('fs');

const mdPath = 'card_list.md';
const seedPath = 'prisma/seed.ts';

const mdContent = fs.readFileSync(mdPath, 'utf8');
let seedContent = fs.readFileSync(seedPath, 'utf8');

const cards = [];

const lines = mdContent.split('\n');
for (const line of lines) {
  const match = line.match(/^\|\s*(\d+)\s*\|\s*\*\*(.+?)\*\*\s*\|\s*(★+)\s*\|\s*(-?\d+)\s*\|\s*\*\*(-?\d+)\*\*\s*\|\s*(-?\d+)\s*\|\s*(\d+)g\s*\|\s*(.*?)\s*\|$/);
  if (match) {
    const id = parseInt(match[1]);
    if (id >= 160) {
      const name = match[2].trim();
      const rarity = match[3].length;
      const statPower = parseInt(match[4]);
      const statHeat = parseInt(match[5]);
      const statStability = parseInt(match[6]);
      const cost = parseInt(match[7]);
      let description = match[8].trim();

      let type = 'UNKNOWN';
      if (id >= 160 && id <= 168) type = 'NITROUS';
      else if (id >= 169 && id <= 185) type = 'TOOL';
      else if (id >= 186 && id <= 201) type = 'CREW';

      let unlockTypeStr = '';
      if (type === 'CREW') {
        if (description.includes('(Achievement)')) {
          unlockTypeStr = `, unlockType: 'ACHIEVEMENT'`;
        } else {
          unlockTypeStr = `, unlockType: 'PURCHASE'`;
        }
      }

      description = description.replace(/'/g, "\\'");

      cards.push(`  { id: ${id}, name: '${name}', type: '${type}', rarity: ${rarity}, statPower: ${statPower}, statHeat: ${statHeat}, statStability: ${statStability}, cost: ${cost}${unlockTypeStr}, description: '${description}' },`);
    }
  }
}

const newCardsStr = cards.join('\n');

const startIndex = seedContent.indexOf('  { id: 160,');
const endIndex = seedContent.indexOf('];;', startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find replacement bounds in seed.ts");
  process.exit(1);
}

seedContent = seedContent.substring(0, startIndex) + newCardsStr + '\n' + seedContent.substring(endIndex);

fs.writeFileSync(seedPath, seedContent, 'utf8');
console.log('Successfully synced seed.ts with card_list.md');
