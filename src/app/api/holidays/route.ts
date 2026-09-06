import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Ambil daftar libur
export async function GET() {
  try {
    const holidays = await prisma.holiday.findMany({ orderBy: { date: 'asc' } });
    return NextResponse.json({ success: true, data: holidays });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Tambah tanggal libur baru
export async function POST(req: NextRequest) {
  try {
    const { date, description } = await req.json();
    if (!date || !description) {
      return NextResponse.json({ success: false, error: 'Tanggal dan keterangan wajib diisi' }, { status: 400 });
    }

    const newHoliday = await prisma.holiday.create({
      data: { date, description }
    });

    return NextResponse.json({ success: true, data: newHoliday });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Hapus tanggal libur
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });

    await prisma.holiday.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}