const fs = require('fs');
const path = 'prisma/seed.ts';
let data = fs.readFileSync(path, 'utf8');

// Thay đổi .jpeg thành .jpg
data = data.replace(/imageUrl:\s*'(.+?)\.jpeg'/g, "imageUrl: '$1.jpg'");

fs.writeFileSync(path, data, 'utf8');
console.log('Successfully replaced .jpeg with .jpg in seed.ts');
