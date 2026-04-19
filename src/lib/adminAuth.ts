// Admin Authentication Middleware
// Verifies JWT + checks role === 'ADMIN' in database
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, JwtPayload } from '@/lib/auth';
import prisma from '@/lib/prisma';

export interface AdminPayload extends JwtPayload {
  role: string;
}

/**
 * Authenticate an admin request.
 * Returns the admin user payload or null if not authorized.
 */
export async function authenticateAdmin(request: NextRequest): Promise<AdminPayload | null> {
  const userPayload = authenticateRequest(request);
  if (!userPayload) return null;

  // Check role in database (not just JWT, to prevent stale tokens)
  const user = await prisma.user.findUnique({
    where: { id: userPayload.userId },
    select: { id: true, username: true, role: true },
  });

  if (!user || user.role !== 'ADMIN') return null;

  return {
    ...userPayload,
    role: user.role,
  };
}

/**
 * Helper: Return 401/403 response for unauthorized admin requests
 */
export function unauthorizedResponse(message = 'Unauthorized: Admin access required') {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Helper: Convert BigInt fields to Number for JSON serialization
 */
export function serializeUser(user: any) {
  return {
    ...user,
    gold: Number(user.gold),
    exp: Number(user.exp),
    techPoints: Number(user.techPoints),
    totalShopSpent: Number(user.totalShopSpent),
  };
}
