export interface Verse {
  number: number;
  text: string;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  verses: Verse[];
}

export interface TranslationResponse {
  code: number;
  status: string;
  data: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    ayahs: {
      number: number;
      text: string;
    }[];
  };
}

export interface AudioEdition {
  identifier: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
}

export interface SurahAudioResponse {
  code: number;
  status: string;
  data: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    audio: string;
  };
}
