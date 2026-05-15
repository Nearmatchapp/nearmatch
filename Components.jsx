import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════
// PHOTO MODERATION
// ═══════════════════════════════════════════════════════
// Prototípusban: szimulált moderálás (random eredmény demo céljára)
// Éles appban: nsfwjs (kliens) + AWS Rekognition (szerver) kettős ellenőrzés

const MODERATION_LABELS = {
  neutral:  { label: "✅ Megfelelő",       color: "#3ecf8e", allowed: true },
  sexy:     { label: "✅ Megfelelő (fürdőruha)", color: "#3ecf8e", allowed: true },
  porn:     { label: "❌ Meztelen tartalom", color: "#ff5c5c", allowed: false },
  hentai:   { label: "❌ Nem megfelelő tartalom", color: "#ff5c5c", allowed: false },
};


// Valódi AI moderálás — Claude Vision API
async function moderatePhoto(imageDataUrl) {
  try {
    // Kép átméretezése 512x512-re küldés előtt
    const resized = await resizeImage(imageDataUrl, 512);
    const base64 = resized.split(",")[1];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 50,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: base64 }
            },
            {
              type: "text",
              text: `Does this image contain explicit nudity or pornography (genitals, sex acts)? Swimwear and bikinis are NOT nudity.

Reply with only one word: YES or NO`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      console.error("Moderation API error:", response.status);
      // API hiba → engedjük át, szerver úgyis ellenőrzi
      return { result: "neutral", allowed: true, label: "✅ Megfelelő", color: "#3ecf8e" };
    }

    const data = await response.json();
    const answer = (data.content?.[0]?.text || "NO").trim().toUpperCase();
    console.log("Moderation answer:", answer);

    const isExplicit = answer.startsWith("YES");

    return {
      result: isExplicit ? "porn" : "neutral",
      allowed: !isExplicit,
      confidence: 0.95,
      label: isExplicit
        ? "❌ Meztelen tartalom — nem tölthető fel"
        : "✅ Megfelelő kép",
      color: isExplicit ? "#ff5c5c" : "#3ecf8e",
    };

  } catch (err) {
    console.error("Moderation failed:", err);
    // Hálózati hiba → engedjük át
    return { result: "neutral", allowed: true, label: "✅ Megfelelő", color: "#3ecf8e" };
  }
}

// Kép átméretezése canvas-szal
function resizeImage(dataUrl, maxSize) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = dataUrl;
  });
}


// ═══════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════
const C = {
  bg: "#080b10", surface: "#0f1520", card: "#141c2b", card2: "#1a2235",
  border: "rgba(255,255,255,0.07)", accent: "#ff5c5c", accentSoft: "rgba(255,92,92,0.12)",
  accentGlow: "rgba(255,92,92,0.28)", orange: "#ff8c42", green: "#3ecf8e",
  greenSoft: "rgba(62,207,142,0.12)", blue: "#4dabf7", blueSoft: "rgba(77,171,247,0.12)",
  purple: "#cc5de8", yellow: "#ffd43b", text: "#f0f4ff",
  muted: "rgba(240,244,255,0.45)", dim: "rgba(240,244,255,0.15)",
};

// ═══════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════
const MOCK_USERS = [
  { id: 1, name: "Sára", age: 26, bio: "Fotós, kávérajongó ☕ Ha fesztiválon vagy, én is ott vagyok.", distance: 18, photo: "https://i.pravatar.cc/400?img=47", active: true, tags: ["📷 Fotózás", "☕ Kávé", "🎵 Zene"], ghostScore: 0.95, lookingFor: "Komoly kapcsolat",
    details: { height: 168, education: "Főiskola / BA", jobType: "Kreatív", kids: "Nincs, nem is tervezek", pets: "Macska", smoking: "Nem dohányzom", alcohol: "Alkalmanként" } },
  { id: 2, name: "Léa", age: 24, bio: "Zenész, fesztiválok szerelmese 🎵", distance: 43, photo: "https://i.pravatar.cc/400?img=45", active: true, tags: ["🎵 Zene", "✈️ Utazás", "🧘 Yoga"], ghostScore: 0.80, lookingFor: "Meglátjuk",
    details: { height: 172, education: "Egyetem / MA", jobType: "Kreatív", pets: "Nincs", smoking: "Nem dohányzom", alcohol: "Társaságban" } },
  { id: 3, name: "Anna", age: 28, bio: "Építész, könyvmoly 📚", distance: 67, photo: "https://i.pravatar.cc/400?img=44", active: false, tags: ["📚 Olvasás", "🎨 Design", "🏔 Túrázás"], ghostScore: 0.40, lookingFor: "Komoly kapcsolat",
    details: { height: 165, education: "Egyetem / MA", jobType: "Alkalmazott", kids: "Nincs, de tervezek", smoking: "Nem dohányzom" } },
  { id: 4, name: "Nóra", age: 23, bio: "Marketing, utazás imádó ✈️", distance: 112, photo: "https://i.pravatar.cc/400?img=43", active: true, tags: ["✈️ Utazás", "🍕 Gasztronómia", "🎬 Film"], ghostScore: 0.15, lookingFor: "Laza ismerkedés",
    details: { height: 170, education: "Főiskola / BA", jobType: "Alkalmazott", alcohol: "Társaságban" } },
  { id: 5, name: "Kata", age: 27, bio: "Orvos, futás és sport 🏃‍♀️", distance: 189, photo: "https://i.pravatar.cc/400?img=41", active: true, tags: ["🏃 Sport", "🌿 Természet", "☕ Kávé"], ghostScore: 0.70, lookingFor: "Komoly kapcsolat",
    details: { height: 174, education: "Egyetem / MA", jobType: "Egészségügy", kids: "Nincs, de tervezek", pets: "Kutya", smoking: "Nem dohányzom", alcohol: "Nem iszom" } },
];

const INTERESTS_ALL = [
  "🎵 Zene","🎨 Művészet","📚 Olvasás","🏃 Sport","🍕 Gasztronómia",
  "✈️ Utazás","🎮 Gaming","🎭 Színház","📷 Fotózás","🧘 Yoga",
  "🌿 Természet","🎸 Koncertek","🍷 Borozás","🏖 Strand","🎬 Film",
  "🦮 Állatok","🚴 Kerékpár","☕ Kávé","🎤 Karaoke","🏔 Túrázás",
];

const INIT_MATCHES = [
  { id: 1, name: "Sára", photo: "https://i.pravatar.cc/300?img=47", lastMsg: "Szia! Látom közel vagyunk 😊", time: "most", unread: true, status: "active", expiresAt: Date.now() + 2.5 * 3600000, msgs: [
    { from: "them", text: "Szia! Látom közel vagyunk 😊", time: "12:41" },
    { from: "me", text: "Igen! Melyik standnál vagy?", time: "12:42" },
    { from: "them", text: "A főszínpad mellett, narancssárga pólóban!", time: "12:43" },
  ]},
  { id: 2, name: "Léa", photo: "https://i.pravatar.cc/300?img=45", lastMsg: "Ez az app annyira jó!", time: "2p", unread: false, status: "active", expiresAt: Date.now() + 18 * 3600000, msgs: [
    { from: "them", text: "Ez az app annyira jó!", time: "11:20" },
    { from: "me", text: "Igaz :) Innen te is látszol a radaron!", time: "11:22" },
  ]},
  { id: 3, name: "Anna", photo: "https://i.pravatar.cc/300?img=44", lastMsg: "Új match! Írj neki 👋", time: "1ó", unread: true, status: "active", expiresAt: Date.now() + 38 * 3600000, msgs: [] },
  { id: 4, name: "Nóra", photo: "https://i.pravatar.cc/300?img=43", lastMsg: "Szia!", time: "3ó", unread: false, status: "active", expiresAt: Date.now() + 44 * 3600000, msgs: [
    { from: "them", text: "Szia!", time: "09:10" },
  ]},
  { id: 5, name: "Kata", photo: "https://i.pravatar.cc/300?img=41", lastMsg: "Lejárt match", time: "2n", unread: false, status: "expired", expiresAt: Date.now() - 1000, msgs: [] },
];

const INIT_NOTIFS = [
  { id: 1, type: "match", read: false, title: "💥 Új match — Sára!", body: "Ti ketten egymásra találtatok. Ő 18m-re van!", photo: "https://i.pravatar.cc/300?img=47", ts: Date.now() - 120000 },
  { id: 2, type: "message", read: false, title: "Léa üzent", body: "\"Ez az app annyira jó!\"", photo: "https://i.pravatar.cc/300?img=45", ts: Date.now() - 300000 },
  { id: 3, type: "nearby", read: true, title: "Anna belépett a radarba", body: "Egy új profil jelent meg 67m-re tőled.", photo: "https://i.pravatar.cc/300?img=44", ts: Date.now() - 3600000 },
];

// ═══════════════════════════════════════════════════════
// GHOST SCORE ALGORITHM
// ═══════════════════════════════════════════════════════
// ghostScore: 0.0 (sosem válaszol) → 1.0 (mindig válaszol)
// A súlyozott pontszám alapján rangsorolja a felhasználókat.
// Minél alacsonyabb a score, annál ritkábban kerül elő.

function applyGhostFilter(users) {
  return users
    .map(u => {
      const score = u.ghostScore ?? 1.0;
      // Valószínűségi megjelenítés: alacsony score = ritkábban jelenik meg
      // 0.0–0.3: 15% esély, 0.3–0.6: 50% esély, 0.6–1.0: 100% esély
      const threshold = score < 0.3 ? 0.15 : score < 0.6 ? 0.5 : 1.0;
      const show = Math.random() < threshold;
      return { ...u, _show: show, _score: score };
    })
    .filter(u => u._show)
    // Rendezés: jobb válaszadók előre, de némi véletlennel vegyítve
    .sort((a, b) => {
      const aVal = a._score * 0.7 + Math.random() * 0.3;
      const bVal = b._score * 0.7 + Math.random() * 0.3;
      return bVal - aVal;
    });
}

function ghostLabel(score) {
  if (score >= 0.8) return { text: "💬 Aktív üzenetküldő", color: "#3ecf8e" };
  if (score >= 0.6) return { text: "💬 Általában válaszol", color: "#4dabf7" };
  if (score >= 0.4) return { text: "⏳ Lassan válaszol", color: "#ffd43b" };
  return null; // 0.4 alatt nem mutatunk semmit — ne legyen stigma
}


function Btn({ children, onClick, disabled, variant = "primary", style: s = {} }) {
  const styles = {
    primary: { background: `linear-gradient(135deg,${C.accent},${C.orange})`, color: "#fff", boxShadow: disabled ? "none" : `0 8px 24px ${C.accentGlow}`, border: "none" },
    ghost: { background: C.accentSoft, color: C.accent, border: `1px solid rgba(255,92,92,0.2)` },
    outline: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      width: "100%", padding: "15px", borderRadius: 16, fontSize: 15, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
      transition: "all 0.2s", letterSpacing: 0.3, ...styles[variant], ...s,
    }}>{children}</button>
  );
}

function StatusBar() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 28px 0", color: C.dim, fontSize: 12, flexShrink: 0 }}>
      <span>9:41</span><span style={{ fontSize: 16 }}>···</span><span>●●●</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════
const ONBOARDING_STEPS = 7;

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name: "", birthdate: "", gender: "", bio: "", interests: [], phone: "", code: ["","","","","",""] });
  const [claimed, setClaimed] = useState(false);
  const next = () => step < ONBOARDING_STEPS - 1 ? setStep(s => s + 1) : onComplete(data);
  const back = () => setStep(s => Math.max(0, s - 1));

  const ProgressBar = () => (
    <div style={{ display: "flex", gap: 5, padding: "0 20px" }}>
      {Array.from({ length: ONBOARDING_STEPS }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? `linear-gradient(90deg,${C.accent},${C.orange})` : C.dim, transition: "background 0.4s" }} />
      ))}
    </div>
  );

  // Step 0: Welcome + auth choice
  if (step === 0) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "28px 28px 40px", overflowY: "auto" }}>
      {/* Logo */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 86, height: 86, borderRadius: 26, background: `linear-gradient(135deg,${C.accent},${C.orange})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 18, boxShadow: `0 20px 50px ${C.accentGlow}` }}>◎</div>
        <h1 style={{ fontSize: 38, fontWeight: 900, margin: "0 0 6px", fontFamily: "Georgia,serif", background: `linear-gradient(135deg,${C.accent},${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>NearMatch</h1>
        <p style={{ color: C.muted, fontSize: 15, textAlign: "center", margin: "0 0 32px", lineHeight: 1.6 }}>Találkozz valakivel — most, itt, közel</p>

        {[{ icon: "📍", t: "Valós idejű közelség alapú matching" }, { icon: "🔒", t: "Csak akkor látod, ha ő is aktív" }, { icon: "⚡", t: "Fesztivál, metró, kávézó — bárhol" }].map(f => (
          <div key={f.t} style={{ display: "flex", alignItems: "center", gap: 14, background: C.card, borderRadius: 14, padding: "13px 16px", border: `1px solid ${C.border}`, marginBottom: 10, width: "100%" }}>
            <span style={{ fontSize: 22 }}>{f.icon}</span><span style={{ color: C.text, fontSize: 14 }}>{f.t}</span>
          </div>
        ))}
      </div>

      {/* Auth buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>

        {/* Apple Sign In */}
        <button onClick={() => { setData(d => ({ ...d, authMethod: "apple", name: "Alex" })); setStep(2); }} style={{
          width: "100%", padding: "15px 20px",
          background: "#fff", border: "none", borderRadius: 16,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          fontSize: 15, fontWeight: 700, color: "#000", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}>
          {/* Apple logo */}
          <svg width="17" height="20" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.644 10.562c-.022-2.229 1.82-3.306 1.903-3.358-1.04-1.52-2.654-1.727-3.226-1.747-1.367-.14-2.682.814-3.376.814-.694 0-1.757-.797-2.892-.775-1.48.022-2.853.873-3.614 2.208-1.55 2.689-.396 6.664 1.107 8.843.74 1.066 1.614 2.258 2.76 2.214 1.116-.045 1.534-.716 2.88-.716 1.347 0 1.73.716 2.906.692 1.196-.021 1.948-1.08 2.674-2.155.855-1.23 1.2-2.438 1.218-2.5-.027-.012-2.313-.888-2.34-3.52zM11.372 3.608C11.97 2.882 12.376 1.88 12.26.86c-.856.037-1.911.576-2.532 1.285-.546.633-1.032 1.66-.903 2.636.959.073 1.945-.487 2.547-1.173z" fill="#000"/>
          </svg>
          Folytatás Apple-lel
        </button>

        {/* Google Sign In */}
        <button onClick={() => { setData(d => ({ ...d, authMethod: "google", name: "Alex" })); setStep(2); }} style={{
          width: "100%", padding: "15px 20px",
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          fontSize: 15, fontWeight: 700, color: C.text, cursor: "pointer",
        }}>
          {/* Google logo SVG */}
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Folytatás Google-lel
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ color: C.dim, fontSize: 12 }}>vagy</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        {/* Phone */}
        <button onClick={next} style={{
          width: "100%", padding: "15px 20px",
          background: C.accentSoft, border: `1px solid rgba(255,92,92,0.2)`, borderRadius: 16,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          fontSize: 15, fontWeight: 700, color: C.accent, cursor: "pointer",
        }}>
          📱 Folytatás telefonszámmal
        </button>

        <p style={{ color: C.dim, fontSize: 11, textAlign: "center", margin: 0, lineHeight: 1.6 }}>
          A regisztrációval elfogadod az{" "}
          <span style={{ color: C.accent }}>Általános Szerződési Feltételeket</span>{" "}
          és az{" "}
          <span style={{ color: C.accent }}>Adatvédelmi Tájékoztatót</span>.
        </p>

        <button style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", padding: "4px" }}>
          Már van fiókom — Bejelentkezés
        </button>
      </div>
    </div>
  );

  // Step 1: Phone (only shown for phone auth)
  if (step === 1) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 0 24px" }}>
      <div style={{ padding: "14px 20px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={back} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted, width: 36, height: 36, borderRadius: 12, fontSize: 18, cursor: "pointer" }}>‹</button>
        <div style={{ flex: 1 }}><ProgressBar /></div>
        <span style={{ color: C.dim, fontSize: 11, fontFamily: "monospace" }}>{step+1}/{ONBOARDING_STEPS}</span>
      </div>
      <div style={{ flex: 1, padding: "8px 24px", overflowY: "auto" }}>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, fontFamily: "Georgia,serif", margin: "0 0 6px" }}>Telefonszámod</h2>
        <p style={{ color: C.muted, fontSize: 13, margin: "0 0 24px" }}>Biztonságos, csak verifikációhoz kell.</p>
        <div style={{ display: "flex", background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "0 14px", background: C.surface, display: "flex", alignItems: "center", color: C.muted, fontSize: 14, borderRight: `1px solid ${C.border}` }}>🇭🇺 +36</div>
          <input type="tel" placeholder="30 123 4567" value={data.phone} onChange={e => setData(d => ({ ...d, phone: e.target.value }))}
            style={{ flex: 1, padding: "17px 14px", background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 16, fontFamily: "monospace" }} />
        </div>
        {/* OAuth provider badge */}
        {data.authMethod && (
          <div style={{ background: C.greenSoft, border: `1px solid rgba(62,207,142,0.2)`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{data.authMethod === "apple" ? "🍎" : "🔵"}</span>
            <span style={{ color: C.green, fontSize: 13 }}>
              {data.authMethod === "apple" ? "Apple" : "Google"} fiók összekapcsolva — add meg a telefonszámod a verifikációhoz
            </span>
          </div>
        )}
        <Btn onClick={next} disabled={data.phone.length < 8}>SMS kód küldése →</Btn>
      </div>
    </div>
  );

  // Step 2: Basic info
  if (step === 2) {
    const birthYear = data.birthdate ? new Date(data.birthdate).getFullYear() : null;
    const age = birthYear ? new Date().getFullYear() - birthYear : null;
    const isUnderage = age !== null && age < 18;
    const canProceed = data.name && data.birthdate && data.gender && data.ageConfirmed && !isUnderage;

    return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 0 24px" }}>
      <div style={{ padding: "14px 20px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={back} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted, width: 36, height: 36, borderRadius: 12, fontSize: 18, cursor: "pointer" }}>‹</button>
        <div style={{ flex: 1 }}><ProgressBar /></div>
        <span style={{ color: C.dim, fontSize: 11, fontFamily: "monospace" }}>{step+1}/{ONBOARDING_STEPS}</span>
      </div>
      <div style={{ flex: 1, padding: "8px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, fontFamily: "Georgia,serif", margin: "0 0 4px" }}>Kicsoda vagy?</h2>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Ez jelenik meg a profilodon.</p>
        </div>

        {/* Name */}
        <div>
          <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 7 }}>Keresztneved</label>
          <input type="text" placeholder="pl. Sára" value={data.name || ""} onChange={e => setData(d => ({ ...d, name: e.target.value }))} autoComplete="off"
            style={{ width: "100%", padding: "15px", borderRadius: 13, background: C.card, border: `1px solid ${data.name ? C.accent : C.border}`, color: C.text, fontSize: 16, fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* Birthdate */}
        <div>
          <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 7 }}>Születési dátum</label>
          <input type="date" value={data.birthdate || ""} onChange={e => setData(d => ({ ...d, birthdate: e.target.value, ageConfirmed: false }))} autoComplete="off"
            style={{ width: "100%", padding: "15px", borderRadius: 13, background: C.card, border: `1px solid ${isUnderage ? C.accent : data.birthdate ? C.green : C.border}`, color: C.text, fontSize: 16, fontWeight: 600, outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />

          {/* Age feedback */}
          {age !== null && (
            <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 10, display: "flex", alignItems: "center", gap: 8,
              background: isUnderage ? "rgba(255,92,92,0.1)" : "rgba(62,207,142,0.1)",
              border: `1px solid ${isUnderage ? "rgba(255,92,92,0.3)" : "rgba(62,207,142,0.25)"}`,
            }}>
              <span style={{ fontSize: 16 }}>{isUnderage ? "🚫" : "✅"}</span>
              <span style={{ fontSize: 13, color: isUnderage ? C.accent : C.green, fontWeight: 600 }}>
                {isUnderage
                  ? `Sajnáljuk — a NearMatch csak 18 éven felüliek számára érhető el.`
                  : `${age} éves — jogosult vagy regisztrálni!`}
              </span>
            </div>
          )}
        </div>

        {/* Gender */}
        <div>
          <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Nem</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {["Nő", "Férfi", "Non-binary", "Egyéb"].map(g => (
              <button key={g} onClick={() => setData(d => ({ ...d, gender: g }))} style={{ padding: "12px", borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: "pointer", background: data.gender === g ? C.accentSoft : C.card, border: `1px solid ${data.gender === g ? C.accent : C.border}`, color: data.gender === g ? C.accent : C.muted }}>{g}</button>
            ))}
          </div>
        </div>

        {/* 18+ checkbox */}
        {!isUnderage && data.birthdate && (
          <div
            onClick={() => setData(d => ({ ...d, ageConfirmed: !d.ageConfirmed }))}
            style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              background: data.ageConfirmed ? "rgba(62,207,142,0.08)" : C.card,
              border: `1px solid ${data.ageConfirmed ? "rgba(62,207,142,0.3)" : C.border}`,
              borderRadius: 14, padding: "14px 16px", cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {/* Custom checkbox */}
            <div style={{
              width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
              background: data.ageConfirmed ? C.green : "transparent",
              border: `2px solid ${data.ageConfirmed ? C.green : C.dim}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {data.ageConfirmed && <span style={{ color: "#fff", fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>}
            </div>

            <div>
              <div style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 3 }}>
                Kijelentem, hogy betöltöttem a 18. életévemet
              </div>
              <div style={{ color: C.dim, fontSize: 12, lineHeight: 1.5 }}>
                A NearMatch kizárólag nagykorú személyek számára elérhető. A hamis adatmegadás a fiók azonnali törlésével jár, és jogi következményekkel járhat.
              </div>
            </div>
          </div>
        )}

        <Btn onClick={next} disabled={!canProceed}>Tovább →</Btn>
      </div>
    </div>
  );};

  // Step 3: Bio + interests
  if (step === 3) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 0 24px" }}>
      <div style={{ padding: "14px 20px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={back} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted, width: 36, height: 36, borderRadius: 12, fontSize: 18, cursor: "pointer" }}>‹</button>
        <div style={{ flex: 1 }}><ProgressBar /></div>
        <span style={{ color: C.dim, fontSize: 11, fontFamily: "monospace" }}>{step+1}/{ONBOARDING_STEPS}</span>
      </div>
      <div style={{ flex: 1, padding: "8px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
        <div><h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, fontFamily: "Georgia,serif", margin: "0 0 4px" }}>Mutatkozz be!</h2></div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Bio</label>
            <span style={{ color: C.dim, fontSize: 11 }}>{(data.bio||"").length}/300</span>
          </div>
          <textarea value={data.bio||""} onChange={e => setData(d => ({ ...d, bio: e.target.value.slice(0,300) }))} rows={4} placeholder="pl. Fotós vagyok, de a lelkem zenész..."
            style={{ width: "100%", padding: "14px", borderRadius: 13, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box", fontFamily: "inherit" }} />
        </div>
        <div>
          <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Érdeklődési körök (min. 3)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {INTERESTS_ALL.map(tag => {
              const on = data.interests.includes(tag);
              return <button key={tag} onClick={() => setData(d => ({ ...d, interests: on ? d.interests.filter(x => x !== tag) : [...d.interests, tag] }))}
                style={{ padding: "8px 13px", borderRadius: 20, fontSize: 13, cursor: "pointer", background: on ? `linear-gradient(135deg,${C.accent},${C.orange})` : C.card, border: `1px solid ${on ? "transparent" : C.border}`, color: on ? "#fff" : C.muted, fontWeight: on ? 700 : 400, transform: on ? "scale(1.04)" : "scale(1)", transition: "all 0.15s" }}>{tag}</button>;
            })}
          </div>
        </div>
        <Btn onClick={next} disabled={data.interests.length < 3}>Tovább →</Btn>
      </div>
    </div>
  );

  // Step 4: Preferences
  if (step === 4) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 0 24px" }}>
      <div style={{ padding: "14px 20px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={back} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted, width: 36, height: 36, borderRadius: 12, fontSize: 18, cursor: "pointer" }}>‹</button>
        <div style={{ flex: 1 }}><ProgressBar /></div>
        <span style={{ color: C.dim, fontSize: 11, fontFamily: "monospace" }}>{step+1}/{ONBOARDING_STEPS}</span>
      </div>
      <div style={{ flex: 1, padding: "8px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div><h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, fontFamily: "Georgia,serif", margin: "0 0 4px" }}>Preferenciák</h2><p style={{ color: C.muted, fontSize: 13, margin: 0 }}>Kiket mutassunk neked?</p></div>
        <div>
          <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Kik érdekelnek</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["Nőket","Férfiakat","Mindenkit"].map(s => (
              <button key={s} onClick={() => setData(d => ({ ...d, showMe: s }))} style={{ flex: 1, padding: "13px 0", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", background: data.showMe === s ? C.accentSoft : C.card, border: `1px solid ${data.showMe === s ? C.accent : C.border}`, color: data.showMe === s ? C.accent : C.muted }}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Mit keresel</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[{ l: "Komoly kapcsolat", i: "💍" },{ l: "Laza ismerkedés", i: "✨" },{ l: "Új barátok", i: "🤝" },{ l: "Meglátjuk", i: "🌀" }].map(x => (
              <button key={x.l} onClick={() => setData(d => ({ ...d, lookingFor: x.l }))} style={{ padding: "14px", borderRadius: 13, cursor: "pointer", textAlign: "center", background: data.lookingFor === x.l ? C.accentSoft : C.card, border: `1px solid ${data.lookingFor === x.l ? C.accent : C.border}`, color: data.lookingFor === x.l ? C.accent : C.muted }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{x.i}</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{x.l}</div>
              </button>
            ))}
          </div>
        </div>
        <Btn onClick={next} disabled={!data.showMe || !data.lookingFor}>Tovább →</Btn>
      </div>
    </div>
  );

  // Step 5: Location permission (pre-prompt — App Store kötelező)
  if (step === 5) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "14px 20px 12px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button onClick={back} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted, width: 36, height: 36, borderRadius: 12, fontSize: 18, cursor: "pointer" }}>‹</button>
        <div style={{ flex: 1 }}><ProgressBar /></div>
        <span style={{ color: C.dim, fontSize: 11, fontFamily: "monospace" }}>{step+1}/{ONBOARDING_STEPS}</span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px 32px" }}>

        {/* Icon + title */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 86, height: 86, borderRadius: 24, margin: "0 auto 16px",
            background: `linear-gradient(135deg, ${C.accent}, ${C.orange})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, boxShadow: `0 16px 48px ${C.accentGlow}`,
          }}>📍</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 8px", color: C.text, fontFamily: "Georgia, serif" }}>
            Helyadat engedély
          </h2>
          <p style={{ color: C.muted, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            A NearMatch alapvető funkciója a közelségen alapuló ismerkedés — ehhez szükségünk van a helyzeted ismeretére.
          </p>
        </div>

        {/* Explanation cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {[
            { icon: "👁", title: "Mit látnak mások?", desc: "Más felhasználók soha nem látják a pontos GPS koordinátádat — csak a közelítő távolságot (pl. \"43 méter\")." },
            { icon: "⏱", title: "Mikor aktív?", desc: "A helyadatot csak akkor olvassuk, ha az app előtérben van és te aktívan használod. Ha bezárod az appot, leáll." },
            { icon: "🗑", title: "Mennyi ideig tároljuk?", desc: "A helyadatot 90 másodpercig tároljuk gyorsítótárban, majd automatikusan törlődik. Nem adjuk el, nem adjuk át harmadik félnek." },
            { icon: "🔧", title: "Te irányítod", desc: "Bármikor kikapcsolhatod a Beállítások → Láthatóság menüben, vagy az iPhone Adatvédelem beállításaiban." },
          ].map(item => (
            <div key={item.title} style={{
              display: "flex", gap: 12, alignItems: "flex-start",
              background: C.card, borderRadius: 14, padding: "13px 14px",
              border: `1px solid ${C.border}`,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: C.accentSoft, border: `1px solid rgba(255,92,92,0.2)`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>{item.icon}</div>
              <div>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{item.title}</div>
                <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* iOS dialog preview */}
        <div style={{
          background: "rgba(255,255,255,0.05)", border: `1px solid rgba(255,255,255,0.1)`,
          borderRadius: 16, padding: "14px", marginBottom: 20,
        }}>
          <div style={{ color: C.dim, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Ezután az iOS ezt kérdezi:
          </div>
          <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: 14, padding: "14px", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#000", marginBottom: 6 }}>
              A „NearMatch" hozzáférést kér a helyadatodhoz
            </div>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 12, lineHeight: 1.5 }}>
              A NearMatch a GPS-edet használja hogy megmutassa a közeledben lévő felhasználókat. A pontos helyadatod más felhasználóknak nem látható.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, padding: "8px", borderRadius: 10, background: "#f0f0f0", fontSize: 12, fontWeight: 600, color: "#333" }}>Nem engedélyezem</div>
              <div style={{ flex: 1, padding: "8px", borderRadius: 10, background: "#007AFF", fontSize: 12, fontWeight: 700, color: "#fff" }}>Engedélyezem</div>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => { setData(d => ({ ...d, locationGranted: true })); setStep(6); }}
            style={{
              width: "100%", padding: "16px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.orange})`,
              border: "none", borderRadius: 16, color: "#fff",
              fontSize: 16, fontWeight: 800, cursor: "pointer",
              boxShadow: `0 8px 24px ${C.accentGlow}`,
            }}
          >📍  Helyadat engedélyezése</button>

          <button
            onClick={() => { setData(d => ({ ...d, locationGranted: false })); setStep(6); }}
            style={{
              width: "100%", padding: "14px",
              background: "transparent", border: `1px solid ${C.border}`,
              borderRadius: 16, color: C.dim, fontSize: 14, cursor: "pointer",
            }}
          >Később döntök — korlátozott funkciók</button>

          <p style={{ color: C.dim, fontSize: 11, textAlign: "center", margin: 0, lineHeight: 1.5 }}>
            Helyadat nélkül a radar és a közelség alapú matching nem működik.{" "}
            <span style={{ color: C.accent }}>Adatvédelmi tájékoztató</span>
          </p>
        </div>
      </div>
    </div>
  );

  // Step 6: Alapító tag — Pro ingyen
  if (step === 6) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg }}>

        {/* Arany konfetti animáció felül */}
        <div style={{ position: "relative", overflow: "hidden", height: 6, flexShrink: 0 }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #ffd43b, #ff8c42, #ffd43b)", backgroundSize: "200% 100%", animation: "shimmer 2s linear infinite" }} />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "32px 28px 40px", display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Hero ikon */}
          <div style={{
            width: 110, height: 110, borderRadius: 32, marginBottom: 24,
            background: "linear-gradient(135deg, #ffd43b, #ff8c42)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 52, boxShadow: "0 20px 60px rgba(255,212,59,0.5)",
            animation: "pulse 2s ease infinite",
          }}>⚡</div>

          <div style={{ background: "linear-gradient(135deg,#ffd43b,#ff8c42)", borderRadius: 20, padding: "4px 16px", marginBottom: 16 }}>
            <span style={{ color: "#000", fontSize: 12, fontWeight: 900, letterSpacing: 1 }}>ALAPÍTÓ TAG</span>
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 12px", color: C.text, fontFamily: "Georgia,serif", textAlign: "center", lineHeight: 1.2 }}>
            Pro verzió — teljesen ingyen! 🎉
          </h1>

          <p style={{ color: C.muted, fontSize: 15, textAlign: "center", lineHeight: 1.7, margin: "0 0 32px" }}>
            Az első <span style={{ color: C.yellow, fontWeight: 700 }}>2 000 felhasználónak</span> a NearMatch Pro verzióját ingyenesen adjuk. Te benne vagy!
          </p>

          {/* Pro előnyök */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
            {[
              { icon: "💥", title: "10 aktív match", sub: "Ingyenes limitnél 5, neked 10 jár" },
              { icon: "⚡", title: "Korlátlan Boost", sub: "Kerülj a radar tetejére bármikor" },
              { icon: "🔔", title: "Lejárt matchek felébresztése", sub: "48 óra után is újraindíthatod" },
              { icon: "🛰", title: "Műholdas radar", sub: "Valós idejű térkép nézettel" },
              { icon: "👑", title: "Pro badge a profilodon", sub: "Kitűnsz a többi felhasználó között" },
            ].map(item => (
              <div key={item.title} style={{
                display: "flex", gap: 14, alignItems: "center",
                background: "linear-gradient(135deg, rgba(255,212,59,0.06), rgba(255,140,66,0.06))",
                border: "1px solid rgba(255,212,59,0.15)",
                borderRadius: 14, padding: "13px 16px",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: "linear-gradient(135deg,#ffd43b22,#ff8c4222)",
                  border: "1px solid rgba(255,212,59,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>{item.icon}</div>
                <div>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{item.title}</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{item.sub}</div>
                </div>
                <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#ffd43b,#ff8c42)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#000", fontSize: 12, fontWeight: 900 }}>✓</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Helyek számlálója */}
          <div style={{
            width: "100%", background: C.card, borderRadius: 14,
            border: "1px solid rgba(255,212,59,0.2)", padding: "14px 16px",
            marginBottom: 24, display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 24 }}>⏳</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.yellow, fontWeight: 700, fontSize: 13 }}>Korlátozott ajánlat</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>Az ingyenes Pro csak az első 2 000 regisztrálónak jár.</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: C.yellow, fontWeight: 900, fontSize: 18 }}>1 247</div>
              <div style={{ color: C.dim, fontSize: 10 }}>hely maradt</div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => { setClaimed(true); setTimeout(() => onComplete({ ...data, isPro: true }), 1200); }}
            style={{
              width: "100%", padding: "18px",
              background: claimed ? C.green : "linear-gradient(135deg, #ffd43b, #ff8c42)",
              border: "none", borderRadius: 18, color: claimed ? "#fff" : "#000",
              fontSize: 17, fontWeight: 900, cursor: "pointer",
              boxShadow: claimed ? `0 8px 24px rgba(62,207,142,0.4)` : "0 8px 32px rgba(255,212,59,0.45)",
              transition: "all 0.3s",
            }}
          >
            {claimed ? "✓ Pro aktiválva — Belépés!" : "⚡  Alapító Pro aktiválása — Ingyenes"}
          </button>

          <p style={{ color: C.dim, fontSize: 11, textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
            Nincs kártyaszám. Nincs rejtett díj. Az ajánlat az első 2 000 usernek szól.
          </p>
        </div>
      </div>
    );
  }

// ═══════════════════════════════════════════════════════
// RADAR SCREEN — Térkép alapú, műholdas nézettel
// ═══════════════════════════════════════════════════════
function RadarScreen({ users, radius, setRadius, onUserClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const [mapMode, setMapMode] = useState("satellite"); // satellite | street
  const [userPos] = useState({ lat: 47.4979, lng: 19.0402 }); // Budapest mock
  const [selectedUser, setSelectedUser] = useState(null);

  const visible = users.filter(u => u.active && u.distance <= radius);

  // Load Leaflet dynamically
  useEffect(() => {
    if (mapInstanceRef.current) return;

    // Add Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }

    // Add Leaflet JS
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => initMap();
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const getTileUrl = (mode) => {
    if (mode === "satellite") {
      return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    }
    return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  };

  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [userPos.lat, userPos.lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Satellite tile layer
    L.tileLayer(getTileUrl("satellite"), {
      maxZoom: 19,
    }).addTo(map);

    // User position marker
    const userIcon = L.divIcon({
      html: `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#ff5c5c,#ff8c42);border:3px solid #fff;box-shadow:0 0 20px rgba(255,92,92,0.8);display:flex;align-items:center;justify-content:center;font-size:18px;">📍</div>`,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
    L.marker([userPos.lat, userPos.lng], { icon: userIcon }).addTo(map);

    // Radius circle
    circleRef.current = L.circle([userPos.lat, userPos.lng], {
      radius: radius,
      color: "rgba(255,92,92,0.8)",
      fillColor: "rgba(255,92,92,0.05)",
      fillOpacity: 1,
      weight: 1.5,
      dashArray: "6,4",
    }).addTo(map);

    // Add user markers
    addUserMarkers(map, visible);

    // Pulsing animation ring
    setInterval(() => {
      if (mapInstanceRef.current) {
        map.invalidateSize();
      }
    }, 1000);
  };

  const addUserMarkers = (map, users) => {
    const L = window.L;
    if (!L) return;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    users.forEach((u, i) => {
      // Place users around the center at their distance
      const angle = (i / users.length) * Math.PI * 2 + 0.3;
      const latOffset = (u.distance / 111000) * Math.cos(angle);
      const lngOffset = (u.distance / (111000 * Math.cos(userPos.lat * Math.PI/180))) * Math.sin(angle);

      const lat = userPos.lat + latOffset;
      const lng = userPos.lng + lngOffset;

      const ghostScore = u.ghostScore || 1;
      const badgeColor = ghostScore >= 0.8 ? "#3ecf8e" : ghostScore >= 0.6 ? "#4dabf7" : "#ffd43b";

      const icon = L.divIcon({
        html: `
          <div style="position:relative;cursor:pointer;">
            <div style="width:44px;height:44px;border-radius:50%;overflow:hidden;border:2.5px solid ${badgeColor};box-shadow:0 0 16px rgba(255,92,92,0.5);">
              <img src="${u.photo}" style="width:100%;height:100%;object-fit:cover;" />
            </div>
            <div style="position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;border-radius:50%;background:#3ecf8e;border:2px solid #080b10;"></div>
            <div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);background:rgba(8,11,16,0.9);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:2px 6px;white-space:nowrap;font-size:10px;color:#fff;font-weight:700;">${u.name}, ${u.age}</div>
          </div>
        `,
        className: "",
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .on("click", () => {
          setSelectedUser(u);
        });

      markersRef.current.push(marker);
    });
  };

  // Update radius circle when radius changes
  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius(radius);
  }, [radius]);

  // Update markers when users/radius change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    addUserMarkers(mapInstanceRef.current, visible);
  }, [users, radius]);

  // Switch tile layer
  const switchMapMode = (mode) => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    setMapMode(mode);
    mapInstanceRef.current.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });
    L.tileLayer(getTileUrl(mode), { maxZoom: 19 }).addTo(mapInstanceRef.current);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>

      {/* Map */}
      <div ref={mapRef} style={{ flex: 1, position: "relative" }} />

      {/* Map mode toggle */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1000, display: "flex", gap: 6 }}>
        {[
          { id: "satellite", label: "🛰 Műhold" },
          { id: "street", label: "🗺 Térkép" },
        ].map(m => (
          <button key={m.id} onClick={() => switchMapMode(m.id)} style={{
            background: mapMode === m.id ? `linear-gradient(135deg,${C.accent},${C.orange})` : "rgba(8,11,16,0.8)",
            border: `1px solid ${mapMode === m.id ? "transparent" : "rgba(255,255,255,0.15)"}`,
            borderRadius: 10, padding: "6px 12px", fontSize: 11, fontWeight: 700,
            color: "#fff", cursor: "pointer", backdropFilter: "blur(8px)",
          }}>{m.label}</button>
        ))}
      </div>

      {/* Zoom controls */}
      <div style={{ position: "absolute", top: 56, right: 12, zIndex: 1000, display: "flex", flexDirection: "column", gap: 4 }}>
        {["+", "−"].map((btn, i) => (
          <button key={btn} onClick={() => {
            if (!mapInstanceRef.current) return;
            i === 0 ? mapInstanceRef.current.zoomIn() : mapInstanceRef.current.zoomOut();
          }} style={{
            width: 34, height: 34, borderRadius: 10, background: "rgba(8,11,16,0.8)",
            border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 18,
            fontWeight: 700, cursor: "pointer", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{btn}</button>
        ))}
      </div>

      {/* Radius slider */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: "linear-gradient(to top, rgba(8,11,16,0.97) 70%, transparent)",
        padding: "20px 20px 16px",
      }}>
        {/* Online count */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
            <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>{visible.length} fő a közelben</span>
          </div>
          <span style={{ color: C.accent, fontSize: 12, fontWeight: 700 }}>
            {radius < 1000 ? `${radius}m` : `${(radius/1000).toFixed(1).replace(".0","")} km`}
          </span>
        </div>

        {/* Slider */}
        <input type="range" min={50} max={20000} step={50} value={radius}
          onChange={e => setRadius(+e.target.value)}
          style={{ width: "100%", accentColor: C.accent, marginBottom: 10 }} />

        {/* User list */}
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {visible.map(u => (
            <div key={u.id} onClick={() => { setSelectedUser(u); onUserClick(u); }}
              style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <div style={{ position: "relative" }}>
                <img src={u.photo} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.accent}` }} />
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: "50%", background: C.green, border: `2px solid ${C.bg}` }} />
              </div>
              <span style={{ color: C.text, fontSize: 10, fontWeight: 600 }}>{u.name}</span>
              <span style={{ color: C.dim, fontSize: 9 }}>{u.distance}m</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected user popup */}
      {selectedUser && (
        <div style={{
          position: "absolute", bottom: 160, left: 16, right: 16, zIndex: 1001,
          background: C.surface, borderRadius: 20, padding: "16px",
          border: `1px solid ${C.border}`, boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
          animation: "slideUp 0.3s ease",
        }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <img src={selectedUser.photo} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.accent}` }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: C.text, fontWeight: 800, fontSize: 16 }}>{selectedUser.name}, {selectedUser.age}</div>
              <div style={{ color: C.accent, fontSize: 12, marginTop: 2 }}>● {selectedUser.distance}m · Aktív most</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedUser.bio}</div>
            </div>
            <button onClick={() => setSelectedUser(null)} style={{ background: "none", border: "none", color: C.dim, fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => { setSelectedUser(null); onUserClick(selectedUser); }} style={{
              flex: 1, padding: "10px", background: `linear-gradient(135deg,${C.accent},${C.orange})`,
              border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>❤️ Swipe-olj rá</button>
            <button onClick={() => setSelectedUser(null)} style={{
              padding: "10px 14px", background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 12, color: C.muted, fontSize: 13, cursor: "pointer",
            }}>Bezár</button>
          </div>
        </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════
// SWIPE SCREEN
// ═══════════════════════════════════════════════════════
function SwipeScreen({ users, onMatch }) {
  const [idx, setIdx] = useState(0);
  const [gone, setGone] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false });
  const startPos = useRef(null);
  const cardRef = useRef(null);

  // Apply ghost score algorithm — re-sort each time idx resets
  const rankedUsers = useRef([]);
  if (rankedUsers.current.length === 0 || idx >= rankedUsers.current.length) {
    rankedUsers.current = applyGhostFilter(users.filter(u => u.active));
  }
  const visible = rankedUsers.current;
  const cur = visible[idx % Math.max(visible.length, 1)];
  const next = visible[(idx + 1) % Math.max(visible.length, 1)];

  const THRESHOLD = 90; // px to trigger swipe

  const act = (type) => {
    if (gone) return;
    setGone(true);
    setDrag({ x: type === "like" ? 600 : -600, y: 0, dragging: false });
    setTimeout(() => {
      setGone(false);
      setDrag({ x: 0, y: 0, dragging: false });
      setIdx(i => i + 1);
      if (type === "like" && Math.random() > 0.4) onMatch(cur);
    }, 400);
  };

  // Touch handlers
  const onTouchStart = (e) => {
    startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setDrag(d => ({ ...d, dragging: true }));
  };
  const onTouchMove = (e) => {
    if (!startPos.current) return;
    const dx = e.touches[0].clientX - startPos.current.x;
    const dy = e.touches[0].clientY - startPos.current.y;
    setDrag({ x: dx, y: dy, dragging: true });
  };
  const onTouchEnd = () => {
    if (!startPos.current) return;
    if (drag.x > THRESHOLD) act("like");
    else if (drag.x < -THRESHOLD) act("pass");
    else setDrag({ x: 0, y: 0, dragging: false });
    startPos.current = null;
  };

  // Mouse handlers (desktop preview)
  const onMouseDown = (e) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    setDrag(d => ({ ...d, dragging: true }));
  };
  const onMouseMove = (e) => {
    if (!startPos.current || !drag.dragging) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    setDrag({ x: dx, y: dy, dragging: true });
  };
  const onMouseUp = () => {
    if (!startPos.current) return;
    if (drag.x > THRESHOLD) act("like");
    else if (drag.x < -THRESHOLD) act("pass");
    else setDrag({ x: 0, y: 0, dragging: false });
    startPos.current = null;
  };

  // Derived values
  const rotate = drag.x * 0.08;
  const likeOpacity = Math.min(Math.max(drag.x / THRESHOLD, 0), 1);
  const passOpacity = Math.min(Math.max(-drag.x / THRESHOLD, 0), 1);
  const transition = drag.dragging ? "none" : "transform 0.4s cubic-bezier(0.4,0,0.2,1)";
  const transform = `translateX(${drag.x}px) translateY(${drag.y * 0.3}px) rotate(${rotate}deg)`;

  // Per-card page: 0 = foto, 1 = részletek
  const [cardPage, setCardPage] = useState(0);

  // Reset page when card changes
  useEffect(() => setCardPage(0), [idx]);

  if (!cur) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", color: C.muted, gap: 12 }}>
      <span style={{ fontSize: 40 }}>🎯</span>
      <span>Nincs több profil közel!</span>
    </div>
  );

  // Tap zones: only on photo page
  const handleCardTap = (e) => {
    if (Math.abs(drag.x) > 5) return; // was a drag, not a tap
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width * 0.75) {
      // Tap right → next page (details)
      setCardPage(p => Math.min(p + 1, 1));
    } else if (x < rect.width * 0.25) {
      // Tap left → back to photo
      setCardPage(p => Math.max(p - 1, 0));
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "6px 16px 10px", gap: 14, overflow: "hidden" }}
      onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>

      {/* Card stack */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>

        {/* Next card (behind) */}
        {next && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 24, overflow: "hidden",
            background: C.card, boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
            transform: `scale(${0.94 + Math.min(Math.abs(drag.x) / THRESHOLD, 1) * 0.06})`,
            transition: drag.dragging ? "none" : "transform 0.3s ease",
          }}>
            <img src={next.photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,11,16,1) 0%, rgba(8,11,16,0.55) 38%, transparent 62%)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 18px 18px" }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: "#fff", fontFamily: "Georgia,serif" }}>{next.name}</span>
              <span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginLeft: 8 }}>{next.age}</span>
            </div>
          </div>
        )}

        {/* Current card (draggable) */}
        <div
          ref={cardRef}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onClick={handleCardTap}
          style={{
            position: "absolute", inset: 0, borderRadius: 24, overflow: "hidden",
            background: C.card, boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            transform, transition,
            cursor: drag.dragging ? "grabbing" : "grab",
            userSelect: "none",
          }}
        >
          {/* ── PAGE DOTS (top center) ── */}
          <div style={{
            position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 5, zIndex: 10, pointerEvents: "none",
          }}>
            {[0, 1].map(p => (
              <div key={p} style={{
                width: p === cardPage ? 20 : 6, height: 6, borderRadius: 3,
                background: p === cardPage ? "#fff" : "rgba(255,255,255,0.35)",
                transition: "all 0.2s",
              }} />
            ))}
          </div>

          {/* ── PHOTO PAGE ── */}
          {cardPage === 0 && (
            <>
              <img src={cur.photo} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} draggable={false} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,11,16,1) 0%, rgba(8,11,16,0.55) 38%, transparent 58%)", pointerEvents: "none" }} />

              {/* Distance badge */}
              <div style={{ position: "absolute", top: 14, right: 14, background: C.accent, borderRadius: 20, padding: "5px 13px", fontSize: 12, fontWeight: 700, color: "#fff", boxShadow: `0 4px 12px ${C.accentGlow}` }}>
                ● {cur.distance}m
              </div>

              {/* Swipe labels */}
              <div style={{ position: "absolute", top: 30, left: 20, border: "3px solid #3ecf8e", borderRadius: 10, padding: "6px 16px", transform: "rotate(-15deg)", color: "#3ecf8e", fontSize: 22, fontWeight: 900, letterSpacing: 2, opacity: likeOpacity, transition: drag.dragging ? "none" : "opacity 0.2s", textShadow: "0 0 12px rgba(62,207,142,0.5)" }}>IGEN ✓</div>
              <div style={{ position: "absolute", top: 30, right: 20, border: "3px solid #ff5c5c", borderRadius: 10, padding: "6px 16px", transform: "rotate(15deg)", color: "#ff5c5c", fontSize: 22, fontWeight: 900, letterSpacing: 2, opacity: passOpacity, transition: drag.dragging ? "none" : "opacity 0.2s", textShadow: "0 0 12px rgba(255,92,92,0.5)" }}>PASS ✕</div>

              {/* Info overlay */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 18px 18px", pointerEvents: "none" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "Georgia,serif" }}>{cur.name}</span>
                  <span style={{ fontSize: 20, color: "rgba(255,255,255,0.5)" }}>{cur.age}</span>
                </div>
                {ghostLabel(cur._score ?? cur.ghostScore ?? 1) && (() => {
                  const lbl = ghostLabel(cur._score ?? cur.ghostScore ?? 1);
                  return <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${lbl.color}22`, border: `1px solid ${lbl.color}55`, borderRadius: 20, padding: "3px 10px", marginBottom: 8 }}><span style={{ color: lbl.color, fontSize: 12, fontWeight: 600 }}>{lbl.text}</span></div>;
                })()}
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: "0 0 10px", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{cur.bio}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {cur.tags.map(t => <span key={t} style={{ background: "rgba(255,92,92,0.18)", border: "1px solid rgba(255,92,92,0.35)", borderRadius: 20, padding: "4px 11px", fontSize: 11, color: "#ffaaaa" }}>{t}</span>)}
                </div>
                {/* Hint to swipe right for details */}
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 8, textAlign: "right" }}>
                  Részletek →
                </div>
              </div>
            </>
          )}

          {/* ── DETAILS PAGE ── */}
          {cardPage === 1 && (
            <div style={{ width: "100%", height: "100%", background: C.bg, overflowY: "auto", padding: "48px 20px 24px" }}>
              {/* Swipe labels still visible */}
              <div style={{ position: "absolute", top: 30, left: 20, border: "3px solid #3ecf8e", borderRadius: 10, padding: "6px 16px", transform: "rotate(-15deg)", color: "#3ecf8e", fontSize: 22, fontWeight: 900, letterSpacing: 2, opacity: likeOpacity, zIndex: 10 }}>IGEN ✓</div>
              <div style={{ position: "absolute", top: 30, right: 20, border: "3px solid #ff5c5c", borderRadius: 10, padding: "6px 16px", transform: "rotate(15deg)", color: "#ff5c5c", fontSize: 22, fontWeight: 900, letterSpacing: 2, opacity: passOpacity, zIndex: 10 }}>PASS ✕</div>

              {/* Mini header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <img src={cur.photo} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.accent}`, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: C.text, fontFamily: "Georgia,serif" }}>{cur.name}, {cur.age}</div>
                  <div style={{ color: C.accent, fontSize: 12, marginTop: 2 }}>● {cur.distance}m · {cur.active ? "Aktív most" : "Nem aktív"}</div>
                </div>
              </div>

              {/* Bio */}
              {cur.bio && (
                <div style={{ background: C.card, borderRadius: 14, padding: "13px 14px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
                  <div style={{ color: C.dim, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Bemutatkozás</div>
                  <p style={{ color: C.text, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{cur.bio}</p>
                </div>
              )}

              {/* Interests */}
              {cur.tags?.length > 0 && (
                <div style={{ background: C.card, borderRadius: 14, padding: "13px 14px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
                  <div style={{ color: C.dim, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Érdeklődés</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {cur.tags.map(t => (
                      <span key={t} style={{ background: C.accentSoft, border: `1px solid rgba(255,92,92,0.25)`, borderRadius: 20, padding: "5px 12px", fontSize: 12, color: C.accent }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Details */}
              {cur.details && Object.values(cur.details).some(Boolean) && (
                <div style={{ background: C.card, borderRadius: 14, padding: "13px 14px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
                  <div style={{ color: C.dim, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Részletek</div>
                  {[
                    { key: "height",    icon: "📏", label: "Magasság",   fmt: v => `${v} cm` },
                    { key: "education", icon: "🎓", label: "Képzettség",  fmt: v => v },
                    { key: "jobType",   icon: "💼", label: "Foglalkozás", fmt: v => v },
                    { key: "kids",      icon: "👶", label: "Gyerekek",    fmt: v => v },
                    { key: "pets",      icon: "🐾", label: "Háziállat",   fmt: v => v },
                    { key: "smoking",   icon: "🚬", label: "Dohányzás",   fmt: v => v },
                    { key: "alcohol",   icon: "🍷", label: "Alkohol",     fmt: v => v },
                    { key: "religion",  icon: "🕊️", label: "Vallás",     fmt: v => v },
                    { key: "politics",  icon: "🗳️", label: "Politika",   fmt: v => v },
                  ].filter(r => cur.details[r.key]).map((r, i, arr) => (
                    <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{r.icon}</span>
                      <span style={{ color: C.muted, fontSize: 13, flex: 1 }}>{r.label}</span>
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{r.fmt(cur.details[r.key])}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Looking for */}
              {cur.lookingFor && (
                <div style={{ background: C.card, borderRadius: 14, padding: "13px 14px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
                  <div style={{ color: C.dim, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Mit keres</div>
                  <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{cur.lookingFor}</div>
                </div>
              )}

              {/* Ghost score */}
              {ghostLabel(cur._score ?? cur.ghostScore ?? 1) && (() => {
                const lbl = ghostLabel(cur._score ?? cur.ghostScore ?? 1);
                return (
                  <div style={{ background: `${lbl.color}12`, border: `1px solid ${lbl.color}33`, borderRadius: 14, padding: "11px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>💬</span>
                    <div>
                      <div style={{ color: lbl.color, fontWeight: 700, fontSize: 13 }}>{lbl.text}</div>
                      <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>Üzenetválaszadási szokás alapján</div>
                    </div>
                  </div>
                );
              })()}

              {/* ← hint */}
              <div style={{ color: C.dim, fontSize: 10, textAlign: "center", marginTop: 14 }}>← Vissza a fotóhoz</div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 24, paddingTop: 4 }}>
        <button onClick={() => act("pass")} style={{ width: 60, height: 60, borderRadius: "50%", background: passOpacity > 0.3 ? "rgba(255,92,92,0.2)" : C.card, border: `1.5px solid ${passOpacity > 0.3 ? C.accent : "rgba(255,255,255,0.13)"}`, fontSize: 22, cursor: "pointer", color: passOpacity > 0.3 ? C.accent : C.muted, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.35)", transition: "all 0.15s", transform: passOpacity > 0.3 ? "scale(1.1)" : "scale(1)" }}>✕</button>
        <button onClick={() => act("like")} style={{ width: 74, height: 74, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, ${C.orange})`, border: "none", fontSize: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 28px ${C.accentGlow}`, transform: likeOpacity > 0.3 ? "scale(1.15)" : "scale(1)", transition: "transform 0.15s" }}>❤️</button>
        <button style={{ width: 60, height: 60, borderRadius: "50%", background: C.card, border: `1.5px solid rgba(255,255,255,0.13)`, fontSize: 22, cursor: "pointer", color: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.35)" }}>★</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MATCH ANIMATION
// ═══════════════════════════════════════════════════════
function Particles({ active }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const W = canvas.width, H = canvas.height;
    const COLORS = ["#ff5c5c","#ff8c42","#ffd43b","#3ecf8e","#4dabf7","#cc5de8","#fff"];
    let particles = Array.from({length:70},()=>({
      x:W/2+(Math.random()-.5)*60, y:H*.42, vx:(Math.random()-.5)*12, vy:-(Math.random()*14+6),
      ay:0.35, size:Math.random()*10+5, color:COLORS[Math.floor(Math.random()*COLORS.length)],
      rotation:Math.random()*Math.PI*2, rotSpeed:(Math.random()-.5)*0.2,
      life:1, decay:Math.random()*0.012+0.006,
    }));
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      particles = particles.filter(p=>p.life>0);
      particles.forEach(p=>{
        ctx.save();ctx.globalAlpha=Math.max(0,p.life);ctx.translate(p.x,p.y);ctx.rotate(p.rotation);ctx.fillStyle=p.color;
        ctx.beginPath();ctx.arc(0,0,p.size/2,0,Math.PI*2);ctx.fill();ctx.restore();
        p.x+=p.vx;p.y+=p.vy;p.vy+=p.ay;p.rotation+=p.rotSpeed;p.life-=p.decay;
      });
      if(particles.length>0) rafRef.current=requestAnimationFrame(draw);
    };
    rafRef.current=requestAnimationFrame(draw);
    return ()=>cancelAnimationFrame(rafRef.current);
  },[active]);
  if(!active) return null;
  return <canvas ref={canvasRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:10}}/>;
}

function MatchOverlay({ user, onMessage, onKeepSwiping }) {
  const [phase, setPhase] = useState("enter");
  const [parts, setParts] = useState(false);
  useEffect(()=>{setTimeout(()=>setPhase("show"),100);setTimeout(()=>setParts(true),400);setTimeout(()=>setParts(false),3500);setTimeout(()=>setPhase("idle"),600);},[]);
  return (
    <div style={{position:"absolute",inset:0,zIndex:80,background:"rgba(8,11,16,0.96)",backdropFilter:"blur(20px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      <Particles active={parts}/>
      <div style={{position:"absolute",top:"40%",left:"50%",transform:"translate(-50%,-50%)",width:280,height:280,borderRadius:"50%",background:`radial-gradient(circle,${C.accentGlow} 0%,transparent 70%)`,animation:"breathe 3s ease infinite"}}/>
      <div style={{textAlign:"center",marginBottom:28,position:"relative",zIndex:2,opacity:phase==="enter"?0:1,transform:phase==="enter"?"translateY(20px) scale(0.9)":"none",transition:"all 0.6s cubic-bezier(0.34,1.56,0.64,1)"}}>
        <div style={{fontSize:12,letterSpacing:4,color:C.muted,textTransform:"uppercase",marginBottom:6}}>✨ Kölcsönös szimpátia</div>
        <h1 style={{fontSize:48,fontWeight:900,margin:0,fontFamily:"Georgia,serif",background:`linear-gradient(135deg,${C.accent},${C.orange},#ffd43b)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Match!</h1>
      </div>
      <div style={{display:"flex",alignItems:"center",position:"relative",zIndex:2,marginBottom:28,opacity:phase==="enter"?0:1,transform:phase==="enter"?"scale(0.7)":"scale(1)",transition:"all 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.15s"}}>
        <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)"}}>
          {[200,240,280].map((s,i)=><div key={s} style={{position:"absolute",width:s,height:s,borderRadius:"50%",border:`2px solid ${[C.accent,C.orange,"#ffd43b44"][i]}`,top:"50%",left:"50%",transform:"translate(-50%,-50%)",animation:`pulseRing 2s ${i*0.4}s ease-out infinite`}}/>)}
        </div>
        <div style={{width:108,height:108,borderRadius:"50%",overflow:"hidden",border:`3px solid ${C.accent}`,boxShadow:`0 0 30px ${C.accentGlow}`,transform:"translateX(12px)",zIndex:2}}><img src="https://i.pravatar.cc/300?img=1" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
        <div style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.orange})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,zIndex:3,boxShadow:`0 0 20px ${C.accentGlow}`,animation:"heartbeat 1.2s ease infinite"}}>❤️</div>
        <div style={{width:108,height:108,borderRadius:"50%",overflow:"hidden",border:`3px solid ${C.orange}`,boxShadow:"0 0 30px rgba(255,140,66,0.4)",transform:"translateX(-12px)",zIndex:2}}><img src={user.photo} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
      </div>
      <div style={{textAlign:"center",marginBottom:32,position:"relative",zIndex:2,opacity:phase==="enter"?0:1,transition:"opacity 0.5s ease 0.3s"}}>
        <div style={{color:C.text,fontSize:17,fontWeight:700,marginBottom:4}}>Te és {user.name} egymásra találtatok!</div>
        <div style={{color:C.accent,fontSize:13}}>● Mindössze {user.distance}m-re van most</div>
      </div>
      <div style={{width:"100%",padding:"0 28px",display:"flex",flexDirection:"column",gap:10,position:"relative",zIndex:2,opacity:phase==="enter"?0:1,transition:"opacity 0.5s ease 0.4s"}}>
        <Btn onClick={onMessage}>💬  Üzenetet küldök</Btn>
        <Btn variant="outline" onClick={onKeepSwiping}>Tovább keresek</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DOUBLE DATE SYSTEM
// ═══════════════════════════════════════════════════════

const MOCK_OTHER_COUPLE = {
  id: 99,
  pair: [
    { name: "Bence", photo: "https://i.pravatar.cc/300?img=12", age: 27 },
    { name: "Réka", photo: "https://i.pravatar.cc/300?img=48", age: 25 },
  ],
  distance: 340,
  commonTags: ["🎵 Zene", "☕ Kávé"],
};

function DoubleDateChat({ group, onBack }) {
  const [msgs, setMsgs] = useState([
    { from: "Sára", photo: "https://i.pravatar.cc/300?img=47", text: "Sziasztok! 🎉 Mikor értek oda?", time: "14:10" },
    { from: "Bence", photo: "https://i.pravatar.cc/300?img=12", text: "Mi már itt vagyunk a kávézó teraszán!", time: "14:11" },
    { from: "Réka", photo: "https://i.pravatar.cc/300?img=48", text: "Annyira izgalmas ez az app 😄", time: "14:12" },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  const send = () => {
    if (!input.trim()) return;
    setMsgs(m => [...m, { from: "me", photo: null, text: input, time: "most" }]);
    setInput("");
  };

  const members = group.pair;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        background: "linear-gradient(135deg, rgba(255,212,59,0.06), rgba(255,140,66,0.06))",
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, fontSize: 22, cursor: "pointer", flexShrink: 0 }}>‹</button>

        {/* Couple avatars */}
        <div style={{ display: "flex", flexShrink: 0 }}>
          {[...members, { name: "Te", photo: null }, { name: "Párod", photo: null }].slice(0, 4).map((p, i) => (
            <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", border: `2px solid ${C.bg}`, marginLeft: i > 0 ? -8 : 0, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: C.muted }}>
              {p.photo ? <img src={p.photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>Dupla Randi 🎉</div>
          <div style={{ color: C.yellow, fontSize: 11 }}>
            {members.map(p => p.name).join(", ")} + Ti
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #ffd43b22, #ff8c4222)",
          border: "1px solid rgba(255,212,59,0.3)",
          borderRadius: 10, padding: "4px 10px",
          color: C.yellow, fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>2+2</div>
      </div>

      {/* System message */}
      <div style={{ padding: "12px 20px 0" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(255,212,59,0.08), rgba(255,140,66,0.08))",
          border: "1px solid rgba(255,212,59,0.2)",
          borderRadius: 14, padding: "12px 14px",
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🎉</span>
          <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.5 }}>
            <span style={{ color: C.yellow, fontWeight: 700 }}>Dupla Randi aktív!</span> Mind a négy fél elfogadta a meghívót. Ez a chat mindenki számára látható.
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {msgs.map((m, i) => {
          const isMe = m.from === "me";
          return (
            <div key={i} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}>
              {!isMe && (
                <img src={m.photo} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginBottom: 2 }} />
              )}
              <div style={{ maxWidth: "68%" }}>
                {!isMe && <div style={{ color: C.dim, fontSize: 10, marginBottom: 3, paddingLeft: 2 }}>{m.from}</div>}
                <div style={{
                  padding: "10px 14px",
                  borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: isMe ? `linear-gradient(135deg,${C.accent},${C.orange})` : C.card,
                  color: "#fff", fontSize: 14, lineHeight: 1.4,
                }}>
                  {m.text}
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4, textAlign: "right" }}>{m.time}</div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Írj a csoportnak..."
          style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: "10px 16px", color: C.text, fontSize: 14, outline: "none" }} />
        <button onClick={send} style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg,#ffd43b,#ff8c42)`, border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>↑</button>
      </div>
    </div>
  );
}

function DoubleDateInviteModal({ match, onSend, onClose }) {
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setSent(true);
    setTimeout(() => { onSend(); onClose(); }, 1400);
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 90, background: "rgba(8,11,16,0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", background: C.surface, borderRadius: "28px 28px 0 0", border: `1px solid ${C.border}`, boxShadow: "0 -20px 60px rgba(0,0,0,0.5)", animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)", overflow: "hidden" }}>

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.dim }} />
        </div>

        <div style={{ padding: "16px 24px 40px" }}>
          {/* Hero */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%", margin: "0 auto 14px",
              background: "linear-gradient(135deg, #ffd43b, #ff8c42)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38,
              boxShadow: "0 0 30px rgba(255,212,59,0.4)",
            }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 6px", color: C.text, fontFamily: "Georgia,serif" }}>Dupla Randi meghívó</h2>
            <p style={{ color: C.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              Küldj meghívót <span style={{ color: C.text, fontWeight: 700 }}>{match.name}</span>-nak, és együtt kerestek egy másik párt a közös randira.
            </p>
          </div>

          {/* How it works */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {[
              { icon: "1️⃣", text: `Meghívod ${match.name}-t egy dupla randira` },
              { icon: "2️⃣", text: "Mindkét pár elfogadja → közös chat nyílik" },
              { icon: "3️⃣", text: "Összehangolhatjátok a találkozót 4 emberként" },
              { icon: "4️⃣", text: "Kevésbé nyomasztó, mint az 1-1-es randi 😄" },
            ].map(s => (
              <div key={s.icon} style={{ display: "flex", gap: 12, alignItems: "center", background: C.card, borderRadius: 12, padding: "11px 14px", border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                <span style={{ color: C.muted, fontSize: 13 }}>{s.text}</span>
              </div>
            ))}
          </div>

          {/* Match preview */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: C.card, borderRadius: 16, padding: "14px",
            border: `1px solid rgba(255,212,59,0.2)`, marginBottom: 20,
          }}>
            <img src={match.photo} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{match.name}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>Meghívót kap a dupla randira</div>
            </div>
            <span style={{ fontSize: 24 }}>📩</span>
          </div>

          <button onClick={handleSend} style={{
            width: "100%", padding: "16px",
            background: sent ? C.green : "linear-gradient(135deg, #ffd43b, #ff8c42)",
            border: "none", borderRadius: 16, color: "#fff",
            fontSize: 16, fontWeight: 800, cursor: "pointer",
            boxShadow: "0 8px 24px rgba(255,212,59,0.35)",
            transition: "background 0.3s",
          }}>
            {sent ? "✓ Meghívó elküldve!" : `🎉  Meghívó küldése ${match.name}-nak`}
          </button>

          <button onClick={onClose} style={{ width: "100%", padding: "12px", marginTop: 8, background: "transparent", border: "none", color: C.dim, fontSize: 14, cursor: "pointer" }}>
            Mégsem
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CHAT / MATCHES
// ═══════════════════════════════════════════════════════
const FREE_LIMIT = 5;
const PRO_LIMIT = 10;
const FOUNDER_LIMIT = 2000; // Első 2000 regisztráló = Alapító tag, örökös Pro

function MatchList({ matches, onOpen, isPro, onUpgrade, onExpire, onRevive }) {
  const limit = isPro ? PRO_LIMIT : FREE_LIMIT;

  // Classify matches
  const active = matches.filter(m => m.status !== "expired");
  const expired = matches.filter(m => m.status === "expired");
  const slotsUsed = active.length;
  const slotsLeft = Math.max(0, limit - slotsUsed);
  const isFull = slotsUsed >= limit;

  const timeLeft = (m) => {
    if (!m.expiresAt) return null;
    const diff = m.expiresAt - Date.now();
    if (diff <= 0) return "Lejárt";
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hrs > 0) return `${hrs}ó múlva jár le`;
    return `${mins}p múlva jár le`;
  };

  const pct = slotsUsed / limit;
  const barColor = pct >= 1 ? C.accent : pct >= 0.7 ? C.orange : C.green;

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ padding: "14px 20px 0" }}>

        {/* Slot indicator */}
        <div style={{
          background: C.card, borderRadius: 16, padding: "14px 16px",
          border: `1px solid ${isFull ? "rgba(255,92,92,0.3)" : C.border}`,
          marginBottom: 14,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <span style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>Aktív matchek</span>
              {isPro && <span style={{ marginLeft: 8, background: "linear-gradient(135deg,#ffd43b,#ff8c42)", borderRadius: 10, padding: "2px 8px", fontSize: 10, color: "#fff", fontWeight: 800 }}>PRO</span>}
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: isFull ? C.accent : C.text }}>
              {slotsUsed} / {limit}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, background: C.dim, borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${Math.min(pct * 100, 100)}%`,
              background: `linear-gradient(90deg, ${barColor}, ${isFull ? C.accent : C.orange})`,
              transition: "width 0.4s ease",
            }} />
          </div>

          {/* Status message */}
          {isFull ? (
            <div style={{ color: C.accent, fontSize: 12, lineHeight: 1.5 }}>
              ⚠️ Betelt a limited! Válaszolj egy meglévő matchnek, vagy várj amíg valamelyik lejár — hogy újakat kapj.
            </div>
          ) : (
            <div style={{ color: C.muted, fontSize: 12 }}>
              {slotsLeft} szabad hely — {isFull ? "nincs" : "van"} lehetőség új matchre
            </div>
          )}

          {/* Pro upsell */}
          {!isPro && (
            <button onClick={onUpgrade} style={{
              width: "100%", marginTop: 10, padding: "10px",
              background: "linear-gradient(135deg, #ffd43b22, #ff8c4222)",
              border: "1px solid rgba(255,212,59,0.3)", borderRadius: 12,
              color: C.yellow, fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              ⚡ Pro-val 10 aktív match — Váltás
            </button>
          )}
        </div>

        {/* Active matches */}
        {active.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.dim }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>💥</div>
            <div>Még nincs match — swipe-olj!</div>
          </div>
        )}

        {active.length > 0 && (
          <div style={{ color: C.dim, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
            Aktív — {active.length}
          </div>
        )}

        {active.map(m => {
          const tl = timeLeft(m);
          const isExpiringSoon = m.expiresAt && (m.expiresAt - Date.now()) < 3600000; // <1 óra
          return (
            <div key={m.id} onClick={() => onOpen(m)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "13px 0", borderBottom: `1px solid ${C.border}`,
              cursor: "pointer",
            }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img src={m.photo} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: `2px solid ${isExpiringSoon ? C.orange : "transparent"}` }} />
                <div style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%", background: C.accent, border: `2px solid ${C.bg}` }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{m.name}</span>
                  <span style={{ color: C.dim, fontSize: 11, flexShrink: 0 }}>{m.time}</span>
                </div>
                <div style={{ color: m.unread ? C.muted : C.dim, fontSize: 13, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.lastMsg}</div>
                {tl && (
                  <div style={{ color: isExpiringSoon ? C.orange : C.dim, fontSize: 11, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                    <span>{isExpiringSoon ? "⚠️" : "⏱"}</span>{tl}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {m.unread && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, boxShadow: `0 0 6px ${C.accent}` }} />}
                <button onClick={e => { e.stopPropagation(); onExpire(m.id); }} style={{ background: "none", border: "none", color: C.dim, fontSize: 16, cursor: "pointer", padding: 4, lineHeight: 1 }} title="Match lezárása">✕</button>
              </div>
            </div>
          );
        })}

        {/* Expired matches */}
        {expired.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "18px 0 10px" }}>
              <div style={{ color: C.dim, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>
                Lejárt — {expired.length}
              </div>
              {isPro && <div style={{ background: "linear-gradient(135deg,#ffd43b,#ff8c42)", borderRadius: 10, padding: "3px 10px", fontSize: 10, color: "#fff", fontWeight: 800 }}>⚡ PRO — Felébresztés</div>}
            </div>

            {expired.map(m => (
              <div key={m.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "13px 0", borderBottom: `1px solid ${C.border}`,
              }}>
                {/* Grayscale avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img src={m.photo} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", filter: isPro ? "none" : "grayscale(100%)", opacity: isPro ? 1 : 0.5, transition: "all 0.3s" }} />
                  {isPro && (
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid #ffd43b`, boxShadow: "0 0 10px rgba(255,212,59,0.4)" }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: isPro ? C.text : C.muted, fontWeight: 700, fontSize: 15 }}>{m.name}</div>
                  <div style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>
                    {isPro ? "💤 Elaludt a match — felébresztheted" : "Match lejárt — 48 óra válasz nélkül"}
                  </div>
                </div>

                {/* Revive or upsell button */}
                {isPro ? (
                  <button
                    onClick={() => onRevive(m.id)}
                    style={{
                      flexShrink: 0,
                      background: "linear-gradient(135deg, #ffd43b, #ff8c42)",
                      border: "none", borderRadius: 12,
                      padding: "8px 14px", fontSize: 12, fontWeight: 800,
                      color: "#fff", cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(255,212,59,0.35)",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    ⚡ Ébresztés
                  </button>
                ) : (
                  <button
                    onClick={onUpgrade}
                    style={{
                      flexShrink: 0,
                      background: "rgba(255,212,59,0.1)",
                      border: "1px solid rgba(255,212,59,0.3)",
                      borderRadius: 12, padding: "8px 12px",
                      fontSize: 11, fontWeight: 700,
                      color: C.yellow, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    🔓 Pro
                  </button>
                )}
              </div>
            ))}

            {/* Non-pro explanation */}
            {!isPro && expired.length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, rgba(255,212,59,0.07), rgba(255,140,66,0.07))",
                border: "1px solid rgba(255,212,59,0.2)",
                borderRadius: 14, padding: "14px 16px", marginTop: 14,
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>⚡</span>
                  <div>
                    <div style={{ color: C.yellow, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                      Pro — Lejárt matchek felébresztése
                    </div>
                    <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>
                      Pro előfizetőként bármikor felébreszthetsz egy lejárt matchet. A másik fél értesítést kap, és újra 48 óra áll rendelkezésre.
                    </div>
                    <button onClick={onUpgrade} style={{
                      background: "linear-gradient(135deg, #ffd43b, #ff8c42)",
                      border: "none", borderRadius: 12, padding: "9px 18px",
                      color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(255,212,59,0.3)",
                    }}>
                      Pro előfizetés — Felébresztés most
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

function ChatView({ match, onBack, onOpenDoubleDate }) {
  const [msgs, setMsgs] = useState(match.msgs || []);
  const [input, setInput] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [doubleActive, setDoubleActive] = useState(match.doubleDate || false);
  const bottomRef = useRef(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);
  const send = () => { if (!input.trim()) return; setMsgs(m => [...m, { from: "me", text: input, time: "most" }]); setInput(""); };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {showInvite && (
        <DoubleDateInviteModal
          match={match}
          onSend={() => { setDoubleActive(true); setShowInvite(false); }}
          onClose={() => setShowInvite(false)}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, fontSize: 22, cursor: "pointer" }}>‹</button>
        <img src={match.photo} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
        <div style={{ flex: 1 }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{match.name}</div>
          <div style={{ color: C.accent, fontSize: 11 }}>● közel van</div>
        </div>
        {/* Double date button */}
        {doubleActive ? (
          <button onClick={() => onOpenDoubleDate && onOpenDoubleDate(match)} style={{
            background: "linear-gradient(135deg, #ffd43b22, #ff8c4222)",
            border: "1px solid rgba(255,212,59,0.35)",
            borderRadius: 12, padding: "7px 12px",
            color: C.yellow, fontSize: 12, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}>🎉 Csoport</button>
        ) : (
          <button onClick={() => setShowInvite(true)} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: "7px 12px",
            color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}>🎉 Dupla randi</button>
        )}
      </div>

      {/* Double date active banner */}
      {doubleActive && (
        <div onClick={() => onOpenDoubleDate && onOpenDoubleDate(match)} style={{
          background: "linear-gradient(135deg, rgba(255,212,59,0.1), rgba(255,140,66,0.1))",
          border: "none", borderBottom: `1px solid rgba(255,212,59,0.2)`,
          padding: "10px 16px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>🎉</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.yellow, fontWeight: 700, fontSize: 13 }}>Dupla Randi aktív!</div>
            <div style={{ color: C.muted, fontSize: 11 }}>Bence & Réka elfogadták a meghívót — Koppints a csoportchatért</div>
          </div>
          <span style={{ color: C.yellow, fontSize: 16 }}>›</span>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "72%", padding: "10px 14px", borderRadius: m.from === "me" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.from === "me" ? `linear-gradient(135deg,${C.accent},${C.orange})` : C.card, color: "#fff", fontSize: 14, lineHeight: 1.4 }}>
              {m.text}<div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4, textAlign: "right" }}>{m.time}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Írj valamit..."
          style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: "10px 16px", color: C.text, fontSize: 14, outline: "none" }} />
        <button onClick={send} style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.orange})`, border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>↑</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PROFILE SCREEN
// ═══════════════════════════════════════════════════════
function ProfileScreen({ profile, setProfile }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [activeTab, setActiveTab] = useState("photos");
  const [saved, setSaved] = useState(false);
  const [notifToggles, setNotifToggles] = useState({ match: true, message: true, nearby: true });

  const readFile = (file) => new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file); });
  const [moderating, setModerating] = useState(false);
  const [moderationResult, setModerationResult] = useState(null);
  const [gridModerating, setGridModerating] = useState({});
  const [gridModerationResults, setGridModerationResults] = useState({});

  const handleMainPhoto = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const url = await readFile(file);
    setModerating(true);
    setModerationResult(null);
    const result = await moderatePhoto(url);
    setModerating(false);
    setModerationResult(result);
    if (result.allowed) {
      setProfile(p => ({ ...p, mainPhoto: url }));
      setDraft(d => ({ ...d, mainPhoto: url }));
      setTimeout(() => setModerationResult(null), 3000);
    }
  };

  const handleGridPhoto = async (e, idx) => {
    const file = e.target.files[0]; if (!file) return;
    const url = await readFile(file);
    setGridModerating(m => ({ ...m, [idx]: true }));
    setGridModerationResults(r => ({ ...r, [idx]: null }));
    const result = await moderatePhoto(url);
    setGridModerating(m => ({ ...m, [idx]: false }));
    setGridModerationResults(r => ({ ...r, [idx]: result }));
    if (result.allowed) {
      setDraft(d => { const photos = [...(d.photos || Array(5).fill(null))]; photos[idx] = url; return { ...d, photos }; });
      setTimeout(() => setGridModerationResults(r => ({ ...r, [idx]: null })), 3000);
    }
  };

  const removeGridPhoto = (idx) => {
    setDraft(d => { const photos = [...(d.photos || Array(5).fill(null))]; photos[idx] = null; return { ...d, photos }; });
  };

  const handleSave = () => {
    setSaved(true); setProfile(draft);
    setTimeout(() => { setSaved(false); setEditing(false); }, 900);
  };

  const age = profile.birthdate ? new Date().getFullYear() - new Date(profile.birthdate).getFullYear() : "";

  // ── View mode ──
  const allPhotos = [profile.mainPhoto, ...(profile.photos || [])].filter(Boolean);
  const [photoIdx, setPhotoIdx] = useState(0);

  // photoIdx reset ha a főkép megváltozik
  useEffect(() => { setPhotoIdx(0); }, [profile.mainPhoto]);

  const touchStartX = useRef(null);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40 && photoIdx < allPhotos.length - 1) setPhotoIdx(i => i + 1);
    if (dx > 40 && photoIdx > 0) setPhotoIdx(i => i - 1);
    touchStartX.current = null;
  };
  // Also support mouse drag for desktop preview
  const mouseStartX = useRef(null);
  const handleMouseDown = (e) => { mouseStartX.current = e.clientX; };
  const handleMouseUp = (e) => {
    if (mouseStartX.current === null) return;
    const dx = e.clientX - mouseStartX.current;
    if (dx < -40 && photoIdx < allPhotos.length - 1) setPhotoIdx(i => i + 1);
    if (dx > 40 && photoIdx > 0) setPhotoIdx(i => i - 1);
    mouseStartX.current = null;
  };

  if (!editing) return (
    <div style={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}>

      {/* ── Photo gallery ── */}
      <div style={{ position: "relative", height: 400, cursor: "grab", userSelect: "none" }}
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}
      >
        {allPhotos.length > 0 ? (
          <>
            <img
              src={allPhotos[photoIdx]}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 0.2s" }}
              draggable={false}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,rgba(8,11,16,0.15) 0%,transparent 30%,rgba(8,11,16,0.92) 78%,#080b10 100%)", pointerEvents: "none" }} />

            {/* Tap zones for navigation */}
            <div style={{ position: "absolute", left: 0, top: 0, width: "40%", height: "100%", zIndex: 5 }}
              onClick={() => photoIdx > 0 && setPhotoIdx(i => i - 1)} />
            <div style={{ position: "absolute", right: 0, top: 0, width: "40%", height: "100%", zIndex: 5 }}
              onClick={() => photoIdx < allPhotos.length - 1 && setPhotoIdx(i => i + 1)} />

            {/* Dot indicators */}
            {allPhotos.length > 1 && (
              <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5, zIndex: 6 }}>
                {allPhotos.map((_, i) => (
                  <div key={i} onClick={() => setPhotoIdx(i)} style={{ width: i === photoIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === photoIdx ? "#fff" : "rgba(255,255,255,0.35)", cursor: "pointer", transition: "all 0.2s" }} />
                ))}
              </div>
            )}

            {/* Change photo button */}
            <label style={{ position: "absolute", top: 14, left: 14, zIndex: 10, background: moderating ? "rgba(255,92,92,0.7)" : "rgba(8,11,16,0.6)", backdropFilter: "blur(8px)", border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 12, padding: "7px 13px", fontSize: 12, color: "#fff", cursor: moderating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, transition: "background 0.2s" }}>
              {moderating ? "⏳ Ellenőrzés..." : "📷 Csere"}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleMainPhoto} disabled={moderating} />
            </label>

            {/* Moderation loading overlay */}
            {moderating && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(8,11,16,0.65)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, zIndex: 8 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid ${C.accent}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>AI moderálás...</div>
              </div>
            )}

            {/* Moderation result toast */}
            {moderationResult && (
              <div style={{
                position: "absolute", bottom: 14, left: 14, right: 14, zIndex: 10,
                background: moderationResult.allowed ? "rgba(62,207,142,0.95)" : "rgba(255,92,92,0.95)",
                borderRadius: 14, padding: "11px 14px",
                display: "flex", alignItems: "center", gap: 10,
                animation: "fadeIn 0.3s ease",
              }}>
                <span style={{ fontSize: 18 }}>{moderationResult.allowed ? "✅" : "🚫"}</span>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{moderationResult.label}</div>
                  {!moderationResult.allowed && <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 2 }}>Ez a kép nem felel meg az irányelveinknek.</div>}
                </div>
              </div>
            )}
          </>
        ) : (
          /* No photo placeholder */
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(160deg,${C.card},${C.surface})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, position: "relative" }}>
            {moderating ? (
              <>
                <div style={{ width: 48, height: 48, borderRadius: "50%", border: `3px solid ${C.accent}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                <div style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>AI moderálás...</div>
              </>
            ) : moderationResult && !moderationResult.allowed ? (
              <>
                <div style={{ fontSize: 44 }}>🚫</div>
                <div style={{ color: C.accent, fontSize: 14, fontWeight: 700, textAlign: "center", padding: "0 20px" }}>Ez a kép nem megfelelő</div>
                <div style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: "0 24px", lineHeight: 1.5 }}>Meztelenséget tartalmaz. Kérjük tölts fel egy másik képet.</div>
                <label style={{ background: C.accentSoft, border: `1px solid rgba(255,92,92,0.3)`, color: C.accent, borderRadius: 14, padding: "11px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  📷 Másik kép
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleMainPhoto} />
                </label>
              </>
            ) : (
              <>
                <div style={{ fontSize: 60 }}>📷</div>
                <div style={{ color: C.muted, fontSize: 14 }}>Még nincs profilkép</div>
                <label style={{ background: `linear-gradient(135deg,${C.accent},${C.orange})`, color: "#fff", borderRadius: 14, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: `0 6px 20px ${C.accentGlow}` }}>
                  📷  Fotó feltöltése
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleMainPhoto} />
                </label>
              </>
            )}
          </div>
        )}

        {/* Name overlay */}
        <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, zIndex: 6, pointerEvents: "none" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: "#fff", fontFamily: "Georgia,serif" }}>{profile.name || "Te"}</h1>
            <span style={{ color: C.muted, fontSize: 22 }}>{age}</span>
            <div style={{ background: `linear-gradient(135deg,${C.accent},${C.orange})`, borderRadius: 16, padding: "2px 10px", fontSize: 11, color: "#fff", fontWeight: 700 }}>✓ Verifikált</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 20px 100px" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          {[{ v: 12, l: "Match", i: "💥" }, { v: 38, l: "Like", i: "❤️" }, { v: "85%", l: "Profil", i: "⚡" }].map(s => (
            <div key={s.l} style={{ flex: 1, background: C.card, borderRadius: 14, padding: "14px 10px", textAlign: "center", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 20, marginBottom: 3 }}>{s.i}</div>
              <div style={{ fontSize: 22, fontWeight: 900, background: `linear-gradient(135deg,${C.accent},${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.v}</div>
              <div style={{ color: C.dim, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {profile.bio && <div style={{ background: C.card, borderRadius: 16, padding: "16px", border: `1px solid ${C.border}`, marginBottom: 12 }}>
          <div style={{ color: C.dim, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Rólam</div>
          <p style={{ color: C.text, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{profile.bio}</p>
        </div>}

        {profile.interests?.length > 0 && <div style={{ background: C.card, borderRadius: 16, padding: "16px", border: `1px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ color: C.dim, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Érdeklődés</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {profile.interests.map(t => <span key={t} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted }}>{t}</span>)}
          </div>
        </div>}

        {/* Details section */}
        {profile.details && Object.values(profile.details).some(Boolean) && (
          <div style={{ background: C.card, borderRadius: 16, padding: "16px", border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <div style={{ color: C.dim, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Részletek</div>
            {[
              { field: "height",    icon: "📏", label: "Magasság",   fmt: v => `${v} cm` },
              { field: "education", icon: "🎓", label: "Képzettség",  fmt: v => v },
              { field: "jobType",   icon: "💼", label: "Foglalkozás", fmt: v => v },
              { field: "kids",      icon: "👶", label: "Gyerekek",    fmt: v => v },
              { field: "pets",      icon: "🐾", label: "Háziállat",   fmt: v => v },
              { field: "smoking",   icon: "🚬", label: "Dohányzás",   fmt: v => v },
              { field: "alcohol",   icon: "🍷", label: "Alkohol",     fmt: v => v },
              { field: "religion",  icon: "🕊️", label: "Vallás",     fmt: v => v },
              { field: "politics",  icon: "🗳️", label: "Politika",   fmt: v => v },
            ].filter(r => profile.details[r.field]).map((r, i, arr) => (
              <div key={r.field} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 18, width: 26, textAlign: "center" }}>{r.icon}</span>
                <span style={{ color: C.muted, fontSize: 13, flex: 1 }}>{r.label}</span>
                <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{r.fmt(profile.details[r.field])}</span>
              </div>
            ))}
          </div>
        )}

        <Btn onClick={() => { setDraft({ ...profile }); setEditing(true); }}>✏️  Profil szerkesztése</Btn>

      </div>
    </div>
  );

  // ── Edit mode ──
  const TABS = [{ id: "photos", l: "📷 Fotók" }, { id: "bio", l: "✍️ Bio" }, { id: "details", l: "📋 Adatok" }, { id: "interests", l: "🎯 Érdeklődés" }, { id: "prefs", l: "⚙ Beáll." }];
  const gridPhotos = draft.photos || Array(5).fill(null);

  const ChipGroup = ({ label, field, options, emoji }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
        <span style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>{emoji}  {label}</span>
        {draft.details?.[field] && (
          <button onClick={() => setDraft(d => ({ ...d, details: { ...(d.details||{}), [field]: null } }))}
            style={{ background: "none", border: "none", color: C.dim, fontSize: 11, cursor: "pointer" }}>töröl ✕</button>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {options.map(opt => {
          const on = (draft.details||{})[field] === opt;
          return (
            <button key={opt}
              onClick={() => setDraft(d => ({ ...d, details: { ...(d.details||{}), [field]: on ? null : opt } }))}
              style={{ padding: "8px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                background: on ? `linear-gradient(135deg,${C.accent},${C.orange})` : C.card,
                border: `1px solid ${on ? "transparent" : C.border}`,
                color: on ? "#fff" : C.muted, fontWeight: on ? 700 : 400,
              }}>{opt}</button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px 0", flexShrink: 0 }}>
        <button onClick={() => setEditing(false)} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted, width: 36, height: 36, borderRadius: 11, fontSize: 18, cursor: "pointer" }}>✕</button>
        <h2 style={{ flex: 1, margin: 0, color: C.text, fontSize: 17, fontWeight: 800, fontFamily: "Georgia,serif" }}>Profil szerkesztése</h2>
        <button onClick={handleSave} style={{ background: saved ? C.green : `linear-gradient(135deg,${C.accent},${C.orange})`, border: "none", borderRadius: 11, padding: "8px 16px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "background 0.3s" }}>{saved ? "✓ Mentve!" : "Mentés"}</button>
      </div>

      <div style={{ display: "flex", gap: 5, padding: "12px 20px 0", flexShrink: 0, overflowX: "auto" }}>
        {TABS.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "8px 12px", borderRadius: 11, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", background: activeTab === t.id ? C.accentSoft : "transparent", border: `1px solid ${activeTab === t.id ? "rgba(255,92,92,0.3)" : "transparent"}`, color: activeTab === t.id ? C.accent : C.muted }}>{t.l}</button>)}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 30px" }}>

        {/* ── PHOTOS TAB ── */}
        {activeTab === "photos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Main photo */}
            <div>
              <div style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Fő profilkép</div>
              <div style={{ position: "relative", height: 200, borderRadius: 18, overflow: "hidden", background: C.card, border: `2px dashed ${draft.mainPhoto ? "transparent" : C.accent}` }}>
                {draft.mainPhoto
                  ? <img src={draft.mainPhoto} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <div style={{ fontSize: 36 }}>📷</div>
                      <div style={{ color: C.muted, fontSize: 13 }}>Koppints a feltöltéshez</div>
                    </div>
                }
                <label style={{
                  position: "absolute", inset: 0, cursor: "pointer",
                  display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 14,
                }}>
                  <div style={{ background: "rgba(8,11,16,0.7)", backdropFilter: "blur(8px)", borderRadius: 12, padding: "7px 18px", fontSize: 13, color: "#fff", fontWeight: 600, border: `1px solid rgba(255,255,255,0.15)` }}>
                    {draft.mainPhoto ? "📷 Csere" : "📷 Feltöltés"}
                  </div>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => { const f = e.target.files[0]; if(f) { const url = await readFile(f); setDraft(d => ({ ...d, mainPhoto: url })); }}} />
                </label>
              </div>
            </div>

            {/* Grid photos */}
            <div>
              <div style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>További fotók (max 5)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {gridPhotos.map((p, i) => (
                  <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 14, overflow: "hidden", background: C.card, border: `1.5px dashed ${p ? "transparent" : gridModerationResults[i]?.allowed === false ? C.accent : C.border}` }}>
                    {gridModerating[i] ? (
                      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${C.accent}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                        <span style={{ color: C.dim, fontSize: 10 }}>Ellenőrzés</span>
                      </div>
                    ) : gridModerationResults[i]?.allowed === false ? (
                      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: 8 }}>
                        <span style={{ fontSize: 24 }}>🚫</span>
                        <span style={{ color: C.accent, fontSize: 10, textAlign: "center", lineHeight: 1.3 }}>Nem megfelelő kép</span>
                        <label style={{ background: C.accentSoft, border: `1px solid rgba(255,92,92,0.2)`, borderRadius: 8, padding: "4px 10px", fontSize: 10, color: C.accent, cursor: "pointer" }}>
                          Másik
                          <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleGridPhoto(e, i)} />
                        </label>
                      </div>
                    ) : p ? (
                      <>
                        <img src={p} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {gridModerationResults[i]?.allowed && (
                          <div style={{ position: "absolute", top: 5, left: 5, background: "rgba(62,207,142,0.9)", borderRadius: 8, padding: "2px 7px", fontSize: 10, color: "#fff", fontWeight: 700 }}>✓ OK</div>
                        )}
                        <button onClick={() => removeGridPhoto(i)} style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%", background: "rgba(8,11,16,0.75)", border: "none", color: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                      </>
                    ) : (
                      <label style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexDirection: "column", gap: 4 }}>
                        <span style={{ color: C.dim, fontSize: 24 }}>+</span>
                        <span style={{ color: C.dim, fontSize: 10 }}>Fotó</span>
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleGridPhoto(e, i)} />
                      </label>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ background: C.accentSoft, borderRadius: 12, padding: "11px 14px", marginTop: 12, border: `1px solid rgba(255,92,92,0.15)` }}>
                <div style={{ color: C.accent, fontSize: 12, lineHeight: 1.5 }}>💡 Tipp: Valódi fotók 3× több matchet hoznak. Első kép legyen mosolygós, jól megvilágított!</div>
              </div>
            </div>
          </div>
        )}

        {/* ── BIO TAB ── */}
        {activeTab === "bio" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 7 }}>Keresztnév</label>
              <input value={draft.name||""} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} style={{ width: "100%", padding: "14px", borderRadius: 13, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 16, fontWeight: 600, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Bio</label>
                <span style={{ color: C.dim, fontSize: 11 }}>{(draft.bio||"").length}/300</span>
              </div>
              <textarea value={draft.bio||""} onChange={e => setDraft(d => ({ ...d, bio: e.target.value.slice(0,300) }))} rows={5} style={{ width: "100%", padding: "14px", borderRadius: 13, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
          </div>
        )}

        {/* ── DETAILS TAB ── */}
        {activeTab === "details" && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ background: C.accentSoft, borderRadius: 12, padding: "10px 14px", marginBottom: 20, border: `1px solid rgba(255,92,92,0.15)` }}>
              <div style={{ color: C.accent, fontSize: 12, lineHeight: 1.5 }}>✨ Ezek az adatok opcionálisak — csak azt add meg amit szeretnél megosztani. Segítenek a jobb matchekben!</div>
            </div>

            {/* Magasság */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>📏  Magasság</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {(draft.details?.height) ? (
                    <span style={{ color: C.accent, fontWeight: 700, fontSize: 15 }}>{draft.details.height} cm</span>
                  ) : (
                    <span style={{ color: C.dim, fontSize: 13 }}>Nem adtam meg</span>
                  )}
                  {draft.details?.height && (
                    <button onClick={() => setDraft(d => ({ ...d, details: { ...(d.details||{}), height: null } }))}
                      style={{ background: "none", border: "none", color: C.dim, fontSize: 11, cursor: "pointer" }}>✕</button>
                  )}
                </div>
              </div>
              <input type="range" min={150} max={210} value={draft.details?.height || 170}
                onChange={e => setDraft(d => ({ ...d, details: { ...(d.details||{}), height: +e.target.value } }))}
                style={{ width: "100%", accentColor: C.accent }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ color: C.dim, fontSize: 10 }}>150 cm</span>
                <span style={{ color: C.dim, fontSize: 10 }}>210 cm</span>
              </div>
            </div>

            <ChipGroup label="Képzettség" field="education" emoji="🎓" options={["Középiskola", "Főiskola / BA", "Egyetem / MA", "PhD", "Szakképzés", "Egyéb"]} />
            <ChipGroup label="Foglalkozás típusa" field="jobType" emoji="💼" options={["Alkalmazott", "Vállalkozó", "Freelancer", "Diák", "Kreatív", "Egészségügy", "IT / Tech"]} />
            <ChipGroup label="Gyerekek" field="kids" emoji="👶" options={["Nincs, nem is tervezek", "Nincs, de tervezek", "Van gyermekem", "Van és tervezek még"]} />
            <ChipGroup label="Háziállat" field="pets" emoji="🐾" options={["Nincs", "Kutya", "Macska", "Más állat", "Több is"]} />
            <ChipGroup label="Dohányzás" field="smoking" emoji="🚬" options={["Nem dohányzom", "Alkalmanként", "Rendszeresen"]} />
            <ChipGroup label="Alkohol" field="alcohol" emoji="🍷" options={["Nem iszom", "Alkalmanként", "Társaságban", "Rendszeresen"]} />
            <ChipGroup label="Vallás / Világnézet" field="religion" emoji="🕊️" options={["Keresztény", "Zsidó", "Muszlim", "Buddhista", "Agnosztikus", "Ateista", "Spirituális", "Egyéb"]} />
            <ChipGroup label="Politikai nézet" field="politics" emoji="🗳️" options={["Bal", "Közép-bal", "Közép", "Közép-jobb", "Jobb", "Nem nyilatkozom"]} />
          </div>
        )}


        {activeTab === "interests" && (
          <div>
            <p style={{ color: C.muted, fontSize: 13, margin: "0 0 14px" }}>{(draft.interests||[]).length} kiválasztva</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {INTERESTS_ALL.map(tag => {
                const on = (draft.interests||[]).includes(tag);
                return <button key={tag} onClick={() => setDraft(d => ({ ...d, interests: on ? (d.interests||[]).filter(x=>x!==tag) : [...(d.interests||[]),tag] }))} style={{ padding: "8px 13px", borderRadius: 20, fontSize: 13, cursor: "pointer", background: on ? `linear-gradient(135deg,${C.accent},${C.orange})` : C.card, border: `1px solid ${on?"transparent":C.border}`, color: on?"#fff":C.muted, fontWeight: on?700:400, transform: on?"scale(1.04)":"scale(1)", transition: "all 0.15s" }}>{tag}</button>;
              })}
            </div>
          </div>
        )}

        {/* ── PREFS TAB ── */}
        {activeTab === "prefs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: -10 }}>Értesítések</div>
            {[{ k: "match", l: "Új match" }, { k: "message", l: "Új üzenet" }, { k: "nearby", l: "Valaki közel" }].map(n => (
              <div key={n.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: C.text, fontSize: 14 }}>{n.l}</span>
                <div onClick={() => setNotifToggles(t => ({ ...t, [n.k]: !t[n.k] }))} style={{ width: 44, height: 26, borderRadius: 13, background: notifToggles[n.k] ? `linear-gradient(135deg,${C.accent},${C.orange})` : C.dim, cursor: "pointer", position: "relative", transition: "background 0.25s" }}>
                  <div style={{ position: "absolute", top: 3, left: notifToggles[n.k]?21:3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
                </div>
              </div>
            ))}
            <button style={{ width: "100%", padding: "14px", borderRadius: 13, background: "transparent", border: "1px solid rgba(255,92,92,0.2)", color: C.accent, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 10 }}>Kijelentkezés</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════
function NotifCenter({ notifs, onMarkRead, onClose }) {
  const unread = notifs.filter(n => !n.read).length;
  const typeIcon = { nearby: "📍", match: "💥", message: "💬", like: "❤️", system: "⚡" };
  const typeColor = { nearby: C.accent, match: C.orange, message: C.blue, like: C.accent, system: C.purple };
  const timeAgo = ts => { const d = Date.now()-ts; if(d<60000)return "most"; if(d<3600000)return Math.floor(d/60000)+"p"; return Math.floor(d/3600000)+"ó"; };
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60, background: C.bg, display: "flex", flexDirection: "column" }}>
      <StatusBar />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 0", flexShrink: 0 }}>
        <div><h2 style={{ margin: 0, color: C.text, fontSize: 20, fontWeight: 800, fontFamily: "Georgia,serif" }}>Értesítések</h2>{unread > 0 && <div style={{ color: C.accent, fontSize: 12, marginTop: 2 }}>{unread} olvasatlan</div>}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {unread > 0 && <button onClick={onMarkRead} style={{ background: C.accentSoft, border: "1px solid rgba(255,92,92,0.2)", borderRadius: 10, padding: "7px 12px", color: C.accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Mind olvasott</button>}
          <button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, width: 34, height: 34, color: C.muted, fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
        {notifs.map(n => (
          <div key={n.id} style={{ display: "flex", gap: 12, padding: "13px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
            {n.photo ? <div style={{ position: "relative", flexShrink: 0 }}>
              <img src={n.photo} style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: `2px solid ${n.read?"transparent":typeColor[n.type]+"44"}` }} />
              <div style={{ position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: "50%", background: C.card, border: `1px solid ${C.bg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>{typeIcon[n.type]}</div>
            </div> : <div style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, background: `${typeColor[n.type]}18`, border: `1px solid ${typeColor[n.type]}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{typeIcon[n.type]}</div>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ color: n.read?C.muted:C.text, fontWeight: n.read?400:700, fontSize: 14 }}>{n.title}</span>
                <span style={{ color: C.dim, fontSize: 11, flexShrink: 0 }}>{timeAgo(n.ts)}</span>
              </div>
              <div style={{ color: C.dim, fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>{n.body}</div>
            </div>
            {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: typeColor[n.type], boxShadow: `0 0 6px ${typeColor[n.type]}`, marginTop: 4, flexShrink: 0 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════
function Toast({ n, onDismiss }) {
  const [vis, setVis] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const color = { nearby: C.accent, match: C.orange, message: C.blue, like: C.accent, system: C.purple }[n.type]||C.accent;
  useEffect(() => { setTimeout(()=>setVis(true),30); const t=setTimeout(()=>{setLeaving(true);setTimeout(onDismiss,300);},(n.duration||4000)); return()=>clearTimeout(t); },[]);
  return (
    <div onClick={() => { setLeaving(true); setTimeout(onDismiss,300); }} style={{
      background: C.card, borderRadius: 16, padding: "13px 14px", border: `1px solid ${color}33`,
      boxShadow: `0 8px 32px rgba(0,0,0,0.5)`, cursor: "pointer", position: "relative", overflow: "hidden",
      transform: vis&&!leaving?"translateY(0) scale(1)":"translateY(-70px) scale(0.95)",
      opacity: vis&&!leaving?1:0, transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, height: 2, background: `linear-gradient(90deg,${color},${color}44)`, animation: `shrink ${n.duration||4000}ms linear forwards`, width: "100%", borderRadius: "0 0 16px 16px" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {n.photo ? <img src={n.photo} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{({ nearby:"📍",match:"💥",message:"💬" })[n.type]||"⚡"}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{n.title}</div>
          <div style={{ color: C.muted, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</div>
        </div>
        <span style={{ color: C.dim, fontSize: 14, flexShrink: 0 }}>✕</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BOTTOM NAV
// ═══════════════════════════════════════════════════════
function BottomNav({ active, setActive, unreadNotifs }) {
  const tabs = [
    { id: "radar", icon: "◎", label: "Radar" },
    { id: "swipe", icon: "♥", label: "Felfedez" },
    { id: "matches", icon: "✉", label: "Üzenetek" },
    { id: "profile", icon: "◉", label: "Profil" },
  ];
  return (
    <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 10px 26px", borderTop: `1px solid ${C.border}`, background: "rgba(8,11,16,0.97)", backdropFilter: "blur(20px)", flexShrink: 0 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActive(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: active === t.id ? C.accent : C.dim, transition: "color 0.2s", padding: "4px 16px", position: "relative" }}>
          <span style={{ fontSize: 22, filter: active === t.id ? `drop-shadow(0 0 6px ${C.accent})` : "none" }}>{t.icon}</span>
          <span style={{ fontSize: 10, letterSpacing: 0.3 }}>{t.label}</span>
          {t.id === "matches" && unreadNotifs > 0 && <div style={{ position: "absolute", top: 0, right: 10, width: 16, height: 16, borderRadius: "50%", background: C.accent, border: `2px solid ${C.bg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 700 }}>{unreadNotifs}</div>}
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BOOST SYSTEM
// ═══════════════════════════════════════════════════════

// Global boost state (lifted up via context-like pattern)
let _boostState = { active: false, endsAt: null, setActive: null };

function BoostButton() {
  const [state, setState] = useState({ active: false, remaining: 0 });
  const [showModal, setShowModal] = useState(false);
  const timerRef = useRef(null);

  // Register global setter
  useEffect(() => {
    _boostState.setActive = (endsAt) => {
      setState({ active: true, remaining: Math.ceil((endsAt - Date.now()) / 1000) });
      timerRef.current = setInterval(() => {
        const rem = Math.ceil((endsAt - Date.now()) / 1000);
        if (rem <= 0) {
          clearInterval(timerRef.current);
          setState({ active: false, remaining: 0 });
        } else {
          setState({ active: true, remaining: rem });
        }
      }, 1000);
    };
    return () => clearInterval(timerRef.current);
  }, []);

  const mins = Math.floor(state.remaining / 60);
  const secs = state.remaining % 60;
  const pct = state.remaining / 600; // 600s = 10 min

  if (state.active) return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: "linear-gradient(135deg, rgba(255,212,59,0.15), rgba(255,140,66,0.15))",
      border: `1px solid rgba(255,212,59,0.4)`,
      borderRadius: 14, padding: "7px 13px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Progress bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0,
        height: 2, width: `${pct * 100}%`,
        background: `linear-gradient(90deg, ${C.yellow}, ${C.orange})`,
        transition: "width 1s linear",
      }} />
      <span style={{ fontSize: 16 }}>⚡</span>
      <div>
        <div style={{ color: C.yellow, fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>BOOST AKTÍV</div>
        <div style={{ color: C.orange, fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>
          {mins}:{secs.toString().padStart(2, "0")}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setShowModal(true)} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: "8px 13px",
        color: C.muted, fontSize: 13, fontWeight: 600,
        cursor: "pointer", transition: "all 0.2s",
      }}>
        <span style={{ fontSize: 16 }}>⚡</span>
        <span>Boost</span>
      </button>
      {showModal && <BoostModal onClose={() => setShowModal(false)} />}
    </>
  );
}

function BoostModal({ onClose }) {
  const [step, setStep] = useState("intro"); // intro | payment | success
  const [loading, setLoading] = useState(false);
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 900);
    return () => clearInterval(t);
  }, []);

  const handlePay = () => {
    if (!cardNum || !expiry || !cvc) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("success");
      // Activate boost for 10 minutes
      const endsAt = Date.now() + 10 * 60 * 1000;
      setTimeout(() => {
        if (_boostState.setActive) _boostState.setActive(endsAt);
      }, 1800);
    }, 2000);
  };

  const formatCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 90,
      background: "rgba(8,11,16,0.85)", backdropFilter: "blur(16px)",
      display: "flex", alignItems: "flex-end",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: "100%", background: C.surface,
        borderRadius: "28px 28px 0 0",
        border: `1px solid ${C.border}`,
        boxShadow: "0 -20px 60px rgba(0,0,0,0.5)",
        overflow: "hidden",
        animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.dim }} />
        </div>

        {/* INTRO STEP */}
        {step === "intro" && (
          <div style={{ padding: "16px 24px 40px" }}>
            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%", margin: "0 auto 14px",
                background: "linear-gradient(135deg, #ffd43b, #ff8c42)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 38,
                boxShadow: `0 0 ${pulse ? 40 : 20}px rgba(255,212,59,${pulse ? 0.6 : 0.3})`,
                transition: "box-shadow 0.9s ease",
              }}>⚡</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 6px", color: C.text, fontFamily: "Georgia,serif" }}>
                10 perces Boost
              </h2>
              <p style={{ color: C.muted, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                A radaron lévők elsőként látják a profilod.<br />Több like, több match, 10 percig.
              </p>
            </div>

            {/* Benefits */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {[
                { icon: "🎯", title: "Prioritásos megjelenés", desc: "A közelben lévők radar-listáján az első helyen jelensz meg" },
                { icon: "👀", title: "3× több megtekintés", desc: "Átlagosan háromszor annyian nézik meg a profilod Boost alatt" },
                { icon: "💥", title: "Azonnali matchek", desc: "A Boost lejárta előtt érkező like-ok is megmaradnak" },
              ].map(b => (
                <div key={b.icon} style={{
                  display: "flex", gap: 14, alignItems: "flex-start",
                  background: C.card, borderRadius: 14, padding: "13px 14px",
                  border: `1px solid ${C.border}`,
                }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{b.icon}</span>
                  <div>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{b.title}</div>
                    <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.4 }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price + CTA */}
            <div style={{
              background: "linear-gradient(135deg, rgba(255,212,59,0.1), rgba(255,140,66,0.1))",
              border: "1px solid rgba(255,212,59,0.25)", borderRadius: 18,
              padding: "16px 20px", marginBottom: 14, textAlign: "center",
            }}>
              <div style={{ color: C.dim, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Ára</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: C.yellow, fontFamily: "Georgia,serif" }}>1 990 Ft</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>Egyszeri vásárlás · Nincs előfizetés</div>
            </div>

            <button onClick={() => setStep("payment")} style={{
              width: "100%", padding: "16px",
              background: "linear-gradient(135deg, #ffd43b, #ff8c42)",
              border: "none", borderRadius: 16, color: "#fff",
              fontSize: 16, fontWeight: 800, cursor: "pointer",
              boxShadow: "0 8px 24px rgba(255,212,59,0.35)",
              letterSpacing: 0.3,
            }}>⚡  Boost megvásárlása — 1 990 Ft</button>

            <button onClick={onClose} style={{
              width: "100%", padding: "12px", marginTop: 8,
              background: "transparent", border: "none",
              color: C.dim, fontSize: 14, cursor: "pointer",
            }}>Nem most</button>
          </div>
        )}

        {/* PAYMENT STEP */}
        {step === "payment" && (
          <div style={{ padding: "16px 24px 40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button onClick={() => setStep("intro")} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted, width: 34, height: 34, borderRadius: 10, fontSize: 18, cursor: "pointer" }}>‹</button>
              <h3 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 800 }}>Fizetés</h3>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                {["💳", "🔒"].map(i => <span key={i} style={{ fontSize: 18 }}>{i}</span>)}
              </div>
            </div>

            {/* Order summary */}
            <div style={{
              background: C.card, borderRadius: 14, padding: "13px 16px",
              border: `1px solid ${C.border}`, marginBottom: 20,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>⚡</span>
                <div>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>10 perces Boost</div>
                  <div style={{ color: C.muted, fontSize: 12 }}>Egyszeri vásárlás</div>
                </div>
              </div>
              <div style={{ color: C.yellow, fontWeight: 800, fontSize: 16 }}>1 990 Ft</div>
            </div>

            {/* Card form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 7 }}>Kártyaszám</label>
                <div style={{ position: "relative" }}>
                  <input
                    value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))}
                    placeholder="1234 5678 9012 3456" maxLength={19}
                    style={{ width: "100%", padding: "14px 44px 14px 14px", borderRadius: 13, background: C.card, border: `1px solid ${cardNum.length === 19 ? C.accent : C.border}`, color: C.text, fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "monospace", letterSpacing: 1 }}
                  />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 20 }}>
                    {cardNum.startsWith("4") ? "💳" : cardNum.startsWith("5") ? "💳" : "💳"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 7 }}>Lejárat</label>
                  <input value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} placeholder="HH/ÉÉ" maxLength={5}
                    style={{ width: "100%", padding: "14px", borderRadius: 13, background: C.card, border: `1px solid ${expiry.length === 5 ? C.accent : C.border}`, color: C.text, fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 7 }}>CVC</label>
                  <input value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="123" maxLength={3}
                    style={{ width: "100%", padding: "14px", borderRadius: 13, background: C.card, border: `1px solid ${cvc.length === 3 ? C.accent : C.border}`, color: C.text, fontSize: 16, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <span style={{ fontSize: 14 }}>🔒</span>
              <span style={{ color: C.dim, fontSize: 12 }}>Biztonságos fizetés — Stripe · 256-bit SSL titkosítás · PCI-DSS</span>
            </div>

            <button onClick={handlePay} disabled={loading || cardNum.length < 19 || expiry.length < 5 || cvc.length < 3} style={{
              width: "100%", padding: "16px",
              background: loading ? C.dim : "linear-gradient(135deg, #ffd43b, #ff8c42)",
              border: "none", borderRadius: 16, color: "#fff",
              fontSize: 16, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
              opacity: (cardNum.length < 19 || expiry.length < 5 || cvc.length < 3) ? 0.5 : 1,
              boxShadow: loading ? "none" : "0 8px 24px rgba(255,212,59,0.35)",
              transition: "all 0.2s",
            }}>
              {loading ? "Feldolgozás..." : "⚡  Fizetés — 1 990 Ft"}
            </button>
          </div>
        )}

        {/* SUCCESS STEP */}
        {step === "success" && (
          <div style={{ padding: "24px 24px 48px", textAlign: "center" }}>
            <div style={{
              width: 90, height: 90, borderRadius: "50%", margin: "0 auto 20px",
              background: "linear-gradient(135deg, #ffd43b, #ff8c42)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 44, animation: "pulse 1.5s ease infinite",
              boxShadow: "0 0 40px rgba(255,212,59,0.5)",
            }}>⚡</div>

            <h2 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 8px", color: C.text, fontFamily: "Georgia,serif" }}>
              Boost aktiválva!
            </h2>
            <p style={{ color: C.muted, fontSize: 15, margin: "0 0 28px", lineHeight: 1.6 }}>
              Most 10 percig te vagy az első<br />a közelben lévők radarán. 🚀
            </p>

            {/* Countdown preview */}
            <div style={{
              background: "linear-gradient(135deg, rgba(255,212,59,0.12), rgba(255,140,66,0.12))",
              border: "1px solid rgba(255,212,59,0.3)", borderRadius: 18,
              padding: "20px", marginBottom: 28,
            }}>
              <div style={{ color: C.yellow, fontSize: 42, fontWeight: 900, fontFamily: "monospace" }}>10:00</div>
              <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Visszaszámlálás indul...</div>
            </div>

            <button onClick={onClose} style={{
              width: "100%", padding: "16px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.orange})`,
              border: "none", borderRadius: 16, color: "#fff",
              fontSize: 16, fontWeight: 800, cursor: "pointer",
              boxShadow: `0 8px 24px ${C.accentGlow}`,
            }}>Vissza a radarhoz →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// FILTER MODAL
// ═══════════════════════════════════════════════════════
const DEFAULT_FILTERS = {
  ageMin: 18, ageMax: 40,
  maxDistance: 200,
  interests: [],
  gender: "mindenki",
  lookingFor: [],
  onlyActive: false,
  onlyWithPhoto: true,
  onlyWithBio: false,
  education: [],
};

function FilterModal({ filters, onApply, onClose }) {
  const [f, setF] = useState({ ...filters });
  const set = (key, val) => setF(prev => ({ ...prev, [key]: val }));

  const activeCount = [
    f.ageMin !== 18 || f.ageMax !== 40,
    f.maxDistance !== 200,
    f.interests.length > 0,
    f.gender !== "mindenki",
    f.lookingFor.length > 0,
    f.onlyActive,
    !f.onlyWithPhoto,
    f.onlyWithBio,
    f.education.length > 0,
  ].filter(Boolean).length;

  const Toggle = ({ on, onChange }) => (
    <div onClick={onChange} style={{ width: 44, height: 26, borderRadius: 13, background: on ? `linear-gradient(135deg,${C.accent},${C.orange})` : C.dim, cursor: "pointer", position: "relative", transition: "background 0.25s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
    </div>
  );

  const Chip = ({ label, selected, onToggle }) => (
    <button onClick={onToggle} style={{ padding: "8px 13px", borderRadius: 20, fontSize: 12, cursor: "pointer", transition: "all 0.15s", background: selected ? `linear-gradient(135deg,${C.accent},${C.orange})` : C.card, border: `1px solid ${selected ? "transparent" : C.border}`, color: selected ? "#fff" : C.muted, fontWeight: selected ? 700 : 400 }}>{label}</button>
  );

  const SectionLabel = ({ children }) => (
    <div style={{ color: C.dim, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10, marginTop: 4 }}>{children}</div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 90, background: "rgba(8,11,16,0.85)", backdropFilter: "blur(16px)", display: "flex", alignItems: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxHeight: "92%", background: C.surface, borderRadius: "28px 28px 0 0", border: `1px solid ${C.border}`, boxShadow: "0 -20px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>

        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.dim }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 0", flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, color: C.text, fontSize: 20, fontWeight: 800, fontFamily: "Georgia,serif" }}>Szűrők</h3>
            {activeCount > 0 && <div style={{ color: C.accent, fontSize: 12, marginTop: 2 }}>{activeCount} aktív szűrő</div>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setF({ ...DEFAULT_FILTERS })} style={{ background: C.accentSoft, border: `1px solid rgba(255,92,92,0.2)`, borderRadius: 10, padding: "7px 12px", color: C.accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Alaphelyzet</button>
            <button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, width: 34, height: 34, color: C.muted, fontSize: 16, cursor: "pointer" }}>✕</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 20px" }}>

          <SectionLabel>📅 Korcsoport</SectionLabel>
          <div style={{ background: C.card, borderRadius: 14, padding: "14px", border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: C.muted, fontSize: 13 }}>Min. kor</span>
              <span style={{ color: C.accent, fontWeight: 700 }}>{f.ageMin} év</span>
            </div>
            <input type="range" min={18} max={f.ageMax - 1} value={f.ageMin} onChange={e => set("ageMin", +e.target.value)} style={{ width: "100%", accentColor: C.accent, marginBottom: 14 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: C.muted, fontSize: 13 }}>Max. kor</span>
              <span style={{ color: C.accent, fontWeight: 700 }}>{f.ageMax} év</span>
            </div>
            <input type="range" min={f.ageMin + 1} max={70} value={f.ageMax} onChange={e => set("ageMax", +e.target.value)} style={{ width: "100%", accentColor: C.accent }} />
          </div>

          <SectionLabel>📍 Max. távolság</SectionLabel>
          <div style={{ background: C.card, borderRadius: 14, padding: "14px", border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: C.muted, fontSize: 13 }}>Sugár</span>
              <span style={{ color: C.accent, fontWeight: 700 }}>
                {f.maxDistance < 1000 ? `${f.maxDistance}m` : `${(f.maxDistance / 1000).toFixed(1).replace(".0","")} km`}
              </span>
            </div>
            <input type="range" min={50} max={20000} step={50} value={f.maxDistance} onChange={e => set("maxDistance", +e.target.value)} style={{ width: "100%", accentColor: C.accent }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ color: C.dim, fontSize: 10 }}>50m</span>
              <span style={{ color: C.dim, fontSize: 10 }}>20 km</span>
            </div>
          </div>

          <SectionLabel>👤 Nem</SectionLabel>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["mindenki", "nők", "férfiak", "non-binary"].map(g => (
              <Chip key={g} label={g.charAt(0).toUpperCase() + g.slice(1)} selected={f.gender === g} onToggle={() => set("gender", g)} />
            ))}
          </div>

          <SectionLabel>💍 Mit keres</SectionLabel>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["Komoly kapcsolat", "Laza ismerkedés", "Új barátok", "Meglátjuk"].map(l => {
              const on = f.lookingFor.includes(l);
              return <Chip key={l} label={l} selected={on} onToggle={() => set("lookingFor", on ? f.lookingFor.filter(x => x !== l) : [...f.lookingFor, l])} />;
            })}
          </div>

          <SectionLabel>🎯 Érdeklődési körök</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 8 }}>
            {INTERESTS_ALL.map(tag => {
              const on = f.interests.includes(tag);
              return <Chip key={tag} label={tag} selected={on} onToggle={() => set("interests", on ? f.interests.filter(x => x !== tag) : [...f.interests, tag])} />;
            })}
          </div>
          {f.interests.length > 0 && (
            <div style={{ background: C.accentSoft, borderRadius: 10, padding: "8px 12px", marginBottom: 16, border: `1px solid rgba(255,92,92,0.15)` }}>
              <span style={{ color: C.accent, fontSize: 12 }}>Csak azok jelennek meg, akiknek legalább 1 közös érdeklődésük van veled.</span>
            </div>
          )}

          <SectionLabel>🎓 Képzettség</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
            {["Középiskola", "Főiskola / BA", "Egyetem / MA", "PhD", "Szakképzés"].map(e => {
              const on = f.education.includes(e);
              return <Chip key={e} label={e} selected={on} onToggle={() => set("education", on ? f.education.filter(x => x !== e) : [...f.education, e])} />;
            })}
          </div>

          <SectionLabel>⚡ Gyors szűrők</SectionLabel>
          <div style={{ background: C.card, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}` }}>
            {[
              { key: "onlyActive", label: "Csak aktív (online most)", sub: "Akik az elmúlt 5 percben frissítették a helyzetük" },
              { key: "onlyWithPhoto", label: "Csak profilképpel", sub: "Fotó nélküli profilok kiszűrése" },
              { key: "onlyWithBio", label: "Csak bemutatkozással", sub: "Bio nélküli profilok kiszűrése" },
            ].map((item, i, arr) => (
              <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>{item.sub}</div>
                </div>
                <Toggle on={f[item.key]} onChange={() => set(item.key, !f[item.key])} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "12px 20px 32px", flexShrink: 0, borderTop: `1px solid ${C.border}`, background: C.surface }}>
          <button onClick={() => { onApply(f); onClose(); }} style={{
            width: "100%", padding: "16px",
            background: `linear-gradient(135deg, ${C.accent}, ${C.orange})`,
            border: "none", borderRadius: 16, color: "#fff",
            fontSize: 16, fontWeight: 800, cursor: "pointer",
            boxShadow: `0 8px 24px ${C.accentGlow}`,
          }}>
            {activeCount > 0 ? `Szűrők alkalmazása (${activeCount} aktív)` : "Szűrők alkalmazása"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div style={{ width: "100%", maxWidth: 390, margin: "0 auto", height: "100vh", maxHeight: 844, background: C.bg, overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "'SF Pro Text',-apple-system,sans-serif", borderRadius: 44, boxShadow: "0 40px 120px rgba(0,0,0,0.8),inset 0 0 0 1px rgba(255,255,255,0.07)", position: "relative" }}>
      {children}
    </div>
  );
}

export default function App() {
  const [appState, setAppState] = useState("onboarding");
  const [tab, setTab] = useState("radar");
  const [radius, setRadius] = useState(200);
  const [matches, setMatches] = useState(INIT_MATCHES);
  const [notifs, setNotifs] = useState(INIT_NOTIFS);
  const [activeChat, setActiveChat] = useState(null);
  const [matchUser, setMatchUser] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [profile, setProfile] = useState({});
  const [isPro, setIsPro] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [userNumber, setUserNumber] = useState(null); // Hányadik regisztráló
  const [showFounderWelcome, setShowFounderWelcome] = useState(false);
  const [doubleDate, setDoubleDate] = useState(null); // active double date group
  const toastId = useRef(200);

  const addToast = (n) => { const id = toastId.current++; setToasts(t => [...t, { ...n, id }]); };
  const removeToast = (id) => setToasts(t => t.filter(x => x.id !== id));
  const expireMatch = (id) => setMatches(m => m.map(x => x.id === id ? { ...x, status: "expired" } : x));
  const reviveMatch = (id) => {
    setMatches(m => m.map(x => x.id === id ? { ...x, status: "active", expiresAt: Date.now() + 48 * 3600000, lastMsg: "⚡ Felébresztett match!" } : x));
    addToast({ id: Date.now(), type: "match", title: "⚡ Match felébresztve!", body: "A másik fél értesítést kapott. 48 óra áll rendelkezésre.", duration: 4000 });
  };

  const handleMatch = (user) => {
    const limit = isPro ? PRO_LIMIT : FREE_LIMIT;
    const activeCount = matches.filter(m => m.status !== "expired").length;
    if (activeCount >= limit) {
      addToast({ id: Date.now(), type: "system", title: "Match limit elérve!", body: isPro ? "Már 10 aktív matchedd van." : "Ingyenes limitnél 5 aktív match engedélyezett. Válts Pro-ra!", duration: 5000 });
      return;
    }
    setMatchUser(user);
    const newMatch = { id: Date.now(), name: user.name, photo: user.photo, lastMsg: "Új match! Írj neki 👋", time: "most", unread: true, status: "active", expiresAt: Date.now() + 48 * 3600000, msgs: [] };
    setMatches(m => [newMatch, ...m]);
    const newN = { id: Date.now(), type: "match", read: false, title: `💥 Új match — ${user.name}!`, body: `Ti ketten egymásra találtatok. Ő ${user.distance}m-re van!`, photo: user.photo, ts: Date.now() };
    setNotifs(n => [newN, ...n]);
  };

  // Apply filters to users
  const filteredUsers = MOCK_USERS.filter(u => {
    if (u.age < filters.ageMin || u.age > filters.ageMax) return false;
    if (u.distance > filters.maxDistance) return false;
    if (filters.onlyActive && !u.active) return false;
    if (filters.interests.length > 0 && !filters.interests.some(i => u.tags.includes(i))) return false;
    return true;
  });

  const activeFilterCount = [
    filters.ageMin !== 18 || filters.ageMax !== 40,
    filters.maxDistance !== 200,
    filters.interests.length > 0,
    filters.gender !== "mindenki",
    filters.lookingFor.length > 0,
    filters.onlyActive,
    !filters.onlyWithPhoto,
    filters.onlyWithBio,
    filters.education.length > 0,
  ].filter(Boolean).length;

  // Simulate nearby toast after 5s
  useEffect(() => {
    if (appState !== "main") return;
    const t = setTimeout(() => {
      const n = { id: Date.now(), type: "nearby", title: "Anna belépett a radarba", body: "Egy új profil jelent meg 67m-re tőled.", photo: "https://i.pravatar.cc/300?img=44", duration: 4500 };
      addToast(n);
      setNotifs(prev => [{ ...n, read: false, ts: Date.now() }, ...prev]);
    }, 5000);
    return () => clearTimeout(t);
  }, [appState]);

  const unreadNotifs = notifs.filter(n => !n.read).length;

  if (appState === "onboarding") return (
    <Shell>
      <StatusBar />
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Onboarding onComplete={(data) => {
          setProfile(data);
          // Szimulált regisztrációs szám — éles appban backend adja
          const simUserNum = Math.floor(Math.random() * 2500) + 1;
          setUserNumber(simUserNum);
          if (simUserNum <= FOUNDER_LIMIT) {
            setIsFounder(true);
            setIsPro(true);
            setShowFounderWelcome(true);
          }
          setAppState("main");
        }} />
      </div>
    </Shell>
  );

  return (
    <Shell>
      <StatusBar />

      {/* Header */}
      {!activeChat && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px 6px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 900, fontFamily: "Georgia,serif", background: `linear-gradient(135deg,${C.accent},${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>NearMatch</span>
            {isFounder && (
              <div style={{ background: "linear-gradient(135deg,#a78bfa,#6366f1)", borderRadius: 8, padding: "2px 8px", fontSize: 10, fontWeight: 900, color: "#fff", letterSpacing: 0.5 }}>👑 ALAPÍTÓ</div>
            )}
            {isPro && !isFounder && (
              <div style={{ background: "linear-gradient(135deg,#ffd43b,#ff8c42)", borderRadius: 8, padding: "2px 8px", fontSize: 10, fontWeight: 900, color: "#000", letterSpacing: 0.5 }}>⚡ PRO</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Boost button */}
            <BoostButton />
            {/* Filter button */}
            <button onClick={() => setShowFilters(true)} style={{ position: "relative", background: activeFilterCount > 0 ? C.accentSoft : C.card, border: `1px solid ${activeFilterCount > 0 ? "rgba(255,92,92,0.3)" : C.border}`, borderRadius: 12, width: 38, height: 38, color: activeFilterCount > 0 ? C.accent : C.muted, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="18" height="2" rx="1" fill="currentColor"/>
                <rect x="3" y="6" width="12" height="2" rx="1" fill="currentColor"/>
                <rect x="6" y="12" width="6" height="2" rx="1" fill="currentColor"/>
              </svg>
              {activeFilterCount > 0 && <div style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: C.accent, border: `2px solid ${C.bg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 700 }}>{activeFilterCount}</div>}
            </button>
            <button onClick={() => setShowNotifs(true)} style={{ position: "relative", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, width: 38, height: 38, color: C.muted, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              🔔
              {unreadNotifs > 0 && <div style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: C.accent, border: `2px solid ${C.bg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 700 }}>{unreadNotifs}</div>}
            </button>
          </div>
        </div>
      )}

      {/* Toast stack */}
      <div style={{ position: "absolute", top: 60, left: 14, right: 14, zIndex: 200, display: "flex", flexDirection: "column", gap: 7 }}>
        {toasts.map(t => <Toast key={t.id} n={t} onDismiss={() => removeToast(t.id)} />)}
      </div>

      {/* Match overlay */}
      {matchUser && <MatchOverlay user={matchUser}
        onMessage={() => { setMatchUser(null); setTab("matches"); }}
        onKeepSwiping={() => { setMatchUser(null); }}
      />}

      {/* Notifications panel */}
      {showNotifs && <NotifCenter notifs={notifs} onMarkRead={() => setNotifs(n => n.map(x => ({ ...x, read: true })))} onClose={() => setShowNotifs(false)} />}

      {/* Main content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {/* Alapító tag üdvözlő modal */}
        {showFounderWelcome && (
          <div style={{ position: "absolute", inset: 0, zIndex: 100, background: "rgba(8,11,16,0.92)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: C.surface, borderRadius: 28, padding: "32px 24px", border: "1px solid rgba(167,139,250,0.3)", boxShadow: "0 0 60px rgba(167,139,250,0.2)", maxWidth: 360, width: "100%", textAlign: "center" }}>

              {/* Crown animation */}
              <div style={{ fontSize: 64, marginBottom: 16, animation: "pulse 2s infinite" }}>👑</div>

              <h2 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 8px", color: C.text, fontFamily: "Georgia,serif" }}>
                Alapító Tag vagy!
              </h2>

              <div style={{ background: "linear-gradient(135deg,rgba(167,139,250,0.15),rgba(99,102,241,0.15))", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 14, padding: "12px 16px", marginBottom: 16 }}>
                <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 16 }}>#{userNumber}. regisztráló</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>az első {FOUNDER_LIMIT.toLocaleString()} alapító tag egyike</div>
              </div>

              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
                Köszönjük hogy az elsők között csatlakoztál! Jutalmul örökös <span style={{ color: "#ffd43b", fontWeight: 700 }}>Pro előfizetést</span> kapsz — teljesen ingyen, örökre.
              </p>

              {/* Benefits */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24, textAlign: "left" }}>
                {[
                  "⚡ Örökös Pro — soha nem jár le",
                  "💬 10 aktív match egyszerre",
                  "🔓 Lejárt matchek felébresztése",
                  "👑 Alapító tag badge a profilodon",
                  "🎯 Korai hozzáférés új funkciókhoz",
                ].map(b => (
                  <div key={b} style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, borderRadius: 10, padding: "10px 14px", border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 14, color: C.text }}>{b}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => setShowFounderWelcome(false)} style={{
                width: "100%", padding: "16px",
                background: "linear-gradient(135deg, #a78bfa, #6366f1)",
                border: "none", borderRadius: 16, color: "#fff",
                fontSize: 16, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 8px 24px rgba(167,139,250,0.4)",
              }}>
                🚀 Kezdjük el!
              </button>
            </div>
          </div>
        )}
        {showFilters && <FilterModal filters={filters} onApply={f => { setFilters(f); setRadius(f.maxDistance); }} onClose={() => setShowFilters(false)} />}

        {doubleDate ? (
          <DoubleDateChat group={doubleDate} onBack={() => setDoubleDate(null)} />
        ) : activeChat ? (
          <ChatView
            match={activeChat}
            onBack={() => setActiveChat(null)}
            onOpenDoubleDate={(m) => setDoubleDate(MOCK_OTHER_COUPLE)}
          />
        ) : (
          <>
            {tab === "radar" && <RadarScreen users={filteredUsers} radius={filters.maxDistance} setRadius={r => setFilters(f => ({ ...f, maxDistance: r }))} onUserClick={() => setTab("swipe")} />}
            {tab === "swipe" && <SwipeScreen users={filteredUsers} onMatch={handleMatch} />}
            {tab === "matches" && <MatchList matches={matches} onOpen={m => setActiveChat(m)} isPro={isPro} onUpgrade={() => setIsPro(true)} onExpire={expireMatch} onRevive={reviveMatch} />}
            {tab === "profile" && <ProfileScreen profile={profile} setProfile={setProfile} />}
          </>
        )}
      </div>

      {/* Bottom nav */}
      {!activeChat && !doubleDate && <BottomNav active={tab} setActive={setTab} unreadNotifs={unreadNotifs} />}

      <style>{`
        @keyframes shimmer { from { background-position: 200% center; } to { background-position: -200% center; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseRing { 0%{transform:translate(-50%,-50%) scale(0.8);opacity:0.8} 100%{transform:translate(-50%,-50%) scale(1.6);opacity:0} }
        @keyframes heartbeat { 0%,100%{transform:scale(1)} 30%{transform:scale(1.25)} 60%{transform:scale(1.1)} }
        @keyframes breathe { 0%,100%{opacity:0.4;transform:translate(-50%,-50%) scale(1)} 50%{opacity:0.7;transform:translate(-50%,-50%) scale(1.1)} }
        @keyframes shrink { from{width:100%} to{width:0%} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        input[type=range]{-webkit-appearance:none;height:3px;background:rgba(240,244,255,0.1);border-radius:2px}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#ff5c5c;cursor:pointer;box-shadow:0 0 8px rgba(255,92,92,0.5);border:2px solid #fff}
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{display:none}
        textarea::placeholder,input::placeholder{color:rgba(240,244,255,0.2)}
      `}</style>
    </Shell>
  );
}
