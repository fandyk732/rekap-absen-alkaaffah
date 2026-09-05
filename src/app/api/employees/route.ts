import { NextRequest, NextResponse } from 'next/server';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from '@/lib/employeeStore';

export async function GET() {
  return NextResponse.json({ success: true, data: getEmployees() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin, name, role, gender, status, nip, phone } = body;

    if (!pin || !name) {
      return NextResponse.json({ success: false, error: 'PIN dan Nama wajib diisi.' }, { status: 400 });
    }

    const newEmp = addEmployee({
      pin,
      name,
      role: role || 'Pegawai',
      gender: gender || 'L',
      status: status || 'Aktif',
      nip: nip || '-',
      phone: phone || '-',
    });

    return NextResponse.json({ success: true, data: newEmp });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID pegawai tidak ditemukan.' }, { status: 400 });
    }

    const updated = updateEmployee(id, data);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID pegawai diperlukan.' }, { status: 400 });
    }

    deleteEmployee(id);
    return NextResponse.json({ success: true, message: 'Pegawai berhasil dihapus.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}