import { PrismaClient } from '@prisma/client';
import { RSA, RSAUtils } from '../src/lib/cryptography/RSA';
import { SHA3 } from '../src/lib/cryptography/SHA3';

const prisma = new PrismaClient();

// Simple password hashing using SHA3
function hashPassword(password: string): string {
  const hash = SHA3.sha256(password);
  return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function main() {
  console.log('🚀 Starting enhanced database seed...');

  // Clear existing data (optional - remove in production)
  console.log('🧹 Cleaning existing data...');
  await prisma.session.deleteMany();
  await prisma.directKey.deleteMany();
  await prisma.secretShare.deleteMany();
  await prisma.transkrip.deleteMany();
  await prisma.user.deleteMany();

  // Generate RSA key pairs for both program heads
  console.log('🔐 Generating RSA key pairs...');
  const informaticsKeyPair = RSA.generateKeyPair(2048);
  const sisKeyPair = RSA.generateKeyPair(2048);

  const defaultPasswordHash = hashPassword('admin123');

  // ===== CREATE KEPALA PROGRAM STUDI =====
  console.log('👨‍💼 Creating Program Heads...');
  
  const kaprodiIF = await prisma.user.create({
    data: {
      username: 'kaprodiIF',
      password: defaultPasswordHash,
      role: 'Kepala_Program_Studi',
      fullName: 'Dr. Kepala Program Studi Teknik Informatika',
      programStudi: 'Teknik_Informatika',
      publicKey: RSAUtils.publicKeyToHex(informaticsKeyPair.publicKey),
      privateKey: RSAUtils.privateKeyToHex(informaticsKeyPair.privateKey),
      createdAt: new Date()
    }
  });

  const kaprodiSTI = await prisma.user.create({
    data: {
      username: 'kaprodiSTI',
      password: defaultPasswordHash,
      role: 'Kepala_Program_Studi',
      fullName: 'Dr. Kepala Program Studi Sistem dan Teknologi Informasi',
      programStudi: 'Sistem_Teknologi_Informasi',
      publicKey: RSAUtils.publicKeyToHex(sisKeyPair.publicKey),
      privateKey: RSAUtils.privateKeyToHex(sisKeyPair.privateKey),
      createdAt: new Date()
    }
  });

  console.log(`✅ Created: ${kaprodiIF.fullName}`);
  console.log(`✅ Created: ${kaprodiSTI.fullName}`);

  // ===== CREATE DOSEN WALI (ADVISORS) =====
  console.log('\n👩‍🏫 Creating Advisors...');
  const advisors: any[] = [];

  // Create exactly 5 advisors as requested
  const advisorData = [
    { username: 'doswal1', fullName: 'Dr. Dosen Wali Pertama' },
    { username: 'doswal2', fullName: 'Dr. Dosen Wali Kedua' },
    { username: 'doswal3', fullName: 'Dr. Dosen Wali Ketiga' },
    { username: 'doswal4', fullName: 'Dr. Dosen Wali Keempat' },
    { username: 'doswal5', fullName: 'Dr. Dosen Wali Kelima' }
  ];

  for (const advisorInfo of advisorData) {
    const advisorKeyPair = RSA.generateKeyPair(2048);
    
    const advisor = await prisma.user.create({
      data: {
        username: advisorInfo.username,
        password: defaultPasswordHash,
        role: 'Dosen_Wali',
        fullName: advisorInfo.fullName,
        // Note: Dosen Wali don't have programStudi - they can advise from any program
        programStudi: null,
        publicKey: RSAUtils.publicKeyToHex(advisorKeyPair.publicKey),
        privateKey: RSAUtils.privateKeyToHex(advisorKeyPair.privateKey),
        createdAt: new Date()
      }
    });

    advisors.push(advisor);
    console.log(`✅ Created advisor: ${advisor.fullName} (${advisor.username})`);
  }

  // ===== CREATE STUDENTS =====
  console.log('\n👨‍🎓 Creating Students...');
  const students: any[] = [];

  // Create STI student with 18222xxx NIM format
  const stiStudent = { username: 'muridSTI1', name: 'Mahasiswa STI Pertama', nim: '18222001' };
  
  const stiStudentKeyPair = RSA.generateKeyPair(2048);
  const stiStudent_created = await prisma.user.create({
    data: {
      username: stiStudent.username,
      password: defaultPasswordHash,
      role: 'Mahasiswa',
      fullName: stiStudent.name,
      nim: stiStudent.nim,
      DosenId: advisors[0].id, // Assign to doswal1
      programStudi: 'Sistem_Teknologi_Informasi',
      publicKey: RSAUtils.publicKeyToHex(stiStudentKeyPair.publicKey),
      privateKey: RSAUtils.privateKeyToHex(stiStudentKeyPair.privateKey),
      createdAt: new Date()
    }
  });

  students.push(stiStudent_created);
  console.log(`✅ Created STI student: ${stiStudent_created.fullName} (${stiStudent_created.nim}) - Advisor: ${advisors[0].fullName}`);

  // Create IF student with 13522xxx NIM format
  const ifStudent = { username: 'muridIF1', name: 'Mahasiswa IF Pertama', nim: '13522001' };
  
  const ifStudentKeyPair = RSA.generateKeyPair(2048);
  const ifStudent_created = await prisma.user.create({
    data: {
      username: ifStudent.username,
      password: defaultPasswordHash,
      role: 'Mahasiswa',
      fullName: ifStudent.name,
      nim: ifStudent.nim,
      DosenId: advisors[1].id, // Assign to doswal2
      programStudi: 'Teknik_Informatika',
      publicKey: RSAUtils.publicKeyToHex(ifStudentKeyPair.publicKey),
      privateKey: RSAUtils.privateKeyToHex(ifStudentKeyPair.privateKey),
      createdAt: new Date()
    }
  });

  students.push(ifStudent_created);
  console.log(`✅ Created IF student: ${ifStudent_created.fullName} (${ifStudent_created.nim}) - Advisor: ${advisors[1].fullName}`);

  // ===== SUMMARY =====
  console.log('\n📊 Database Seed Summary:');
  console.log('========================');
  console.log(`👨‍💼 Program Heads: 2 (kaprodiIF, kaprodiSTI)`);
  console.log(`👩‍🏫 Advisors: 5 (doswal1, doswal2, doswal3, doswal4, doswal5)`);
  console.log(`👨‍🎓 Students: 2 total`);
  console.log(`   - STI Student: 1 (muridSTI1 - 18222001)`);
  console.log(`   - IF Student: 1 (muridIF1 - 13522001)`);
  console.log(`🔐 All users have 2048-bit RSA key pairs`);
  console.log(`🔑 Default password for all: admin123`);
  console.log('\n✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed.');
  });