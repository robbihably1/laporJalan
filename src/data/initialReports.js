export const INITIAL_REPORTS = [
  {
    id: "REP-2026-0812-001",
    title: "Lubang Dalam di Lampu Merah Jl. Sudirman",
    category: "Jalan Berlubang",
    severity: "Parah",
    description: "Terdapat lubang berdiameter ~60cm dengan kedalaman 15cm persis di lajur kanan dekat perempatan lampu merah. Sangat membahayakan pengendara motor di malam hari.",
    locationName: "Jl. Jend. Sudirman No. 42, Jakarta Pusat",
    latitude: -6.2088,
    longitude: 106.8219,
    photoUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800&auto=format&fit=crop",
    status: "Diproses", // Menunggu, Diproses, Selesai, Ditolak
    createdAt: "2026-08-12T14:30:00Z",
    userName: "Budi Santoso",
    userPhone: "0812-3456-7890",
    timeline: [
      { status: "Menunggu", note: "Laporan berhasil diterima oleh sistem.", timestamp: "2026-08-12T14:30:00Z" },
      { status: "Diproses", note: "Tim Dinas Bina Marga telah melakukan verifikasi lokasi dan penjadwalan perbaikan.", timestamp: "2026-08-13T09:15:00Z" }
    ]
  },
  {
    id: "REP-2026-0810-002",
    title: "Jalan Ambles Akibat Luapan Drainase",
    category: "Jalan Ambles",
    severity: "Sedang",
    description: "Aspal melesak ke bawah sepanjang 2 meter akibat erosi saluran air bawah tanah. Kendaraan roda empat terpaksa melambat.",
    locationName: "Jl. Gatot Subroto Kav 18, Tebet",
    latitude: -6.2415,
    longitude: 106.8436,
    photoUrl: "https://images.unsplash.com/photo-1584463699966-1c88019b8849?q=80&w=800&auto=format&fit=crop",
    status: "Selesai",
    createdAt: "2026-08-10T08:15:00Z",
    userName: "Siti Rahma",
    userPhone: "0857-1122-3344",
    timeline: [
      { status: "Menunggu", note: "Laporan masuk.", timestamp: "2026-08-10T08:15:00Z" },
      { status: "Diproses", note: "Penambalan aspal darurat dan perbaikan drainase dijalankan.", timestamp: "2026-08-10T13:00:00Z" },
      { status: "Selesai", note: "Pengaspalan ulang selesai dan jalan sudah aman dilalui.", timestamp: "2026-08-11T16:45:00Z" }
    ]
  },
  {
    id: "REP-2026-0814-003",
    title: "Retak Rambut Panjang & Lampu Penerangan Mati",
    category: "Retak & Penerangan",
    severity: "Ringan",
    description: "Retakan memanjang sekitar 10 meter di bahu jalan. Ditambah lagi lampu PJU di dekatnya tidak menyala.",
    locationName: "Jl. Raya Pasar Minggu KM 15",
    latitude: -6.2750,
    longitude: 106.8420,
    photoUrl: "https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?q=80&w=800&auto=format&fit=crop",
    status: "Menunggu",
    createdAt: "2026-08-14T10:00:00Z",
    userName: "Budi Santoso",
    userPhone: "0812-3456-7890",
    timeline: [
      { status: "Menunggu", note: "Laporan baru dikirim, menunggu tinjauan verifikator.", timestamp: "2026-08-14T10:00:00Z" }
    ]
  }
];
