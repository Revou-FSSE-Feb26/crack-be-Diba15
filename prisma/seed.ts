import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';

// Inisialisasi Prisma Client menggunakan adapter pg (sama seperti PrismaService)
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(
    '🌱 Menyiapkan penyemaian database dengan metode Upsert (Aman untuk data yang sudah ada)...',
  );

  /*
  // ─── PEMBERSIHAN DATABASE (DITANGGUHKAN / DICOMMENT SESUAI PERMINTAAN USER) ───
  console.log('🌱 Memulai proses pembersihan database...');
  await prisma.disputeLog.deleteMany({});
  await prisma.revision.deleteMany({});
  await prisma.commissionProgress.deleteMany({});
  await prisma.commission.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.artworkTag.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.artwork.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Pembersihan database selesai.');
  */

  console.log('🌱 Menyemaikan data pengguna baru (Upsert)...');

  // 2. Hash sandi tiruan menggunakan bcrypt
  const artistHash = await bcrypt.hash('artist123', 10);
  const clientHash = await bcrypt.hash('client123', 10);
  const curatorHash = await bcrypt.hash('curator123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  // 3. Buat Users (Upsert)
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
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: u,
    });
  }

  console.log('🌱 Menyemaikan profil pengguna (Upsert)...');

  // 4. Buat Profiles (Upsert)
  const profilesData = [
    {
      id: 'p-001',
      userId: 'u-001',
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
      bio: 'Komikus & cover artist. Webtoon lokal enthusiast.',
      isVerified: false,
      approvedPortfolioCount: 3,
      isOpenForCommission: true,
      basePriceIdr: 175000,
      strikeCount: 0,
    },
  ];

  for (const p of profilesData) {
    await prisma.profile.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }

  console.log('🌱 Menyemaikan tag-tag karya (Upsert)...');

  // 5. Buat Tags (Upsert)
  const tagsData = [
    { id: 't-001', tagName: 'cat air' },
    { id: 't-002', tagName: 'lanskap' },
    { id: 't-003', tagName: 'urban' },
    { id: 't-004', tagName: 'karakter' },
    { id: 't-005', tagName: 'sci-fi' },
    { id: 't-006', tagName: 'digital' },
    { id: 't-007', tagName: 'ink' },
    { id: 't-008', tagName: 'fantasy' },
    { id: 't-009', tagName: 'webtoon' },
    { id: 't-010', tagName: 'cover art' },
  ];

  for (const t of tagsData) {
    await prisma.tag.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    });
  }

  console.log('🌱 Menyemaikan karya seni / artworks (Upsert)...');

  // 6. Buat Artworks (Upsert)
  const artworksData = [
    {
      id: 'a-001',
      artistsId: 'u-001',
      title: 'Senja di Tepi Sungai Ciliwung',
      description:
        'Lukisan cat air yang menangkap suasana sore hari di tepian Sungai Ciliwung, Jakarta.',
      imagesUrl: [
        'https://picsum.photos/seed/ciliwung/800/600',
        'https://picsum.photos/seed/ciliwung/800/600',
      ],
      wipProofUrl: 'https://picsum.photos/seed/ciliwung-wip/800/600',
      uploadType: 'original' as const,
      curationStatus: 'approved' as const,
      isVisibleOnFeed: true,
      createdAt: new Date('2024-05-01T10:00:00Z'),
    },
    {
      id: 'a-002',
      artistsId: 'u-001',
      title: 'Pasar Baru, Hujan Sore',
      description: 'Suasana hujan di kawasan Pasar Baru, dengan warna-warna basah khas cat air.',
      imagesUrl: [
        'https://picsum.photos/seed/pasarbaru/800/600',
        'https://picsum.photos/seed/pasarbaru/800/600',
        'https://picsum.photos/seed/pasarbaru/800/600',
      ],
      wipProofUrl: 'https://picsum.photos/seed/pasarbaru-wip/800/600',
      uploadType: 'original' as const,
      curationStatus: 'approved' as const,
      isVisibleOnFeed: true,
      createdAt: new Date('2024-05-15T14:00:00Z'),
    },
    {
      id: 'a-003',
      artistsId: 'u-002',
      title: 'Putri Jelajah Antariksa',
      description:
        'Character design original — seorang putri dari peradaban antarbintang dengan armor futuristik.',
      imagesUrl: [
        'https://picsum.photos/seed/antariksa/800/600',
        'https://picsum.photos/seed/antariksa/800/600',
        'https://picsum.photos/seed/antariksa/800/600',
        'https://picsum.photos/seed/antariksa/800/600',
      ],
      wipProofUrl: 'https://picsum.photos/seed/antariksa-wip/800/600',
      uploadType: 'original' as const,
      curationStatus: 'approved' as const,
      isVisibleOnFeed: true,
      createdAt: new Date('2024-06-02T09:30:00Z'),
    },
    {
      id: 'a-004',
      artistsId: 'u-002',
      title: 'Neon Samurai',
      description: 'OC samurai cyberpunk dengan estetika neon kota futuristik.',
      imagesUrl: [
        'https://picsum.photos/seed/neonsamurai/800/600',
        'https://picsum.photos/seed/neonsamurai/800/600',
      ],
      wipProofUrl: 'https://picsum.photos/seed/neonsamurai-wip/800/600',
      uploadType: 'original' as const,
      curationStatus: 'approved' as const,
      isVisibleOnFeed: true,
      createdAt: new Date('2024-06-20T16:00:00Z'),
    },
    {
      id: 'a-005',
      artistsId: 'u-003',
      title: 'Forest Spirit — Ink Series #3',
      description:
        'Bagian ketiga dari seri ink drawing roh hutan. Digambar dengan tinta India di atas kertas Canson.',
      imagesUrl: ['https://picsum.photos/seed/forestspirit/800/600'],
      wipProofUrl: 'https://picsum.photos/seed/forestspirit-wip/800/600',
      uploadType: 'original' as const,
      curationStatus: 'approved' as const,
      isVisibleOnFeed: true,
      createdAt: new Date('2024-07-05T11:00:00Z'),
    },
    {
      id: 'a-006',
      artistsId: 'u-004',
      title: 'Pasar Malam — Webtoon Cover',
      description: 'Cover episode perdana webtoon lokal bertema festival rakyat malam hari.',
      imagesUrl: ['https://picsum.photos/seed/pasarmalam/800/600'],
      wipProofUrl: 'https://picsum.photos/seed/pasarmalam-wip/800/600',
      uploadType: 'original' as const,
      curationStatus: 'approved' as const,
      isVisibleOnFeed: true,
      createdAt: new Date('2024-07-18T13:00:00Z'),
    },
    {
      id: 'a-007',
      artistsId: 'u-003',
      title: 'Mystic Garden — AI Style Experiment',
      description:
        'Eksperimen visual taman mistis dengan pencahayaan dramatis dan detail hyper-realistic.',
      imagesUrl: ['https://picsum.photos/seed/mysticgarden/800/600'],
      wipProofUrl: 'https://picsum.photos/seed/mysticgarden-wip/800/600',
      uploadType: 'original' as const,
      curationStatus: 'pending' as const,
      isVisibleOnFeed: false,
      createdAt: new Date('2024-08-01T09:00:00Z'),
    },
    {
      id: 'a-008',
      artistsId: 'u-004',
      title: 'Kota Hujan — Scene Study',
      description: 'Studi suasana kota saat hujan dengan teknik digital painting tradisional.',
      imagesUrl: [
        'https://picsum.photos/seed/kotahujan/800/600',
        'https://picsum.photos/seed/kotahujan2/800/600',
      ],
      wipProofUrl: 'https://picsum.photos/seed/kotahujan-wip/800/600',
      uploadType: 'original' as const,
      curationStatus: 'pending' as const,
      isVisibleOnFeed: false,
      createdAt: new Date('2024-08-03T14:30:00Z'),
    },
    {
      id: 'a-009',
      artistsId: 'u-001',
      title: 'Fan Art — Guardian of the Stars',
      description:
        'Fan art karakter dari franchise populer, digambar manual dengan referensi resmi.',
      imagesUrl: ['https://picsum.photos/seed/guardianstars/800/600'],
      wipProofUrl: null,
      uploadType: 'fanart' as const,
      curationStatus: 'pending' as const,
      isVisibleOnFeed: false,
      createdAt: new Date('2024-08-05T11:15:00Z'),
    },
  ];

  for (const art of artworksData) {
    await prisma.artwork.upsert({
      where: { id: art.id },
      update: {},
      create: art,
    });
  }

  console.log('🌱 Menyemaikan relasi tag karya / artwork_tags (Upsert)...');

  // 7. Buat ArtworkTags (Upsert)
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

  console.log('🌱 Menyemaikan komisi / commissions (Upsert)...');

  // 8. Buat Commissions (Upsert)
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
      createdAt: new Date('2024-07-02T10:15:00Z'),
      updatedAt: new Date('2024-07-06T08:45:00Z'),
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
      createdAt: new Date('2024-07-01T13:20:00Z'),
      updatedAt: new Date('2024-07-05T11:10:00Z'),
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
      createdAt: new Date('2024-07-04T16:00:00Z'),
      updatedAt: new Date('2024-07-04T16:00:00Z'),
    },
  ];

  for (const c of commissionsData) {
    await prisma.commission.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  // 9. Buat CommissionProgress (Upsert)
  const progressData = [
    {
      id: 'cp-001',
      commissionId: 'c-001',
      sketchUrl: 'https://picsum.photos/seed/commission-sketch-1/900/650',
      sketchApproved: true,
      finalArtworkUrl: 'https://picsum.photos/seed/commission-final-1/900/650',
      finalArtworkApproved: true,
      updatedAt: new Date('2024-06-26T15:30:00Z'),
    },
    {
      id: 'cp-002',
      commissionId: 'c-002',
      sketchUrl: 'https://picsum.photos/seed/commission-sketch-2/900/650',
      sketchApproved: false,
      finalArtworkUrl: null,
      finalArtworkApproved: false,
      updatedAt: new Date('2024-07-06T08:45:00Z'),
    },
    {
      id: 'cp-003',
      commissionId: 'c-003',
      sketchUrl: 'https://picsum.photos/seed/commission-sketch-3/900/650',
      sketchApproved: true,
      finalArtworkUrl: 'https://picsum.photos/seed/commission-final-3/900/650',
      finalArtworkApproved: false,
      updatedAt: new Date('2024-07-05T11:10:00Z'),
    },
  ];

  for (const p of progressData) {
    await prisma.commissionProgress.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }

  // 10. Buat Revisions (Upsert)
  const revisionsData = [
    {
      id: 'r-001',
      commissionId: 'c-002',
      userId: 'u-005',
      comment: 'Tolong pertahankan palet warna biru dan tambahkan variasi pose.',
      createdAt: new Date('2024-07-06T09:10:00Z'),
    },
  ];

  for (const r of revisionsData) {
    await prisma.revision.upsert({
      where: { id: r.id },
      update: {},
      create: r,
    });
  }

  console.log('🌱 Menyemaikan pengikutan / follows (Upsert)...');

  // 11. Buat Follows (Upsert)
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
