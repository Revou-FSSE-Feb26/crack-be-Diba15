import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';

// Inisialisasi Prisma Client menggunakan adapter pg (sama seperti PrismaService)
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Menyiapkan penyemaian database TruBrush...');

  // ─── 1. PEMBERSIHAN DATABASE MENYELURUH (Dibersihkan dari child ke parent) ───
  console.log('🧹 Memulai proses pembersihan seluruh tabel database...');
  await prisma.walletTransaction.deleteMany({});
  await prisma.appeal.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.disputeLog.deleteMany({});
  await prisma.revision.deleteMany({});
  await prisma.commissionProgress.deleteMany({});
  await prisma.commission.deleteMany({});
  await prisma.artworkTag.deleteMany({});
  await prisma.artwork.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Pembersihan database selesai.');

  // ─── 2. HASH SANDI PENGGUNA ───
  console.log('🌱 Melakukan hashing password untuk akun bawaan...');
  const artistHash = await bcrypt.hash('artist123', 10);
  const clientHash = await bcrypt.hash('client123', 10);
  const curatorHash = await bcrypt.hash('curator123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  // ─── 3. BUAT USERS (Upsert) ───
  console.log('🌱 Menyemaikan data pengguna (Users)...');
  const usersData = [
    {
      id: 'u-001',
      name: 'Ari Ramadan',
      email: 'ari@example.com',
      password: artistHash,
      role: 'artist' as const,
      balance: 0,
      createdAt: new Date('2024-01-10T08:00:00Z'),
    },
    {
      id: 'u-002',
      name: 'Nadia Suryani',
      email: 'nadia@example.com',
      password: artistHash,
      role: 'artist' as const,
      balance: 0,
      createdAt: new Date('2024-02-03T09:15:00Z'),
    },
    {
      id: 'u-003',
      name: 'Budi Laksono',
      email: 'budi@example.com',
      password: artistHash,
      role: 'artist' as const,
      balance: 0,
      createdAt: new Date('2024-03-20T11:00:00Z'),
    },
    {
      id: 'u-004',
      name: 'Rina Pertiwi',
      email: 'rina@example.com',
      password: artistHash,
      role: 'artist' as const,
      balance: 0,
      createdAt: new Date('2024-04-05T14:30:00Z'),
    },
    {
      id: 'u-005',
      name: 'Dimas Prasetyo',
      email: 'dimas@example.com',
      password: clientHash,
      role: 'client' as const,
      balance: 2000000,
      createdAt: new Date('2024-05-01T10:00:00Z'),
    },
    {
      id: 'u-006',
      name: 'Sari Dewi',
      email: 'sari@example.com',
      password: clientHash,
      role: 'client' as const,
      balance: 1500000,
      createdAt: new Date('2024-05-15T13:00:00Z'),
    },
    {
      id: 'u-007',
      name: 'Admin TruBrush',
      email: 'admin@trubrush.com',
      password: adminHash,
      role: 'admin' as const,
      balance: 0,
      createdAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: 'u-008',
      name: 'Hendra Kurniawan',
      email: 'hendra@trubrush.com',
      password: curatorHash,
      role: 'curator' as const,
      balance: 0,
      createdAt: new Date('2024-01-05T08:00:00Z'),
    },
    {
      id: 'u-009',
      name: 'Fajar Nugroho',
      email: 'fajar@example.com',
      password: artistHash,
      role: 'artist' as const,
      balance: 0,
      createdAt: new Date('2024-04-10T10:00:00Z'),
    },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role,
        balance: u.balance,
      },
      create: u,
    });
  }

  // ─── 4. BUAT PROFILES (Upsert) ───
  console.log('🌱 Menyemaikan profil pengguna (Profiles)...');
  const profilesData = [
    {
      id: 'p-001',
      userId: 'u-001',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      bio: 'Ilustrator cat air berbasis di Jakarta. Spesialis lanskap urban dan alam.',
      isVerified: true,
      approvedPortfolioCount: 12,
      isOpenForCommission: true,
      basePriceIdr: 250000,
      strikeCount: 0,
    },
    {
      id: 'p-002',
      userId: 'u-002',
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      bio: 'Character designer & illustrator. Suka Sci-Fi dan fantasy. No AI, ever.',
      isVerified: true,
      approvedPortfolioCount: 8,
      isOpenForCommission: true,
      basePriceIdr: 350000,
      strikeCount: 0,
    },
    {
      id: 'p-003',
      userId: 'u-003',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      bio: 'Ink artist. Menggambar dengan tangan sejak 2015. Penggemar berat folklore.',
      isVerified: true,
      approvedPortfolioCount: 20,
      isOpenForCommission: false,
      basePriceIdr: 200000,
      strikeCount: 0,
    },
    {
      id: 'p-004',
      userId: 'u-004',
      avatarUrl:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
      bio: 'Komikus & cover artist. Webtoon lokal enthusiast.',
      isVerified: false,
      approvedPortfolioCount: 3,
      isOpenForCommission: true,
      basePriceIdr: 175000,
      strikeCount: 1,
    },
    {
      id: 'p-005',
      userId: 'u-005',
      avatarUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      bio: 'Kolektor seni digital dan penikmat karya original manusia.',
      isVerified: false,
      approvedPortfolioCount: 0,
      isOpenForCommission: false,
      basePriceIdr: null,
      strikeCount: 0,
    },
    {
      id: 'p-006',
      userId: 'u-006',
      avatarUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      bio: 'Penggemar ilustrasi anime dan novel grafis fantasi.',
      isVerified: false,
      approvedPortfolioCount: 0,
      isOpenForCommission: false,
      basePriceIdr: null,
      strikeCount: 0,
    },
    {
      id: 'p-007',
      userId: 'u-007',
      avatarUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      bio: 'Administrator Eksekutif platform TruBrush.',
      isVerified: true,
      approvedPortfolioCount: 0,
      isOpenForCommission: false,
      basePriceIdr: null,
      strikeCount: 0,
    },
    {
      id: 'p-008',
      userId: 'u-008',
      avatarUrl:
        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80',
      bio: 'Kurator dan pengawas otentisitas karya seni anti-AI TruBrush.',
      isVerified: true,
      approvedPortfolioCount: 0,
      isOpenForCommission: false,
      basePriceIdr: null,
      strikeCount: 0,
    },
    {
      id: 'p-009',
      userId: 'u-009',
      avatarUrl:
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
      bio: 'Eks-ilustrator digital. Akun dibekukan akibat akumulasi 5 strike pelanggaran konten AI.',
      isVerified: false,
      approvedPortfolioCount: 1,
      isOpenForCommission: false,
      basePriceIdr: 150000,
      strikeCount: 5,
    },
  ];

  for (const p of profilesData) {
    await prisma.profile.upsert({
      where: { id: p.id },
      update: {
        avatarUrl: p.avatarUrl,
        isVerified: p.isVerified,
        isOpenForCommission: p.isOpenForCommission,
        approvedPortfolioCount: p.approvedPortfolioCount,
        basePriceIdr: p.basePriceIdr,
        bio: p.bio,
        strikeCount: p.strikeCount,
      },
      create: p,
    });
  }

  // ─── 5. BUAT TAGS (Upsert) ───
  console.log('🌱 Menyemaikan katalog tag (Tags)...');
  const tagsData = [
    { id: 't-001', tagName: 'cat air' },
    { id: 't-002', tagName: 'lanskap' },
    { id: 't-003', tagName: 'tradisional' },
    { id: 't-004', tagName: 'karakter' },
    { id: 't-005', tagName: 'sci-fi' },
    { id: 't-006', tagName: 'fantasi' },
    { id: 't-007', tagName: 'ink' },
    { id: 't-008', tagName: 'folklore' },
    { id: 't-009', tagName: 'webtoon' },
    { id: 't-010', tagName: 'anime' },
  ];

  for (const t of tagsData) {
    await prisma.tag.upsert({
      where: { id: t.id },
      update: { tagName: t.tagName },
      create: t,
    });
  }

  // ─── 6. BUAT ARTWORKS (Upsert) ───
  console.log('🌱 Menyemaikan karya seni (Artworks)...');
  const artworksData = [
    {
      id: 'a-001',
      artistsId: 'u-001',
      title: 'Lembah Merapi di Pagi Hari',
      description:
        'Lukisan cat air di atas kertas Arches 300gsm. Menampilkan kabut pagi di lereng Merapi.',
      imagesUrl: [
        'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80',
      ],
      wipProofUrl:
        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1000&q=80',
      uploadType: 'original' as const,
      curationStatus: 'approved' as const,
      isVisibleOnFeed: true,
      createdAt: new Date('2026-08-01T10:00:00Z'),
    },
    {
      id: 'a-002',
      artistsId: 'u-001',
      title: 'Sudut Senja Kota Tua',
      description: 'Lanskap perkotaan dengan teknik basah di atas basah. Palet warna hangat.',
      imagesUrl: [
        'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=1000&q=80',
      ],
      wipProofUrl:
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80',
      uploadType: 'original' as const,
      curationStatus: 'approved' as const,
      isVisibleOnFeed: true,
      createdAt: new Date('2026-08-05T14:20:00Z'),
    },
    {
      id: 'a-003',
      artistsId: 'u-002',
      title: 'Ksatria Antariksa Seri 01',
      description:
        'Konsep karakter pilot tempur galaksi dengan armor modular. Dibuat manual di Procreate.',
      imagesUrl: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1000&q=80',
      ],
      wipProofUrl:
        'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?auto=format&fit=crop&w=1000&q=80',
      uploadType: 'original' as const,
      curationStatus: 'approved' as const,
      isVisibleOnFeed: true,
      createdAt: new Date('2026-08-10T09:30:00Z'),
    },
    {
      id: 'a-004',
      artistsId: 'u-002',
      title: 'Neon Samurai',
      description: 'OC samurai cyberpunk dengan estetika neon kota futuristik.',
      imagesUrl: [
        'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1000&q=80',
      ],
      wipProofUrl:
        'https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&w=1000&q=80',
      uploadType: 'original' as const,
      curationStatus: 'approved' as const,
      isVisibleOnFeed: true,
      createdAt: new Date('2026-08-15T16:00:00Z'),
    },
    {
      id: 'a-005',
      artistsId: 'u-003',
      title: 'Forest Spirit — Ink Series #3',
      description:
        'Bagian ketiga dari seri ink drawing roh hutan. Digambar dengan tinta India di atas kertas Canson.',
      imagesUrl: [
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=80',
      ],
      wipProofUrl:
        'https://images.unsplash.com/photo-1578925518470-4def7a0f08bb?auto=format&fit=crop&w=1000&q=80',
      uploadType: 'original' as const,
      curationStatus: 'approved' as const,
      isVisibleOnFeed: true,
      createdAt: new Date('2026-08-18T11:00:00Z'),
    },
    {
      id: 'a-006',
      artistsId: 'u-004',
      title: 'Pasar Malam — Webtoon Cover',
      description: 'Cover episode perdana webtoon lokal bertema festival rakyat malam hari.',
      imagesUrl: [
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1000&q=80',
      ],
      wipProofUrl:
        'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&w=1000&q=80',
      uploadType: 'original' as const,
      curationStatus: 'approved' as const,
      isVisibleOnFeed: true,
      createdAt: new Date('2026-08-20T13:00:00Z'),
    },
    {
      id: 'a-007',
      artistsId: 'u-003',
      title: 'Sang Penjaga Rawa',
      description: 'Makhluk mitologi penjaga rawa purba. Ink on paper + digital tone.',
      imagesUrl: [
        'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1000&q=80',
      ],
      wipProofUrl:
        'https://images.unsplash.com/photo-1579783483458-83d02161294e?auto=format&fit=crop&w=1000&q=80',
      uploadType: 'original' as const,
      curationStatus: 'approved' as const,
      isVisibleOnFeed: true,
      createdAt: new Date('2026-08-22T08:45:00Z'),
    },
    {
      id: 'a-008',
      artistsId: 'u-001',
      title: 'Hujan di Borobudur',
      description:
        'Studi suasana Candi Borobudur saat gerimis sore. Menggunakan kuas Cina dan cat air Winsor & Newton.',
      imagesUrl: [
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=80',
      ],
      wipProofUrl:
        'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1000&q=80',
      uploadType: 'original' as const,
      curationStatus: 'approved' as const,
      isVisibleOnFeed: true,
      createdAt: new Date('2026-08-23T15:30:00Z'),
    },
    {
      id: 'a-009',
      artistsId: 'u-002',
      title: 'Guardian of the Stars (Fanart)',
      description:
        'Fan art karakter dari franchise populer, digambar manual dengan referensi resmi.',
      imagesUrl: [
        'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&w=1000&q=80',
      ],
      wipProofUrl: null,
      uploadType: 'fanart' as const,
      curationStatus: 'pending' as const,
      isVisibleOnFeed: false,
      createdAt: new Date('2026-08-24T11:15:00Z'),
    },
  ];

  for (const art of artworksData) {
    await prisma.artwork.upsert({
      where: { id: art.id },
      update: {
        title: art.title,
        description: art.description,
        imagesUrl: art.imagesUrl,
        wipProofUrl: art.wipProofUrl,
        uploadType: art.uploadType,
        curationStatus: art.curationStatus,
        isVisibleOnFeed: art.isVisibleOnFeed,
      },
      create: art,
    });
  }

  // ─── 7. BUAT ARTWORK TAGS (Upsert) ───
  console.log('🌱 Menyemaikan relasi tag karya (ArtworkTags)...');
  const artworkTagsData = [
    { artworkId: 'a-001', tagId: 't-001' },
    { artworkId: 'a-001', tagId: 't-002' },
    { artworkId: 'a-001', tagId: 't-003' },
    { artworkId: 'a-002', tagId: 't-001' },
    { artworkId: 'a-002', tagId: 't-003' },
    { artworkId: 'a-003', tagId: 't-004' },
    { artworkId: 'a-003', tagId: 't-005' },
    { artworkId: 'a-003', tagId: 't-006' },
    { artworkId: 'a-004', tagId: 't-004' },
    { artworkId: 'a-004', tagId: 't-005' },
    { artworkId: 'a-004', tagId: 't-006' },
    { artworkId: 'a-005', tagId: 't-007' },
    { artworkId: 'a-005', tagId: 't-008' },
    { artworkId: 'a-006', tagId: 't-009' },
    { artworkId: 'a-006', tagId: 't-010' },
    { artworkId: 'a-007', tagId: 't-008' },
    { artworkId: 'a-007', tagId: 't-006' },
    { artworkId: 'a-008', tagId: 't-003' },
    { artworkId: 'a-008', tagId: 't-006' },
    { artworkId: 'a-009', tagId: 't-004' },
    { artworkId: 'a-009', tagId: 't-005' },
  ];

  for (const artTag of artworkTagsData) {
    await prisma.artworkTag.upsert({
      where: { artworkId_tagId: { artworkId: artTag.artworkId, tagId: artTag.tagId } },
      update: {},
      create: artTag,
    });
  }

  // ─── 8. BUAT COMMISSIONS (Upsert) ───
  console.log('🌱 Menyemaikan komisi (Commissions)...');
  const commissionsData = [
    {
      id: 'c-001',
      artistsId: 'u-001',
      clientId: 'u-005',
      commissionTitle: 'Ilustrasi keluarga bergaya watercolor',
      description: 'Potret keluarga kecil dengan latar taman kota untuk hadiah ulang tahun.',
      price: 450000,
      status: 'completed' as const,
      paymentStatus: 'released' as const,
      createdAt: new Date('2024-06-12T09:00:00Z'),
      updatedAt: new Date('2024-06-26T15:30:00Z'),
    },
    {
      id: 'c-002',
      artistsId: 'u-002',
      clientId: 'u-005',
      commissionTitle: 'Character sheet original character',
      description: 'Desain karakter fantasy dengan tiga pose dan palet warna utama.',
      price: 650000,
      status: 'in_progress' as const,
      paymentStatus: 'paid' as const,
      createdAt: new Date('2026-08-02T10:15:00Z'),
      updatedAt: new Date('2026-08-06T08:45:00Z'),
    },
    {
      id: 'c-003',
      artistsId: 'u-003',
      clientId: 'u-006',
      commissionTitle: 'Ink portrait folklore theme',
      description: 'Portrait hitam putih dengan ornamen folklore untuk koleksi pribadi.',
      price: 300000,
      status: 'revision' as const,
      paymentStatus: 'paid' as const,
      createdAt: new Date('2026-08-01T13:20:00Z'),
      updatedAt: new Date('2026-08-05T11:10:00Z'),
    },
    {
      id: 'c-004',
      artistsId: 'u-001',
      clientId: 'u-006',
      commissionTitle: 'Landscape kota hujan',
      description: 'Lukisan digital bergaya cat air untuk cover playlist personal.',
      price: 275000,
      status: 'pending' as const,
      paymentStatus: 'unpaid' as const,
      createdAt: new Date('2026-08-04T16:00:00Z'),
      updatedAt: new Date('2026-08-04T16:00:00Z'),
    },
  ];

  for (const c of commissionsData) {
    await prisma.commission.upsert({
      where: { id: c.id },
      update: {
        commissionTitle: c.commissionTitle,
        description: c.description,
        price: c.price,
        status: c.status,
        paymentStatus: c.paymentStatus,
      },
      create: c,
    });
  }

  // ─── 9. BUAT COMMISSION PROGRESS (Upsert) ───
  console.log('🌱 Menyemaikan tahapan progress komisi (CommissionProgress)...');
  const progressData = [
    {
      id: 'cp-001',
      commissionId: 'c-001',
      sketchUrl:
        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80',
      sketchApproved: true,
      finalArtworkUrl:
        'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=900&q=80',
      finalArtworkApproved: true,
      finalFileUrl:
        'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1200&q=80',
      updatedAt: new Date('2024-06-26T15:30:00Z'),
    },
    {
      id: 'cp-002',
      commissionId: 'c-002',
      sketchUrl:
        'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?auto=format&fit=crop&w=900&q=80',
      sketchApproved: false,
      finalArtworkUrl: null,
      finalArtworkApproved: false,
      finalFileUrl: null,
      updatedAt: new Date('2026-08-06T08:45:00Z'),
    },
    {
      id: 'cp-003',
      commissionId: 'c-003',
      sketchUrl:
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80',
      sketchApproved: true,
      finalArtworkUrl:
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=80',
      finalArtworkApproved: false,
      finalFileUrl: null,
      updatedAt: new Date('2026-08-05T11:10:00Z'),
    },
    {
      id: 'cp-004',
      commissionId: 'c-004',
      sketchUrl: null,
      sketchApproved: false,
      finalArtworkUrl: null,
      finalArtworkApproved: false,
      finalFileUrl: null,
      updatedAt: new Date('2026-08-04T16:00:00Z'),
    },
  ];

  for (const p of progressData) {
    await prisma.commissionProgress.upsert({
      where: { id: p.id },
      update: {
        sketchUrl: p.sketchUrl,
        sketchApproved: p.sketchApproved,
        finalArtworkUrl: p.finalArtworkUrl,
        finalArtworkApproved: p.finalArtworkApproved,
        finalFileUrl: p.finalFileUrl,
      },
      create: p,
    });
  }

  // ─── 10. BUAT REVISIONS (Upsert) ───
  console.log('🌱 Menyemaikan catatan revisi (Revisions)...');
  const revisionsData = [
    {
      id: 'r-001',
      commissionId: 'c-002',
      userId: 'u-005',
      comment: 'Tolong pertahankan palet warna biru dan tambahkan variasi pose.',
      createdAt: new Date('2026-08-06T09:10:00Z'),
    },
    {
      id: 'r-002',
      commissionId: 'c-003',
      userId: 'u-006',
      comment: 'Bisa dibuat sedikit lebih gelap di bagian background arsiran?',
      createdAt: new Date('2026-08-05T11:30:00Z'),
    },
  ];

  for (const r of revisionsData) {
    await prisma.revision.upsert({
      where: { id: r.id },
      update: { comment: r.comment },
      create: r,
    });
  }

  // ─── 11. BUAT DISPUTES (Upsert) ───
  console.log('🌱 Menyemaikan sengketa komisi (DisputeLogs)...');
  const disputesData = [
    {
      id: 'd-001',
      commissionId: 'c-003',
      reason: 'Seniman melewati batas waktu kesepakatan lebih dari 7 hari tanpa pembaruan.',
      status: 'pending' as const,
      mediatorId: 'u-008',
      createdAt: new Date('2026-08-10T14:00:00Z'),
    },
  ];

  for (const d of disputesData) {
    await prisma.disputeLog.upsert({
      where: { id: d.id },
      update: {
        reason: d.reason,
        status: d.status,
        mediatorId: d.mediatorId,
      },
      create: d,
    });
  }

  // ─── 12. BUAT REPORTS (Upsert) ───
  console.log('🌱 Menyemaikan laporan pelanggaran (Reports)...');
  const reportsData = [
    {
      id: 'rep-001',
      reporterId: 'u-005',
      targetType: 'artwork' as const,
      targetId: 'a-009',
      artworkId: 'a-009',
      reason: 'Karya terindikasi hasil generasi AI yang tidak dideklarasikan pada deskripsi.',
      status: 'pending' as const,
      curatorId: 'u-008',
      createdAt: new Date('2026-08-25T10:00:00Z'),
    },
  ];

  for (const rep of reportsData) {
    await prisma.report.upsert({
      where: { id: rep.id },
      update: {
        reason: rep.reason,
        status: rep.status,
        curatorId: rep.curatorId,
      },
      create: rep,
    });
  }

  // ─── 13. BUAT APPEALS (Upsert) ───
  console.log('🌱 Menyemaikan permohonan banding artis (Appeals)...');
  const appealsData = [
    {
      id: 'app-001',
      artistId: 'u-004',
      reason:
        'Saya melampirkan berkas PSD 20 layer asli dan rekaman video menggambar dari kanvas kosong.',
      status: 'pending' as const,
      resolvedById: null,
      resolutionNotes: null,
      createdAt: new Date('2026-08-26T09:30:00Z'),
    },
    {
      id: 'app-002',
      artistId: 'u-009',
      reason:
        'Akun saya telah mencapai 5 strike pelanggaran. Saya memohon peninjauan ulang dan melampirkan rekaman proses menggambar asli untuk membuktikan seluruh karya dibuat manual tanpa generator AI.',
      status: 'pending' as const,
      resolvedById: null,
      resolutionNotes: null,
      createdAt: new Date('2026-08-28T14:15:00Z'),
    },
  ];

  for (const app of appealsData) {
    await prisma.appeal.upsert({
      where: { id: app.id },
      update: {
        reason: app.reason,
        status: app.status,
      },
      create: app,
    });
  }

  // ─── 14. BUAT FAVORITES (Upsert) ───
  console.log('🌱 Menyemaikan karya favorit (Favorites)...');
  const favoritesData = [
    { id: 'fav-001', userId: 'u-005', artworkId: 'a-001' },
    { id: 'fav-002', userId: 'u-005', artworkId: 'a-002' },
    { id: 'fav-003', userId: 'u-006', artworkId: 'a-001' },
    { id: 'fav-004', userId: 'u-006', artworkId: 'a-003' },
  ];

  for (const fav of favoritesData) {
    await prisma.favorite.upsert({
      where: { userId_artworkId: { userId: fav.userId, artworkId: fav.artworkId } },
      update: {},
      create: fav,
    });
  }

  // ─── 15. BUAT FOLLOWS (Upsert) ───
  console.log('🌱 Menyemaikan relasi pengikutan (Follows)...');
  const followsData = [
    { id: 'f-001', followerId: 'u-005', artistId: 'u-001' },
    { id: 'f-002', followerId: 'u-005', artistId: 'u-002' },
    { id: 'f-003', followerId: 'u-006', artistId: 'u-001' },
    { id: 'f-004', followerId: 'u-006', artistId: 'u-003' },
  ];

  for (const f of followsData) {
    await prisma.follow.upsert({
      where: { followerId_artistId: { followerId: f.followerId, artistId: f.artistId } },
      update: {},
      create: f,
    });
  }

  // ─── 16. BUAT WALLET TRANSACTIONS / BUKU KAS (Upsert) ───
  console.log('🌱 Menyemaikan mutasi transaksi dompet & buku kas (WalletTransactions)...');
  const transactionsData = [
    {
      id: 'tx-001',
      userId: 'u-005',
      type: 'topup' as const,
      amount: 2000000,
      title: 'Top Up Saldo Dompet Virtual Account',
      status: 'success' as const,
      commissionId: null,
      createdAt: new Date('2024-05-01T10:05:00Z'),
    },
    {
      id: 'tx-002',
      userId: 'u-006',
      type: 'topup' as const,
      amount: 1500000,
      title: 'Top Up Saldo Dompet Virtual Account',
      status: 'success' as const,
      commissionId: null,
      createdAt: new Date('2024-05-15T13:05:00Z'),
    },
    {
      id: 'tx-003',
      userId: 'u-005',
      type: 'payment' as const,
      amount: 450000,
      title: 'Pembayaran Komisi "Ilustrasi keluarga bergaya watercolor"',
      status: 'success' as const,
      commissionId: 'c-001',
      createdAt: new Date('2024-06-12T09:30:00Z'),
    },
    {
      id: 'tx-004',
      userId: 'u-001',
      type: 'release' as const,
      amount: 427500,
      title: 'Pencairan Dana Komisi "Ilustrasi keluarga bergaya watercolor" (Net 95%)',
      status: 'success' as const,
      commissionId: 'c-001',
      createdAt: new Date('2024-06-26T15:35:00Z'),
    },
    {
      id: 'tx-005',
      userId: 'u-001',
      type: 'platform_fee' as const,
      amount: 22500,
      title: 'Potongan Fee Platform 5% Komisi "Ilustrasi keluarga bergaya watercolor"',
      status: 'success' as const,
      commissionId: 'c-001',
      createdAt: new Date('2024-06-26T15:35:00Z'),
    },
    {
      id: 'tx-006',
      userId: 'u-005',
      type: 'payment' as const,
      amount: 650000,
      title: 'Pembayaran Komisi "Character sheet original character"',
      status: 'success' as const,
      commissionId: 'c-002',
      createdAt: new Date('2026-08-02T10:30:00Z'),
    },
  ];

  for (const tx of transactionsData) {
    await prisma.walletTransaction.upsert({
      where: { id: tx.id },
      update: {
        amount: tx.amount,
        title: tx.title,
        status: tx.status,
      },
      create: tx,
    });
  }

  console.log('🎉 PROSES PENYEMAIAN DATABASE TRUBRUSH BERHASIL DISUKSESKAN!');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat penyemaian database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
