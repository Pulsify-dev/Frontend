const createWaveform = (seed) =>
  Array.from({ length: 140 }, (_, index) => {
    const primary = (Math.sin((index + seed) * 0.43) + 1) / 2
    const secondary = (Math.cos((index + seed) * 0.19) + 1) / 2
    return Number((0.16 + primary * 0.5 + secondary * 0.14).toFixed(3))
  })

const users = {
  you: {
    id: 'usr-viewer',
    name: 'Mayar Ayman',
    handle: '@mayar-ayman-15',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
  },
  rana: {
    id: 'usr-10',
    name: 'Rana Magdy',
    handle: '@ranamagdy',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
  },
  youssef: {
    id: 'usr-11',
    name: 'Youssef Tarek',
    handle: '@yousseftrk',
    avatar:
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?q=80&w=200&auto=format&fit=crop',
  },
  salma: {
    id: 'usr-12',
    name: 'Salma Samir',
    handle: '@salmasamir',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
  },
  noor: {
    id: 'usr-01',
    name: 'Noor Salah',
    handle: '@noorsalah',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop',
  },
  omar: {
    id: 'usr-02',
    name: 'Omar Adel',
    handle: '@omr.adel',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
  },
  dana: {
    id: 'usr-03',
    name: 'Dana Fathy',
    handle: '@danaf',
    avatar:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
  },
  khaled: {
    id: 'usr-04',
    name: 'Khaled Amin',
    handle: '@khaledamin',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop',
  },
  basel: {
    id: 'usr-05',
    name: 'Basel Karim',
    handle: '@baselkarim',
    avatar:
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?q=80&w=200&auto=format&fit=crop',
  },
  farah: {
    id: 'usr-21',
    name: 'Farah Ahmed',
    handle: '@farahahmed',
    avatar:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df2?q=80&w=200&auto=format&fit=crop',
  },
  hazem: {
    id: 'usr-30',
    name: 'Hazem Reda',
    handle: '@hazemreda',
    avatar:
      'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=200&auto=format&fit=crop',
  },
  menna: {
    id: 'usr-31',
    name: 'Menna Hossam',
    handle: '@mennahossam',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
  },
  ibrahim: {
    id: 'usr-32',
    name: 'Ibrahim Mohamed',
    handle: '@ibrahimmo',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop',
  },
  gamal: {
    id: 'usr-33',
    name: 'Gamal Nader',
    handle: '@gamalnader',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
  },
  leila: {
    id: 'usr-34',
    name: 'Leila Atef',
    handle: '@leilaatef',
    avatar:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=200&auto=format&fit=crop',
  },
}

const tracks = {
  'trk-2026-014': {
    id: 'trk-2026-014',
    title: 'Desert Skyline (Live Take)',
    artist: 'Mayar Ayman',
    artistHandle: '@mayar.ayman',
    artistAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=240&auto=format&fit=crop',
    cover:
      'https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?q=80&w=900&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 248,
    description:
      'A warm late-night live take built for long headphones sessions, floating synths, and a heavy low-end groove.',
    genre: 'Electronic',
    location: 'Cairo, Egypt',
    postedAt: '2026-03-27T20:15:00.000Z',
    playCount: 3410000,
    likeCount: 104000,
    repostCount: 1070,
    commentCount: 131,
    viewerHasLiked: false,
    viewerHasReposted: false,
    playbackState: 'Playable',
    previewDurationSeconds: 30,
    typeLabel: 'Music',
    waveform: createWaveform(14),
  },
  'trk-2026-011': {
    id: 'trk-2026-011',
    title: 'Dust After Rain',
    artist: 'Nadine Waleed',
    artistHandle: '@nadinewaleed',
    artistAvatar:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=240&auto=format&fit=crop',
    cover:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=900&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 214,
    description: 'Soft pads, dry vocals, and a city-night pulse.',
    genre: 'Indie Electronic',
    location: 'Alexandria, Egypt',
    postedAt: '2026-03-12T19:20:00.000Z',
    playCount: 4980000,
    likeCount: 149000,
    repostCount: 1638,
    commentCount: 502,
    viewerHasLiked: true,
    viewerHasReposted: false,
    playbackState: 'Playable',
    previewDurationSeconds: 30,
    typeLabel: 'Music',
    waveform: createWaveform(11),
  },
  'trk-2026-009': {
    id: 'trk-2026-009',
    title: 'Neon Harbor',
    artist: 'Basel Karim',
    artistHandle: '@baselkarim',
    artistAvatar:
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?q=80&w=240&auto=format&fit=crop',
    cover:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=900&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 196,
    description: 'A tighter, brighter cut with fast transient drums.',
    genre: 'Synthwave',
    location: 'Dubai, UAE',
    postedAt: '2026-02-18T18:00:00.000Z',
    playCount: 117000,
    likeCount: 1000,
    repostCount: 24,
    commentCount: 19,
    viewerHasLiked: false,
    viewerHasReposted: false,
    playbackState: 'Preview',
    previewDurationSeconds: 45,
    typeLabel: 'Music',
    waveform: createWaveform(9),
  },
  'trk-2026-006': {
    id: 'trk-2026-006',
    title: 'Blue Taxi Radio',
    artist: 'Lina Osama',
    artistHandle: '@linaosama',
    artistAvatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=240&auto=format&fit=crop',
    cover:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=900&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 241,
    description: 'Broken-beat drums and a spacious chorus for the drive home.',
    genre: 'Alt Pop',
    location: 'Amman, Jordan',
    postedAt: '2026-02-04T22:40:00.000Z',
    playCount: 860000,
    likeCount: 28000,
    repostCount: 512,
    commentCount: 74,
    viewerHasLiked: true,
    viewerHasReposted: true,
    playbackState: 'Playable',
    previewDurationSeconds: 30,
    typeLabel: 'Music',
    waveform: createWaveform(6),
  },
  'trk-2026-018': {
    id: 'trk-2026-018',
    title: 'Velvet Static',
    artist: 'Mina Selim',
    artistHandle: '@minaselim',
    artistAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=240&auto=format&fit=crop',
    cover:
      'https://images.unsplash.com/photo-1496293455970-f8581aae0e3b?q=80&w=900&auto=format&fit=crop',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    duration: 229,
    description: 'Muted kicks, tape wash, and a darker club edge.',
    genre: 'House',
    location: 'Beirut, Lebanon',
    postedAt: '2026-03-31T21:50:00.000Z',
    playCount: 690000,
    likeCount: 22000,
    repostCount: 402,
    commentCount: 58,
    viewerHasLiked: true,
    viewerHasReposted: true,
    playbackState: 'Playable',
    previewDurationSeconds: 30,
    typeLabel: 'Music',
    waveform: createWaveform(18),
  },
}

const playlists = {
  pl_98x72abc: {
    id: 'pl_98x72abc',
    title: 'Cairo After Midnight',
    creatorName: 'medo',
    creatorHandle: '@medo',
    cover:
      'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=300&q=80',
    likes: 1,
    trackCount: 3,
  },
  pl_44y89xyz: {
    id: 'pl_44y89xyz',
    title: 'Arabic Chill Finds',
    creatorName: 'Yosr Nehad',
    creatorHandle: '@yosrnehad',
    cover:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=300&q=80',
    likes: 8,
    trackCount: 7,
  },
  pl_77m20qwe: {
    id: 'pl_77m20qwe',
    title: 'car',
    creatorName: 'Yosr Nehad',
    creatorHandle: '@yosrnehad',
    cover:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=80',
    likes: 3,
    trackCount: 5,
  },
}

const comment = (id, user, text, createdAt, timestampMs = null) => ({
  id,
  user,
  text,
  created_at: createdAt,
  timestamp_ms: timestampMs,
})

const engagement = {
  'trk-2026-014': {
    comments: [
      comment('c-01', users.noor, 'The bass here is gorgeous.', '2026-04-01T18:00:00.000Z', 32000),
      comment('c-02', users.omar, 'That drop feels so clean.', '2026-04-02T20:40:00.000Z', 118000),
      comment('c-03', users.dana, 'Love the room tone on the vocal take.', '2026-04-03T09:10:00.000Z', 183000),
      comment('c-04', users.khaled, 'This whole mix feels very SoundCloud-era in the best way.', '2026-04-03T21:30:00.000Z'),
      comment('c-05', users.farah, 'The transition at 1:41 deserves a replay.', '2026-04-04T11:22:00.000Z', 101000),
      comment('c-06', users.hazem, 'Snare pocket is crazy.', '2026-04-04T12:05:00.000Z', 44000),
      comment('c-07', users.menna, 'Hook landed immediately for me.', '2026-04-04T13:40:00.000Z', 86000),
      comment('c-08', users.ibrahim, 'Perfect late-night headphones track.', '2026-04-05T08:10:00.000Z'),
    ],
    likers: [
      users.rana,
      users.youssef,
      users.salma,
      users.farah,
      users.noor,
      users.omar,
    ],
    reposters: [users.hazem, users.leila, users.ibrahim, users.gamal, users.farah],
    fans: [
      { ...users.rana, plays: 233 },
      { ...users.hazem, plays: 233 },
      { ...users.ibrahim, plays: 212 },
      { ...users.gamal, plays: 186 },
      { ...users.menna, plays: 136 },
    ],
    relatedTrackIds: ['trk-2026-011', 'trk-2026-009', 'trk-2026-006', 'trk-2026-018'],
    playlistIds: ['pl_98x72abc', 'pl_44y89xyz', 'pl_77m20qwe'],
  },
}

const recentlyPlayed = [
  {
    id: 'trk-2026-014',
    title: 'Desert Skyline (Live Take)',
    artist: 'Mayar Ayman',
    cover:
      'https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?q=80&w=900&auto=format&fit=crop',
    duration: 248,
    played_at: '2026-04-04T08:45:00.000Z',
    duration_played_ms: 226000,
  },
  {
    id: 'trk-2026-011',
    title: 'Dust After Rain',
    artist: 'Nadine Waleed',
    cover:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=900&auto=format&fit=crop',
    duration: 214,
    played_at: '2026-04-03T22:15:00.000Z',
    duration_played_ms: 214000,
  },
  {
    id: 'trk-2026-009',
    title: 'Neon Harbor',
    artist: 'Basel Karim',
    cover:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=900&auto=format&fit=crop',
    duration: 196,
    played_at: '2026-04-03T19:30:00.000Z',
    duration_played_ms: 88000,
  },
]

const history = [
  ...recentlyPlayed,
  {
    id: 'trk-2026-006',
    title: 'Blue Taxi Radio',
    artist: 'Lina Osama',
    cover:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=900&auto=format&fit=crop',
    duration: 241,
    played_at: '2026-04-02T23:55:00.000Z',
    duration_played_ms: 241000,
  },
]

export const trackExperienceMockData = {
  viewer: users.you,
  tracks,
  playlists,
  engagement,
  recentlyPlayed,
  history,
}
