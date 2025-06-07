import { PrismaClient } from '@prisma/client';
import { RSA, RSAUtils } from '../src/lib/cryptography/RSA';
import { SHA3 } from '../src/lib/cryptography/SHA3';
import { BBSUtils } from '../src/lib/cryptography/BBS';

const prisma = new PrismaClient();

// Simple password hashing using your crypto library
function hashPassword(password: string): string {
  // Use SHA3 to hash the password
  const hash = SHA3.sha256(password);
  // Convert to hex string
  return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function main() {
  console.log('Starting database seed...');

  // Generate RSA key pairs for both heads
  const informaticsKeyPair = RSA.generateKeyPair(2048);
  const sisKeyPair = RSA.generateKeyPair(2048);

  // Hash default passwords using your crypto library
  const defaultPasswordHash = hashPassword('admin123');

  // Create Head for Informatics
  const kaprodiIF = await prisma.user.upsert({
    where: { username: 'KaprodiIF' },
    update: {},
    create: {
      username: 'KaprodiIF',
      password: defaultPasswordHash,
      role: 'Kepala_Program_Studi',
      fullName: 'Kepala Program Studi Teknik Informatika',
      programStudi: 'Teknik_Informatika',
      publicKey: RSAUtils.publicKeyToHex(informaticsKeyPair.publicKey),
      privateKey: RSAUtils.privateKeyToHex(informaticsKeyPair.privateKey),
      createdAt: new Date()
    }
  });

  // Create Head for Information Systems
  const kaprodiSTI = await prisma.user.upsert({
    where: { username: 'KaprodiSTI' },
    update: {},
    create: {
      username: 'KaprodiSTI',
      password: defaultPasswordHash,
      role: 'Kepala_Program_Studi',
      fullName: 'Kepala Program Studi Sistem dan Teknologi Informasi',
      programStudi: 'Sistem_Teknologi_Informasi',
      publicKey: RSAUtils.publicKeyToHex(sisKeyPair.publicKey),
      privateKey: RSAUtils.privateKeyToHex(sisKeyPair.privateKey),
      createdAt: new Date()
    }
  });

  console.log('Created default heads:');
  console.log(`${kaprodiIF.fullName} (${kaprodiIF.username})`);
  console.log(`${kaprodiSTI.fullName} (${kaprodiSTI.username})`);
  console.log('Default password: admin123');
  console.log('Please change default passwords in production!');

  // Create 5 advisors
  console.log('Creating advisors...');
  const advisors: any[] = [];

  for (let i = 1; i <= 5; i++) {
    const advisorKeyPair = RSA.generateKeyPair(2048);
    
    const advisor = await prisma.user.upsert({
      where: { username: `advisor${i}` },
      update: {},
      create: {
        username: `advisor${i}`,
        password: defaultPasswordHash,
        role: 'Dosen_Wali',
        fullName: `Dr. Dosen Wali ${i}`,
        publicKey: RSAUtils.publicKeyToHex(advisorKeyPair.publicKey),
        privateKey: RSAUtils.privateKeyToHex(advisorKeyPair.privateKey),
        createdAt: new Date()
      }
    });

    advisors.push(advisor);
    console.log(`Created advisor: ${advisor.fullName} (${advisor.username})`);
  }

  // Optional: Create sample students for testing
  if (process.env.NODE_ENV === 'development') {
    console.log('Creating sample students for development...');

    // Sample student key pairs
    const student1KeyPair = RSA.generateKeyPair(2048);
    const student2KeyPair = RSA.generateKeyPair(2048);

    // Create sample students
    const student1 = await prisma.user.upsert({
      where: { username: 'student1' },
      update: {},
      create: {
        username: 'student1',
        password: defaultPasswordHash,
        role: 'Mahasiswa',
        fullName: 'Mahasiswa Informatika',
        nim: '13521001',
        DosenId: advisors[0].id,
        programStudi: 'Teknik_Informatika',
        publicKey: RSAUtils.publicKeyToHex(student1KeyPair.publicKey),
        privateKey: RSAUtils.privateKeyToHex(student1KeyPair.privateKey),
        createdAt: new Date()
      }
    });

    const student2 = await prisma.user.upsert({
      where: { username: 'student2' },
      update: {},
      create: {
        username: 'student2',
        password: defaultPasswordHash,
        role: 'Mahasiswa',
        fullName: 'Mahasiswa STI',
        nim: '18221001',
        DosenId: advisors[1].id,
        programStudi: 'Sistem_Teknologi_Informasi',
        publicKey: RSAUtils.publicKeyToHex(student2KeyPair.publicKey),
        privateKey: RSAUtils.privateKeyToHex(student2KeyPair.privateKey),
        createdAt: new Date()
      }
    });

    console.log('Created sample students:');
    console.log(`${student1.fullName} (${student1.username}) - ${student1.programStudi}`);
    console.log(`${student2.fullName} (${student2.username}) - ${student2.programStudi}`);
  }

  console.log('Database seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });