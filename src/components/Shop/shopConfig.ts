// =============================================
// SHOP LAYOUT CONFIG — Chỉnh vị trí kệ, lootbox, card tại đây
// =============================================

export const SHOP_LAYOUT = {
  // Vị trí kệ card (% so với màn hình)
  shelf: {
    top: '28%',       // Khoảng cách từ trên xuống
    left: '13%',       // Khoảng cách từ trái
    width: '44%',     // Chiều rộng vùng kệ
    height: '50%',    // Chiều cao vùng kệ
  },

  // Vị trí loot box trên quầy gỗ
  lootBox: {
    bottom: '0%',
    left: '55%',
  },

  // Kích thước card trên kệ (px)
  card: {
    width: 105,       // Chiều rộng 1 card
    height: 178,      // Chiều cao 1 card
    gap: 15,          // Khoảng cách giữa các card
  },

  // Khoảng cách giữa 2 hàng kệ (px)
  rowGap: 12,
};
