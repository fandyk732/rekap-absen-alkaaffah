import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding data...');

  // Data disesuaikan persis dengan kolom skema Prisma
  const employees = [
    { name: 'Ahmad Dahlan, S.Pd.', pin: '1001', role: 'Guru' },
    { name: 'Siti Nurhaliza, M.Pd.', pin: '1002', role: 'Guru' },
    { name: 'Budi Santoso', pin: '1003', role: 'Staff TU' },
    { name: 'Dewi Lestari, S.Si.', pin: '1004', role: 'Guru' },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { pin: emp.pin },
      update: {},
      create: emp,
    });
  }

  console.log('✅ Seeding berhasil! Data pegawai awal telah ditambahkan.');
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });