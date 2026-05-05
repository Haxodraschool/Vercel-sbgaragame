// GET /api/events/random - Roll sự kiện ngẫu nhiên
// POST /api/events/random - Chấp nhận/Từ chối sự kiện
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Get all possible events
    const events = await prisma.gameEvent.findMany();

    const nkEventNames = ['Camera Ngoại Bang', 'Kiểm Tra Ảnh Cán Bộ', 'Sát Thủ Gọi Mời', 'Cảnh Sát Triều Tiên'];
    let triggeredEvents = [];

    // North Korea Storyline Event Distribution
    if (user.isInNorthKorea) {
       if (user.northKoreaDayCount === 10) {
          // Ngày 10: 100% ra sát thủ
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          triggeredEvents = events.filter((e: any) => e.name === 'Sát Thủ Gọi Mời');
       } else {
          // Camera 40%, Kiểm tra ảnh 50%
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          triggeredEvents = events.filter((e: any) => {
             if (e.name === 'Camera Ngoại Bang') return Math.random() < 0.4;
             if (e.name === 'Kiểm Tra Ảnh Cán Bộ') return Math.random() < 0.5;
             return false;
          });
       }
    } else {
       // Normal events
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       triggeredEvents = events.filter((e: any) => {
          if (e.name === 'Băng Đảng Xăng Dầu') return true;
          return false;
       });
    }

    if (triggeredEvents.length === 0) {
      return NextResponse.json({
        message: 'Hôm nay không có sự kiện đặc biệt',
        event: null,
      });
    }

    // Pick one random event from triggered ones
    const event = triggeredEvents[Math.floor(Math.random() * triggeredEvents.length)];

    return NextResponse.json({
      message: `⚡ Sự kiện: ${event.name}!`,
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        type: event.type,
        targetAttribute: event.targetAttribute,
        effectValue: event.effectValue,
        requiresChoice: event.type === 'CHOICE',
      },
    });

  } catch (error) {
    console.error('Random event error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { eventId, accepted } = await request.json();

    const event = await prisma.gameEvent.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: 'Sự kiện không tồn tại' }, { status: 404 });
    }

    if (event.type === 'CHOICE' && accepted === undefined) {
      return NextResponse.json(
        { error: 'Sự kiện CHOICE cần chấp nhận hoặc từ chối' },
        { status: 400 }
      );
    }

    // Create active event record
    const activeEvent = await prisma.userActiveEvent.create({
      data: {
        userId: auth.userId,
        eventId: event.id,
        isAccepted: accepted ?? true,
        remainingTurns: 3, // Event kéo dài 3 ngày
      },
    });

    // Apply immediate effects if accepted or PASSIVE
    if (accepted || event.type === 'PASSIVE') {
      const user = await prisma.user.findUnique({ where: { id: auth.userId } });
      if (user) {
        const updates: Record<string, unknown> = {};
        let finalMessage = accepted
          ? `Đã chấp nhận sự kiện: ${event.name}`
          : `Đã từ chối sự kiện: ${event.name}`;

        // ============================================
        // SPECIFIC EVENT LOGIC (New Creative Events)
        // ============================================
        let canAccept = true;

        if (event.name === 'Tay Buôn Lậu Gõ Cửa' && accepted) {
          updates.smugglerPenalty = 0.15;
          const newHealth = Math.min(100, Math.max(0, user.garageHealth - 10));
          updates.garageHealth = newHealth;
        }
        else if (event.name === 'Ánh Trăng Racing' && accepted) {
          if (user.garageHealth <= 15) {
            canAccept = false;
            finalMessage = 'Không đủ Uy tín để tham gia đua ngầm (>15)!';
          } else {
            // Sau ngày 25, thưởng x2 gold
            const goldReward = user.currentDay >= 25 ? 1600 : 800;
            updates.gold = { increment: goldReward };
            updates.garageHealth = user.garageHealth - 15;
            finalMessage = `Tham gia đua ngầm thành công! Nhận ${goldReward} Gold nhưng mất 15 Uy tín.`;
          }
        }
        else if (event.name === 'Băng Đảng Xăng Dầu') {
          // Trừ 10% tổng Gold đang có
          const loss = Math.floor(Number(user.gold) * 0.10);
          updates.gold = { decrement: loss };
          finalMessage = `Bị thu phí bảo kê mất 10% tài sản (-${loss} Gold)!`;
        }
        else if (event.name === 'Độ Channel Bốc Phốt') {
          updates.garageHealth = Math.min(100, user.garageHealth + 40);
          updates.gold = { decrement: 200 }; // Có thể âm hoặc về 0, Prisma update decrement handles it
          finalMessage = 'Được lên sóng! Uy tín tăng vọt (+40) nhưng tốn 200 Gold chi phí PR.';
        }
        else if (event.name === 'Đấu Giá Kho Xưởng' && accepted) {
          if (Number(user.gold) < 700) {
            canAccept = false;
            finalMessage = 'Không đủ 700 Gold để cược mua kho!';
          } else {
            updates.gold = { decrement: 700 };
            updates.techPoints = { increment: 400 };
            finalMessage = 'Đã mua mù thành công! Mất 700 Gold, thử vận may nhận 400 EXP.';
          }
        }
        else if (event.name === 'Kẻ Chế Tạo Cuồng Tín' && accepted) {
          updates.techPoints = { increment: 400 };
          updates.garageHealth = Math.max(0, user.garageHealth - 20);
          finalMessage = 'Học bí kíp cấm! Nhận 400 EXP nhưng gara bị đánh giá nguy hiểm (-20 Uy Tín).';
        }
        else if (event.name === 'Cảnh Sát Đột Kích') {
          updates.garageHealth = Math.max(0, user.garageHealth - 10);
          updates.gold = { decrement: 150 };
          finalMessage = 'Bị cơ động kiểm tra ngang! Phạt 150 Gold và mất 10 Uy Tín.';
        }
        // ============================================
        // NORTH KOREA EVENTS
        // ============================================
        else if (event.name === 'Camera Ngoại Bang') {
          if (accepted) {
             updates.gold = { increment: 1000 };
             finalMessage = 'Bạn đã lập công lớn! Tố cáo thành công, Chủ Tịch thưởng nóng 1000 Gold!';
          }
        }
        else if (event.name === 'Kiểm Tra Ảnh Cán Bộ') { // PASSIVE
           let passChance = 0.65;
           if (user.garageHealth >= 90) passChance = 1.0;
           
           if (Math.random() <= passChance) {
              finalMessage = 'Đoàn kiểm tra gật gù hài lòng với bức ảnh Chủ Tịch Kim treo ở Gara. Bạn an toàn!';
           } else {
              // Fail = Bad Ending. Handled via special route or returned here directly.
              // For a passive event that kills, we can just return a game over response.
              return NextResponse.json({
                message: 'Phát hiện quán không treo ảnh Chủ Tịch! Bạn bị khép vào tội phản quốc!',
                gameOver: true,
                ending: 'Bị Tiêu Diệt Bởi Chủ Tịch'
              });
           }
        }
        else if (event.name === 'Sát Thủ Gọi Mời') {
           if (!accepted) {
              return NextResponse.json({
                message: 'Từ chối ám sát Chủ Tịch? Tổ chức ngầm không để kẻ biết chuyện sống sót...',
                gameOver: true,
                ending: 'Bị Sát Thủ Tiêu Diệt'
              });
           } else {
              // Roll success chance (lower health = higher chance)
              // Ví dụ: health 100 -> chance 20%; health 10 -> chance 80%?
              // Base chance = 100 - health (max 90, min 10)
              const chance = Math.max(0.1, Math.min(0.9, (100 - user.garageHealth) / 100));
              if (Math.random() <= chance) {
                 updates.isInNorthKorea = false;
                 updates.hasKimBuff = false;
                 updates.hasUnderworldBuff = true;
                 updates.isKimAssassinated = true; // Mark Kim as dead
                 finalMessage = 'Ám sát thành công! Bạn được đưa về nước an toàn và gia nhập Thế Giới Ngầm (+50% lợi nhuận, giảm giá tay buôn lậu)!';
              } else {
                 return NextResponse.json({
                   message: 'Ám sát thất bại! Bạn bị bắt giữ và xử bắn công khai.',
                   gameOver: true,
                   ending: 'Bị Tiêu Diệt Bởi Chủ Tịch' // Or 'Bị Sát Thủ Tiêu Diệt'
                 });
              }
           }
        }
        else if (event.name === 'Cảnh Sát Triều Tiên') { // PASSIVE meaning police visits you
           // Kiểm tra xem hôm qua có mua hàng từ buôn lậu không
           if (user.lastSmugglerBuyDay === user.currentDay - 1) {
              updates.garageHealth = Math.max(0, user.garageHealth - 80);
              finalMessage = 'Cảnh sát phát hiện bạn giao dịch phi pháp hôm qua! Bị phạt nặng và điêu đứng mất 80 Uy Tín!';
           } else {
              finalMessage = 'Cảnh sát ghé thăm kiểm tra... Mọi thứ hợp pháp! Chúc một ngày tốt lành!';
           }
        }
        // Fallback for any other events (if any)
        else {
          if (event.targetAttribute === 'GOLD') {
            updates.gold = { increment: Math.floor(event.effectValue) };
          } else if (event.targetAttribute === 'GARAGE_HEALTH') {
            const newHealth = Math.min(100, Math.max(0, user.garageHealth + Math.floor(event.effectValue)));
            updates.garageHealth = newHealth;
          } else if (event.targetAttribute === 'TECH_POINTS') {
            updates.techPoints = { increment: Math.floor(event.effectValue) };
          }
        }

        // Apply if action is valid
        if (canAccept && Object.keys(updates).length > 0) {
          // If gold decrement goes below 0, clamp it using a separate read or set
          // Since we can't reliably clamp with { decrement: X } if X > current gold,
          // let's adjust decrement to not exceed current gold for PASSIVE events.
          if ((updates.gold as Record<string, number>)?.decrement !== undefined) {
             const decValue = (updates.gold as Record<string, number>).decrement;
             if (Number(user.gold) < decValue) {
               updates.gold = 0; // Set direct to 0 if not enough gold
             }
          }

          await prisma.user.update({
            where: { id: auth.userId },
            data: updates,
          });
        } else if (!canAccept) {
          // If couldn't accept due to requirements, fail early
          return NextResponse.json({ error: finalMessage }, { status: 400 });
        }

        // Check if this is the smuggler event
        const isSmuggler = event.name === 'Tay Buôn Lậu Gõ Cửa';

        return NextResponse.json({
          message: finalMessage,
          activeEvent: {
            id: activeEvent.id,
            eventName: event.name,
            isAccepted: activeEvent.isAccepted,
            remainingTurns: activeEvent.remainingTurns,
          },
          smugglerActive: isSmuggler && accepted ? true : false,
        });
      }
    }

    // Check if this is the smuggler event
    const isSmuggler = event.name === 'Tay Buôn Lậu Gõ Cửa';

    return NextResponse.json({
      message: accepted
        ? `Đã chấp nhận sự kiện: ${event.name}`
        : `Đã từ chối sự kiện: ${event.name}`,
      activeEvent: {
        id: activeEvent.id,
        eventName: event.name,
        isAccepted: activeEvent.isAccepted,
        remainingTurns: activeEvent.remainingTurns,
      },
      smugglerActive: isSmuggler && accepted ? true : false,
    });


  } catch (error) {
    console.error('Event respond error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
