const fs = require('fs');

const file = 'prisma/seed.ts';
let content = fs.readFileSync(file, 'utf8');

// Scale statHeat
content = content.replace(/statHeat:\s*(-?\d+)/g, (match, p1) => {
    let heat = parseInt(p1, 10);
    if (heat > 0) {
        // Increase heat generation by 15%
        heat = Math.round(heat * 1.15);
    } else if (heat < 0) {
        // Decrease cooling efficiency by 15% (making it 15% closer to 0)
        heat = Math.round(heat * 0.85);
    }
    return `statHeat: ${heat}`;
});

fs.writeFileSync(file, content);
console.log("Successfully updated statHeat in prisma/seed.ts");
