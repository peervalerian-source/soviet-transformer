export interface SwearWord {
  russian: string;
  german: string;
  transliteration: string;
  level: 'mild' | 'medium' | 'heavy';
  context: string;
}

export const SWEAR_DECK: SwearWord[] = [
  // Mild - alltaeglich
  { russian: 'Блин', german: 'Mist / Verdammt', transliteration: 'blin', level: 'mild', context: 'Wie "Mist!" - sehr haeufig, harmlos' },
  { russian: 'Чёрт', german: 'Teufel / Verflixt', transliteration: 'tschjort', level: 'mild', context: 'Wie "Verdammt nochmal!"' },
  { russian: 'Чёрт возьми', german: 'Zum Teufel!', transliteration: 'tschjort wosmí', level: 'mild', context: 'Staerkere Version von Чёрт' },
  { russian: 'Фиг', german: 'Dreck / Mist', transliteration: 'fig', level: 'mild', context: 'Milde Ersatzform fuer schlimmeres' },
  { russian: 'Ёлки-палки', german: 'Heiliger Strohsack!', transliteration: 'jólki-pálki', level: 'mild', context: 'Ueberraschung, Euphemismus' },
  { russian: 'Ёпрст', german: 'Verdammich!', transliteration: 'jóprst', level: 'mild', context: 'Zensierte Form von etwas Staerkerem' },
  { russian: 'Капец', german: 'Krass / Heftig', transliteration: 'kapjéz', level: 'mild', context: 'Milde Ersatzform, wie "Alter!"' },
  { russian: 'Офигеть', german: 'Wahnsinn / Krass', transliteration: 'ofigét', level: 'mild', context: '"Das ist ja irre!" - Ueberraschung' },
  { russian: 'Ни фига себе', german: 'Nicht schlecht! / Alter!', transliteration: 'ni figá sebé', level: 'mild', context: 'Staunen, Ueberraschung' },
  { russian: 'Задолбал', german: 'Du nervst extrem', transliteration: 'zadolbál', level: 'mild', context: 'Wenn jemand nervt' },
  { russian: 'Достал', german: 'Du gehst mir auf die Nerven', transliteration: 'dostál', level: 'mild', context: 'Genervt sein' },
  { russian: 'Отвали', german: 'Hau ab / Verpiss dich', transliteration: 'otwalí', level: 'mild', context: 'Jemanden wegschicken' },

  // Medium
  { russian: 'Дурак', german: 'Dummkopf / Idiot', transliteration: 'durák', level: 'medium', context: 'Maennlich. Weiblich: Дура (durá)' },
  { russian: 'Дура', german: 'Dumme / Idiotin', transliteration: 'durá', level: 'medium', context: 'Weibliche Form von Дурак' },
  { russian: 'Идиот', german: 'Idiot', transliteration: 'idiót', level: 'medium', context: 'Wie im Deutschen' },
  { russian: 'Козёл', german: 'Arschloch (wrtl: Ziegenbock)', transliteration: 'kosjól', level: 'medium', context: 'Haeufige Beleidigung fuer Maenner' },
  { russian: 'Сволочь', german: 'Mistkerl / Drecksack', transliteration: 'swólotsch', level: 'medium', context: 'Starke Beleidigung, geschlechtsneutral' },
  { russian: 'Придурок', german: 'Vollidiot / Depp', transliteration: 'pridúrok', level: 'medium', context: 'Staerker als Дурак' },
  { russian: 'Мудак', german: 'Arschloch / Wichser', transliteration: 'mudák', level: 'medium', context: 'Sehr haeufig, beleidigend' },
  { russian: 'Стерва', german: 'Miststueck / Biest', transliteration: 'stérwa', level: 'medium', context: 'Fuer Frauen, kann auch "tough" bedeuten' },
  { russian: 'Жопа', german: 'Arsch', transliteration: 'schópa', level: 'medium', context: 'Koerperteil + allgemeine Frustration' },
  { russian: 'Засранец', german: 'Dreckiger Mistkerl', transliteration: 'zasránez', level: 'medium', context: 'Ziemlich beleidigend' },
  { russian: 'Заткнись', german: 'Halt die Fresse', transliteration: 'zatknís', level: 'medium', context: 'Sehr direkt, unhoefllich' },

  // Heavy - Mat (russische Schimpfwoerter-Kategorie)
  { russian: 'Блять', german: 'Schei*e / F*ck', transliteration: 'bljat', level: 'heavy', context: 'Allzweck-Fluch, extrem haeufig' },
  { russian: 'Сука', german: 'Schlampe / Miststueck', transliteration: 'súka', level: 'heavy', context: 'Wrtl: Huendin. Sehr beleidigend' },
  { russian: 'Пиздец', german: 'Totale Schei*e / Katastrophe', transliteration: 'pizdéz', level: 'heavy', context: 'Wenn alles schiefgeht' },
  { russian: 'Хуй', german: 'Schwanz (vulgaer)', transliteration: 'chúj', level: 'heavy', context: 'Sehr vulgaer, Basis vieler Ausdruecke' },
  { russian: 'Иди на хуй', german: 'Verpiss dich / F*ck dich', transliteration: 'idí na chúj', level: 'heavy', context: 'Ultimative Beleidigung' },
  { russian: 'Ёб твою мать', german: 'F*ck deine Mutter', transliteration: 'job twojú mat', level: 'heavy', context: 'Einer der staerksten Flueche' },
  { russian: 'Сукин сын', german: 'Hurensohn', transliteration: 'súkin syn', level: 'heavy', context: 'Klassische schwere Beleidigung' },
  { russian: 'Пошёл на хуй', german: 'Verpiss dich (sehr vulgaer)', transliteration: 'paschól na chúj', level: 'heavy', context: 'Noch staerker als Иди на хуй' },
  { russian: 'Ебать', german: 'F*cken', transliteration: 'jebát', level: 'heavy', context: 'Verb, Basis vieler Ausdruecke' },
  { russian: 'Ни хуя себе', german: 'Was zum F*ck?!', transliteration: 'ni chujá sebé', level: 'heavy', context: 'Extremes Staunen/Schock' },
  { russian: 'Бляха-муха', german: 'So ein Mist! (Euphemismus)', transliteration: 'bljácha-múcha', level: 'heavy', context: 'Zensierte Version von Блять' },
];
