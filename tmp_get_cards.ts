import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import fs from 'fs';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const cards = await prisma.card.findMany({
    orderBy: [
      { type: 'asc' },
      { rarity: 'asc' },
      { id: 'asc' }
    ]
  });

  let md = '# Danh Sách Toàn Bộ Thẻ Bài SB-GARAGE\n\n';
  md += 'Đây là danh sách trích xuất trực tiếp từ cơ sở dữ liệu của game, bao gồm 201 thẻ bài (bao gồm cả Crew ẩn).\n\n';
  let currentType = '';

  for (const card of cards) {
    if (card.type !== currentType) {
      currentType = card.type;
      md += `\n## Nhóm: ${currentType}\n\n`;
      md += `| ID | Tên Thẻ | Độ Hiếm | Power | Heat | Stability | Giá | Mô Tả |\n`;
      md += `|---|---|---|---|---|---|---|---|\n`;
    }
    const rarityStars = '★'.repeat(card.rarity);
    md += `| ${card.id} | **${card.name}** | ${rarityStars} | ${card.statPower} | **${card.statHeat}** | ${card.statStability} | ${card.cost}g | ${card.description} |\n`;
  }

  // Update both the inner artifact and the workspace copy
  fs.writeFileSync('C:/Users/Admin/.gemini/antigravity/brain/ddf62539-63b6-41e4-96ca-1df3062ff891/card_list.md', md);
  fs.writeFileSync('c:/Users/Admin/OneDrive/ドキュメント/SBgara/sb-garage/card_list.md', md);
  console.log('Done generating cards list!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
