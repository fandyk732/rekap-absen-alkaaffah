import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionValue } from '@/lib/session';

// GET dipanggil dari 2 tempat:
// 1. Halaman publik /pengajuan-izin (tanpa login) — cuma butuh pin/name/role buat dropdown & submit izin.
// 2. Halaman admin /data-pegawai (butuh login) — butuh semua kolom buat tabel & form edit.
// Daripada pecah jadi 2 endpoint, kita bedain response-nya berdasarkan ada/nggaknya session valid,
// biar data sensitif (phone, nip, gender, status) nggak ikut kekirim ke pengunjung anonim.
export async function GET(req: NextRequest) {
  try {
    const session = await verifySessionValue(req.cookies.get('user_session')?.value);

    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' },
      select: session
        ? {
            id: true,
            pin: true,
            name: true,
            nip: true,
            role: true,
            gender: true,
            phone: true,
            status: true,
          }
        : {
            id: true,
            pin: true,
            name: true,
            role: true,
          },
    });

    return NextResponse.json({ success: true, data: employees });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, name, role, gender, status, nip, phone } = body;

    if (!pin || !name) {
      return NextResponse.json({ success: false, error: 'PIN dan Nama wajib diisi.' }, { status: 400 });
    }

    const newEmp = await prisma.employee.create({
      data: {
        pin: String(pin).trim(),
        name,
        role: role || 'Pegawai',
        gender: gender || 'L',
        status: status || 'Aktif',
        nip: nip || '-',
        phone: phone || '-',
      },
    });

    return NextResponse.json({ success: true, data: newEmp });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'PIN sudah terdaftar untuk pegawai lain.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, role, gender, status, nip, phone } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID pegawai tidak ditemukan.' }, { status: 400 });
    }

    // "pin" SENGAJA nggak boleh diubah lewat sini: pin itu foreign key yang dipakai
    // AttendanceLog & Permission buat nyambung ke pegawai ini. Kalau pin diubah,
    // semua riwayat absensi & izin lama jadi "nyasar" (nggak ke-link lagi ke pegawai ini).
    // Kalau memang PIN fingerprint-nya ganti, mending nonaktifkan pegawai lama (status
    // Non-Aktif) dan buat entri baru dengan PIN yang baru.
    const updated = await prisma.employee.update({
      where: { id },
      data: { name, role, gender, status, nip, phone },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Pegawai tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const hard = searchParams.get('hard') === 'true';

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID pegawai diperlukan.' }, { status: 400 });
    }

    // Employee.pin adalah relation key buat AttendanceLog & Permission dengan onDelete: Cascade
    // di schema.prisma. Artinya hard-delete di sini otomatis IKUT MENGHAPUS seluruh riwayat
    // absensi & pengajuan izin pegawai tsb secara permanen.
    // Defaultnya sekarang SOFT DELETE (status -> Non-Aktif) supaya riwayat kehadiran tetap
    // ada buat rekap/laporan lama. Kalau memang mau hapus permanen (mis. salah input pegawai),
    // panggil DELETE /api/employees?id=...&hard=true.
    if (hard) {
      await prisma.employee.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: 'Pegawai & seluruh riwayat absensi/izinnya dihapus permanen.',
      });
    }

    await prisma.employee.update({ where: { id }, data: { status: 'Non-Aktif' } });
    return NextResponse.json({
      success: true,
      message: 'Pegawai dinonaktifkan (riwayat absensi & izin tetap tersimpan).',
    });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Pegawai tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
