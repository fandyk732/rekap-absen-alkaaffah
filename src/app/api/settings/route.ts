import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper agar TypeScript tidak komplain sebelum restart dev server
const db = prisma as any;

// GET: Ambil Setting Sekarang
export async function GET() {
  try {
    let setting = await db.setting.findUnique({ where: { id: 'default' } });
    if (!setting) {
      setting = await db.setting.create({
        data: { id: 'default', workStartTime: '07:15', emailNotif: true },
      });
    }
    return NextResponse.json({ success: true, data: setting });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Simpan Perubahan Setting
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const workStartTime = body.workStartTime || '07:15';
    const emailNotif = Boolean(body.emailNotif);

    const setting = await db.setting.upsert({
      where: { id: 'default' },
      update: {
        workStartTime,
        emailNotif,
      },
      create: {
        id: 'default',
        workStartTime,
        emailNotif,
      },
    });

    return NextResponse.json({ success: true, data: setting });
  } catch (error: any) {
    console.error('Error Save Settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}