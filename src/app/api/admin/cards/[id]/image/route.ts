// POST /api/admin/cards/[id]/image — Upload card image
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import { writeFile } from 'fs/promises';
import path from 'path';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { id } = await params;

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: jpg, png, webp' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 2MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg';
    const fileName = `${id}${ext}`;
    const filePath = path.join(process.cwd(), 'public', 'componentcardimg', fileName);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      message: 'Upload ảnh thành công',
      imageUrl: `/componentcardimg/${fileName}`,
    });
  } catch (error) {
    console.error('Admin upload image error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
