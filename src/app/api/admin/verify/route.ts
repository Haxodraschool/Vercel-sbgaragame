// GET /api/admin/verify — Simple admin role verification
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  return NextResponse.json({
    ok: true,
    userId: admin.userId,
    username: admin.username,
    role: admin.role,
  });
}
