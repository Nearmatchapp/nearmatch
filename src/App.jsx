import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#080b10", surface: "#0f1520", card: "#141c2b",
  border: "rgba(255,255,255,0.07)", accent: "#ff5c5c",
  accentSoft: "rgba(255,92,92,0.12)", accentGlow: "rgba(255,92,92,0.35)",
  orange: "#ff8c42", yellow: "#ffd43b", green: "#3ecf8e",
  text: "#f0f4ff", muted: "rgba(240,244,255,0.55)", dim: "rgba(240,244,255,0.2)",
};

const INTERESTS_ALL = [
  "📸 Fotózás","☕ Kávé","🎵 Zene","✈️ Utazás","🧘 Yoga","📚 Olvasás",
  "🎮 Gaming","🍕 Gasztronómia","🏃 Futás","🎨 Művészet","🐶 Állatok","🌿 Természet",
  "💃 Tánc","🎬 Film","🏋️ Sport","🌍 Kultúra",
];

const DEFAULT_FILTERS = {
  ageMin: 18, ageMax: 40, maxDistance: 200,
  interests: [], gender: "mindenki", lookingFor: [],
  onlyActive: false, onlyWithPhoto: true, onlyWithBio: false, education: [],
};

// 🔑 "Meglátjuk" = 🤷 (nem szivárvány!)
const LOOKING_FOR_OPTIONS = [
  { l: "Komoly kapcsolat", i: "💍" },
  { l: "Laza ismerkedés", i: "✨" },
  { l: "Új barátok", i: "👋" },
  { l: "Meglátjuk", i: "🤷" },
];

const MOCK_USERS = [
  { id: 1, name: "Sára", age: 26, bio: "Fotós, kávérajongó ☕ Ha fesztiválon vagy, én is ott vagyok valahol a tömegben.", distance: 18, photo: "https://i.pravatar.cc/300?img=47", tags: ["📸 Fotózás","☕ Kávé","🎵 Zene"], active: true, ghostScore: 0.85, lookingFor: "Komoly kapcsolat", details: { height: "168 cm", education: "Egyetem / MA", smoking: "Nem dohányzik" } },
  { id: 2, name: "Léa", age: 24, bio: "Zenész, fesztiválok szerelmese 🎵 Mindig valami új kalandot keresek.", distance: 43, photo: "https://i.pravatar.cc/300?img=45", tags: ["🎵 Zene","✈️ Utazás","🎨 Művészet"], active: true, ghostScore: 0.65, lookingFor: "Laza ismerkedés", details: { height: "162 cm", education: "Főiskola / BA", smoking: "Nem dohányzik" } },
  { id: 3, name: "Anna", age: 28, bio: "Építész, könyvmoly 📚 Hétvégente kávézókban olvasok.", distance: 67, photo: "https://i.pravatar.cc/300?img=44", tags: ["📚 Olvasás","🎨 Művészet","☕ Kávé"], active: false, ghostScore: 0.45, lookingFor: "Komoly kapcsolat", details: { height: "170 cm", education: "Egyetem / MA", smoking: "Nem dohányzik" } },
  { id: 4, name: "Nóra", age: 23, bio: "Marketing, utazás imádó ✈️ 15 ország, még sok van hátra!", distance: 112, photo: "https://i.pravatar.cc/300?img=49", tags: ["✈️ Utazás","📸 Fotózás","💃 Tánc"], active: true, ghostScore: 0.9, lookingFor: "Új barátok", details: { height: "165 cm", education: "Főiskola / BA", smoking: "Alkalmanként" } },
  { id: 5, name: "Kata", age: 27, bio: "Orvos, futás és sport 🏃 Félmaratont futok, de kávé nélkül nem megy.", distance: 189, photo: "https://i.pravatar.cc/300?img=41", tags: ["🏃 Futás","🏋️ Sport","🌿 Természet"], active: false, ghostScore: 0.25, lookingFor: "Meglátjuk", details: { height: "172 cm", education: "Egyetem / MA", smoking: "Nem dohányzik" } },
  { id: 6, name: "Zsófi", age: 25, bio: "Grafikus, gaming rajongó 🎮 Nap mint nap rajzolok vagy játszom.", distance: 55, photo: "https://i.pravatar.cc/300?img=32", tags: ["🎮 Gaming","🎨 Művészet","🎬 Film"], active: true, ghostScore: 0.78, lookingFor: "Laza ismerkedés", details: { height: "160 cm", education: "Főiskola / BA", smoking: "Nem dohányzik" } },
  { id: 7, name: "Bori", age: 29, bio: "Séf, gasztronómia megszállott 🍕 Ha nem főzök, étteremben kóstolok.", distance: 30, photo: "https://i.pravatar.cc/300?img=38", tags: ["🍕 Gasztronómia","🌍 Kultúra","✈️ Utazás"], active: true, ghostScore: 0.92, lookingFor: "Komoly kapcsolat", details: { height: "166 cm", education: "Szakképzés", smoking: "Nem dohányzik" } },
  { id: 8, name: "Réka", age: 22, bio: "Táncos, yoga fanatikus 🧘 A mozgás az életem.", distance: 88, photo: "https://i.pravatar.cc/300?img=35", tags: ["💃 Tánc","🧘 Yoga","🎵 Zene"], active: true, ghostScore: 0.7, lookingFor: "Új barátok", details: { height: "163 cm", education: "Középiskola", smoking: "Nem dohányzik" } },
  { id: 9, name: "Petra", age: 31, bio: "Jogász, filmimádó 🎬 Hétvégén moziban vagy túrán találsz.", distance: 140, photo: "https://i.pravatar.cc/300?img=25", tags: ["🎬 Film","📚 Olvasás","🌿 Természet"], active: false, ghostScore: 0.55, lookingFor: "Meglátjuk", details: { height: "169 cm", education: "PhD", smoking: "Nem dohányzik" } },
  { id: 10, name: "Viki", age: 26, bio: "Állatorvos, állatimádó 🐶 Mindig van nálam kutyás kép.", distance: 22, photo: "https://i.pravatar.cc/300?img=23", tags: ["🐶 Állatok","🌿 Természet","🏃 Futás"], active: true, ghostScore: 0.88, lookingFor: "Komoly kapcsolat", details: { height: "164 cm", education: "Egyetem / MA", smoking: "Nem dohányzik" } },
];

const INIT_MATCHES = [
  { id: 1, name: "Sára", photo: "https://i.pravatar.cc/300?img=47", lastMsg: "Szia! Látom közel vagyunk 😊", time: "12:43", unread: true, msgs: [{ from: "them", text: "Szia! Látom közel vagyunk 😊", time: "12:41" }, { from: "me", text: "Igen! Melyik standnál vagy?", time: "12:42" }, { from: "them", text: "A főszínpad mellett, narancssárga pólóban!", time: "12:43" }] },
  { id: 2, name: "Léa", photo: "https://i.pravatar.cc/300?img=45", lastMsg: "Ez az app annyira jó!", time: "11:20", unread: false, msgs: [{ from: "them", text: "Ez az app annyira jó!", time: "11:20" }] },
  { id: 3, name: "Anna", photo: "https://i.pravatar.cc/300?img=44", lastMsg: "Lejárt match", time: "tegnap", status: "expired", unread: false, msgs: [] },
];

function ghostLabel(score) {
  if (score >= 0.8) return { text: "💬 Aktív üzenetküldő", color: "#3ecf8e" };
  if (score >= 0.6) return { text: "💬 Általában válaszol", color: "#4dabf7" };
  if (score >= 0.4) return { text: "⏳ Lassan válaszol", color: "#ffd43b" };
  return null;
}

// ── ONBOARDING ─────────────────────────────────────────
const ONBOARDING_STEPS = 6;

function Btn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", padding: "16px", background: disabled ? C.card : `linear-gradient(135deg,${C.accent},#ff8c42)`, border: "none", borderRadius: 16, color: "#fff", fontSize: 16, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, marginTop: 8 }}>
      {children}
    </button>
  );
}

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name: "", birthdate: "", gender: "", bio: "", interests: [], phone: "", showMe: "", lookingFor: "", ageConfirmed: false, locationGranted: false, authMethod: "" });
  const next = () => step < ONBOARDING_STEPS - 1 ? setStep(s => s + 1) : onComplete(data);
  const back = () => setStep(s => Math.max(0, s - 1));

  const ProgressBar = () => (
    <div style={{ display: "flex", gap: 5 }}>
      {Array.from({ length: ONBOARDING_STEPS }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? `linear-gradient(90deg,${C.accent},#ff8c42)` : C.border, transition: "background 0.3s" }} />
      ))}
    </div>
  );

  const Header = () => (
    <div style={{ padding: "14px 20px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}` }}>
      <button onClick={back} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>← Vissza</button>
      <div style={{ flex: 1 }}><ProgressBar /></div>
      <span style={{ color: C.dim, fontSize: 11 }}>{step + 1}/{ONBOARDING_STEPS}</span>
    </div>
  );

  if (step === 0) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "28px 28px 32px", background: C.bg }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 86, height: 86, borderRadius: 26, background: `linear-gradient(135deg,${C.accent},#ff8c42)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📍</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, margin: "0 0 6px", fontFamily: "Georgia,serif", color: C.text }}>NearMatch</h1>
        <p style={{ color: C.muted, fontSize: 14, textAlign: "center", margin: "0 0 28px", lineHeight: 1.7 }}>Közelségen alapuló társkereső.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
          <button onClick={() => { setData(d => ({ ...d, authMethod: "apple", name: "Alex" })); next(); }} style={{ width: "100%", padding: "15px", background: "#fff", border: "none", borderRadius: 14, color: "#000", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>🍎 Folytatás Apple-lel</button>
          <button onClick={() => { setData(d => ({ ...d, authMethod: "google", name: "Alex" })); next(); }} style={{ width: "100%", padding: "15px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, color: C.text, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>🌐 Folytatás Google-lel</button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ flex: 1, height: 1, background: C.border }} /><span style={{ color: C.dim, fontSize: 12 }}>vagy</span><div style={{ flex: 1, height: 1, background: C.border }} /></div>
          <button onClick={next} style={{ width: "100%", padding: "15px", background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: 14, color: C.accent, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Folytatás telefonszámmal</button>
        </div>
      </div>
    </div>
  );

  if (step === 1) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 0 24px", background: C.bg }}>
      <Header />
      <div style={{ flex: 1, padding: "8px 24px", overflowY: "auto" }}>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, fontFamily: "Georgia,serif", margin: "20px 0 8px" }}>Telefonszámod</h2>
        <div style={{ display: "flex", background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "0 14px", background: C.surface, display: "flex", alignItems: "center", color: C.muted, fontSize: 14, borderRight: `1px solid ${C.border}` }}>+36</div>
          <input type="tel" placeholder="30 123 4567" value={data.phone} onChange={e => setData(d => ({ ...d, phone: e.target.value }))} style={{ flex: 1, padding: "16px 14px", background: "transparent", border: "none", color: C.text, fontSize: 16, outline: "none" }} />
        </div>
        <Btn onClick={next} disabled={data.phone.length < 8}>SMS kód küldése →</Btn>
      </div>
    </div>
  );

  if (step === 2) {
    const birthYear = data.birthdate ? new Date(data.birthdate).getFullYear() : null;
    const age = birthYear ? new Date().getFullYear() - birthYear : null;
    const isUnderage = age !== null && age < 18;
    const canProceed = data.name && data.birthdate && data.gender && data.ageConfirmed && !isUnderage;
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 0 24px", background: C.bg }}>
        <Header />
        <div style={{ flex: 1, padding: "8px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, fontFamily: "Georgia,serif", margin: "12px 0 0" }}>Rólad</h2>
          <div>
            <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Keresztneved</label>
            <input type="text" placeholder="pl. Sára" value={data.name} onChange={e => setData(d => ({ ...d, name: e.target.value }))} style={{ display: "block", width: "100%", padding: "14px", marginTop: 8, borderRadius: 13, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 16, outline: "none" }} />
          </div>
          <div>
            <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Születési dátum</label>
            <input type="date" value={data.birthdate} onChange={e => setData(d => ({ ...d, birthdate: e.target.value }))} style={{ display: "block", width: "100%", padding: "14px", marginTop: 8, borderRadius: 13, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 16, outline: "none" }} />
            {age !== null && (<div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 10, background: isUnderage ? "rgba(255,92,92,0.1)" : "rgba(62,207,142,0.1)", border: `1px solid ${isUnderage ? C.accent : C.green}` }}><span>{isUnderage ? "🚫" : "✅"}</span><span style={{ fontSize: 13, color: isUnderage ? C.accent : C.green, fontWeight: 600, marginLeft: 8 }}>{age} éves {isUnderage ? "— 18+ korhatáros" : "— Megfelelő kor"}</span></div>)}
          </div>
          <div>
            <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Nemed</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              {["Nő", "Férfi", "Non-binary", "Egyéb"].map(g => (<button key={g} onClick={() => setData(d => ({ ...d, gender: g }))} style={{ padding: "12px", borderRadius: 12, border: `1px solid ${data.gender === g ? C.accent : C.border}`, background: data.gender === g ? C.accentSoft : C.card, color: data.gender === g ? C.accent : C.text, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>{g}</button>))}
            </div>
          </div>
          {!isUnderage && data.birthdate && (
            <div onClick={() => setData(d => ({ ...d, ageConfirmed: !d.ageConfirmed }))} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px", background: C.card, borderRadius: 13, border: `1px solid ${data.ageConfirmed ? C.accent : C.border}`, cursor: "pointer" }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, background: data.ageConfirmed ? C.accent : "transparent", border: `2px solid ${data.ageConfirmed ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{data.ageConfirmed && <span style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>✓</span>}</div>
              <div><div style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>Megerősítem, hogy 18+ vagyok</div></div>
            </div>
          )}
          <Btn onClick={next} disabled={!canProceed}>Tovább →</Btn>
        </div>
      </div>
    );
  }

  if (step === 3) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 0 24px", background: C.bg }}>
      <Header />
      <div style={{ flex: 1, padding: "8px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, fontFamily: "Georgia,serif", margin: "12px 0 0" }}>Mutatkozz be</h2>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Bio</label><span style={{ color: C.dim, fontSize: 11 }}>{(data.bio || "").length}/300</span></div>
          <textarea value={data.bio || ""} onChange={e => setData(d => ({ ...d, bio: e.target.value.slice(0, 300) }))} placeholder="Mesélj magadról..." style={{ width: "100%", padding: "14px", borderRadius: 13, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", resize: "none", minHeight: 100, lineHeight: 1.6 }} />
        </div>
        <div>
          <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Érdeklődési körök (min. 3)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
            {INTERESTS_ALL.map(tag => { const on = data.interests.includes(tag); return (<button key={tag} onClick={() => setData(d => ({ ...d, interests: on ? d.interests.filter(i => i !== tag) : [...d.interests, tag] }))} style={{ padding: "8px 13px", borderRadius: 20, fontSize: 13, cursor: "pointer", border: `1px solid ${on ? C.accent : C.border}`, background: on ? C.accentSoft : C.card, color: on ? C.accent : C.muted, fontWeight: on ? 700 : 400 }}>{tag}</button>); })}
          </div>
        </div>
        <Btn onClick={next} disabled={data.interests.length < 3}>Tovább →</Btn>
      </div>
    </div>
  );

  if (step === 4) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 0 24px", background: C.bg }}>
      <Header />
      <div style={{ flex: 1, padding: "8px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, fontFamily: "Georgia,serif", margin: "12px 0 0" }}>Preferenciák</h2>
        <div>
          <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Kit szeretnél látni?</label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>{["Nőket","Férfiakat","Mindenkit"].map(s => (<button key={s} onClick={() => setData(d => ({ ...d, showMe: s }))} style={{ flex: 1, padding: "12px 8px", borderRadius: 12, border: `1px solid ${data.showMe === s ? C.accent : C.border}`, background: data.showMe === s ? C.accentSoft : C.card, color: data.showMe === s ? C.accent : C.text, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>{s}</button>))}</div>
        </div>
        <div>
          <label style={{ color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Mit keresel?</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            {LOOKING_FOR_OPTIONS.map(x => (<button key={x.l} onClick={() => setData(d => ({ ...d, lookingFor: x.l }))} style={{ padding: "14px 10px", borderRadius: 14, border: `1px solid ${data.lookingFor === x.l ? C.accent : C.border}`, background: data.lookingFor === x.l ? C.accentSoft : C.card, color: data.lookingFor === x.l ? C.accent : C.text, cursor: "pointer", textAlign: "center" }}><div style={{ fontSize: 22, marginBottom: 4 }}>{x.i}</div><div style={{ fontSize: 12, fontWeight: 600 }}>{x.l}</div></button>))}
          </div>
        </div>
        <Btn onClick={next} disabled={!data.showMe || !data.lookingFor}>Tovább →</Btn>
      </div>
    </div>
  );

  if (step === 5) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg }}>
      <Header />
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 24, paddingTop: 20 }}>
          <div style={{ width: 86, height: 86, borderRadius: 24, margin: "0 auto 16px", background: `linear-gradient(135deg,${C.accent},#ff8c42)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📍</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 8px", color: C.text, fontFamily: "Georgia,serif" }}>Helyszín hozzáférés</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {[{ icon: "👁️", title: "Mit látnak mások?", desc: "Soha nem látják a pontos GPS koordinátáidat." }, { icon: "⏰", title: "Mikor aktív?", desc: "Csak akkor olvassuk, ha az app előtérben van." }, { icon: "🗑️", title: "Mennyi ideig tároljuk?", desc: "90 másodpercig, majd automatikusan törlődik." }].map(item => (
            <div key={item.title} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: C.card, borderRadius: 13, padding: "14px", border: `1px solid ${C.border}` }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{item.icon}</div>
              <div><div style={{ color: C.text, fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{item.title}</div><div style={{ color: C.muted, fontSize: 12, lineHeight: 1.5 }}>{item.desc}</div></div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => onComplete({ ...data, locationGranted: true })} style={{ width: "100%", padding: "16px", background: `linear-gradient(135deg,${C.accent},#ff8c42)`, border: "none", borderRadius: 16, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>📍 Helyszín engedélyezése</button>
          <button onClick={() => onComplete({ ...data, locationGranted: false })} style={{ width: "100%", padding: "16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, color: C.muted, fontSize: 15, cursor: "pointer" }}>Kihagyom egyelőre</button>
        </div>
      </div>
    </div>
  );

  return null;
}

// ── PRO WALL ───────────────────────────────────────────
function ProWall({ user, onClose, onUpgrade }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 95, background: "rgba(8,11,16,0.92)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end" }}>
      <div style={{ width: "100%", background: C.surface, borderRadius: "28px 28px 0 0", padding: "28px 24px 40px", border: `1px solid ${C.border}` }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🔒</div>
          <h3 style={{ color: C.text, fontSize: 22, fontWeight: 900, margin: "0 0 8px", fontFamily: "Georgia,serif" }}>Pro funkció</h3>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.5, margin: 0 }}>A Radar profil megtekintése csak <span style={{ color: C.yellow, fontWeight: 700 }}>Pro</span> tagoknak elérhető.</p>
        </div>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, borderRadius: 14, padding: "14px 16px", border: `1px solid ${C.border}`, marginBottom: 20, filter: "blur(3px)", pointerEvents: "none" }}>
            <img src={user.photo} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} alt="" />
            <div><div style={{ color: C.text, fontWeight: 700 }}>{user.name}, {user.age}</div><div style={{ color: C.accent, fontSize: 12 }}>● {user.distance}m közel</div></div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {["🔒 Radar profil megtekintése", "💬 10 aktív match egyszerre", "🔄 Lejárt matchek újraélesztése", "⚡ Kiemelés — heti 1 db", "🎯 Fejlett szűrők"].map(b => (
            <div key={b} style={{ background: C.card, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13 }}>{b}</div>
          ))}
        </div>
        <button onClick={onUpgrade} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg,#ffd43b,#ff8c42)", border: "none", borderRadius: 16, color: "#000", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}>⚡ Upgrade Pro-ra</button>
        <button onClick={onClose} style={{ width: "100%", padding: "14px", background: "none", border: `1px solid ${C.border}`, borderRadius: 16, color: C.muted, fontSize: 15, cursor: "pointer" }}>Mégse</button>
      </div>
    </div>
  );
}

// ── FILTER MODAL ───────────────────────────────────────
function FilterModal({ filters, onApply, onClose }) {
  const [f, setF] = useState({ ...filters });
  const set = (key, val) => setF(prev => ({ ...prev, [key]: val }));
  const activeCount = [f.ageMin !== 18 || f.ageMax !== 40, f.maxDistance !== 200, f.interests.length > 0, f.gender !== "mindenki", f.lookingFor.length > 0, f.onlyActive, f.education.length > 0].filter(Boolean).length;
  const Toggle = ({ on, onChange }) => (<div onClick={onChange} style={{ width: 44, height: 26, borderRadius: 13, background: on ? C.accent : C.card, border: `1px solid ${on ? C.accent : C.border}`, position: "relative", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}><div style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} /></div>);
  const Chip = ({ label, selected, onToggle }) => (<button onClick={onToggle} style={{ padding: "8px 13px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: `1px solid ${selected ? C.accent : C.border}`, background: selected ? C.accentSoft : C.card, color: selected ? C.accent : C.muted, fontWeight: selected ? 700 : 400 }}>{label}</button>);
  const SL = ({ children }) => <div style={{ color: C.dim, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, marginTop: 16 }}>{children}</div>;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 90, background: "rgba(8,11,16,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end" }}>
      <div style={{ width: "100%", maxHeight: "92%", background: C.surface, borderRadius: "28px 28px 0 0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}><div style={{ width: 36, height: 4, borderRadius: 2, background: C.border }} /></div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 8px" }}>
          <div><h3 style={{ margin: 0, color: C.text, fontSize: 20, fontWeight: 800 }}>Szűrők</h3>{activeCount > 0 && <div style={{ color: C.accent, fontSize: 12 }}>{activeCount} aktív szűrő</div>}</div>
          <div style={{ display: "flex", gap: 8 }}><button onClick={() => setF({ ...DEFAULT_FILTERS })} style={{ background: C.accentSoft, border: `1px solid ${C.accent}`, color: C.accent, borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Törlés</button><button onClick={onClose} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>✕</button></div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0px 20px 20px" }}>
          <SL>🎂 Korcsoport</SL>
          <div style={{ background: C.card, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: C.muted, fontSize: 12 }}>Min: {f.ageMin} év</span><span style={{ color: C.muted, fontSize: 12 }}>Max: {f.ageMax} év</span></div>
            <input type="range" min={18} max={f.ageMax - 1} value={f.ageMin} onChange={e => set("ageMin", +e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
            <input type="range" min={f.ageMin + 1} max={70} value={f.ageMax} onChange={e => set("ageMax", +e.target.value)} style={{ width: "100%" }} />
          </div>
          <SL>📍 Max. távolság</SL>
          <div style={{ background: C.card, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ color: C.muted, fontSize: 12 }}>Távolság</span><span style={{ color: C.accent, fontSize: 12, fontWeight: 700 }}>{f.maxDistance < 1000 ? `${f.maxDistance}m` : `${(f.maxDistance / 1000).toFixed(1)}km`}</span></div>
            <input type="range" min={50} max={20000} step={50} value={f.maxDistance} onChange={e => set("maxDistance", +e.target.value)} style={{ width: "100%" }} />
          </div>
          <SL>👤 Nem</SL>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>{["mindenki","nők","férfiak","non-binary"].map(g => <Chip key={g} label={g.charAt(0).toUpperCase() + g.slice(1)} selected={f.gender === g} onToggle={() => set("gender", g)} />)}</div>
          <SL>💍 Mit keres</SL>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>{LOOKING_FOR_OPTIONS.map(x => { const on = f.lookingFor.includes(x.l); return <Chip key={x.l} label={`${x.i} ${x.l}`} selected={on} onToggle={() => set("lookingFor", on ? f.lookingFor.filter(v => v !== x.l) : [...f.lookingFor, x.l])} />; })}</div>
          <SL>🎯 Érdeklődés</SL>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 8 }}>{INTERESTS_ALL.map(tag => { const on = f.interests.includes(tag); return <Chip key={tag} label={tag} selected={on} onToggle={() => set("interests", on ? f.interests.filter(i => i !== tag) : [...f.interests, tag])} />; })}</div>
          <SL>🎓 Képzettség</SL>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 8 }}>{["Középiskola","Főiskola / BA","Egyetem / MA","PhD","Szakképzés"].map(e => { const on = f.education.includes(e); return <Chip key={e} label={e} selected={on} onToggle={() => set("education", on ? f.education.filter(x => x !== e) : [...f.education, e])} />; })}</div>
          <SL>⚡ Gyors szűrők</SL>
          <div style={{ background: C.card, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}` }}>
            {[{ key: "onlyActive", label: "Csak aktív (online most)", sub: "Akik az elmúlt 5 percben aktívak" }, { key: "onlyWithPhoto", label: "Csak profilképpel", sub: "Ellenőrzött fotóval" }, { key: "onlyWithBio", label: "Csak bemutatkozóval", sub: "Akik kitöltötték a biójukat" }].map((item, idx) => (
              <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderTop: idx > 0 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ flex: 1 }}><div style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{item.label}</div><div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>{item.sub}</div></div>
                <Toggle on={f[item.key]} onChange={() => set(item.key, !f[item.key])} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "12px 20px 32px", borderTop: `1px solid ${C.border}`, background: C.surface }}>
          <button onClick={() => { onApply(f); onClose(); }} style={{ width: "100%", padding: "16px", background: `linear-gradient(135deg,${C.accent},#ff8c42)`, border: "none", borderRadius: 16, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>{activeCount > 0 ? `Szűrők alkalmazása (${activeCount} aktív)` : "Szűrők alkalmazása"}</button>
        </div>
      </div>
    </div>
  );
}

// ── DUPLA RANDI ────────────────────────────────────────
function DoubleDateChat({ onBack }) {
  const [msgs, setMsgs] = useState([
    { from: "Bence", photo: "https://i.pravatar.cc/300?img=12", text: "Sziasztok! Mikor értek oda?", time: "13:10" },
    { from: "Réka", photo: "https://i.pravatar.cc/300?img=48", text: "Mi már itt vagyunk a kávézónál 😊", time: "13:11" },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);
  const send = () => { if (!input.trim()) return; setMsgs(m => [...m, { from: "me", photo: null, text: input, time: new Date().toLocaleTimeString("hu", { hour: "2-digit", minute: "2-digit" }) }]); setInput(""); };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 20 }}>←</button>
        <div style={{ flex: 1 }}><div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>Dupla Randi 🎉</div></div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.map((m, i) => { const isMe = m.from === "me"; return (<div key={i} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}>{!isMe && m.photo && <img src={m.photo} style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} alt={m.from} />}<div style={{ maxWidth: "68%" }}>{!isMe && <div style={{ color: C.dim, fontSize: 10, marginBottom: 3, paddingLeft: 4 }}>{m.from}</div>}<div style={{ padding: "9px 13px", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isMe ? `linear-gradient(135deg,${C.accent},#ff8c42)` : C.card, color: "#fff", fontSize: 14 }}>{m.text}<div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4, textAlign: "right" }}>{m.time}</div></div></div></div>); })}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Írj üzenetet..." style={{ flex: 1, padding: "12px 16px", borderRadius: 24, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none" }} />
        <button onClick={send} style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},#ff8c42)`, border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>→</button>
      </div>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div style={{ width: "100%", maxWidth: 390, margin: "0 auto", height: "100vh", maxHeight: 844, background: C.bg, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {children}
      <style>{`* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; } ::-webkit-scrollbar { display: none; } input[type=range] { -webkit-appearance: none; height: 3px; background: rgba(240,244,255,0.15); border-radius: 2px; outline: none; width: 100%; } input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #ff5c5c; cursor: pointer; } @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>
    </div>
  );
}

function BottomNav({ active, setActive, unreadMatches }) {
  const tabs = [{ id: "radar", icon: "◎", label: "Radar" }, { id: "swipe", icon: "♥", label: "Swipe" }, { id: "matches", icon: "💬", label: "Matchek" }, { id: "profile", icon: "👤", label: "Profil" }];
  return (
    <div style={{ display: "flex", borderTop: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActive(t.id)} style={{ flex: 1, padding: "10px 0", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}>
          <span style={{ fontSize: 20, opacity: active === t.id ? 1 : 0.4 }}>{t.icon}</span>
          <span style={{ fontSize: 10, color: active === t.id ? C.accent : C.dim }}>{t.label}</span>
          {t.id === "matches" && unreadMatches > 0 && (<div style={{ position: "absolute", top: 6, right: "22%", width: 14, height: 14, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 700 }}>{unreadMatches}</div>)}
        </button>
      ))}
    </div>
  );
}

// ── RADAR ──────────────────────────────────────────────
function RadarScreen({ users, radius, setRadius, isPro, onUpgrade, boostActive }) {
  const canvasRef = useRef(null);
  const [dots, setDots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showProWall, setShowProWall] = useState(false);
  const animRef = useRef(null);
  const angleRef = useRef(0);

  useEffect(() => {
    setDots(users.map((u, i) => ({ ...u, angle: (i / users.length) * Math.PI * 2, r: 0.3 + (u.distance / 20000) * 0.6 })));
  }, [users]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); const size = canvas.width; const cx = size / 2, cy = size / 2;
    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      [0.3, 0.55, 0.8].forEach(r => { ctx.beginPath(); ctx.arc(cx, cy, r * (size / 2), 0, Math.PI * 2); ctx.strokeStyle = "rgba(255,92,92,0.12)"; ctx.lineWidth = 1; ctx.stroke(); });
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(angleRef.current);
      const grad = ctx.createLinearGradient(0, -size / 2, 0, 0); grad.addColorStop(0, "rgba(255,92,92,0)"); grad.addColorStop(1, "rgba(255,92,92,0.18)");
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, size / 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 0.4); ctx.closePath(); ctx.fillStyle = grad; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fillStyle = C.accent; ctx.fill();
      dots.forEach(d => {
        const x = cx + Math.cos(d.angle) * d.r * (size / 2 - 20); const y = cy + Math.sin(d.angle) * d.r * (size / 2 - 20);
        ctx.beginPath(); ctx.arc(x, y, selected?.id === d.id ? 8 : 5, 0, Math.PI * 2); ctx.fillStyle = selected?.id === d.id ? C.accent : "rgba(255,92,92,0.7)"; ctx.fill();
        if (selected?.id === d.id) { ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.strokeStyle = "rgba(255,92,92,0.4)"; ctx.lineWidth = 2; ctx.stroke(); }
      });
      angleRef.current += 0.015; animRef.current = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(animRef.current);
  }, [dots, selected]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width); const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const size = canvas.width; const cx = size / 2, cy = size / 2; let found = null;
    dots.forEach(d => { const dx = cx + Math.cos(d.angle) * d.r * (size / 2 - 20); const dy = cy + Math.sin(d.angle) * d.r * (size / 2 - 20); if (Math.hypot(x - dx, y - dy) < 20) found = d; });
    setSelected(found);
  };

  return (
    <>
      {showProWall && <ProWall user={selected} onClose={() => setShowProWall(false)} onUpgrade={() => { onUpgrade(); setShowProWall(false); }} />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "10px 16px", gap: 10, overflowY: "auto" }}>
        <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
          <canvas ref={canvasRef} width={340} height={340} onClick={handleCanvasClick} style={{ borderRadius: "50%", cursor: "crosshair" }} />
          {selected && (
            <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, minWidth: 220 }}>
              {isPro ? (<img src={selected.photo} style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} alt={selected.name} />) : (<div style={{ width: 42, height: 42, borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔒</div>)}
              <div style={{ flex: 1 }}>
                {isPro ? (<><div style={{ color: C.text, fontWeight: 700 }}>{selected.name}, {selected.age}</div><div style={{ color: C.accent, fontSize: 12 }}>● {selected.distance}m</div></>) : (<><div style={{ color: C.text, fontWeight: 700 }}>Ismeretlen profil</div><div style={{ color: C.accent, fontSize: 12 }}>● {selected.distance}m közel</div></>)}
              </div>
              <button onClick={() => { if (!isPro) setShowProWall(true); }} style={{ background: isPro ? `linear-gradient(135deg,${C.accent},#ff8c42)` : "linear-gradient(135deg,#ffd43b,#ff8c42)", border: "none", borderRadius: 10, color: isPro ? "#fff" : "#000", padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{isPro ? "Profil" : "🔒 Pro"}</button>
            </div>
          )}
        </div>
        {boostActive && (
          <div style={{ background: "linear-gradient(135deg,rgba(255,212,59,0.12),rgba(255,140,66,0.12))", border: "1px solid rgba(255,212,59,0.4)", borderRadius: 13, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20, animation: "pulse 1s infinite" }}>⚡</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.yellow, fontWeight: 700, fontSize: 13 }}>Kiemelés aktív — legközelebb elöl</div>
              <div style={{ color: C.dim, fontSize: 11 }}>A közeliek távolság szerint rendezve jelennek meg</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: "0 0 6px #3ecf8e", flexShrink: 0 }} />
          </div>
        )}
        <div style={{ background: C.card, borderRadius: 14, padding: "12px 14px", border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: C.muted, fontSize: 12 }}>Sugár</span><span style={{ color: C.accent, fontSize: 12, fontWeight: 700 }}>{radius < 1000 ? `${radius}m` : `${(radius / 1000).toFixed(1)}km`}</span></div>
          <input type="range" min={50} max={20000} step={50} value={radius} onChange={e => setRadius(+e.target.value)} style={{ width: "100%" }} />
        </div>
        {!isPro && (
          <div style={{ background: "rgba(255,212,59,0.08)", border: "1px solid rgba(255,212,59,0.25)", borderRadius: 13, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <div style={{ flex: 1 }}><div style={{ color: C.yellow, fontWeight: 700, fontSize: 13 }}>Profilok rejtve</div><div style={{ color: C.dim, fontSize: 11 }}>Pro-val látod ki van közel</div></div>
            <button onClick={onUpgrade} style={{ background: "linear-gradient(135deg,#ffd43b,#ff8c42)", border: "none", borderRadius: 10, color: "#000", padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Upgrade</button>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {users.map(u => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, borderRadius: 13, padding: "10px 14px", border: `1px solid ${C.border}` }}>
              {isPro ? (<img src={u.photo} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} alt={u.name} />) : (<div style={{ width: 40, height: 40, borderRadius: "50%", background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: `1px solid ${C.border}`, flexShrink: 0 }}>🔒</div>)}
              <div style={{ flex: 1 }}>
                {isPro ? (<><div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{u.name}, {u.age}</div><div style={{ color: C.accent, fontSize: 11 }}>● {u.distance}m</div></>) : (<><div style={{ color: C.muted, fontWeight: 600, fontSize: 14 }}>Rejtett profil</div><div style={{ color: C.accent, fontSize: 11 }}>● {u.distance}m közel</div></>)}
              </div>
              <button onClick={() => { if (!isPro) { setSelected(u); setShowProWall(true); } }} style={{ background: isPro ? C.accentSoft : "rgba(255,212,59,0.1)", border: `1px solid ${isPro ? C.accent : "rgba(255,212,59,0.3)"}`, color: isPro ? C.accent : C.yellow, borderRadius: 10, padding: "7px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{isPro ? "Profil" : "🔒 Pro"}</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── SWIPE (végtelen loop, superlike, visszatekerés) ───
const THRESHOLD = 100;

// Napi limit segédfüggvény
function getTodayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }

function SwipeScreen({ users, onMatch, boostActive, isPro, onUpgrade }) {
  const [idx, setIdx] = useState(0);
  const [history, setHistory] = useState([]); // visszatekeréshez
  const [cardPage, setCardPage] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false });
  const [gone, setGone] = useState(false);
  const [actionLabel, setActionLabel] = useState(null); // "SUPER LIKE" / "LIKE" / "PASS"
  const startPos = useRef(null);

  // Super Like napi számláló
  const slLimit = isPro ? 5 : 1;
  const [slUsed, setSlUsed] = useState(0);
  const [slDay, setSlDay] = useState(getTodayKey());
  const slLeft = (() => { if (getTodayKey() !== slDay) return slLimit; return Math.max(0, slLimit - slUsed); })();

  // ProWall modal
  const [proWallType, setProWallType] = useState(null); // "rewind" | "superlike"

  useEffect(() => setCardPage(0), [idx]);

  if (!users.length) return (<div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, flexDirection: "column", gap: 16, color: C.muted }}><div style={{ fontSize: 50 }}>😕</div><div style={{ fontSize: 16, color: C.text }}>Nincs senki a közelben</div></div>);

  const cur = users[idx % users.length];
  const next = users[(idx + 1) % users.length];

  const showLabel = (label) => {
    setActionLabel(label);
    setTimeout(() => setActionLabel(null), 900);
  };

  const act = (dir) => {
    if (gone) return;
    setGone(true);
    setHistory(h => [...h.slice(-9), { idx, user: cur }]);
    if (dir === "like" || dir === "superlike") onMatch(cur);
    if (dir === "superlike") {
      const today = getTodayKey();
      if (today !== slDay) { setSlDay(today); setSlUsed(1); } else { setSlUsed(u => u + 1); }
    }
    setTimeout(() => { setIdx(i => i + 1); setGone(false); setDrag({ x: 0, y: 0, dragging: false }); }, 350);
  };

  const handleSuperLike = () => {
    if (slLeft <= 0) return;
    showLabel("SUPER LIKE");
    act("superlike");
  };

  const handleRewind = () => {
    if (!isPro) { setProWallType("rewind"); return; }
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setIdx(prev.idx);
  };

  const onMouseDown = (e) => { startPos.current = { x: e.clientX, y: e.clientY }; setDrag(d => ({ ...d, dragging: true })); };
  const onMouseMove = (e) => { if (!drag.dragging || !startPos.current) return; setDrag({ x: e.clientX - startPos.current.x, y: e.clientY - startPos.current.y, dragging: true }); };
  const onMouseUp = () => {
    if (!drag.dragging) return;
    if (drag.x > THRESHOLD) { showLabel("LIKE"); act("like"); }
    else if (drag.x < -THRESHOLD) { showLabel("PASS"); act("pass"); }
    else setDrag({ x: 0, y: 0, dragging: false });
    startPos.current = null;
  };
  const onTouchStart = (e) => { const t = e.touches[0]; startPos.current = { x: t.clientX, y: t.clientY }; setDrag(d => ({ ...d, dragging: true })); };
  const onTouchMove = (e) => { if (!startPos.current) return; const t = e.touches[0]; setDrag({ x: t.clientX - startPos.current.x, y: t.clientY - startPos.current.y, dragging: true }); };
  const onTouchEnd = () => {
    if (drag.x > THRESHOLD) { showLabel("LIKE"); act("like"); }
    else if (drag.x < -THRESHOLD) { showLabel("PASS"); act("pass"); }
    else setDrag({ x: 0, y: 0, dragging: false });
    startPos.current = null;
  };

  const transform = gone ? `translateX(${drag.x > 0 ? 600 : -600}px) rotate(${drag.x > 0 ? 25 : -25}deg)` : `translateX(${drag.x}px) translateY(${drag.y * 0.3}px) rotate(${drag.x / 15}deg)`;
  const transition = drag.dragging && !gone ? "none" : "transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)";
  const likeOpacity = Math.max(0, drag.x / THRESHOLD);
  const passOpacity = Math.max(0, -drag.x / THRESHOLD);
  const superOpacity = actionLabel === "SUPER LIKE" ? 1 : 0;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "6px 16px 10px", userSelect: "none" }} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      {boostActive && (
        <div style={{ background: "linear-gradient(135deg,rgba(255,212,59,0.12),rgba(255,140,66,0.12))", border: "1px solid rgba(255,212,59,0.35)", borderRadius: 12, padding: "9px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 16 }}>⚡</span>
          <div style={{ flex: 1, color: C.yellow, fontSize: 12, fontWeight: 700 }}>Kiemelés aktív — legközelebbiek kerülnek elő</div>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, boxShadow: "0 0 5px #3ecf8e", flexShrink: 0 }} />
        </div>
      )}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        {next && (
          <div style={{ position: "absolute", inset: 0, borderRadius: 24, overflow: "hidden", transform: "scale(0.95)", opacity: 0.7 }}>
            <img src={next.photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={next.name} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }} />
            <div style={{ position: "absolute", bottom: 18, left: 18 }}><span style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{next.name}</span><span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginLeft: 8 }}>{next.age}</span></div>
          </div>
        )}
        <div onMouseDown={onMouseDown} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          onClick={(e) => { if (Math.abs(drag.x) > 5) return; const rect = e.currentTarget.getBoundingClientRect(); const x = e.clientX - rect.left; if (x > rect.width * 0.75) setCardPage(p => Math.min(p + 1, 1)); else if (x < rect.width * 0.25) setCardPage(p => Math.max(p - 1, 0)); }}
          style={{ position: "absolute", inset: 0, borderRadius: 24, overflow: "hidden", background: C.card, cursor: "grab", transform, transition }}>
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4, zIndex: 10 }}>
            {[0, 1].map(p => <div key={p} style={{ width: p === cardPage ? 20 : 6, height: 6, borderRadius: 3, background: p === cardPage ? "#fff" : "rgba(255,255,255,0.4)", transition: "width 0.2s" }} />)}
          </div>
          {cardPage === 0 ? (
            <>
              <img src={cur.photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={cur.name} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,11,16,0.9) 0%, transparent 50%)" }} />
              <div style={{ position: "absolute", top: 14, right: 14, background: C.accent, borderRadius: 10, padding: "4px 10px", fontSize: 12, color: "#fff", fontWeight: 700 }}>● {cur.distance}m</div>
              <div style={{ position: "absolute", top: 30, left: 20, border: "3px solid #3ecf8e", borderRadius: 12, padding: "6px 16px", color: "#3ecf8e", fontSize: 22, fontWeight: 900, opacity: likeOpacity, transform: "rotate(-15deg)" }}>LIKE</div>
              <div style={{ position: "absolute", top: 30, right: 20, border: "3px solid #ff5c5c", borderRadius: 12, padding: "6px 16px", color: "#ff5c5c", fontSize: 22, fontWeight: 900, opacity: passOpacity, transform: "rotate(15deg)" }}>PASS</div>
              <div style={{ position: "absolute", top: 30, left: "50%", transform: "translateX(-50%) rotate(-5deg)", border: "3px solid #4dabf7", borderRadius: 12, padding: "6px 16px", color: "#4dabf7", fontSize: 20, fontWeight: 900, opacity: superOpacity, whiteSpace: "nowrap", transition: "opacity 0.2s" }}>⭐ SUPER LIKE</div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 20px 20px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}><span style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>{cur.name}</span><span style={{ fontSize: 20, color: "rgba(255,255,255,0.5)" }}>{cur.age}</span></div>
                {ghostLabel(cur.ghostScore) && (<div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.4)", borderRadius: 20, padding: "4px 10px", marginBottom: 8 }}><span style={{ fontSize: 12, color: ghostLabel(cur.ghostScore).color, fontWeight: 600 }}>{ghostLabel(cur.ghostScore).text}</span></div>)}
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: "0 0 10px" }}>{cur.bio}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{cur.tags.map(t => <span key={t} style={{ background: "rgba(255,92,92,0.18)", border: "1px solid rgba(255,92,92,0.3)", borderRadius: 20, padding: "4px 10px", fontSize: 12, color: "#fff" }}>{t}</span>)}</div>
                <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 8, textAlign: "center" }}>Koppints a részletekért →</div>
              </div>
            </>
          ) : (
            <div style={{ width: "100%", height: "100%", background: C.bg, overflowY: "auto", padding: "20px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><img src={cur.photo} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} alt={cur.name} /><div><div style={{ fontSize: 20, fontWeight: 900, color: C.text }}>{cur.name}, {cur.age}</div><div style={{ color: C.accent, fontSize: 12 }}>● {cur.distance}m</div></div></div>
              <div style={{ background: C.card, borderRadius: 14, padding: "13px", border: `1px solid ${C.border}`, marginBottom: 10 }}><div style={{ color: C.dim, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Bio</div><p style={{ color: C.text, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{cur.bio}</p></div>
              <div style={{ background: C.card, borderRadius: 14, padding: "13px", border: `1px solid ${C.border}`, marginBottom: 10 }}><div style={{ color: C.dim, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Érdeklődés</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{cur.tags.map(t => <span key={t} style={{ background: C.accentSoft, border: `1px solid ${C.accent}`, borderRadius: 20, padding: "4px 10px", fontSize: 12, color: C.accent }}>{t}</span>)}</div></div>
              {cur.details && (<div style={{ background: C.card, borderRadius: 14, padding: "13px", border: `1px solid ${C.border}`, marginBottom: 10 }}><div style={{ color: C.dim, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Részletek</div>{[["Magasság", cur.details.height], ["Végzettség", cur.details.education], ["Dohányzás", cur.details.smoking]].map(([k, v]) => v ? (<div key={k} style={{ display: "flex", justifyContent: "space-between", color: C.text, fontSize: 13, paddingBottom: 6 }}><span style={{ color: C.muted }}>{k}</span><span>{v}</span></div>) : null)}</div>)}
              {cur.lookingFor && (<div style={{ background: C.card, borderRadius: 14, padding: "13px", border: `1px solid ${C.border}` }}><div style={{ color: C.dim, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Mit keres</div><div style={{ color: C.text, fontWeight: 600 }}>{LOOKING_FOR_OPTIONS.find(x => x.l === cur.lookingFor)?.i} {cur.lookingFor}</div></div>)}
            </div>
          )}
        </div>
      </div>
      {/* ProWall modal visszatekerés / superlike limithez */}
      {proWallType && (
        <div style={{ position: "absolute", inset: 0, zIndex: 95, background: "rgba(8,11,16,0.92)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end" }}>
          <div style={{ width: "100%", background: C.surface, borderRadius: "28px 28px 0 0", padding: "28px 24px 40px", border: `1px solid ${C.border}` }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>{proWallType === "rewind" ? "↩️" : "⭐"}</div>
              <h3 style={{ color: C.text, fontSize: 20, fontWeight: 900, margin: "0 0 8px" }}>{proWallType === "rewind" ? "Visszatekerés — Pro funkció" : "Super Like elfogyott"}</h3>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                {proWallType === "rewind" ? "Az előző profil visszahozása csak Pro tagoknak elérhető." : `Mára elhasználtad az összes Super Like-odat. Pro-val napi 5 db jár.`}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {(proWallType === "rewind"
                ? ["↩️ Korlátlan visszatekerés", "⭐ Napi 5 Super Like", "🔒 Radar profil megtekintése", "💬 10 aktív match"]
                : ["⭐ Napi 5 Super Like (Free: 1/nap)", "↩️ Korlátlan visszatekerés", "🔒 Radar profil megtekintése", "💬 10 aktív match"]
              ).map(b => (<div key={b} style={{ background: C.card, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13 }}>{b}</div>))}
            </div>
            <button onClick={() => { onUpgrade(); setProWallType(null); }} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg,#ffd43b,#ff8c42)", border: "none", borderRadius: 16, color: "#000", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}>⚡ Upgrade Pro-ra</button>
            <button onClick={() => setProWallType(null)} style={{ width: "100%", padding: "14px", background: "none", border: `1px solid ${C.border}`, borderRadius: 16, color: C.muted, fontSize: 15, cursor: "pointer" }}>Mégse</button>
          </div>
        </div>
      )}
      <div style={{ flexShrink: 0, paddingTop: 10 }}>
        {/* Super Like számláló */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10 }}>
          {Array.from({ length: slLimit }).map((_, i) => (
            <div key={i} style={{ width: 20, height: 4, borderRadius: 2, background: i < slLeft ? "#4dabf7" : C.border, transition: "background 0.3s" }} />
          ))}
          <span style={{ color: C.dim, fontSize: 10, marginLeft: 4 }}>{slLeft}/{slLimit} Super Like</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
          {/* Visszatekerés */}
          <button onClick={handleRewind} disabled={history.length === 0 && isPro}
            style={{ width: 52, height: 52, borderRadius: "50%", background: isPro && history.length > 0 ? "rgba(255,140,66,0.12)" : C.card, border: `1px solid ${isPro && history.length > 0 ? C.orange : C.border}`, fontSize: 20, cursor: history.length === 0 && isPro ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: history.length === 0 && isPro ? 0.4 : 1, position: "relative" }}>
            ↩️
            {!isPro && <div style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: "50%", background: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#000", fontWeight: 900 }}>P</div>}
          </button>
          {/* Pass */}
          <button onClick={() => { showLabel("PASS"); act("pass"); }} style={{ width: 60, height: 60, borderRadius: "50%", background: C.card, border: `1px solid ${C.border}`, fontSize: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          {/* Like */}
          <button onClick={() => { showLabel("LIKE"); act("like"); }} style={{ width: 74, height: 74, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},#ff8c42)`, border: "none", fontSize: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 20px ${C.accentGlow}` }}>♥</button>
          {/* Super Like */}
          <button onClick={() => { if (slLeft <= 0) { setProWallType("superlike"); return; } handleSuperLike(); }}
            style={{ width: 60, height: 60, borderRadius: "50%", background: slLeft > 0 ? "rgba(77,171,247,0.12)" : C.card, border: `1px solid ${slLeft > 0 ? "#4dabf7" : C.border}`, fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            ⭐
            {slLeft <= 0 && !isPro && <div style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: "50%", background: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#000", fontWeight: 900 }}>P</div>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MATCH LIST ─────────────────────────────────────────
function MatchList({ matches, onOpen, isPro, onUpgrade, onExpire, onRevive }) {
  const FREE_LIMIT = 5, PRO_LIMIT = 10;
  const limit = isPro ? PRO_LIMIT : FREE_LIMIT;
  const active = matches.filter(m => m.status !== "expired");
  const expired = matches.filter(m => m.status === "expired");
  const pct = active.length / limit;
  const barColor = pct >= 1 ? C.accent : pct >= 0.7 ? C.orange : C.green;
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
      <div style={{ background: C.card, borderRadius: 16, padding: "14px 16px", border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span style={{ color: C.text, fontWeight: 700 }}>Aktív matchek</span><span style={{ fontWeight: 800, color: pct >= 1 ? C.accent : C.text }}>{active.length}/{limit}</span></div>
        <div style={{ height: 6, background: C.dim, borderRadius: 3, overflow: "hidden", marginBottom: 8 }}><div style={{ height: "100%", borderRadius: 3, width: `${Math.min(pct * 100, 100)}%`, background: barColor, transition: "width 0.3s" }} /></div>
        {!isPro && <button onClick={onUpgrade} style={{ width: "100%", marginTop: 8, padding: "10px", background: "linear-gradient(135deg,#ffd43b,#ff8c42)", border: "none", borderRadius: 12, color: "#000", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>⚡ Upgrade Pro-ra — 10 match egyszerre</button>}
      </div>
      {active.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted }}>Még nincsenek matcheid. Kezdj el swipelni! 💝</div>}
      {active.map(m => (
        <div key={m.id} onClick={() => onOpen(m)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
          <div style={{ position: "relative" }}><img src={m.photo} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} alt={m.name} /><div style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%", background: C.green, border: `2px solid ${C.bg}` }} /></div>
          <div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: C.text, fontWeight: 700 }}>{m.name}</span><span style={{ color: C.dim, fontSize: 11 }}>{m.time}</span></div><div style={{ color: C.dim, fontSize: 13, marginTop: 2 }}>{m.lastMsg}</div></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>{m.unread && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent }} />}<button onClick={e => { e.stopPropagation(); onExpire(m.id); }} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 10 }}>Lejárat</button></div>
        </div>
      ))}
      {expired.length > 0 && (<><div style={{ color: C.dim, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", margin: "16px 0 8px" }}>Lejárt matchek</div>{expired.map(m => (<div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}`, opacity: 0.7 }}><img src={m.photo} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", filter: "grayscale(80%)" }} alt={m.name} /><div style={{ flex: 1 }}><div style={{ color: isPro ? C.text : C.muted, fontWeight: 700 }}>{m.name}</div><div style={{ color: C.dim, fontSize: 12 }}>Match lejárt — 48 óra válasz nélkül</div></div>{isPro ? (<button onClick={() => onRevive(m.id)} style={{ background: "linear-gradient(135deg,#ffd43b,#ff8c42)", border: "none", borderRadius: 10, color: "#000", padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Újraéleszt</button>) : (<button onClick={onUpgrade} style={{ background: "rgba(255,212,59,0.1)", border: "1px solid rgba(255,212,59,0.3)", borderRadius: 10, color: C.yellow, padding: "8px 12px", cursor: "pointer", fontSize: 12 }}>Pro</button>)}</div>))}</>)}
    </div>
  );
}

// ── CHAT ───────────────────────────────────────────────
function ChatView({ match, onBack, onOpenDoubleDate }) {
  const [msgs, setMsgs] = useState(match.msgs || []);
  const [input, setInput] = useState("");
  const [showDDInvite, setShowDDInvite] = useState(false);
  const [ddActive, setDDActive] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);
  const send = () => { if (!input.trim()) return; setMsgs(m => [...m, { from: "me", text: input, time: new Date().toLocaleTimeString("hu", { hour: "2-digit", minute: "2-digit" }) }]); setInput(""); };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {showDDInvite && (
        <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "rgba(8,11,16,0.95)", display: "flex", alignItems: "flex-end" }}>
          <div style={{ width: "100%", background: C.surface, borderRadius: "28px 28px 0 0", padding: "28px 24px 40px" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}><div style={{ fontSize: 50, marginBottom: 10 }}>🎉</div><h3 style={{ color: C.text, fontSize: 20, fontWeight: 900, margin: "0 0 8px" }}>Dupla Randi felkérés</h3></div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => { setDDActive(true); setShowDDInvite(false); }} style={{ flex: 1, padding: "14px", background: `linear-gradient(135deg,${C.yellow},${C.orange})`, border: "none", borderRadius: 14, color: "#000", fontWeight: 700, cursor: "pointer" }}>Meghívó küldése 🎉</button>
              <button onClick={() => setShowDDInvite(false)} style={{ padding: "14px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, color: C.muted, cursor: "pointer" }}>Mégse</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.accent, cursor: "pointer", fontSize: 20 }}>←</button>
        <img src={match.photo} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} alt={match.name} />
        <div style={{ flex: 1 }}><div style={{ color: C.text, fontWeight: 700 }}>{match.name}</div><div style={{ color: C.green, fontSize: 11 }}>● Online</div></div>
        {ddActive ? (<button onClick={onOpenDoubleDate} style={{ background: "rgba(255,212,59,0.15)", border: "1px solid rgba(255,212,59,0.3)", borderRadius: 10, color: C.yellow, padding: "7px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>🎉 Dupla Randi</button>) : (<button onClick={() => setShowDDInvite(true)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, padding: "7px 12px", cursor: "pointer", fontSize: 12 }}>Dupla Randi?</button>)}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {msgs.map((m, i) => (<div key={i} style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start" }}><div style={{ maxWidth: "72%", padding: "10px 14px", borderRadius: m.from === "me" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.from === "me" ? `linear-gradient(135deg,${C.accent},#ff8c42)` : C.card, color: "#fff", fontSize: 14 }}>{m.text}<div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4, textAlign: "right" }}>{m.time}</div></div></div>))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Írj üzenetet..." style={{ flex: 1, padding: "12px 16px", borderRadius: 24, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none" }} />
        <button onClick={send} style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},#ff8c42)`, border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}>→</button>
      </div>
    </div>
  );
}

// ── PROFIL (magasság, végzettség, dohányzás, mit keres) ─
// Magasság csúszkával (135–230 cm)
const EDU_OPTIONS = ["Középiskola","Szakképzés","Főiskola / BA","Egyetem / MA","PhD"];
const SMOKING_OPTIONS = ["Nem dohányzik","Alkalmanként","Rendszeresen","Leszokott"];

function ProfileScreen({ profile, setProfile, isPro, boostActive, boostAvailable, onBoost, onUpgrade }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: profile.name || "Alex", bio: profile.bio || "Szia! NearMatch-en vagyok 👋", mainPhoto: profile.mainPhoto || null, height: profile.height || "", education: profile.education || "", smoking: profile.smoking || "", lookingFor: profile.lookingFor || "" });

  const SelectRow = ({ label, value, options, onChange }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map(opt => (<button key={opt} onClick={() => onChange(opt)} style={{ padding: "7px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: `1px solid ${value === opt ? C.accent : C.border}`, background: value === opt ? C.accentSoft : C.card, color: value === opt ? C.accent : C.muted, fontWeight: value === opt ? 700 : 400 }}>{opt}</button>))}
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ position: "relative", height: 220, background: `linear-gradient(135deg,${C.accent},#ff8c42)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {draft.mainPhoto ? (<img src={draft.mainPhoto} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Profilkép" />) : (<div style={{ textAlign: "center" }}><div style={{ fontSize: 60 }}>📷</div><div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Nincs profilkép</div></div>)}
        <label style={{ position: "absolute", top: 12, right: 12, background: "rgba(8,11,16,0.7)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", color: C.text, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          📷 {draft.mainPhoto ? "Csere" : "Feltöltés"}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = ev => { setDraft(d => ({ ...d, mainPhoto: ev.target.result })); setProfile(p => ({ ...p, mainPhoto: ev.target.result })); }; reader.readAsDataURL(file); }} />
        </label>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div><div style={{ color: C.text, fontWeight: 800, fontSize: 20 }}>{draft.name}</div><div style={{ color: C.muted, fontSize: 13 }}>NearMatch felhasználó</div></div>
          <button onClick={() => { if (editing) setProfile(draft); setEditing(!editing); }} style={{ background: editing ? `linear-gradient(135deg,${C.accent},#ff8c42)` : C.card, border: `1px solid ${editing ? C.accent : C.border}`, borderRadius: 12, color: editing ? "#fff" : C.text, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>{editing ? "✓ Mentés" : "✏️ Szerkesztés"}</button>
        </div>
        {/* ── BOOST KÁRTYA ── */}
        {!editing && (
          <div style={{ marginBottom: 16 }}>
            {boostActive ? (
              <div style={{ background: "linear-gradient(135deg,rgba(255,212,59,0.15),rgba(255,140,66,0.15))", border: "1px solid rgba(255,212,59,0.4)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 28, animation: "pulse 1s infinite" }}>⚡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.yellow, fontWeight: 800, fontSize: 15 }}>Kiemelés aktív!</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>A profilod előre kerül a közeliek között — 30 percig</div>
                </div>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.green, boxShadow: "0 0 8px #3ecf8e" }} />
              </div>
            ) : isPro && boostAvailable ? (
              <button onClick={onBoost} style={{ width: "100%", padding: "14px 16px", background: "linear-gradient(135deg,rgba(255,212,59,0.12),rgba(255,140,66,0.12))", border: "1px solid rgba(255,212,59,0.35)", borderRadius: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                <div style={{ fontSize: 26 }}>⚡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.yellow, fontWeight: 700, fontSize: 14 }}>Kiemelés használata</div>
                  <div style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>Profilod előre kerül — 30 percig • Heti 1 db</div>
                </div>
                <div style={{ background: "linear-gradient(135deg,#ffd43b,#ff8c42)", borderRadius: 10, padding: "6px 12px", color: "#000", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>Aktiválás</div>
              </button>
            ) : isPro && !boostAvailable ? (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, opacity: 0.6 }}>
                <div style={{ fontSize: 26 }}>⚡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>Kiemelés elhasználva</div>
                  <div style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>Jövő héten újra elérhető</div>
                </div>
                <div style={{ background: C.surface, borderRadius: 10, padding: "6px 12px", color: C.dim, fontSize: 12, fontWeight: 600 }}>🔄 +7 nap</div>
              </div>
            ) : (
              <button onClick={onUpgrade} style={{ width: "100%", padding: "14px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                <div style={{ fontSize: 26 }}>⚡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.muted, fontWeight: 700, fontSize: 14 }}>Kiemelés — Pro funkció</div>
                  <div style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>Kerülj előre a közeliek között • Heti 1 db</div>
                </div>
                <div style={{ background: "rgba(255,212,59,0.1)", border: "1px solid rgba(255,212,59,0.3)", borderRadius: 10, padding: "6px 12px", color: C.yellow, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>Pro</div>
              </button>
            )}
          </div>
        )}
        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Név</label>
              <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 15, outline: "none" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Bio</label>
              <textarea value={draft.bio} onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", resize: "none", minHeight: 80, lineHeight: 1.6 }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>📏 Magasság</label>
                <span style={{ color: C.accent, fontWeight: 700, fontSize: 13 }}>{draft.height ? `${draft.height} cm` : "—"}</span>
              </div>
              <input type="range" min={135} max={230} step={1}
                value={draft.height ? parseInt(draft.height) : 170}
                onChange={e => setDraft(d => ({ ...d, height: e.target.value }))}
                style={{ width: "100%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ color: C.dim, fontSize: 10 }}>135 cm</span>
                <span style={{ color: C.dim, fontSize: 10 }}>230 cm</span>
              </div>
            </div>
            <SelectRow label="🎓 Végzettség" value={draft.education} options={EDU_OPTIONS} onChange={v => setDraft(d => ({ ...d, education: v }))} />
            <SelectRow label="🚬 Dohányzás" value={draft.smoking} options={SMOKING_OPTIONS} onChange={v => setDraft(d => ({ ...d, smoking: v }))} />
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>💍 Mit keresel?</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {LOOKING_FOR_OPTIONS.map(x => (<button key={x.l} onClick={() => setDraft(d => ({ ...d, lookingFor: x.l }))} style={{ padding: "12px 10px", borderRadius: 12, border: `1px solid ${draft.lookingFor === x.l ? C.accent : C.border}`, background: draft.lookingFor === x.l ? C.accentSoft : C.card, color: draft.lookingFor === x.l ? C.accent : C.text, cursor: "pointer", textAlign: "center" }}><div style={{ fontSize: 18, marginBottom: 3 }}>{x.i}</div><div style={{ fontSize: 12, fontWeight: 600 }}>{x.l}</div></button>))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: C.card, borderRadius: 14, padding: "14px", border: `1px solid ${C.border}` }}><div style={{ color: C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Bio</div><p style={{ color: C.text, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{draft.bio}</p></div>
            {(draft.height || draft.education || draft.smoking) && (
              <div style={{ background: C.card, borderRadius: 14, padding: "14px", border: `1px solid ${C.border}` }}>
                <div style={{ color: C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Részletek</div>
                {[["📏 Magasság", draft.height], ["🎓 Végzettség", draft.education], ["🚬 Dohányzás", draft.smoking]].map(([k, v]) => v ? (<div key={k} style={{ display: "flex", justifyContent: "space-between", color: C.text, fontSize: 13, paddingBottom: 8 }}><span style={{ color: C.muted }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div>) : null)}
              </div>
            )}
            {draft.lookingFor && (<div style={{ background: C.card, borderRadius: 14, padding: "14px", border: `1px solid ${C.border}` }}><div style={{ color: C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Mit keres</div><div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{LOOKING_FOR_OPTIONS.find(x => x.l === draft.lookingFor)?.i} {draft.lookingFor}</div></div>)}
            {!draft.height && !draft.education && !draft.smoking && !draft.lookingFor && (<div style={{ background: C.card, borderRadius: 14, padding: "14px", border: `1px solid ${C.border}`, textAlign: "center" }}><div style={{ color: C.dim, fontSize: 13 }}>Töltsd ki a részleteket! ✏️</div></div>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MATCH OVERLAY + FOUNDER ────────────────────────────
function MatchOverlay({ user, onMessage, onClose }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(8,11,16,0.92)", backdropFilter: "blur(8px)", zIndex: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ fontSize: 60, marginBottom: 16, animation: "pulse 1s infinite" }}>🎉</div>
      <h2 style={{ fontSize: 32, fontWeight: 900, color: C.text, margin: "0 0 8px", fontFamily: "Georgia,serif" }}>Egymásra találtatok!</h2>
      <p style={{ color: C.muted, marginBottom: 24 }}>Te és {user.name} egymásra találtatok!</p>
      <img src={user.photo} style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: `3px solid ${C.accent}`, marginBottom: 28 }} alt={user.name} />
      <button onClick={onMessage} style={{ width: "100%", padding: "16px", background: `linear-gradient(135deg,${C.accent},#ff8c42)`, border: "none", borderRadius: 16, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}>💬 Üzenet küldése</button>
      <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 15 }}>Folytatom a böngészést</button>
    </div>
  );
}

function FounderWelcome({ userNumber, onClose }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, background: "rgba(8,11,16,0.95)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#0f1520", borderRadius: 28, padding: "32px 24px", border: "1px solid rgba(167,139,250,0.3)", maxWidth: 360, width: "100%" }}>
        <div style={{ fontSize: 60, marginBottom: 16, textAlign: "center" }}>🚀</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 8px", color: C.text, fontFamily: "Georgia,serif", textAlign: "center" }}>Alapító tag vagy!</h2>
        <div style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 14, padding: "12px 16px", marginBottom: 16, textAlign: "center" }}><div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 18 }}>#{userNumber}. regisztrált felhasználó</div><div style={{ color: C.muted, fontSize: 12 }}>az első 2 000 alapító tag egyike</div></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>{["⚡ Örökös Pro — soha nem jár le", "🔒 Radar profilok megtekintése", "💬 10 aktív match egyszerre", "🔄 Lejárt matchek újraélesztése", "⚡ Kiemelés — heti 1 db"].map(b => (<div key={b} style={{ background: "#141c2b", borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13 }}>{b}</div>))}</div>
        <button onClick={onClose} style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg,#a78bfa,#6366f1)", border: "none", borderRadius: 14, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>🚀 Kezdjük el!</button>
      </div>
    </div>
  );
}

// ── APP ────────────────────────────────────────────────
export default function App() {
  const [appState, setAppState] = useState("onboarding");
  const [tab, setTab] = useState("radar");
  const [matches, setMatches] = useState(INIT_MATCHES);
  const [activeChat, setActiveChat] = useState(null);
  const [matchUser, setMatchUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [profile, setProfile] = useState({});
  const [showFounder, setShowFounder] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [doubleDate, setDoubleDate] = useState(false);
  const [userNumber] = useState(() => Math.floor(Math.random() * 1800) + 1);
  const [boostActive, setBoostActive] = useState(false);
  const [lastBoostWeek, setLastBoostWeek] = useState(null);
  const getWeekNumber = () => { const d = new Date(); const oneJan = new Date(d.getFullYear(), 0, 1); return Math.ceil(((d - oneJan) / 86400000 + oneJan.getDay() + 1) / 7); };
  const boostAvailable = isPro && lastBoostWeek !== getWeekNumber() && !boostActive;
  const handleBoost = () => { if (!boostAvailable) return; setBoostActive(true); setLastBoostWeek(getWeekNumber()); setTimeout(() => setBoostActive(false), 30 * 60 * 1000); };

  const handleOnboardingComplete = (data) => {
    setProfile(data);
    if (userNumber <= 2000) { setIsFounder(true); setIsPro(true); setTimeout(() => setShowFounder(true), 600); }
    setAppState("main");
  };

  const handleMatch = (user) => {
    const activeCount = matches.filter(m => m.status !== "expired").length;
    if (activeCount >= (isPro ? 10 : 5)) return;
    const newMatch = { id: Date.now(), name: user.name, photo: user.photo, lastMsg: "Új match! Küldj üzenetet 💝", time: "most", unread: true, msgs: [] };
    setMatches(m => [newMatch, ...m]);
    setMatchUser({ ...user, matchObj: newMatch });
  };

  const handleMatchMessage = () => {
    const match = matches.find(m => m.name === matchUser.name);
    setMatchUser(null);
    if (match) { setActiveChat(match); setTab("matches"); }
  };

  const activeFilterCount = [filters.ageMin !== 18 || filters.ageMax !== 40, filters.maxDistance !== 200, filters.interests.length > 0].filter(Boolean).length;
  const filteredUsers = (() => {
    const base = MOCK_USERS.filter(u => {
      if (u.distance > filters.maxDistance) return false;
      if (u.age < filters.ageMin || u.age > filters.ageMax) return false;
      if (filters.onlyActive && !u.active) return false;
      if (filters.interests.length > 0 && !filters.interests.some(i => u.tags.includes(i))) return false;
      return true;
    });
    if (boostActive) {
      // Boost aktív: távolság szerint növekvő sorrend (legközelebb elöl)
      return [...base].sort((a, b) => a.distance - b.distance);
    }
    return base;
  })();
  const unreadMatches = matches.filter(m => m.unread && m.status !== "expired").length;

  if (appState === "onboarding") return <Shell><Onboarding onComplete={handleOnboardingComplete} /></Shell>;

  return (
    <Shell>
      {showFounder && <FounderWelcome userNumber={userNumber} onClose={() => setShowFounder(false)} />}
      {showFilters && <FilterModal filters={filters} onApply={f => setFilters(f)} onClose={() => setShowFilters(false)} />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 900, background: `linear-gradient(135deg,${C.accent},#ff8c42)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>NearMatch</span>
          {isFounder && <div style={{ background: "linear-gradient(135deg,#a78bfa,#6366f1)", borderRadius: 8, padding: "3px 8px", fontSize: 10, color: "#fff", fontWeight: 700 }}>FOUNDER</div>}
          {isPro && !isFounder && <div style={{ background: "linear-gradient(135deg,#ffd43b,#ff8c42)", borderRadius: 8, padding: "3px 8px", fontSize: 10, color: "#000", fontWeight: 700 }}>PRO</div>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShowFilters(true)} style={{ position: "relative", background: C.card, border: `1px solid ${activeFilterCount > 0 ? C.accent : C.border}`, borderRadius: 10, padding: "8px 12px", cursor: "pointer", color: activeFilterCount > 0 ? C.accent : C.muted }}>
            ⚙️ Szűrők
            {activeFilterCount > 0 && <div style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 700 }}>{activeFilterCount}</div>}
          </button>
          <button onClick={() => { setIsPro(p => !p); if (isPro) setIsFounder(false); }} style={{ background: isPro ? "linear-gradient(135deg,#ffd43b,#ff8c42)" : C.accentSoft, border: `1px solid ${isPro ? "transparent" : C.accent}`, borderRadius: 10, padding: "8px 12px", cursor: "pointer", color: isPro ? "#000" : C.accent, fontWeight: 700, fontSize: 12 }}>{isPro ? "PRO ✓" : "Pro?"}</button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
        {matchUser && <MatchOverlay user={matchUser} onMessage={handleMatchMessage} onClose={() => setMatchUser(null)} />}
        {doubleDate ? (<DoubleDateChat onBack={() => setDoubleDate(false)} />) : activeChat ? (<ChatView match={activeChat} onBack={() => setActiveChat(null)} onOpenDoubleDate={() => setDoubleDate(true)} />) : (
          <>
            {tab === "radar" && <RadarScreen users={filteredUsers} radius={filters.maxDistance} setRadius={r => setFilters(f => ({ ...f, maxDistance: r }))} isPro={isPro} onUpgrade={() => setIsPro(true)} boostActive={boostActive} />}
            {tab === "swipe" && <SwipeScreen users={filteredUsers} onMatch={handleMatch} boostActive={boostActive} isPro={isPro} onUpgrade={() => setIsPro(true)} />}
            {tab === "matches" && <MatchList matches={matches} onOpen={m => setActiveChat(m)} isPro={isPro} onUpgrade={() => setIsPro(true)} onExpire={id => setMatches(m => m.map(x => x.id === id ? { ...x, status: "expired" } : x))} onRevive={id => setMatches(m => m.map(x => x.id === id ? { ...x, status: "active" } : x))} />}
            {tab === "profile" && <ProfileScreen profile={profile} setProfile={setProfile} isPro={isPro} boostActive={boostActive} boostAvailable={boostAvailable} onBoost={handleBoost} onUpgrade={() => setIsPro(true)} />}
          </>
        )}
      </div>
      {!activeChat && !doubleDate && <BottomNav active={tab} setActive={setTab} unreadMatches={unreadMatches} />}
    </Shell>
  );
}
