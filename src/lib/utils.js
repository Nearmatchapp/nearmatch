// Tiszta segédfüggvények — az App.jsx-ből kiemelve, supabase-függés nélkül

export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export function getTodayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }

// Pontos életkor: hónapot/napot is figyelembe vesz (a puszta évkülönbség
// a 18. születésnap előtt állókat is átengedné a korhatár-ellenőrzésen)
export function calcAge(birthdate, now = new Date()) {
  if (!birthdate) return null;
  const b = new Date(birthdate);
  if (isNaN(b.getTime())) return null;
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

// ISO hét kulcs (ÉÉÉÉHH), a Postgres to_char(now(),'IYYYIW')-vel egyezően —
// a heti ingyenes boost limitet a szerver ezzel tartja nyilván
export function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const isoYear = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return isoYear * 100 + week;
}

// Hátralévő boost-idő ms-ban a profil boost_expires_at mezőjéből
export function boostMillisLeft(profile, now = Date.now()) {
  if (!profile?.boost_expires_at) return 0;
  const end = new Date(profile.boost_expires_at).getTime();
  if (isNaN(end)) return 0;
  return Math.max(0, end - now);
}

// Olvasatlan jelölés a match-listán (B6: a badge eddig sosem jelent meg,
// mert az unread mező sehol nem kapott értéket)
export function applyUnread(matches, unreadMatchIds) {
  return matches.map(m => ({ ...m, unread: unreadMatchIds.has(m.id) }));
}

// Közös láthatósági szabály: ki jelenhet meg a Radar/Swipe listákban
export function isProfileListable(u, { swipedIds, likedUsIds }) {
  if (u.is_banned) return false;
  if (swipedIds.has(u.id)) return false;
  // Inkognito: csak annak látszik, aki likeolta őt
  if (u.is_incognito && !likedUsIds.has(u.id)) return false;
  return true;
}

// Kiszűri a bióból az Instagram (és egyéb közösségi) elérhetőség-megosztást,
// hogy a felhasználók ne vigyék le a beszélgetést a platformról. Kezeli:
//   @felhasznalonev · instagram.com/nev · "insta: nev" · "ig - nev" · "IG @nev" stb.
// Szándékosan elválasztót (vagy @-ot) vár a kulcsszó után, hogy a normál
// mondatokat ("imádom az instagramot") ne csonkítsa meg.
export function sanitizeBio(text) {
  if (!text) return text;
  let out = text;
  // 1) Teljes profil-URL-ek
  out = out.replace(/(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am|ig\.me|tiktok\.com|facebook\.com|fb\.com|fb\.me|snapchat\.com)\/\S+/gi, "");
  // 2) Kulcsszó + elválasztó (: = . - @ /) + felhasználónév
  out = out.replace(/\b(?:insta(?:gram)?|ig|snap(?:chat)?|tiktok|fb|facebook)\b\s*[:=._\-–—@/]+\s*@?[a-z0-9._]{2,30}/gi, "");
  // 3) Maradék @említések (email-t nem bánt, mert előtte szóköz/sorelej kell)
  out = out.replace(/(^|[^\w@./])@[a-z0-9._]{2,30}/gi, "$1");
  // 4) A kivágások utáni felesleges szóközök/üres sorok rendezése
  return out.replace(/[ \t]{2,}/g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function getGhostLabel(score) {
  if (score === null || score === undefined) return null;
  if (score >= 81) return { label: "Kiváló válaszoló", desc: "Szinte mindig ír vissza", emoji: "🌟", color: "#3ecf8e" };
  if (score >= 61) return { label: "Megbízható", desc: "Általában válaszol", emoji: "😊", color: "#69db7c" };
  if (score >= 41) return { label: "Közepes", desc: "Néha nem ír vissza", emoji: "😐", color: "#ffd43b" };
  if (score >= 21) return { label: "Gyenge válaszoló", desc: "Ritkán ír vissza", emoji: "😶", color: "#ff8c42" };
  return { label: "Szellem", desc: "Szinte soha nem válaszol", emoji: "👻", color: "#ff5c5c" };
}

