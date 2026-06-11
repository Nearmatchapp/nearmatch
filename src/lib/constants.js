// Márka-konstansok, statikus adatok — az App.jsx-ből kiemelve

export const STRIPE_PRICE_ID = "price_1TcXG4B9BUbmA0wIpIjDmRuf";
export const STRIPE_BOOST_PRICE_ID = "price_1Td5GlB9BUbmA0wI8uXEdzef";
export const STRIPE_REVEAL_PRICE_ID = "price_1TdanQB9BUbmA0wIIvVBccrw";

export const C = {
  bg: "#080b10", surface: "#0f1520", card: "#141c2b",
  border: "rgba(255,255,255,0.07)", accent: "#ff5c5c",
  accentSoft: "rgba(255,92,92,0.12)", accentGlow: "rgba(255,92,92,0.35)",
  orange: "#ff8c42", yellow: "#ffd43b", green: "#3ecf8e",
  text: "#f0f4ff", muted: "rgba(240,244,255,0.55)", dim: "rgba(240,244,255,0.2)",
};

export const INTERESTS_ALL = [
  // Sport & Mozgás
  "🏃 Futás","🏋️ Edzés","🧘 Yoga","🚴 Kerékpározás","⚽ Foci","🏊 Úszás","🎾 Tenisz","🏄 Szörfözés","🧗 Mászás","🏔️ Túrázás","⛷️ Síelés","🥊 Harcművészet","🏀 Kosár","🎿 Snowboard","🤸 Gimnasztika",
  // Zene & Szórakozás
  "🎵 Zene","🎸 Gitár","🥁 Dob","🎹 Zongora","🎤 Énekelés","🎧 DJ","🎶 Koncertek","🎷 Jazz","🎺 Fúvós","🪗 Akusztikus",
  // Gasztronómia
  "🍕 Pizza","🍣 Sushi","☕ Kávé","🍷 Bor","🍺 Sör","🍰 Sütés","👨‍🍳 Főzés","🌮 Street food","🫖 Tea","🧃 Smoothie",
  // Kultúra & Művészet
  "🎨 Festés","📸 Fotózás","🎬 Film","📚 Olvasás","🎭 Színház","💃 Tánc","🖼️ Kiállítás","✍️ Írás","🎙️ Podcast","📖 Könyvklub",
  // Természet & Utazás
  "🌿 Természet","✈️ Utazás","🏕️ Kempingezés","🌊 Tengerpart","🌄 Napkelte","🌍 Backpacking","🐾 Állatvédelem","🌱 Kertészkedés","♻️ Fenntarthatóság","🦋 Madármegfigyelés",
  // Tech & Játék
  "🎮 Gaming","💻 Kódolás","📱 Tech","🤖 AI","🎲 Társasjáték","♟️ Sakk","🎯 Darts","🎳 Bowling","🃏 Kártyajáték","🕹️ Retro gaming",
  // Életmód
  "🐶 Kutyás","🐱 Macskás","🧳 Minimalizmus","🛋️ Otthon","🧶 Kézművesség","🌸 Wellness","💆 Meditáció","🎁 DIY","🛁 Self-care","🌙 Éjjeli bagoly",
];

export const LOOKING_FOR_OPTIONS = [
  { l: "Komoly kapcsolat", i: "💍" },
  { l: "Laza ismerkedés", i: "✨" },
  { l: "Új barátok", i: "👋" },
  { l: "Meglátjuk", i: "🤷" },
];

export const EDU_OPTIONS = ["Középiskola","Szakképzés","Főiskola / BA","Egyetem / MA","PhD"];
export const SMOKING_OPTIONS = ["Nem dohányzik","Alkalmanként","Rendszeresen","Leszokott"];

export const COMPLIMENT_CARDS = {
  female: {
    "💫 Megjelenés": [
      "Te vagy ma a legszebb lány, akit láttam",
      "A mosolyod feldobta a napom",
      "A szemed teljesen lenyűgözött",
      "Olyan természetes szépséged van, ami ritkaság",
      "Olyan kisugárzásod van, amit nem lehet figyelmen kívül hagyni",
      "Te vagy a legsármosabb lány ma a közelemben",
    ],
    "👗 Stílus": [
      "Ma a te outfited a legjobb, amit láttam",
      "A stílusod teljesen egyedi és imádom",
      "Pontosan tudod hogyan kell öltözni",
      "Az összeállításod chef's kiss 🤌",
      "A vibes-od már a fotókból átjön",
      "Olyan ízlésed van, ami azonnali figyelmet kelt",
    ],
    "✨ Személyiség": [
      "A bio-d alapján azonnal szimpatikus vagy",
      "Olyan lánynak tűnsz akivel soha nem unatkozna az ember",
      "Az érdeklődési köreid alapján teljesen összeillünk",
      "Az a fajta energia árad belőled, ami magával ragad",
      "Úgy érzem, veled mindig lehetne miről beszélni",
    ],
    "❤️ Romantikus": [
      "Rád gondoltam mielőtt erre az appra nyitottam",
      "Szerintem egy randi veled élmény lenne",
      "Ha közelebb lennénk, mindenképp megszólítanálak",
      "Egy kávé veled – ez ma az én álmom",
      "Azt kívánom, bárcsak hamarabb találkoztunk volna",
    ],
  },
  male: {
    "💫 Megjelenés": [
      "Te vagy ma a legszebb fiú, akit láttam",
      "A mosolyod feldobta a napom",
      "A szemed teljesen lenyűgözött",
      "Olyan természetes kisugárzásod van, ami ritkaság",
      "Olyan magabiztosság árad belőled, amit nem lehet figyelmen kívül hagyni",
      "Te vagy a legsármosabb fiú ma a közelemben",
    ],
    "👗 Stílus": [
      "Ma a te outfited a legjobb, amit láttam",
      "A stílusod teljesen egyedi és imádom",
      "Pontosan tudod hogyan kell öltözni",
      "Az összeállításod chef's kiss 🤌",
      "A vibes-od már a fotókból átjön",
      "Olyan ízlésed van, ami azonnali figyelmet kelt",
    ],
    "✨ Személyiség": [
      "A bio-d alapján azonnal szimpatikus vagy",
      "Olyan fickónak tűnsz akivel soha nem unatkozna az ember",
      "Az érdeklődési köreid alapján teljesen összeillünk",
      "Az a fajta energia árad belőled, ami magával ragad",
      "Úgy érzem, veled mindig lehetne miről beszélni",
    ],
    "❤️ Romantikus": [
      "Rád gondoltam mielőtt erre az appra nyitottam",
      "Szerintem egy randi veled élmény lenne",
      "Ha közelebb lennénk, mindenképp megszólítanálak",
      "Egy kávé veled – ez ma az én álmom",
      "Azt kívánom, bárcsak hamarabb találkoztunk volna",
    ],
  },
  other: {
    "💫 Megjelenés": [
      "Te vagy ma a legsugárzóbb ember, akit láttam",
      "A mosolyod feldobta a napom",
      "A szemed teljesen lenyűgözött",
      "Olyan természetes szépséged van, ami ritkaság",
      "Olyan kisugárzásod van, amit nem lehet figyelmen kívül hagyni",
    ],
    "👗 Stílus": [
      "Ma a te outfited a legjobb, amit láttam",
      "A stílusod teljesen egyedi és imádom",
      "Az összeállításod chef's kiss 🤌",
      "A vibes-od már a fotókból átjön",
    ],
    "✨ Személyiség": [
      "A bio-d alapján azonnal szimpatikus vagy",
      "Olyan embernek tűnsz akivel soha nem unatkozna az ember",
      "Az érdeklődési köreid alapján teljesen összeillünk",
      "Úgy érzem, veled mindig lehetne miről beszélni",
    ],
    "❤️ Romantikus": [
      "Rád gondoltam mielőtt erre az appra nyitottam",
      "Szerintem egy randi veled élmény lenne",
      "Egy kávé veled – ez ma az én álmom",
      "Azt kívánom, bárcsak hamarabb találkoztunk volna",
    ],
  },
};

export const getCardsForGender = (gender) => {
  if (gender === "Nő" || gender === "female") return COMPLIMENT_CARDS.female;
  if (gender === "Férfi" || gender === "male") return COMPLIMENT_CARDS.male;
  return COMPLIMENT_CARDS.other;
};
