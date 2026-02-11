import type { ImageSource } from "expo-image";

export interface LibraryTrack {
  id: string;
  title: string;
  reciter: string;
  durationLabel: string;
  audioUrl: string;
}

export interface LibraryCollection {
  id: string;
  title: string;
  subtitle: string;
  imageSource: ImageSource;
  tracks: LibraryTrack[];
}

const RECITER = "Abdul Basit";
const BASE_URL = "https://download.quranicaudio.com/quran/abdul_basit_murattal";

export const LIBRARY_COLLECTIONS: LibraryCollection[] = [
  {
    id: "sleep",
    title: "Sleep Halo",
    subtitle: "Calm recitations for a soft nightly transition.",
    imageSource: require("@/public/images/_source/library-cover-sleep-halo-v01.webp"),
    tracks: [
      {
        id: "sleep-067",
        title: "Surah Al-Mulk (67)",
        reciter: RECITER,
        durationLabel: "8 min",
        audioUrl: `${BASE_URL}/067.mp3`,
      },
      {
        id: "sleep-078",
        title: "Surah An-Naba (78)",
        reciter: RECITER,
        durationLabel: "6 min",
        audioUrl: `${BASE_URL}/078.mp3`,
      },
      {
        id: "sleep-112",
        title: "Surah Al-Ikhlas (112)",
        reciter: RECITER,
        durationLabel: "1 min",
        audioUrl: `${BASE_URL}/112.mp3`,
      },
    ],
  },
  {
    id: "anxiety",
    title: "Ease Anxiety",
    subtitle: "Grounding passages to steady the heart and breath.",
    imageSource: require("@/public/images/_source/library-cover-anxiety-contour-v01.webp"),
    tracks: [
      {
        id: "anxiety-013",
        title: "Surah Ar-Ra'd (13)",
        reciter: RECITER,
        durationLabel: "12 min",
        audioUrl: `${BASE_URL}/013.mp3`,
      },
      {
        id: "anxiety-093",
        title: "Surah Ad-Duha (93)",
        reciter: RECITER,
        durationLabel: "2 min",
        audioUrl: `${BASE_URL}/093.mp3`,
      },
      {
        id: "anxiety-094",
        title: "Surah Ash-Sharh (94)",
        reciter: RECITER,
        durationLabel: "2 min",
        audioUrl: `${BASE_URL}/094.mp3`,
      },
    ],
  },
  {
    id: "gratitude",
    title: "Gratitude Arc",
    subtitle: "Morning recitations to begin with shukr and clarity.",
    imageSource: require("@/public/images/_source/library-cover-gratitude-arc-v01.webp"),
    tracks: [
      {
        id: "gratitude-001",
        title: "Surah Al-Fatihah (1)",
        reciter: RECITER,
        durationLabel: "2 min",
        audioUrl: `${BASE_URL}/001.mp3`,
      },
      {
        id: "gratitude-055",
        title: "Surah Ar-Rahman (55)",
        reciter: RECITER,
        durationLabel: "13 min",
        audioUrl: `${BASE_URL}/055.mp3`,
      },
      {
        id: "gratitude-110",
        title: "Surah An-Nasr (110)",
        reciter: RECITER,
        durationLabel: "1 min",
        audioUrl: `${BASE_URL}/110.mp3`,
      },
    ],
  },
];
