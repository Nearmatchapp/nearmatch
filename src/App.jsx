import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase.js";

const STRIPE_PRICE_ID = "price_1TcXG4B9BUbmA0wIpIjDmRuf";
const STRIPE_BOOST_PRICE_ID = "price_1Td5GlB9BUbmA0wI8uXEdzef";
const STRIPE_REVEAL_PRICE_ID = "price_1TdanQB9BUbmA0wIIvVBccrw";

const C = {
  bg: "#080b10", surface: "#0f1520", card: "#141c2b",
  border: "rgba(255,255,255,0.07)", accent: "#ff5c5c",
  accentSoft: "rgba(255,92,92,0.12)", accentGlow: "rgba(255,92,92,0.35)",
  orange: "#ff8c42", yellow: "#ffd43b", green: "#3ecf8e",
  text: "#f0f4ff", muted: "rgba(240,244,255,0.55)", dim: "rgba(240,244,255,0.2)",
};

const INTERESTS_ALL = [
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

const LOOKING_FOR_OPTIONS = [
  { l: "Komoly kapcsolat", i: "💍" },
  { l: "Laza ismerkedés", i: "✨" },
  { l: "Új barátok", i: "👋" },
  { l: "Meglátjuk", i: "🤷" },
];

const EDU_OPTIONS = ["Középiskola","Szakképzés","Főiskola / BA","Egyetem / MA","PhD"];
const SMOKING_OPTIONS = ["Nem dohányzik","Alkalmanként","Rendszeresen","Leszokott"];

const COMPLIMENT_CARDS = {
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

const getCardsForGender = (gender) => {
  if (gender === "Nő" || gender === "female") return COMPLIMENT_CARDS.female;
  if (gender === "Férfi" || gender === "male") return COMPLIMENT_CARDS.male;
  return COMPLIMENT_CARDS.other;
};

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function getTodayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }

async function registerOneSignalUser(userId) {
  try {
    if (!window.OneSignalDeferred) return;
    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.login(userId);
      await OneSignal.User.addTag("user_id", userId);
    });
  } catch (err) { console.warn("OneSignal hiba:", err); }
}

async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
      body: JSON.stringify({ user_id: userId, title, body, data }),
    });
  } catch (err) { console.warn("Push hiba:", err); }
}

function Shell({ children }) {
  return (
    <div style={{ width:"100%", maxWidth:390, margin:"0 auto", height:"100dvh", minHeight:"-webkit-fill-available", background:C.bg, display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" }}>
      {children}
      <style>{`* { box-sizing:border-box; -webkit-tap-highlight-color:transparent; } ::-webkit-scrollbar{display:none;} input[type=range]{-webkit-appearance:none;height:3px;background:rgba(240,244,255,0.15);border-radius:2px;outline:none;width:100%;} input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#ff5c5c;cursor:pointer;} @keyframes pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.05);}} @keyframes spin{to{transform:rotate(360deg);}}@keyframes slideDown{from{transform:translateY(-80px);opacity:0;}to{transform:translateY(0);opacity:1;}} div,button,input,textarea,span,a{touch-action:pan-x pan-y;} img{touch-action:pinch-zoom;}`}</style>
    </div>
  );
}

function Spinner() {
  return <div style={{ width:40, height:40, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.accent}`, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto" }} />;
}

// ── AUTH ───────────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handle = async () => {
    if (!email || !password) { setError("Töltsd ki az összes mezőt!"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Ellenőrizd az emailed!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (e) {
      setError(e.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 28px" }}>
      <div style={{ width:80, height:80, borderRadius:24, marginBottom:20, overflow:"hidden", flexShrink:0, alignSelf:"center", background:"#141c2b" }}>
        <img src="/icon-512.png" alt="NearMatch" style={{ width:"115%", height:"115%", objectFit:"cover", display:"block", marginLeft:"-7.5%", marginTop:"-7.5%" }} />
      </div>
      <h1 style={{ fontSize:32, fontWeight:900, color:C.text, fontFamily:"Georgia,serif", margin:"0 0 6px" }}>NearMatch</h1>
      <p style={{ color:C.muted, fontSize:13, margin:"0 0 28px" }}>Sosem volt még ilyen közel a következő randid.</p>

      {/* Google gomb */}
      <button onClick={handleGoogle} disabled={googleLoading}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"14px 16px", borderRadius:14, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontSize:15, fontWeight:600, cursor:googleLoading?"not-allowed":"pointer", marginBottom:16, opacity:googleLoading?0.7:1 }}>
        {googleLoading ? <Spinner /> : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Folytatás Google-lel
          </>
        )}
      </button>

      {/* Elválasztó */}
      <div style={{ width:"100%", display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <div style={{ flex:1, height:1, background:C.border }} />
        <span style={{ color:C.dim, fontSize:12 }}>vagy</span>
        <div style={{ flex:1, height:1, background:C.border }} />
      </div>

      {/* Email/jelszó tab */}
      <div style={{ width:"100%", display:"flex", gap:8, marginBottom:20 }}>
        {["login","register"].map(m => (
          <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
            style={{ flex:1, padding:"10px", borderRadius:12, border:`1px solid ${mode===m?C.accent:C.border}`, background:mode===m?C.accentSoft:C.card, color:mode===m?C.accent:C.muted, fontWeight:700, cursor:"pointer", fontSize:14 }}>
            {m === "login" ? "Bejelentkezés" : "Regisztráció"}
          </button>
        ))}
      </div>
      <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:12 }}>
        <input type="email" placeholder="Email cím" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width:"100%", padding:"14px 16px", borderRadius:13, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontSize:15, outline:"none" }} />
        <input type="password" placeholder="Jelszó" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key==="Enter" && handle()}
          style={{ width:"100%", padding:"14px 16px", borderRadius:13, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontSize:15, outline:"none" }} />
        {error && <div style={{ background:"rgba(255,92,92,0.1)", border:`1px solid ${C.accent}`, borderRadius:10, padding:"10px 14px", color:C.accent, fontSize:13 }}>{error}</div>}
        {success && <div style={{ background:"rgba(62,207,142,0.1)", border:`1px solid ${C.green}`, borderRadius:10, padding:"10px 14px", color:C.green, fontSize:13 }}>{success}</div>}
        <button onClick={handle} disabled={loading}
          style={{ width:"100%", padding:"16px", background:loading?C.card:`linear-gradient(135deg,${C.accent},#ff8c42)`, border:"none", borderRadius:16, color:"#fff", fontSize:16, fontWeight:700, cursor:loading?"not-allowed":"pointer", marginTop:4 }}>
          {loading ? <Spinner /> : mode === "login" ? "Bejelentkezés →" : "Regisztráció →"}
        </button>
      </div>
    </div>
  );
}

// ── ONBOARDING ─────────────────────────────────────────
function Onboarding({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name:"", birthdate:"", gender:"", bio:"", interests:[], showMe:"", lookingFor:"" });
  const [saving, setSaving] = useState(false);

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

  const finish = async (locationGranted) => {
    setSaving(true);
    let lat = null, lng = null;
    if (locationGranted) {
      try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }));
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch {}
    }
    const birthYear = data.birthdate ? new Date(data.birthdate).getFullYear() : null;
    const age = birthYear ? new Date().getFullYear() - birthYear : null;
    const profile = { id: user.id, name: data.name, bio: data.bio, age, gender: data.gender, interests: data.interests, looking_for: data.lookingFor, is_pro: true, is_founder: true, lat, lng, last_seen: new Date().toISOString() };
    const { error } = await supabase.from("profiles").upsert(profile);
    if (!error) onComplete(profile);
    setSaving(false);
  };

  const steps = 5;
  const ProgressBar = () => (
    <div style={{ display:"flex", gap:5 }}>
      {Array.from({ length: steps }).map((_, i) => (
        <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=step?`linear-gradient(90deg,${C.accent},#ff8c42)`:C.border, transition:"background 0.3s" }} />
      ))}
    </div>
  );
  const Header = () => (
    <div style={{ padding:"14px 20px 12px", display:"flex", alignItems:"center", gap:10, borderBottom:`1px solid ${C.border}` }}>
      <button onClick={back} style={{ background:C.card, border:`1px solid ${C.border}`, color:C.text, borderRadius:10, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>← Vissza</button>
      <div style={{ flex:1 }}><ProgressBar /></div>
      <span style={{ color:C.dim, fontSize:11 }}>{step+1}/{steps}</span>
    </div>
  );

  if (step === 0) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"28px 28px 32px" }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
        <div style={{ width:86, height:86, borderRadius:26, background:`linear-gradient(135deg,${C.accent},#ff8c42)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40 }}>👋</div>
        <h2 style={{ fontSize:28, fontWeight:900, color:C.text, fontFamily:"Georgia,serif", margin:0 }}>Üdvözlünk!</h2>
        <p style={{ color:C.muted, fontSize:14, textAlign:"center", margin:"0 0 16px", lineHeight:1.7 }}>Töltsd ki a profilodat, hogy mások megtaláljanak!</p>
        <button onClick={next} style={{ width:"100%", padding:"16px", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, border:"none", borderRadius:16, color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer" }}>Kezdjük el →</button>
      </div>
    </div>
  );

  if (step === 1) {
    const birthYear = data.birthdate ? new Date(data.birthdate).getFullYear() : null;
    const age = birthYear ? new Date().getFullYear() - birthYear : null;
    const isUnderage = age !== null && age < 18;
    const canProceed = data.name && data.birthdate && data.gender && !isUnderage;
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
        <Header />
        <div style={{ flex:1, padding:"16px 24px", overflowY:"auto", display:"flex", flexDirection:"column", gap:16 }}>
          <h2 style={{ fontSize:24, fontWeight:900, color:C.text, margin:"8px 0 0" }}>Rólad</h2>
          <div>
            <label style={{ color:C.muted, fontSize:11, letterSpacing:1, textTransform:"uppercase" }}>Keresztneved</label>
            <input type="text" placeholder="pl. Sára" value={data.name} onChange={e => setData(d=>({...d,name:e.target.value}))}
              style={{ display:"block", width:"100%", padding:"14px", marginTop:8, borderRadius:13, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontSize:16, outline:"none" }} />
          </div>
          <div>
            <label style={{ color:C.muted, fontSize:11, letterSpacing:1, textTransform:"uppercase" }}>Születési dátum</label>
            <input type="date" value={data.birthdate} onChange={e => setData(d=>({...d,birthdate:e.target.value}))}
              style={{ display:"block", width:"100%", padding:"14px", marginTop:8, borderRadius:13, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontSize:16, outline:"none" }} />
            {age !== null && (<div style={{ marginTop:8, padding:"10px 14px", borderRadius:10, background:isUnderage?"rgba(255,92,92,0.1)":"rgba(62,207,142,0.1)", border:`1px solid ${isUnderage?C.accent:C.green}` }}><span style={{ fontSize:13, color:isUnderage?C.accent:C.green, fontWeight:600 }}>{isUnderage?"🚫":"✅"} {age} éves {isUnderage?"— 18+ korhatáros":"— Megfelelő kor"}</span></div>)}
          </div>
          <div>
            <label style={{ color:C.muted, fontSize:11, letterSpacing:1, textTransform:"uppercase" }}>Nemed</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
              {["Nő","Férfi","Non-binary","Egyéb"].map(g => (<button key={g} onClick={() => setData(d=>({...d,gender:g}))} style={{ padding:"12px", borderRadius:12, border:`1px solid ${data.gender===g?C.accent:C.border}`, background:data.gender===g?C.accentSoft:C.card, color:data.gender===g?C.accent:C.text, cursor:"pointer", fontWeight:600, fontSize:14 }}>{g}</button>))}
            </div>
          </div>
          <button onClick={next} disabled={!canProceed} style={{ width:"100%", padding:"16px", background:canProceed?`linear-gradient(135deg,${C.accent},#ff8c42)`:C.card, border:"none", borderRadius:16, color:"#fff", fontSize:16, fontWeight:700, cursor:canProceed?"pointer":"not-allowed", opacity:canProceed?1:0.5 }}>Tovább →</button>
        </div>
      </div>
    );
  }

  if (step === 2) return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <Header />
      <div style={{ flex:1, padding:"16px 24px", overflowY:"auto", display:"flex", flexDirection:"column", gap:16 }}>
        <h2 style={{ fontSize:24, fontWeight:900, color:C.text, margin:"8px 0 0" }}>Mutatkozz be</h2>
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}><label style={{ color:C.muted, fontSize:11, letterSpacing:1, textTransform:"uppercase" }}>Bio</label><span style={{ color:C.dim, fontSize:11 }}>{(data.bio||"").length}/300</span></div>
          <textarea value={data.bio||""} onChange={e => {
              const val = e.target.value.slice(0,300);
              // Szűrjük ki az Instagram/social linkeket
              const filtered = val.replace(/(@[\w.]+|instagram\.com\/[\w.]+|ig:\s*[\w.]+|insta:\s*[\w.]+|fb\.com\/[\w.]+|tiktok\.com\/[\w.]+|snapchat:\s*[\w.]+)/gi, "");
              setData(d=>({...d,bio:filtered}));
            }} placeholder="Mesélj magadról..."
            style={{ width:"100%", padding:"14px", borderRadius:13, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontSize:14, outline:"none", resize:"none", minHeight:100, lineHeight:1.6 }} />
        </div>
        <div>
          <label style={{ color:C.muted, fontSize:11, letterSpacing:1, textTransform:"uppercase" }}>Érdeklődési körök (min. 3)</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginTop:10 }}>
            {INTERESTS_ALL.map(tag => { const on=data.interests.includes(tag); return (<button key={tag} onClick={() => setData(d=>({...d,interests:on?d.interests.filter(i=>i!==tag):[...d.interests,tag]}))} style={{ padding:"8px 13px", borderRadius:20, fontSize:13, cursor:"pointer", border:`1px solid ${on?C.accent:C.border}`, background:on?C.accentSoft:C.card, color:on?C.accent:C.muted, fontWeight:on?700:400 }}>{tag}</button>); })}
          </div>
        </div>
        <button onClick={next} disabled={data.interests.length<3} style={{ width:"100%", padding:"16px", background:data.interests.length>=3?`linear-gradient(135deg,${C.accent},#ff8c42)`:C.card, border:"none", borderRadius:16, color:"#fff", fontSize:16, fontWeight:700, cursor:data.interests.length>=3?"pointer":"not-allowed", opacity:data.interests.length>=3?1:0.5 }}>Tovább →</button>
      </div>
    </div>
  );

  if (step === 3) return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <Header />
      <div style={{ flex:1, padding:"16px 24px", overflowY:"auto", display:"flex", flexDirection:"column", gap:16 }}>
        <h2 style={{ fontSize:24, fontWeight:900, color:C.text, margin:"8px 0 0" }}>Preferenciák</h2>
        <div>
          <label style={{ color:C.muted, fontSize:11, letterSpacing:1, textTransform:"uppercase" }}>Kit szeretnél látni?</label>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>{["Nőket","Férfiakat","Mindenkit"].map(s => (<button key={s} onClick={() => setData(d=>({...d,showMe:s}))} style={{ flex:1, padding:"12px 8px", borderRadius:12, border:`1px solid ${data.showMe===s?C.accent:C.border}`, background:data.showMe===s?C.accentSoft:C.card, color:data.showMe===s?C.accent:C.text, cursor:"pointer", fontWeight:600, fontSize:13 }}>{s}</button>))}</div>
        </div>
        <div>
          <label style={{ color:C.muted, fontSize:11, letterSpacing:1, textTransform:"uppercase" }}>Mit keresel?</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
            {LOOKING_FOR_OPTIONS.map(x => (<button key={x.l} onClick={() => setData(d=>({...d,lookingFor:x.l}))} style={{ padding:"14px 10px", borderRadius:14, border:`1px solid ${data.lookingFor===x.l?C.accent:C.border}`, background:data.lookingFor===x.l?C.accentSoft:C.card, color:data.lookingFor===x.l?C.accent:C.text, cursor:"pointer", textAlign:"center" }}><div style={{ fontSize:22, marginBottom:4 }}>{x.i}</div><div style={{ fontSize:12, fontWeight:600 }}>{x.l}</div></button>))}
          </div>
        </div>
        <button onClick={next} disabled={!data.showMe||!data.lookingFor} style={{ width:"100%", padding:"16px", background:data.showMe&&data.lookingFor?`linear-gradient(135deg,${C.accent},#ff8c42)`:C.card, border:"none", borderRadius:16, color:"#fff", fontSize:16, fontWeight:700, cursor:data.showMe&&data.lookingFor?"pointer":"not-allowed", opacity:data.showMe&&data.lookingFor?1:0.5 }}>Tovább →</button>
      </div>
    </div>
  );

  if (step === 4) return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <Header />
      <div style={{ flex:1, overflowY:"auto", padding:"16px 24px 32px" }}>
        <div style={{ textAlign:"center", marginBottom:24, paddingTop:8 }}>
          <div style={{ width:80, height:80, borderRadius:24, margin:"0 auto 16px", overflow:"hidden", flexShrink:0 }}><img src="/icon-512.png" alt="NearMatch" style={{ width:"115%", height:"115%", objectFit:"cover", display:"block", marginLeft:"-7.5%", marginTop:"-7.5%" }} /></div>
          <h2 style={{ fontSize:22, fontWeight:900, margin:"0 0 8px", color:C.text }}>Helyszín hozzáférés</h2>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>A NearMatch a közelségedre épül.</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
          {[{icon:"👁️",title:"Mit látnak mások?",desc:"Soha nem látják a pontos GPS koordinátáidat."},{icon:"⏰",title:"Mikor aktív?",desc:"Csak akkor olvassuk, ha az app előtérben van."},{icon:"🗑️",title:"Mennyi ideig tároljuk?",desc:"90 másodpercig, majd automatikusan törlődik."}].map(item => (
            <div key={item.title} style={{ display:"flex", gap:12, alignItems:"flex-start", background:C.card, borderRadius:13, padding:"14px", border:`1px solid ${C.border}` }}>
              <div style={{ width:34, height:34, borderRadius:10, flexShrink:0, background:C.accentSoft, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{item.icon}</div>
              <div><div style={{ color:C.text, fontWeight:700, fontSize:14, marginBottom:3 }}>{item.title}</div><div style={{ color:C.muted, fontSize:12, lineHeight:1.5 }}>{item.desc}</div></div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <button onClick={() => finish(true)} disabled={saving} style={{ width:"100%", padding:"16px", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, border:"none", borderRadius:16, color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer" }}>
            {saving ? <Spinner /> : "📍 Helyszín engedélyezése"}
          </button>
          <button onClick={() => finish(false)} disabled={saving} style={{ width:"100%", padding:"16px", background:C.card, border:`1px solid ${C.border}`, borderRadius:16, color:C.muted, fontSize:15, cursor:"pointer" }}>Kihagyom egyelőre</button>
        </div>
      </div>
    </div>
  );

  return null;
}

// ── BOTTOM NAV ─────────────────────────────────────────
function BottomNav({ active, setActive, unreadCount, newLikesCount }) {
  const tabs = [
    { id:"radar", icon:"◎", label:"Radar" },
    { id:"swipe", icon:"♥", label:"Swipe" },
    { id:"likeok", icon:"🔥", label:"Likeok" },
    { id:"matches", icon:"💬", label:"Matchek" },
    { id:"profile", icon:"👤", label:"Profil" },
  ];
  return (
    <div style={{ display:"flex", borderTop:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActive(t.id)} style={{ flex:1, padding:"10px 0", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, position:"relative" }}>
          <span style={{ fontSize:18, opacity:active===t.id?1:0.4 }}>{t.icon}</span>
          <span style={{ fontSize:9, color:active===t.id?C.accent:C.dim }}>{t.label}</span>
          {t.id==="matches" && unreadCount>0 && (<div style={{ position:"absolute", top:6, right:"10%", width:14, height:14, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff", fontWeight:700 }}>{unreadCount}</div>)}
          {t.id==="likeok" && newLikesCount>0 && (<div style={{ position:"absolute", top:6, right:"10%", width:14, height:14, borderRadius:"50%", background:C.orange, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff", fontWeight:700 }}>{newLikesCount}</div>)}
        </button>
      ))}
    </div>
  );
}

// ── CARDS SCREEN ──────────────────────────────────────
function CardsScreen({ myId, isPro, onUpgrade, session }) {
  const [receivedCards, setReceivedCards] = useState([]);
  const [sentToday, setSentToday] = useState([]);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flipping, setFlipping] = useState(null);
  const [sendModal, setSendModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [sending, setSending] = useState(false);
  const [buyModal, setBuyModal] = useState(false);

  const today = new Date().toDateString();
  const lastRevealKey = `lastReveal_${myId}`;
  const lastRevealDate = localStorage.getItem(lastRevealKey);
  const revealedToday = localStorage.getItem(`revealedToday_${myId}`) === today;

  // PRO: napi 1 felfedés, Free: 2 naponta 1
  const canReveal = () => {
    const last = localStorage.getItem(lastRevealKey);
    if (!last) return true;
    const diff = (Date.now() - parseInt(last)) / (1000 * 60 * 60 * 24);
    return isPro ? diff >= 1 : diff >= 2;
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    // Kapott kártyák
    const { data: recv } = await supabase.from("compliment_cards").select("*, sender:profiles!sender_id(id,name,photo_url)").eq("receiver_id", myId).order("created_at", { ascending: false });
    setReceivedCards(recv || []);

    // Ma küldött kártyák (receiver_id-k)
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const { data: sent } = await supabase.from("compliment_cards").select("receiver_id").eq("sender_id", myId).gte("created_at", todayStart.toISOString());
    const sentIds = (sent || []).map(s => s.receiver_id);
    setSentToday(sentIds);

    // Közeli userek akiknek még nem küldtünk ma
    const { data: nearby } = await supabase.from("profiles").select("id,name,photo_url,age").neq("id", myId).eq("is_banned", false).limit(30);
    setNearbyUsers((nearby || []).filter(u => !sentIds.includes(u.id)));
    setLoading(false);
  };

  const handleReveal = async (card) => {
    if (card.revealed) return;
    if (!canReveal()) { setBuyModal(true); return; }
    setFlipping(card.id);
    await supabase.from("compliment_cards").update({ revealed: true, revealed_at: new Date().toISOString() }).eq("id", card.id);
    localStorage.setItem(lastRevealKey, Date.now().toString());
    setReceivedCards(prev => prev.map(c => c.id === card.id ? { ...c, revealed: true } : c));
    setTimeout(() => setFlipping(null), 600);
  };

  const handleSend = async () => {
    if (!selectedUser || !selectedCard) return;
    setSending(true);
    await supabase.from("compliment_cards").insert({ sender_id: myId, receiver_id: selectedUser.id, card_text: selectedCard, category: selectedCategory });
    setSentToday(prev => [...prev, selectedUser.id]);
    setNearbyUsers(prev => prev.filter(u => u.id !== selectedUser.id));
    setSendModal(false); setSelectedUser(null); setSelectedCategory(null); setSelectedCard(null);
    setSending(false);
    loadData();
  };

  const cardsLeft = 3 - sentToday.length;
  const unrevealed = receivedCards.filter(c => !c.revealed).length;

  if (loading) return <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}><div style={{ width:32, height:32, border:`3px solid ${C.accent}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} /></div>;

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
      {/* Fejléc */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:800, color:C.text }}>🃏 Kártyák</div>
        <div style={{ color:C.muted, fontSize:13, marginTop:4 }}>Küldj névtelen bókokat a közeledben lévőknek</div>
      </div>

      {/* Kiosztás gomb */}
      <button onClick={() => cardsLeft > 0 ? setSendModal(true) : null}
        style={{ width:"100%", padding:"16px", borderRadius:18, border:`1px solid ${cardsLeft>0?C.accent:C.border}`, background:cardsLeft>0?C.accentSoft:C.card, cursor:cardsLeft>0?"pointer":"default", marginBottom:20, display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:cardsLeft>0?"linear-gradient(135deg,#ff5c5c,#ff8c42)":"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🃏</div>
        <div style={{ textAlign:"left" }}>
          <div style={{ color:cardsLeft>0?C.accent:C.muted, fontWeight:700, fontSize:15 }}>{cardsLeft > 0 ? `${cardsLeft} kártya kiosztható ma` : "Ma már elküldted mind a 3 kártyát"}</div>
          <div style={{ color:C.dim, fontSize:12, marginTop:2 }}>Napi 3 kártya • névtelen küldés</div>
        </div>
      </button>

      {/* Kapott kártyák */}
      <div style={{ marginBottom:12 }}>
        <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Kapott kártyák {unrevealed > 0 && <span style={{ background:C.accent, color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:10, marginLeft:6 }}>{unrevealed} új</span>}</div>
        {receivedCards.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 20px", color:C.dim }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🃏</div>
            <div style={{ fontWeight:700, color:C.muted }}>Még nincs kártyád</div>
            <div style={{ fontSize:13, marginTop:6 }}>Amikor valaki küld egyet, itt jelenik meg</div>
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {receivedCards.map(card => (
            <div key={card.id} onClick={() => !card.revealed && handleReveal(card)}
              style={{ borderRadius:18, overflow:"hidden", border:`1px solid ${card.revealed ? "rgba(255,212,59,0.3)" : C.border}`, background:card.revealed ? "linear-gradient(135deg,rgba(255,212,59,0.08),rgba(255,140,66,0.08))" : C.card, cursor:card.revealed?"default":"pointer", transition:"all 0.3s", transform:flipping===card.id?"rotateY(90deg)":"rotateY(0deg)" }}>
              {card.revealed ? (
                <div style={{ padding:"18px 16px" }}>
                  <div style={{ fontSize:11, color:C.yellow, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>{card.category}</div>
                  <div style={{ fontSize:16, color:C.text, fontWeight:600, marginBottom:14, lineHeight:1.5 }}>"{card.card_text}"</div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <img src={card.sender?.photo_url||`https://i.pravatar.cc/80?u=${card.sender?.id}`} style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover", border:`2px solid rgba(255,212,59,0.4)` }} alt="" />
                    <div>
                      <div style={{ color:C.text, fontWeight:700, fontSize:13 }}>{card.sender?.name}</div>
                      <div style={{ color:C.dim, fontSize:11 }}>{new Date(card.created_at).toLocaleDateString("hu-HU")}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding:"18px 16px", display:"flex", alignItems:"center", gap:14 }}>
                  {/* Kártya hátoldala */}
                  <div style={{ width:56, height:76, borderRadius:10, background:"linear-gradient(135deg,#1a2340,#0f1520)", border:"1px solid rgba(255,92,92,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle at 30% 30%, rgba(255,92,92,0.15), transparent 60%)" }} />
                    <span style={{ fontSize:24, position:"relative" }}>🃏</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:C.text, fontWeight:700, fontSize:14 }}>Új kártya érkezett!</div>
                    <div style={{ color:C.dim, fontSize:12, marginTop:4 }}>{new Date(card.created_at).toLocaleDateString("hu-HU")}</div>
                    <div style={{ marginTop:10, display:"inline-flex", alignItems:"center", gap:6, background:C.accentSoft, border:`1px solid ${C.accent}`, borderRadius:20, padding:"6px 12px" }}>
                      <span style={{ fontSize:12 }}>👆</span>
                      <span style={{ color:C.accent, fontSize:12, fontWeight:700 }}>Koppints a felfedéshez</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Küldés modal */}
      {sendModal && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.85)", display:"flex", flexDirection:"column" }} onClick={e => e.target===e.currentTarget && setSendModal(false)}>
          <div style={{ marginTop:"auto", background:C.surface, borderRadius:"24px 24px 0 0", padding:"24px 16px", maxHeight:"85vh", overflowY:"auto" }}>
            <div style={{ width:40, height:4, borderRadius:2, background:C.border, margin:"0 auto 20px" }} />
            {!selectedUser ? (
              <>
                <div style={{ fontWeight:800, fontSize:18, color:C.text, marginBottom:16 }}>Kinek küldöd? 🃏</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {nearbyUsers.slice(0,10).map(u => (
                    <button key={u.id} onClick={() => setSelectedUser(u)} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:14, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left" }}>
                      <img src={u.photo_url||`https://i.pravatar.cc/80?u=${u.id}`} style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover" }} alt="" />
                      <div><div style={{ color:C.text, fontWeight:700 }}>{u.name}{u.age ? `, ${u.age}` : ""}</div><div style={{ color:C.dim, fontSize:12 }}>A közeledben</div></div>
                    </button>
                  ))}
                  {nearbyUsers.length === 0 && <div style={{ color:C.dim, textAlign:"center", padding:20 }}>Ma már mindenki kapott tőled kártyát</div>}
                </div>
              </>
            ) : !selectedCategory ? (
              <>
                <button onClick={() => setSelectedUser(null)} style={{ background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:13, marginBottom:16, padding:0 }}>← Vissza</button>
                <div style={{ fontWeight:800, fontSize:18, color:C.text, marginBottom:16 }}>Melyik kategória? ✨</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {Object.keys(COMPLIMENT_CARDS).map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding:"14px 16px", borderRadius:14, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left", color:C.text, fontWeight:700, fontSize:15 }}>{cat}</button>
                  ))}
                </div>
              </>
            ) : !selectedCard ? (
              <>
                <button onClick={() => setSelectedCategory(null)} style={{ background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:13, marginBottom:16, padding:0 }}>← Vissza</button>
                <div style={{ fontWeight:800, fontSize:18, color:C.text, marginBottom:16 }}>Melyik üzenet? 💌</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {COMPLIMENT_CARDS[selectedCategory].map((text, i) => (
                    <button key={i} onClick={() => setSelectedCard(text)} style={{ padding:"14px 16px", borderRadius:14, background:C.card, border:`1px solid ${C.border}`, cursor:"pointer", textAlign:"left", color:C.text, fontSize:14, lineHeight:1.5 }}>"{text}"</button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setSelectedCard(null)} style={{ background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:13, marginBottom:16, padding:0 }}>← Vissza</button>
                <div style={{ fontWeight:800, fontSize:18, color:C.text, marginBottom:20 }}>Megerősítés 🚀</div>
                <div style={{ background:C.card, borderRadius:16, padding:16, marginBottom:16, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:11, color:C.yellow, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>{selectedCategory}</div>
                  <div style={{ color:C.text, fontSize:15, fontWeight:600, lineHeight:1.5 }}>"{selectedCard}"</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, padding:"12px 14px", background:C.card, borderRadius:14, border:`1px solid ${C.border}` }}>
                  <img src={selectedUser.photo_url||`https://i.pravatar.cc/80?u=${selectedUser.id}`} style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover" }} alt="" />
                  <div>
                    <div style={{ color:C.text, fontWeight:700 }}>Nekik: {selectedUser.name}</div>
                    <div style={{ color:C.dim, fontSize:12 }}>Felfedés után látja hogy tőled jött 💌</div>
                  </div>
                </div>
                <button onClick={handleSend} disabled={sending} style={{ width:"100%", padding:"16px", borderRadius:16, border:"none", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, color:"#fff", fontWeight:800, fontSize:16, cursor:"pointer" }}>
                  {sending ? "Küldés..." : "🃏 Kártya elküldése"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Felfedés vásárlás modal */}
      {buyModal && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }} onClick={e => e.target===e.currentTarget && setBuyModal(false)}>
          <div style={{ background:C.surface, borderRadius:24, padding:28, width:"100%", maxWidth:360, textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🃏</div>
            <div style={{ fontWeight:800, fontSize:20, color:C.text, marginBottom:8 }}>{isPro ? "Holnap felfedheted" : "Következő felfedés 2 nap múlva"}</div>
            <div style={{ color:C.muted, fontSize:14, marginBottom:24 }}>{isPro ? "PRO előfizetőként naponta 1 kártyát fedhetsz fel ingyen." : "Free fiókon 2 naponta 1 felfedés jár ingyen. PRO-val naponta."}</div>
            <button onClick={() => { setBuyModal(false); }} style={{ width:"100%", padding:"14px", borderRadius:14, border:`1px solid ${C.border}`, background:C.card, color:C.muted, fontWeight:600, fontSize:14, cursor:"pointer" }}>Majd később</button>
            {!isPro && <button onClick={onUpgrade} style={{ width:"100%", padding:"14px", borderRadius:14, border:"none", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer", marginTop:10 }}>PRO – napi felfedés 🔑</button>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── LIKEOK SCREEN ──────────────────────────────────────
function LikeokScreen({ myId, isPro, onUpgrade, onSwipe }) {
  const [likers, setLikers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [profileModal, setProfileModal] = useState(null);
  const [profilePhotoIdx, setProfilePhotoIdx] = useState(0);

  const handleAction = async (userId, action) => {
    setLikers(prev => prev.filter(u => u.id !== userId));
    setCount(prev => Math.max(0, prev - 1));
    setProfileModal(null);
    await onSwipe(userId, action);
  };

  useEffect(() => {
    const load = async () => {
      const { data: swipes } = await supabase
        .from("swipes")
        .select("swiper_id, action, created_at")
        .eq("swiped_id", myId)
        .in("action", ["like", "superlike"])
        .order("created_at", { ascending: false });

      if (!swipes) { setLoading(false); return; }

      const { data: matches } = await supabase
        .from("matches")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${myId},user2_id.eq.${myId}`);

      const matchedIds = new Set((matches||[]).map(m => m.user1_id===myId ? m.user2_id : m.user1_id));

      // Azokat is kiszűrjük akiket már mi is swipe-oltunk (pass vagy like)
      const { data: mySwipes } = await supabase
        .from("swipes")
        .select("swiped_id")
        .eq("swiper_id", myId);
      const mySwipedIds = new Set((mySwipes||[]).map(s => s.swiped_id));

      const filtered = swipes.filter(s => !matchedIds.has(s.swiper_id) && !mySwipedIds.has(s.swiper_id));
      setCount(filtered.length);

      if (isPro) {
        const ids = filtered.map(s => s.swiper_id);
        if (ids.length > 0) {
          const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids);
          const withAction = (profiles||[]).map(p => ({
            ...p,
            action: filtered.find(s => s.swiper_id === p.id)?.action
          }));
          setLikers(withAction);
        }
      }
      setLoading(false);
    };
    load();
  }, [myId, isPro]);

  if (loading) return <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}><Spinner /></div>;

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", position:"relative" }}>

      {/* Profil modal */}
      {profileModal && (
        <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(8,11,16,0.97)", backdropFilter:"blur(8px)", display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:`1px solid ${C.border}` }}>
            <button onClick={() => { setProfileModal(null); setProfilePhotoIdx(0); }} style={{ background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:20 }}>←</button>
            <span style={{ color:C.text, fontWeight:700, fontSize:16 }}>{profileModal.name}, {profileModal.age}</span>
          </div>
          <div style={{ flex:1, overflowY:"auto" }}>
            {(() => {
              const photos = profileModal.photos||(profileModal.photo_url?[profileModal.photo_url]:[]);
              return photos.length > 0 ? (
                <div style={{ position:"relative", width:"100%", aspectRatio:"1", background:C.card }}>
                  <img src={photos[profilePhotoIdx]} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={profileModal.name} />
                  {photos.length > 1 && (
                    <>
                      <div style={{ position:"absolute", top:10, left:"50%", transform:"translateX(-50%)", display:"flex", gap:4 }}>
                        {photos.map((_,i) => <div key={i} style={{ width:i===profilePhotoIdx?18:5, height:5, borderRadius:3, background:i===profilePhotoIdx?"#fff":"rgba(255,255,255,0.4)", transition:"width 0.2s" }} />)}
                      </div>
                      <button onClick={() => setProfilePhotoIdx(i=>Math.max(0,i-1))} style={{ position:"absolute", left:0, top:0, bottom:0, width:"40%", background:"none", border:"none", cursor:"pointer" }} />
                      <button onClick={() => setProfilePhotoIdx(i=>Math.min(photos.length-1,i+1))} style={{ position:"absolute", right:0, top:0, bottom:0, width:"40%", background:"none", border:"none", cursor:"pointer" }} />
                    </>
                  )}
                </div>
              ) : (
                <div style={{ width:"100%", aspectRatio:"1", background:C.card, display:"flex", alignItems:"center", justifyContent:"center", fontSize:60 }}>👤</div>
              );
            })()}
            <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
              {profileModal.bio && (
                <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}` }}>
                  <div style={{ color:C.dim, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Bio</div>
                  <p style={{ color:C.text, fontSize:14, lineHeight:1.6, margin:0 }}>{profileModal.bio}</p>
                </div>
              )}
              <GhostScoreBadge score={profileModal.ghost_score} />
              {(profileModal.interests||[]).length > 0 && (
                <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}` }}>
                  <div style={{ color:C.dim, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Érdeklődés</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {profileModal.interests.map(t => <span key={t} style={{ background:C.accentSoft, border:`1px solid ${C.accent}`, borderRadius:20, padding:"5px 11px", fontSize:12, color:C.accent }}>{t}</span>)}
                  </div>
                </div>
              )}
              {(profileModal.looking_for||profileModal.height||profileModal.education) && (
                <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}`, display:"flex", flexDirection:"column", gap:8 }}>
                  {profileModal.looking_for && <div style={{ color:C.muted, fontSize:13 }}>💍 {profileModal.looking_for}</div>}
                  {profileModal.height && <div style={{ color:C.muted, fontSize:13 }}>📏 {profileModal.height} cm</div>}
                  {profileModal.education && <div style={{ color:C.muted, fontSize:13 }}>🎓 {profileModal.education}</div>}
                </div>
              )}
            </div>
          </div>
          <div style={{ display:"flex", gap:10, padding:"16px", borderTop:`1px solid ${C.border}` }}>
            <button onClick={() => handleAction(profileModal.id, "pass")} style={{ flex:1, padding:"16px", background:C.card, border:`1px solid ${C.border}`, borderRadius:16, color:C.text, fontSize:22, cursor:"pointer" }}>✕</button>
            <button onClick={() => handleAction(profileModal.id, "like")} style={{ flex:2, padding:"16px", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, border:"none", borderRadius:16, color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer" }}>♥ Lájkolom</button>
          </div>
        </div>
      )}
      <div style={{ marginBottom:20 }}>
        <h2 style={{ color:C.text, fontSize:22, fontWeight:900, margin:"0 0 4px" }}>🔥 Likeok</h2>
        <p style={{ color:C.muted, fontSize:13, margin:0 }}>{count} ember lájkolt téged</p>
      </div>

      {count === 0 && (
        <div style={{ textAlign:"center", padding:"40px 20px" }}>
          <div style={{ fontSize:50, marginBottom:16 }}>🔥</div>
          <div style={{ color:C.text, fontSize:16, fontWeight:700, marginBottom:8 }}>Még nincs like</div>
          <div style={{ color:C.muted, fontSize:13 }}>Swipe-olj többet, hogy mások is lássanak!</div>
        </div>
      )}

      {!isPro && count > 0 && (
        <>
          <div style={{ position:"relative", marginBottom:16 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, filter:"blur(12px)", pointerEvents:"none", userSelect:"none" }}>
              {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
                <div key={i} style={{ aspectRatio:"1", borderRadius:16, background:`linear-gradient(135deg, #${Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')}, #${Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>
                  👤
                </div>
              ))}
            </div>
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
              <div style={{ background:"rgba(8,11,16,0.85)", backdropFilter:"blur(8px)", borderRadius:20, padding:"20px 24px", textAlign:"center", border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:36, marginBottom:8 }}>🔒</div>
                <div style={{ color:C.text, fontWeight:800, fontSize:18, marginBottom:4 }}>{count} ember lájkolt téged!</div>
                <div style={{ color:C.muted, fontSize:13, marginBottom:16 }}>Upgrade Pro-ra, hogy lásd ki lájkolt téged</div>
                <button onClick={onUpgrade} style={{ background:"linear-gradient(135deg,#ffd43b,#ff8c42)", border:"none", borderRadius:14, color:"#000", padding:"12px 24px", cursor:"pointer", fontSize:14, fontWeight:700 }}>⚡ Upgrade Pro-ra</button>
              </div>
            </div>
          </div>
        </>
      )}

      {isPro && likers.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {likers.map(u => (
            <div key={u.id} onClick={() => { setProfileModal(u); setProfilePhotoIdx(0); }} style={{ display:"flex", alignItems:"center", gap:12, background:C.card, borderRadius:16, padding:"12px 14px", border:`1px solid ${C.border}`, cursor:"pointer" }}>
              <div style={{ position:"relative" }}>
                <img src={u.photo_url||`https://i.pravatar.cc/300?u=${u.id}`} style={{ width:56, height:56, borderRadius:"50%", objectFit:"cover" }} alt={u.name} />
                {u.action === "superlike" && <div style={{ position:"absolute", bottom:-2, right:-2, fontSize:14 }}>⭐</div>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ color:C.text, fontWeight:700, fontSize:15 }}>{u.name}, {u.age}</div>
                <div style={{ color:u.action==="superlike"?"#4dabf7":C.accent, fontSize:12, marginTop:2 }}>
                  {u.action === "superlike" ? "⭐ Super lájkolt" : "❤️ Lájkolt téged"}
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={(e) => { e.stopPropagation(); handleAction(u.id, "pass"); }} style={{ width:44, height:44, borderRadius:"50%", background:C.surface, border:`1px solid ${C.border}`, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
                <button onClick={(e) => { e.stopPropagation(); handleAction(u.id, "like"); }} style={{ width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, border:"none", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>♥</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── RADAR ──────────────────────────────────────────────

// Ghost Score – kiszámítása kliens oldalon a saját matches/messages alapján,
// majd eltárolva a profiles táblában. Más userek score-ját a profiles-ból olvassuk.

async function calcAndSaveGhostScore(userId) {
  try {
    const { data: matches } = await supabase.from("matches").select("id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    if (!matches || matches.length === 0) {
      await supabase.from("profiles").update({ ghost_score: null }).eq("id", userId);
      return null;
    }
    const total = matches.length;
    let replied = 0;
    for (const m of matches) {
      const { data: msgs } = await supabase.from("messages").select("id").eq("match_id", m.id).eq("sender_id", userId).limit(1);
      if (msgs && msgs.length > 0) replied++;
    }
    const score = Math.round((replied / total) * 100);
    await supabase.from("profiles").update({ ghost_score: score }).eq("id", userId);
    return score;
  } catch { return null; }
}

function getGhostLabel(score) {
  if (score === null || score === undefined) return null;
  if (score >= 81) return { label: "Kiváló válaszoló", desc: "Szinte mindig ír vissza", emoji: "🌟", color: "#3ecf8e" };
  if (score >= 61) return { label: "Megbízható", desc: "Általában válaszol", emoji: "😊", color: "#69db7c" };
  if (score >= 41) return { label: "Közepes", desc: "Néha nem ír vissza", emoji: "😐", color: "#ffd43b" };
  if (score >= 21) return { label: "Gyenge válaszoló", desc: "Ritkán ír vissza", emoji: "😶", color: "#ff8c42" };
  return { label: "Szellem", desc: "Szinte soha nem válaszol", emoji: "👻", color: "#ff5c5c" };
}

// score prop-ot kap közvetlenül a profile objektumból
function GhostScoreBadge({ score }) {
  if (score === null || score === undefined) return (
    <div style={{ background:"rgba(20,28,43,0.95)", borderRadius:14, padding:"12px 14px", border:"1px solid rgba(240,244,255,0.08)", display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ textAlign:"center", minWidth:52 }}>
        <div style={{ fontSize:26 }}>🆕</div>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ color:"#f0f4ff", fontWeight:700, fontSize:13, marginBottom:2 }}>Ghost Score</div>
        <div style={{ color:"rgba(240,244,255,0.45)", fontSize:12 }}>Új felhasználó – még nincs adat</div>
      </div>
    </div>
  );
  const g = getGhostLabel(score);
  return (
    <div style={{ background:"rgba(20,28,43,0.95)", borderRadius:14, padding:"12px 14px", border:`1px solid ${g.color}44`, display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ textAlign:"center", minWidth:52 }}>
        <div style={{ fontSize:26 }}>{g.emoji}</div>
        <div style={{ fontSize:22, fontWeight:900, color:g.color, lineHeight:1 }}>{score}%</div>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ color:"#f0f4ff", fontWeight:700, fontSize:13, marginBottom:2 }}>Ghost Score</div>
        <div style={{ color:g.color, fontSize:12, fontWeight:600, marginBottom:6 }}>{g.label}</div>
        <div style={{ background:"rgba(240,244,255,0.08)", borderRadius:8, height:6 }}>
          <div style={{ background:g.color, borderRadius:8, height:6, width:`${score}%`, transition:"width 0.6s" }} />
        </div>
        <div style={{ color:"rgba(240,244,255,0.4)", fontSize:11, marginTop:4 }}>{g.desc}</div>
      </div>
    </div>
  );
}

function SatelliteMapView({ myProfile, visibleUsers, isPro, onSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const addMarkers = (L, map) => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    visibleUsers.forEach(u => {
      if (!u.lat || !u.lng) return;
      const name = isPro ? (u.name || "?") : "???";
      const color = isPro ? "#3ecf8e" : "#ffd43b";
      const icon = L.divIcon({
        className: "",
        html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer"><div style="background:rgba(8,11,16,0.85);border:1px solid ${color};border-radius:8px;padding:2px 7px;font-size:11px;font-weight:700;color:${color};white-space:nowrap;margin-bottom:3px">${name}</div><div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 5px ${color}"></div></div>`,
        iconSize: [60,32], iconAnchor: [30,32]
      });
      const marker = L.marker([u.lat, u.lng], { icon }).addTo(map);
      marker.on("click", () => onSelect(u));
      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (!mapRef.current) return;
    const lat = myProfile?.lat || 47.497;
    const lng = myProfile?.lng || 19.040;

    const initMap = (L) => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
      const map = L.map(mapRef.current, { zoomControl:false, attributionControl:false }).setView([lat, lng], 15);
      mapInstanceRef.current = map;
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom:19 }).addTo(map);
      const myIcon = L.divIcon({ className:"", html:`<div style="width:14px;height:14px;border-radius:50%;background:#ff5c5c;border:2px solid #fff;box-shadow:0 0 6px rgba(255,92,92,0.8)"></div>`, iconSize:[14,14], iconAnchor:[7,7] });
      L.marker([lat, lng], { icon: myIcon }).addTo(map);
      addMarkers(L, map);
    };

    if (window.L) { initMap(window.L); }
    else {
      if (!document.querySelector("link[href*=leaflet]")) {
        const link = document.createElement("link"); link.rel="stylesheet"; link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
      }
      if (!document.querySelector("script[src*=leaflet]")) {
        const script = document.createElement("script"); script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload=()=>initMap(window.L); document.head.appendChild(script);
      } else {
        const wait = setInterval(() => { if(window.L){ clearInterval(wait); initMap(window.L); } }, 100);
      }
    }
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [myProfile?.lat, myProfile?.lng]);

  useEffect(() => {
    if (window.L && mapInstanceRef.current) addMarkers(window.L, mapInstanceRef.current);
  }, [visibleUsers, isPro]);

  return (
    <div style={{ width:300, height:300, borderRadius:16, overflow:"hidden", position:"relative", flexShrink:0 }}>
      <div ref={mapRef} style={{ width:"100%", height:"100%", borderRadius:16 }} />
      <div style={{ position:"absolute", top:8, left:8, zIndex:1000, background:"rgba(8,11,16,0.8)", borderRadius:8, padding:"4px 8px", color:"#f0f4ff", fontSize:11, pointerEvents:"none" }}>🛰️ Műholdas</div>
    </div>
  );
}

function RadarScreen({ myProfile, nearbyUsers, isPro, boostActive, onUpgrade, onSwipe }) {
  const canvasRef = useRef(null);
  const [dots, setDots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showProWall, setShowProWall] = useState(false);
  const [satelliteMode, setSatelliteMode] = useState(false);
  const [localSwipedIds, setLocalSwipedIds] = useState(new Set());
  const [profileModal, setProfileModal] = useState(null);
  const [profilePhotoIdx, setProfilePhotoIdx] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ minAge:18, maxAge:60, maxDist:20 });
  const [activeFilters, setActiveFilters] = useState({ minAge:18, maxAge:60, maxDist:20 });
  const animRef = useRef(null);
  const angleRef = useRef(0);

  const filteredNearby = nearbyUsers.filter(u => {
    if (u.age && (u.age < activeFilters.minAge || u.age > activeFilters.maxAge)) return false;
    if (u.distanceKm != null && u.distanceKm > activeFilters.maxDist) return false;
    return true;
  });

  const visibleUsers = filteredNearby.filter(u => !localSwipedIds.has(u.id));
  const isFiltered = activeFilters.minAge !== 18 || activeFilters.maxAge !== 60 || activeFilters.maxDist !== 20;

  const handleRadarSwipe = async (userId, action) => {
    setLocalSwipedIds(prev => new Set([...prev, userId]));
    setSelected(null);
    setProfileModal(null);
    await onSwipe(userId, action);
  };

  const openProfile = (u) => { setProfileModal(u); setProfilePhotoIdx(0); };

  useEffect(() => {
    setDots(visibleUsers.map((u, i) => ({ ...u, angle: (i / Math.max(visibleUsers.length, 1)) * Math.PI * 2, r: Math.min(0.9, 0.2 + (u.distanceKm / 20) * 0.7) })));
  }, [visibleUsers.length]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); const size = canvas.width; const cx = size/2, cy = size/2;
    const draw = () => {
      ctx.clearRect(0,0,size,size);
      [0.3,0.55,0.8].forEach(r => { ctx.beginPath(); ctx.arc(cx,cy,r*(size/2),0,Math.PI*2); ctx.strokeStyle="rgba(255,92,92,0.12)"; ctx.lineWidth=1; ctx.stroke(); });
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(angleRef.current);
      const grad = ctx.createLinearGradient(0,-size/2,0,0); grad.addColorStop(0,"rgba(255,92,92,0)"); grad.addColorStop(1,"rgba(255,92,92,0.18)");
      ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,size/2,-Math.PI/2,-Math.PI/2+Math.PI*0.4); ctx.closePath(); ctx.fillStyle=grad; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(cx,cy,6,0,Math.PI*2); ctx.fillStyle=C.accent; ctx.fill();
      dots.forEach(d => {
        const x = cx+Math.cos(d.angle)*d.r*(size/2-20); const y = cy+Math.sin(d.angle)*d.r*(size/2-20);
        ctx.beginPath(); ctx.arc(x,y,selected?.id===d.id?8:5,0,Math.PI*2); ctx.fillStyle=selected?.id===d.id?C.accent:"rgba(255,92,92,0.7)"; ctx.fill();
      });
      angleRef.current += 0.015; animRef.current = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(animRef.current);
  }, [dots, selected]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect();
    const x = (e.clientX-rect.left)*(canvas.width/rect.width); const y = (e.clientY-rect.top)*(canvas.height/rect.height);
    const size = canvas.width; const cx=size/2, cy=size/2; let found=null;
    dots.forEach(d => { const dx=cx+Math.cos(d.angle)*d.r*(size/2-20); const dy=cy+Math.sin(d.angle)*d.r*(size/2-20); if(Math.hypot(x-dx,y-dy)<20) found=d; });
    setSelected(found);
  };

  const distLabel = (km) => km < 1 ? `${Math.round(km*1000)}m` : `${km.toFixed(1)}km`;

  return (
    <>
      {profileModal && (
        <div style={{ position:"absolute",inset:0,zIndex:96,background:"rgba(8,11,16,0.96)",backdropFilter:"blur(8px)",display:"flex",flexDirection:"column" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:`1px solid ${C.border}` }}>
            <button onClick={() => setProfileModal(null)} style={{ background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:20 }}>←</button>
            <span style={{ color:C.text,fontWeight:700,fontSize:16 }}>{profileModal.name}, {profileModal.age}</span>
          </div>
          <div style={{ flex:1,overflowY:"auto" }}>
            {/* Fotók */}
            {(() => {
              const photos = profileModal.photos||(profileModal.photo_url?[profileModal.photo_url]:[]);
              return photos.length > 0 ? (
                <div style={{ position:"relative",width:"100%",aspectRatio:"1",background:C.card }}>
                  <img src={photos[profilePhotoIdx]} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt={profileModal.name} />
                  {photos.length > 1 && (
                    <>
                      <div style={{ position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4 }}>
                        {photos.map((_,i) => <div key={i} style={{ width:i===profilePhotoIdx?18:5,height:5,borderRadius:3,background:i===profilePhotoIdx?"#fff":"rgba(255,255,255,0.4)",transition:"width 0.2s" }} />)}
                      </div>
                      <button onClick={() => setProfilePhotoIdx(i=>Math.max(0,i-1))} style={{ position:"absolute",left:0,top:0,bottom:0,width:"40%",background:"none",border:"none",cursor:"pointer" }} />
                      <button onClick={() => setProfilePhotoIdx(i=>Math.min(photos.length-1,i+1))} style={{ position:"absolute",right:0,top:0,bottom:0,width:"40%",background:"none",border:"none",cursor:"pointer" }} />
                    </>
                  )}
                </div>
              ) : (
                <div style={{ width:"100%",aspectRatio:"1",background:C.card,display:"flex",alignItems:"center",justifyContent:"center",fontSize:60 }}>👤</div>
              );
            })()}
            <div style={{ padding:"16px 20px",display:"flex",flexDirection:"column",gap:12 }}>
              {profileModal.bio && (
                <div style={{ background:C.card,borderRadius:14,padding:"14px",border:`1px solid ${C.border}` }}>
                  <div style={{ color:C.dim,fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:8 }}>Bio</div>
                  <p style={{ color:C.text,fontSize:14,lineHeight:1.6,margin:0 }}>{profileModal.bio}</p>
                </div>
              )}
              <GhostScoreBadge score={profileModal.ghost_score} />
              {(profileModal.interests||[]).length > 0 && (
                <div style={{ background:C.card,borderRadius:14,padding:"14px",border:`1px solid ${C.border}` }}>
                  <div style={{ color:C.dim,fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:10 }}>Érdeklődés</div>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                    {profileModal.interests.map(t => <span key={t} style={{ background:C.accentSoft,border:`1px solid ${C.accent}`,borderRadius:20,padding:"5px 11px",fontSize:12,color:C.accent }}>{t}</span>)}
                  </div>
                </div>
              )}
              {(profileModal.looking_for||profileModal.height||profileModal.education) && (
                <div style={{ background:C.card,borderRadius:14,padding:"14px",border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8 }}>
                  {profileModal.looking_for && <div style={{ color:C.muted,fontSize:13 }}>💍 {profileModal.looking_for}</div>}
                  {profileModal.height && <div style={{ color:C.muted,fontSize:13 }}>📏 {profileModal.height} cm</div>}
                  {profileModal.education && <div style={{ color:C.muted,fontSize:13 }}>🎓 {profileModal.education}</div>}
                </div>
              )}
            </div>
          </div>
          <div style={{ display:"flex",gap:10,padding:"16px",borderTop:`1px solid ${C.border}` }}>
            <button onClick={() => handleRadarSwipe(profileModal.id,"pass")} style={{ flex:1,padding:"16px",background:C.card,border:`1px solid ${C.border}`,borderRadius:16,color:C.text,fontSize:22,cursor:"pointer" }}>✕</button>
            <button onClick={() => handleRadarSwipe(profileModal.id,"like")} style={{ flex:2,padding:"16px",background:`linear-gradient(135deg,${C.accent},#ff8c42)`,border:"none",borderRadius:16,color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer" }}>♥ Lájkolom</button>
          </div>
        </div>
      )}
      {showProWall && (
        <div style={{ position:"absolute", inset:0, zIndex:95, background:"rgba(8,11,16,0.92)", backdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end" }}>
          <div style={{ width:"100%", background:C.surface, borderRadius:"28px 28px 0 0", padding:"28px 24px 40px", border:`1px solid ${C.border}` }}>
            <div style={{ textAlign:"center", marginBottom:20 }}><div style={{ fontSize:48, marginBottom:10 }}>🔒</div><h3 style={{ color:C.text, fontSize:20, fontWeight:900, margin:"0 0 8px" }}>Pro funkció</h3><p style={{ color:C.muted, fontSize:13, margin:0 }}>A Radar like küldése csak Pro tagoknak érhető el.</p></div>
            <button onClick={() => { onUpgrade(); setShowProWall(false); }} style={{ width:"100%", padding:"16px", background:"linear-gradient(135deg,#ffd43b,#ff8c42)", border:"none", borderRadius:16, color:"#000", fontSize:16, fontWeight:700, cursor:"pointer", marginBottom:10 }}>⚡ Upgrade Pro-ra</button>
            <button onClick={() => setShowProWall(false)} style={{ width:"100%", padding:"14px", background:"none", border:`1px solid ${C.border}`, borderRadius:16, color:C.muted, fontSize:15, cursor:"pointer" }}>Mégse</button>
          </div>
        </div>
      )}
      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"10px 16px", gap:10, overflowY:"scroll", WebkitOverflowScrolling:"touch", minHeight:0 }}>
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          <button onClick={() => setSatelliteMode(m => !m)} style={{ flex:1, padding:"10px 14px", borderRadius:12, border:`1px solid ${satelliteMode?"#4dabf7":C.border}`, background:satelliteMode?"rgba(77,171,247,0.12)":C.card, color:satelliteMode?"#4dabf7":C.muted, cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            🛰️ {satelliteMode?"Műholdas":"Radar"} nézet
          </button>
          <button onClick={() => setShowFilters(f => !f)} style={{ padding:"10px 14px", borderRadius:12, border:`1px solid ${isFiltered?C.accent:C.border}`, background:isFiltered?C.accentSoft:C.card, color:isFiltered?C.accent:C.muted, cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isFiltered?C.accent:C.muted} strokeWidth="2.2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="9" cy="6" r="2.5" fill={isFiltered?C.accent:"#0f1520"} stroke={isFiltered?C.accent:C.muted}/><circle cx="15" cy="12" r="2.5" fill={isFiltered?C.accent:"#0f1520"} stroke={isFiltered?C.accent:C.muted}/><circle cx="9" cy="18" r="2.5" fill={isFiltered?C.accent:"#0f1520"} stroke={isFiltered?C.accent:C.muted}/></svg>
            {isFiltered && <span style={{ width:6,height:6,borderRadius:"50%",background:C.accent }} />}
          </button>
        </div>
        {/* Radar szűrő panel */}
        {showFilters && (
          <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px", display:"flex", flexDirection:"column", gap:20, flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ color:C.text, fontWeight:700, fontSize:14 }}>Szűrők</span>
              {isFiltered && <button onClick={() => { const d={minAge:18,maxAge:60,maxDist:20}; setFilters(d); setActiveFilters(d); }} style={{ background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:12, fontWeight:600 }}>Visszaállít</button>}
            </div>
            {/* Kor */}
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ color:C.muted, fontSize:12, fontWeight:600 }}>Kor</span>
                <span style={{ color:C.accent, fontWeight:700, fontSize:12 }}>{filters.minAge} – {filters.maxAge} év</span>
              </div>
              {[
                { label:"Min", min:18, max:filters.maxAge-1, val:filters.minAge, key:"minAge" },
                { label:"Max", min:filters.minAge+1, max:80, val:filters.maxAge, key:"maxAge" },
              ].map(s => {
                const pct = Math.round(((s.val - s.min) / (s.max - s.min)) * 100);
                return (
                  <div key={s.key} style={{ position:"relative", height:32, display:"flex", alignItems:"center", marginBottom:4 }}>
                    <div style={{ position:"absolute", left:0, right:0, height:3, borderRadius:2, background:"rgba(255,255,255,0.08)" }} />
                    <div style={{ position:"absolute", left:0, width:`${pct}%`, height:3, borderRadius:2, background:`linear-gradient(90deg,${C.accent},#ff8c42)` }} />
                    <input type="range" min={s.min} max={s.max} value={s.val} step={1}
                      onChange={e => { const v={...filters,[s.key]:+e.target.value}; setFilters(v); setActiveFilters(v); }}
                      style={{ position:"absolute",left:0,right:0,width:"100%",appearance:"none",WebkitAppearance:"none",background:"transparent",outline:"none",cursor:"pointer",margin:0,padding:0 }} />
                  </div>
                );
              })}
            </div>
            {/* Távolság */}
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ color:C.muted, fontSize:12, fontWeight:600 }}>Max távolság</span>
                <span style={{ color:C.accent, fontWeight:700, fontSize:12 }}>{filters.maxDist} km</span>
              </div>
              <div style={{ position:"relative", height:32, display:"flex", alignItems:"center" }}>
                <div style={{ position:"absolute", left:0, right:0, height:3, borderRadius:2, background:"rgba(255,255,255,0.08)" }} />
                <div style={{ position:"absolute", left:0, width:`${Math.round(((filters.maxDist-1)/19)*100)}%`, height:3, borderRadius:2, background:`linear-gradient(90deg,${C.accent},#ff8c42)` }} />
                <input type="range" min={1} max={20} value={filters.maxDist} step={1}
                  onChange={e => { const v={...filters,maxDist:+e.target.value}; setFilters(v); setActiveFilters(v); }}
                  style={{ position:"absolute",left:0,right:0,width:"100%",appearance:"none",WebkitAppearance:"none",background:"transparent",outline:"none",cursor:"pointer",margin:0,padding:0 }} />
              </div>
            </div>
          </div>
        )}
        {boostActive && (
          <div style={{ background:"linear-gradient(135deg,rgba(255,212,59,0.12),rgba(255,140,66,0.12))", border:"1px solid rgba(255,212,59,0.4)", borderRadius:13, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>⚡</span>
            <div style={{ flex:1 }}><div style={{ color:C.yellow, fontWeight:700, fontSize:13 }}>Kiemelés aktív</div></div>
            <div style={{ width:8, height:8, borderRadius:"50%", background:C.green, boxShadow:"0 0 6px #3ecf8e" }} />
          </div>
        )}
        <div style={{ position:"relative", display:"flex", justifyContent:"center" }}>
          {satelliteMode ? (
            <SatelliteMapView myProfile={myProfile} visibleUsers={visibleUsers} isPro={isPro} onSelect={setSelected} />
          ) : (
            <canvas ref={canvasRef} width={300} height={300} onClick={handleCanvasClick} style={{ borderRadius:"50%", cursor:"crosshair", width:300, height:300, flexShrink:0 }} />
          )}
          {selected && (
            <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, minWidth:230 }}>
              {isPro ? (<img src={selected.photo_url||`https://i.pravatar.cc/300?u=${selected.id}`} style={{ width:42, height:42, borderRadius:"50%", objectFit:"cover" }} alt={selected.name} />) : (<div style={{ width:42, height:42, borderRadius:"50%", background:C.card, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🔒</div>)}
              <div style={{ flex:1 }}>
                {isPro ? (<><div style={{ color:C.text, fontWeight:700 }}>{selected.name}, {selected.age}</div><div style={{ color:C.accent, fontSize:12 }}>● {distLabel(selected.distanceKm)}</div></>) : (<><div style={{ color:C.text, fontWeight:700 }}>Ismeretlen profil</div><div style={{ color:C.accent, fontSize:12 }}>● {distLabel(selected.distanceKm)}</div></>)}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={() => { if(!isPro){setShowProWall(true);return;} handleRadarSwipe(selected.id,"pass"); }} style={{ width:34, height:34, borderRadius:"50%", background:C.card, border:`1px solid ${C.border}`, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                <button onClick={() => { if(!isPro){setShowProWall(true);return;} handleRadarSwipe(selected.id,"like"); }} style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, border:"none", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>♥</button>
              </div>
            </div>
          )}
        </div>
        {!isPro && (
          <div style={{ background:"rgba(255,212,59,0.08)", border:"1px solid rgba(255,212,59,0.25)", borderRadius:13, padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>🔒</span>
            <div style={{ flex:1 }}><div style={{ color:C.yellow, fontWeight:700, fontSize:13 }}>Profilok rejtve</div><div style={{ color:C.dim, fontSize:11 }}>Pro-val látod ki van közel és likeolhatsz</div></div>
            <button onClick={onUpgrade} style={{ background:"linear-gradient(135deg,#ffd43b,#ff8c42)", border:"none", borderRadius:10, color:"#000", padding:"8px 12px", cursor:"pointer", fontSize:12, fontWeight:700 }}>Upgrade</button>
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {visibleUsers.length === 0 && <div style={{ textAlign:"center", padding:"20px", color:C.muted, fontSize:13 }}>Nincs senki a közelben 😕</div>}
          {visibleUsers.map(u => (
            <div key={u.id} onClick={() => isPro && openProfile(u)} style={{ display:"flex", alignItems:"center", gap:10, background:C.card, borderRadius:13, padding:"10px 14px", border:`1px solid ${C.border}`, cursor:isPro?"pointer":"default" }}>
              {isPro ? (<img src={u.photo_url||`https://i.pravatar.cc/300?u=${u.id}`} style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover" }} alt={u.name} />) : (<div style={{ width:40, height:40, borderRadius:"50%", background:C.surface, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, border:`1px solid ${C.border}`, flexShrink:0 }}>🔒</div>)}
              <div style={{ flex:1 }}>
                {isPro ? (<><div style={{ color:C.text, fontWeight:600, fontSize:14 }}>{u.name}, {u.age}</div><div style={{ color:C.accent, fontSize:11 }}>● {distLabel(u.distanceKm)}</div></>) : (<><div style={{ color:C.muted, fontWeight:600, fontSize:14 }}>Rejtett profil</div><div style={{ color:C.accent, fontSize:11 }}>● {distLabel(u.distanceKm)}</div></>)}
              </div>
              {isPro ? (
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={(e) => { e.stopPropagation(); handleRadarSwipe(u.id,"pass"); }} style={{ width:44, height:44, borderRadius:"50%", background:C.surface, border:`1px solid ${C.border}`, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
                  <button onClick={(e) => { e.stopPropagation(); handleRadarSwipe(u.id,"like"); }} style={{ width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, border:"none", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", flexShrink:0 }}>♥</button>
                </div>
              ) : (
                <button onClick={onUpgrade} style={{ background:"rgba(255,212,59,0.1)", border:"1px solid rgba(255,212,59,0.3)", color:C.yellow, borderRadius:10, padding:"7px 12px", cursor:"pointer", fontSize:12, fontWeight:600 }}>🔒 Pro</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── SWIPE ──────────────────────────────────────────────
const THRESHOLD = 100;

// ── NEARMATCH CARD SVG ──────────────────────────────────
function NearMatchCard({ size = 1 }) {
  const uid = useRef(`nm_${Math.random().toString(36).slice(2)}`).current;
  const w = 80 * size, h = 110 * size;
  return (
    <svg width={w} height={h} viewBox="0 0 80 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`cardBg_${uid}`} x1="0" y1="0" x2="80" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1a2340" />
          <stop offset="100%" stopColor="#0d1525" />
        </linearGradient>
        <linearGradient id={`accentGrad_${uid}`} x1="24" y1="41" x2="56" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff5c5c" />
          <stop offset="100%" stopColor="#ff8c42" />
        </linearGradient>
      </defs>
      <rect width="80" height="110" rx="10" fill={`url(#cardBg_${uid})`} />
      <rect x="0.5" y="0.5" width="79" height="109" rx="9.5" stroke="rgba(255,92,92,0.3)" strokeWidth="1" />
      <rect x="5" y="5" width="70" height="100" rx="7" stroke="rgba(255,92,92,0.12)" strokeWidth="0.5" />
      <text x="9" y="17" fontSize="7" fontWeight="800" fill="#ff5c5c" fontFamily="Arial,sans-serif">NM</text>
      <text x="71" y="100" fontSize="7" fontWeight="800" fill="#ff5c5c" fontFamily="Arial,sans-serif" textAnchor="end">NM</text>
      <path d="M40 70 C40 70 24 59 24 49 C24 43 28.5 39 34 39 C37 39 39.5 40.5 40 42 C40.5 40.5 43 39 46 39 C51.5 39 56 43 56 49 C56 59 40 70 40 70Z" fill={`url(#accentGrad_${uid})`} />
      <text x="40" y="86" fontSize="5.5" fontWeight="700" fill="rgba(255,255,255,0.35)" fontFamily="Arial,sans-serif" textAnchor="middle" letterSpacing="1.5">NEARMATCH</text>
    </svg>
  );
}

function CardsModal({ myId, isPro, onClose, onUpgrade, onOpenChat }) {
  const [profileModal, setProfileModal] = useState(null);
  const [myCards, setMyCards] = useState([]); // kártyák amiket én kioszthatom
  const [receivedCards, setReceivedCards] = useState([]); // kártyák amiket kaptam
  const [loading, setLoading] = useState(true);
  const [flipping, setFlipping] = useState(null);
  const [buyModal, setBuyModal] = useState(false);

  const canReveal = () => {
    const last = localStorage.getItem(`lastReveal_${myId}`);
    if (!last) return true;
    const diff = (Date.now() - parseInt(last)) / (1000 * 60 * 60 * 24);
    return isPro ? diff >= 1 : diff >= 2;
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    // Kártyák amiket én kioszthatom (is_mine_to_give = true, még nem adtam oda)
    const { data: mine } = await supabase.from("compliment_cards")
      .select("*").eq("sender_id", myId).eq("is_mine_to_give", true)
      .is("given_to", null).order("created_at", { ascending: false });
    setMyCards(mine || []);

    // Kártyák amiket kaptam (valaki nekem adta)
    const { data: recv } = await supabase.from("compliment_cards")
      .select("*, sender:profiles!sender_id(id,name,photo_url)")
      .eq("receiver_id", myId).eq("is_mine_to_give", false)
      .order("created_at", { ascending: false });
    setReceivedCards(recv || []);
    setLoading(false);
  };

  const genLock = useRef(false);

  const generateDailyCards = async () => {
    if (!myId || genLock.current) return;
    genLock.current = true;

    const lastGenKey = `cardsGeneratedAt_${myId}`;
    const lastGen = localStorage.getItem(lastGenKey);
    const now = Date.now();

    // 24 órán belül generált? Akkor skip — semmi DB hívás
    if (lastGen && (now - parseInt(lastGen)) < 24 * 60 * 60 * 1000) {
      genLock.current = false;
      return;
    }

    // DB ellenőrzés: van-e az elmúlt 24 órában generált kártya
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const { data: existing, error: checkError } = await supabase
      .from("compliment_cards")
      .select("id, created_at")
      .eq("sender_id", myId)
      .eq("is_mine_to_give", true)
      .gte("created_at", dayAgo.toISOString());

    if (checkError) { console.error("Card check error:", checkError); genLock.current = false; return; }

    if ((existing||[]).length > 0) {
      const latest = Math.max(...existing.map(c => new Date(c.created_at).getTime()));
      localStorage.setItem(lastGenKey, latest.toString());
      genLock.current = false;
      return;
    }

    // Generálás
    const categories = Object.keys(COMPLIMENT_CARDS.other);
    const shuffledCats = [...categories].sort(() => Math.random() - 0.5).slice(0, 3);
    const cards = shuffledCats.map(cat => {
      const texts = COMPLIMENT_CARDS.other[cat];
      const text = texts[Math.floor(Math.random() * texts.length)];
      return { sender_id: myId, receiver_id: myId, card_text: text, category: cat, is_mine_to_give: true };
    });

    const { error } = await supabase.from("compliment_cards").insert(cards);
    if (!error) {
      // Időbélyeg AZONNAL mentve, mielőtt bármi más történne — ez akadályozza meg az újragenerálást
      localStorage.setItem(lastGenKey, now.toString());
      await loadData();
    } else {
      console.error("Card insert error:", error);
    }
    genLock.current = false;
  };

  useEffect(() => {
    if (myId) generateDailyCards();
  }, [myId]);

  const handleReveal = async (card) => {
    if (card.revealed) return;
    if (!canReveal()) { setBuyModal(card); return; }
    setFlipping(card.id);
    await supabase.from("compliment_cards").update({ revealed: true, revealed_at: new Date().toISOString() }).eq("id", card.id);
    localStorage.setItem(`lastReveal_${myId}`, Date.now().toString());
    setReceivedCards(prev => prev.map(c => c.id === card.id ? { ...c, revealed: true } : c));
    setTimeout(() => setFlipping(null), 600);
  };

  const handleBuyReveal = async (card) => {
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      // Elmentjük melyik kártyát akarjuk felfedni, hogy visszatéréskor tudjuk
      localStorage.setItem(`pendingReveal_${myId}`, card.id);
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${s?.access_token}` },
        body: JSON.stringify({ price_id: STRIPE_REVEAL_PRICE_ID, success_url: window.location.origin+"?reveal=success", cancel_url: window.location.origin+"?reveal=cancel", mode: "payment" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) { console.error(err); }
  };

  const unrevealed = receivedCards.filter(c => !c.revealed).length;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.88)", display:"flex", flexDirection:"column" }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ marginTop:"auto", background:C.surface, borderRadius:"24px 24px 0 0", maxHeight:"88vh", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"12px 16px 0", flexShrink:0 }}>
          <div style={{ width:40, height:4, borderRadius:2, background:C.border, margin:"0 auto 16px" }} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ fontWeight:800, fontSize:17, color:C.text }}>🃏 Kártyák</div>
            <button onClick={onClose} style={{ background:"none", border:"none", color:C.dim, cursor:"pointer", fontSize:20, padding:0 }}>✕</button>
          </div>
        </div>

        <div style={{ overflowY:"auto", padding:"0 16px 32px", flex:1 }}>
          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:40 }}>
              <div style={{ width:28, height:28, border:`3px solid ${C.accent}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
            </div>
          ) : (<>
            {/* Saját kiosztható kártyák */}
            {myCards.length > 0 && (<>
              <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>
                Kiosztható kártyáid
                <span style={{ background:C.orange, color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:10, marginLeft:8 }}>{myCards.length} db</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
                {myCards.map(card => (
                  <div key={card.id} style={{ borderRadius:16, border:`1px solid rgba(255,140,66,0.3)`, background:"linear-gradient(135deg,rgba(255,140,66,0.08),rgba(255,92,92,0.05))", padding:"14px 16px", display:"flex", alignItems:"center", gap:14 }}>
                    <NearMatchCard size={0.6} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, color:C.orange, fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>{card.category}</div>
                      <div style={{ color:C.text, fontSize:13, fontWeight:600, lineHeight:1.4 }}>"{card.card_text}"</div>
                      <div style={{ color:C.dim, fontSize:11, marginTop:6 }}>Swipelés közben adhatod oda 👆</div>
                    </div>
                  </div>
                ))}
              </div>
            </>)}

            {/* Kapott kártyák */}
            <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>
              Kapott kártyák
              {unrevealed > 0 && <span style={{ background:C.accent, color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:10, marginLeft:8 }}>{unrevealed} új</span>}
            </div>
            {receivedCards.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px" }}>
                <NearMatchCard size={1.2} />
                <div style={{ fontWeight:700, color:C.muted, marginTop:16 }}>Még nincs kapott kártyád</div>
                <div style={{ fontSize:13, color:C.dim, marginTop:6 }}>Amikor valaki swipelés közben neked adja, itt jelenik meg</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {receivedCards.map(card => (
                  <div key={card.id} onClick={() => !card.revealed && handleReveal(card)}
                    style={{ borderRadius:16, border:`1px solid ${card.revealed?"rgba(255,212,59,0.3)":C.border}`, background:card.revealed?"linear-gradient(135deg,rgba(255,212,59,0.07),rgba(255,140,66,0.07))":C.card, cursor:card.revealed?"default":"pointer", opacity:flipping===card.id?0.3:1, transition:"opacity 0.3s" }}>
                    {card.revealed ? (
                      <div style={{ padding:"16px" }}>
                        <div style={{ fontSize:10, color:C.yellow, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>{card.category}</div>
                        <div style={{ fontSize:15, color:C.text, fontWeight:600, marginBottom:14, lineHeight:1.5 }}>"{card.card_text}"</div>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                          <img src={card.sender?.photo_url||`https://i.pravatar.cc/80?u=${card.sender?.id}`} style={{ width:34, height:34, borderRadius:"50%", objectFit:"cover", border:"2px solid rgba(255,212,59,0.4)", cursor:"pointer" }} alt="" onClick={() => setProfileModal(card.sender)} />
                          <div>
                            <div style={{ color:C.text, fontWeight:700, fontSize:13 }}>{card.sender?.name}</div>
                            <div style={{ color:C.dim, fontSize:11 }}>{new Date(card.created_at).toLocaleDateString("hu-HU")}</div>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={() => setProfileModal(card.sender)} style={{ flex:1, padding:"9px", borderRadius:12, border:`1px solid ${C.border}`, background:C.card, color:C.text, fontSize:13, fontWeight:600, cursor:"pointer" }}>👤 Profil</button>
                          <button onClick={() => { onOpenChat && onOpenChat(card.sender); onClose(); }} style={{ flex:1, padding:"9px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>💬 Üzenet</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:14 }}>
                        <NearMatchCard size={0.6} />
                        <div style={{ flex:1 }}>
                          <div style={{ color:C.text, fontWeight:700, fontSize:14 }}>Új kártya érkezett!</div>
                          <div style={{ color:C.dim, fontSize:12, marginTop:3 }}>{new Date(card.created_at).toLocaleDateString("hu-HU")}</div>
                          <div style={{ marginTop:10, display:"inline-flex", alignItems:"center", gap:6, background:C.accentSoft, border:`1px solid rgba(255,92,92,0.3)`, borderRadius:20, padding:"5px 12px" }}>
                            <span style={{ color:C.accent, fontSize:12, fontWeight:700 }}>👆 Koppints a felfedéshez</span>
                          </div>
                          <div style={{ color:C.dim, fontSize:11, marginTop:6 }}>{isPro ? "PRO: napi 1 ingyenes" : "2 naponta 1 ingyenes"}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>)}
        </div>
      </div>

      {buyModal && (
        <div style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(0,0,0,0.9)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }} onClick={e => e.target===e.currentTarget && setBuyModal(false)}>
          <div style={{ background:C.surface, borderRadius:24, padding:28, width:"100%", maxWidth:340, textAlign:"center" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}><NearMatchCard size={1.2} /></div>
            <div style={{ fontWeight:800, fontSize:18, color:C.text, marginBottom:8 }}>Elérted a napi ingyenes felfedést</div>
            <div style={{ color:C.muted, fontSize:13, marginBottom:24 }}>{isPro ? "Holnap újra felfedhetsz egyet ingyen, vagy fedd fel most azonnal." : "Free fiókon 2 naponta jár 1 ingyenes. Fedd fel most azonnal, vagy válts PRO-ra."}</div>
            <button onClick={() => { const card = buyModal; setBuyModal(false); handleBuyReveal(card); }} style={{ width:"100%", padding:"14px", borderRadius:14, border:"none", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer", marginBottom:10 }}>🔓 Felfedés most – 490 Ft</button>
            {!isPro && <button onClick={() => { setBuyModal(false); onUpgrade(); }} style={{ width:"100%", padding:"13px", borderRadius:14, border:`1px solid rgba(255,212,59,0.4)`, background:"rgba(255,212,59,0.08)", color:C.yellow, fontWeight:700, fontSize:14, cursor:"pointer", marginBottom:10 }}>⚡ PRO – napi ingyenes felfedés</button>}
            <button onClick={() => setBuyModal(false)} style={{ width:"100%", padding:"13px", borderRadius:14, border:`1px solid ${C.border}`, background:"none", color:C.muted, fontWeight:600, fontSize:14, cursor:"pointer" }}>Majd később</button>
          </div>
        </div>
      )}

      {profileModal && (
        <div style={{ position:"fixed", inset:0, zIndex:700, background:"rgba(0,0,0,0.92)", display:"flex", flexDirection:"column" }} onClick={e => e.target===e.currentTarget && setProfileModal(null)}>
          <div style={{ marginTop:"auto", background:C.surface, borderRadius:"24px 24px 0 0", padding:"24px 16px 40px", maxHeight:"70vh", overflowY:"auto" }}>
            <div style={{ width:40, height:4, borderRadius:2, background:C.border, margin:"0 auto 20px" }} />
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
              <img src={profileModal.photo_url||`https://i.pravatar.cc/120?u=${profileModal.id}`} style={{ width:70, height:70, borderRadius:"50%", objectFit:"cover", border:`3px solid rgba(255,212,59,0.4)` }} alt="" />
              <div>
                <div style={{ fontSize:22, fontWeight:800, color:C.text }}>{profileModal.name}</div>
                {profileModal.age && <div style={{ color:C.muted, fontSize:14 }}>{profileModal.age} éves</div>}
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setProfileModal(null)} style={{ flex:1, padding:"13px", borderRadius:14, border:`1px solid ${C.border}`, background:C.card, color:C.muted, fontSize:14, cursor:"pointer" }}>Bezárás</button>
              <button onClick={() => { onOpenChat && onOpenChat(profileModal); onClose(); }} style={{ flex:2, padding:"13px", borderRadius:14, border:"none", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer" }}>💬 Üzenet küldése</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SwipeScreen({ myProfile, swipeUsers, onSwipe, boostActive, isPro, onUpgrade, onOpenChat }) {
  const [idx, setIdx] = useState(0);
  const [history, setHistory] = useState([]);
  const [cardPage, setCardPage] = useState(0);
  const [drag, setDrag] = useState({ x:0, y:0, dragging:false });
  const [gone, setGone] = useState(false);
  const [actionLabel, setActionLabel] = useState(null);
  const [proWallType, setProWallType] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [myCards, setMyCards] = useState([]);
  const [giveCardModal, setGiveCardModal] = useState(false);
  const [givingCard, setGivingCard] = useState(false);
  const DEFAULT_FILTERS = { minAge:18, maxAge:60, maxDist:50, gender:"Mindenki", lookingFor:"" };
  const loadSavedFilters = () => {
    try { const s = localStorage.getItem("swipeFilters"); return s ? JSON.parse(s) : DEFAULT_FILTERS; }
    catch { return DEFAULT_FILTERS; }
  };
  const [filters, setFilters] = useState(loadSavedFilters);
  const [activeFilters, setActiveFilters] = useState(loadSavedFilters);
  const startPos = useRef(null);

  const loadMyCards = useCallback(async () => {
    if (!myProfile?.id) return;
    const { data } = await supabase.from("compliment_cards")
      .select("*").eq("sender_id", myProfile.id).eq("is_mine_to_give", true)
      .is("given_to", null);
    setMyCards(data || []);
  }, [myProfile?.id]);

  useEffect(() => { loadMyCards(); }, [loadMyCards]);

  const slLimit = isPro ? 5 : 1;
  const [slUsed, setSlUsed] = useState(0);
  const [slDay, setSlDay] = useState(getTodayKey());
  const slLeft = getTodayKey()!==slDay ? slLimit : Math.max(0, slLimit-slUsed);

  useEffect(() => setCardPage(0), [idx]);
  useEffect(() => setIdx(0), [activeFilters]);

  const filteredUsers = swipeUsers.filter(u => {
    if (u.age && (u.age < activeFilters.minAge || u.age > activeFilters.maxAge)) return false;
    if (u.distanceKm != null && u.distanceKm > activeFilters.maxDist) return false;
    if (activeFilters.gender !== "Mindenki" && u.gender && u.gender !== activeFilters.gender) return false;
    if (activeFilters.lookingFor && activeFilters.lookingFor !== "Bármilyen" && u.looking_for && u.looking_for !== activeFilters.lookingFor) return false;
    return true;
  });

  const isFiltered = activeFilters.minAge !== 18 || activeFilters.maxAge !== 60 || activeFilters.maxDist !== 50 || activeFilters.gender !== "Mindenki" || !!activeFilters.lookingFor;

  const SliderTrack = ({ min, max, value, onChange, label, unit="" }) => {
    const pct = Math.round(((value - min) / (max - min)) * 100);
    return (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
          <span style={{ color:C.muted, fontSize:13 }}>{label}</span>
          <span style={{ color:C.accent, fontWeight:700, fontSize:13 }}>{value}{unit}</span>
        </div>
        <div style={{ position:"relative", height:36, display:"flex", alignItems:"center" }}>
          {/* Track háttér */}
          <div style={{ position:"absolute", left:0, right:0, height:4, borderRadius:2, background:"rgba(255,255,255,0.1)" }} />
          {/* Aktív sáv */}
          <div style={{ position:"absolute", left:0, width:`${pct}%`, height:4, borderRadius:2, background:`linear-gradient(90deg,${C.accent},#ff8c42)` }} />
          <input
            type="range" min={min} max={max} value={value} step={1}
            onChange={e => onChange(+e.target.value)}
            style={{
              position:"absolute", left:0, right:0, width:"100%",
              appearance:"none", WebkitAppearance:"none",
              background:"transparent", outline:"none", cursor:"pointer", margin:0, padding:0,
            }}
          />
        </div>
        <style>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 26px; height: 26px;
            border-radius: 50%;
            background: #fff;
            border: 3px solid ${C.accent};
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(255,92,92,0.4);
          }
          input[type=range]::-moz-range-thumb {
            width: 26px; height: 26px;
            border-radius: 50%;
            background: #fff;
            border: 3px solid ${C.accent};
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(255,92,92,0.4);
          }
          input[type=range]::-webkit-slider-runnable-track { background: transparent; }
          input[type=range]::-moz-range-track { background: transparent; }
        `}</style>
      </div>
    );
  };

  const FilterIcon = ({ active }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? C.accent : C.muted} strokeWidth="2.2" strokeLinecap="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="9" cy="6" r="2.5" fill={active ? C.accent : C.surface} stroke={active ? C.accent : C.muted} />
      <circle cx="15" cy="12" r="2.5" fill={active ? C.accent : C.surface} stroke={active ? C.accent : C.muted} />
      <circle cx="9" cy="18" r="2.5" fill={active ? C.accent : C.surface} stroke={active ? C.accent : C.muted} />
    </svg>
  );

  const FilterPanel = () => (
    <div style={{ position:"absolute",inset:0,zIndex:95,background:"rgba(8,11,16,0.92)",backdropFilter:"blur(12px)",display:"flex",alignItems:"flex-end" }}>
      <div style={{ width:"100%",background:C.surface,borderRadius:"28px 28px 0 0",padding:"8px 0 0",border:`1px solid ${C.border}`,display:"flex",flexDirection:"column" }}>
        <div style={{ width:36,height:4,borderRadius:2,background:C.border,margin:"0 auto 20px" }} />
        <div style={{ padding:"0 20px 40px", display:"flex", flexDirection:"column", gap:24 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <span style={{ color:C.text,fontWeight:800,fontSize:18 }}>Szűrők</span>
            <button onClick={() => setShowFilters(false)} style={{ width:32,height:32,borderRadius:"50%",background:C.card,border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
          </div>

          {/* Kor - két csúszka */}
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ color:C.muted, fontSize:13, fontWeight:600 }}>Kor</span>
              <span style={{ color:C.accent, fontWeight:700, fontSize:13 }}>{filters.minAge} – {filters.maxAge} év</span>
            </div>
            <SliderTrack min={18} max={filters.maxAge - 1} value={filters.minAge} label="Min kor" unit=" év"
              onChange={v => setFilters(f => ({...f, minAge: v}))} />
            <div style={{ marginTop:4 }}>
              <SliderTrack min={filters.minAge + 1} max={80} value={filters.maxAge} label="Max kor" unit=" év"
                onChange={v => setFilters(f => ({...f, maxAge: v}))} />
            </div>
          </div>

          {/* Távolság */}
          <SliderTrack min={1} max={100} value={filters.maxDist} label="Max távolság"
            unit={filters.maxDist < 100 ? " km" : "+ km"}
            onChange={v => setFilters(f => ({...f, maxDist: v}))} />

          {/* Nem */}
          <div>
            <span style={{ color:C.muted, fontSize:13, fontWeight:600, display:"block", marginBottom:10 }}>Keresett nem</span>
            <div style={{ display:"flex", gap:8 }}>
              {["Mindenki","Nő","Férfi","Non-binary"].map(g => (
                <button key={g} onClick={() => setFilters(f=>({...f,gender:g}))}
                  style={{ flex:1,padding:"10px 4px",borderRadius:12,border:`1px solid ${filters.gender===g?C.accent:C.border}`,background:filters.gender===g?C.accentSoft:C.card,color:filters.gender===g?C.accent:C.muted,cursor:"pointer",fontSize:11,fontWeight:700,transition:"all 0.15s" }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Keresett kapcsolat */}
          <div>
            <span style={{ color:C.muted, fontSize:13, fontWeight:600, display:"block", marginBottom:10 }}>Keresett kapcsolat</span>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {[{l:"Bármilyen",i:"✨"},{l:"Komoly kapcsolat",i:"💍"},{l:"Laza ismerkedés",i:"🌊"},{l:"Új barátok",i:"👋"},{l:"Meglátjuk",i:"🤷"}].map(x => (
                <button key={x.l} onClick={() => setFilters(f=>({...f,lookingFor:f.lookingFor===x.l?"":x.l}))}
                  style={{ padding:"8px 12px",borderRadius:20,border:`1px solid ${filters.lookingFor===x.l?C.accent:C.border}`,background:filters.lookingFor===x.l?C.accentSoft:C.card,color:filters.lookingFor===x.l?C.accent:C.muted,cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5 }}>
                  {x.i} {x.l}
                </button>
              ))}
            </div>
          </div>

          {/* Gombok */}
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => { const d={minAge:18,maxAge:60,maxDist:50,gender:"Mindenki",lookingFor:""}; setFilters(d); setActiveFilters(d); localStorage.setItem("swipeFilters", JSON.stringify(d)); setShowFilters(false); }}
              style={{ flex:1,padding:"14px",borderRadius:14,border:`1px solid ${C.border}`,background:"none",color:C.muted,cursor:"pointer",fontSize:14,fontWeight:600 }}>
              Visszaállít
            </button>
            <button onClick={() => { setActiveFilters(filters); localStorage.setItem("swipeFilters", JSON.stringify(filters)); setShowFilters(false); }}
              style={{ flex:2,padding:"14px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${C.accent},#ff8c42)`,color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,boxShadow:`0 4px 16px ${C.accentGlow}` }}>
              Mutat →
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!filteredUsers.length) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", flex:1, flexDirection:"column", gap:16, padding:"0 24px", position:"relative" }}>
      {showFilters && <FilterPanel />}
      <div style={{ fontSize:50 }}>😕</div>
      <div style={{ fontSize:16, color:C.text }}>Nincs találat</div>
      <div style={{ fontSize:13, color:C.muted, textAlign:"center" }}>{isFiltered ? "Próbálj tágabb szűrőkkel!" : "Próbálj később!"}</div>
      {isFiltered && <button onClick={() => { const d={minAge:18,maxAge:60,maxDist:50,gender:"Mindenki",lookingFor:""}; setFilters(d); setActiveFilters(d); localStorage.setItem("swipeFilters", JSON.stringify(d)); }} style={{ padding:"12px 24px",borderRadius:14,border:"none",background:C.accent,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14 }}>Szűrők törlése</button>}
    </div>
  );

  const cur = filteredUsers[idx % filteredUsers.length];
  const next = filteredUsers[(idx+1) % filteredUsers.length];
  const showLabel = (label) => { setActionLabel(label); setTimeout(() => setActionLabel(null), 900); };

  const act = async (dir) => {
    if (gone) return;
    setGone(true);
    setHistory(h => [...h.slice(-9), { idx, user:cur }]);
    await onSwipe(cur.id, dir);
    if (dir==="superlike") {
      const today = getTodayKey();
      if (today!==slDay) { setSlDay(today); setSlUsed(1); } else { setSlUsed(u=>u+1); }
    }
    setTimeout(() => { setIdx(i=>i+1); setGone(false); setDrag({ x:0,y:0,dragging:false }); }, 350);
  };

  const handleRewind = () => {
    if (!isPro) { setProWallType("rewind"); return; }
    if (history.length===0) return;
    const prev = history[history.length-1];
    setHistory(h=>h.slice(0,-1));
    setIdx(prev.idx);
  };

  const onMouseDown = (e) => { startPos.current={x:e.clientX,y:e.clientY}; setDrag(d=>({...d,dragging:true})); };
  const onMouseMove = (e) => { if(!drag.dragging||!startPos.current) return; setDrag({x:e.clientX-startPos.current.x,y:e.clientY-startPos.current.y,dragging:true}); };
  const onMouseUp = () => { if(!drag.dragging) return; if(drag.x>THRESHOLD){showLabel("LIKE");act("like");}else if(drag.x<-THRESHOLD){showLabel("PASS");act("pass");}else setDrag({x:0,y:0,dragging:false}); startPos.current=null; };
  const onTouchStart = (e) => { const t=e.touches[0]; startPos.current={x:t.clientX,y:t.clientY}; setDrag(d=>({...d,dragging:true})); };
  const onTouchMove = (e) => { if(!startPos.current) return; const t=e.touches[0]; setDrag({x:t.clientX-startPos.current.x,y:t.clientY-startPos.current.y,dragging:true}); };
  const onTouchEnd = () => { if(drag.x>THRESHOLD){showLabel("LIKE");act("like");}else if(drag.x<-THRESHOLD){showLabel("PASS");act("pass");}else setDrag({x:0,y:0,dragging:false}); startPos.current=null; };

  const handleGiveCard = async (card) => {
    if (!cur || givingCard) return;
    setGivingCard(true);
    // A kártya szövege marad, csak a nemspecifikus szavakat igazítjuk a célszemélyhez
    let finalText = card.card_text;
    if (cur.gender === "Férfi" || cur.gender === "male") {
      finalText = finalText.replace(/legszebb lány/gi, "legszebb fiú").replace(/legsugárzóbb ember/gi, "legszebb fiú");
    } else if (cur.gender === "Nő" || cur.gender === "female") {
      finalText = finalText.replace(/legszebb fiú/gi, "legszebb lány").replace(/legsugárzóbb ember/gi, "legszebb lány");
    }
    await supabase.from("compliment_cards").insert({
      sender_id: myProfile.id,
      receiver_id: cur.id,
      card_text: finalText,
      category: card.category,
      is_mine_to_give: false,
    });
    await supabase.from("compliment_cards").update({ given_to: cur.id, given_at: new Date().toISOString() }).eq("id", card.id);
    setMyCards(prev => prev.filter(c => c.id !== card.id));
    setGiveCardModal(false);
    setGivingCard(false);
    setActionLabel("🃏 KÁRTYA ELKÜLDVE!");
    setTimeout(() => setActionLabel(null), 1200);
  };

  const transform = gone?`translateX(${drag.x>0?600:-600}px) rotate(${drag.x>0?25:-25}deg)`:`translateX(${drag.x}px) translateY(${drag.y*0.3}px) rotate(${drag.x/15}deg)`;
  const transition = drag.dragging&&!gone?"none":"transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)";
  const likeOpacity = Math.max(0,drag.x/THRESHOLD);
  const passOpacity = Math.max(0,-drag.x/THRESHOLD);
  const distLabel = (km) => km!=null ? (km<1?`${Math.round(km*1000)}m`:`${km.toFixed(1)}km`) : "";

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",padding:"4px 8px 8px",userSelect:"none",position:"relative" }} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      {showFilters && <FilterPanel />}
      {showCards && <CardsModal myId={myProfile?.id} isPro={isPro} onClose={() => { setShowCards(false); loadMyCards(); }} onUpgrade={onUpgrade} onOpenChat={onOpenChat} />}

      {/* Kártya odaadás modal */}
      {giveCardModal && (() => {
        return (
          <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.88)", display:"flex", flexDirection:"column" }} onClick={e => e.target===e.currentTarget && setGiveCardModal(false)}>
            <div style={{ marginTop:"auto", background:C.surface, borderRadius:"24px 24px 0 0", padding:"20px 16px 40px" }}>
              <div style={{ width:40, height:4, borderRadius:2, background:C.border, margin:"0 auto 20px" }} />
              <div style={{ fontWeight:800, fontSize:17, color:C.text, marginBottom:6 }}>Melyik kártyát adod oda?</div>
              <div style={{ color:C.dim, fontSize:13, marginBottom:20 }}>
                {cur?.name} megkapja, felfedés után látja hogy tőled jött 💌
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {myCards.map(card => (
                  <button key={card.id} onClick={() => handleGiveCard(card)} disabled={givingCard}
                    style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:16, background:C.card, border:`1px solid rgba(255,140,66,0.3)`, cursor:"pointer", textAlign:"left" }}>
                    <NearMatchCard size={0.55} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, color:C.orange, fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>{card.category}</div>
                      <div style={{ color:C.text, fontSize:13, fontWeight:600, lineHeight:1.4 }}>"{card.card_text}"</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setGiveCardModal(false)} style={{ width:"100%", marginTop:14, padding:"13px", borderRadius:14, border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:14, cursor:"pointer" }}>Mégse</button>
            </div>
          </div>
        );
      })()}
      {/* Gombok sor */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexShrink:0 }}>
        <button onClick={() => setShowCards(true)} style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:20,border:`1px solid rgba(255,92,92,0.3)`,background:"rgba(255,92,92,0.08)",color:C.accent,cursor:"pointer",fontSize:13,fontWeight:600 }}>
          <NearMatchCard size={0.28} />
          Kártyák
        </button>
        <button onClick={() => setShowFilters(true)} style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:20,border:`1px solid ${isFiltered?C.accent:C.border}`,background:isFiltered?C.accentSoft:C.card,color:isFiltered?C.accent:C.muted,cursor:"pointer",fontSize:13,fontWeight:600 }}>
          <FilterIcon active={isFiltered} />
          Szűrők {isFiltered && <span style={{ width:6,height:6,borderRadius:"50%",background:C.accent,display:"inline-block" }} />}
        </button>
      </div>
      {proWallType && (
        <div style={{ position:"absolute",inset:0,zIndex:95,background:"rgba(8,11,16,0.92)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end" }}>
          <div style={{ width:"100%",background:C.surface,borderRadius:"28px 28px 0 0",padding:"28px 24px 40px",border:`1px solid ${C.border}` }}>
            <div style={{ textAlign:"center",marginBottom:20 }}><div style={{ fontSize:48,marginBottom:10 }}>{proWallType==="rewind"?"↩️":"⭐"}</div><h3 style={{ color:C.text,fontSize:20,fontWeight:900,margin:"0 0 8px" }}>{proWallType==="rewind"?"Visszatekerés — Pro":"Super Like elfogyott"}</h3></div>
            <button onClick={() => { onUpgrade(); setProWallType(null); }} style={{ width:"100%",padding:"16px",background:"linear-gradient(135deg,#ffd43b,#ff8c42)",border:"none",borderRadius:16,color:"#000",fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:10 }}>⚡ Upgrade Pro-ra</button>
            <button onClick={() => setProWallType(null)} style={{ width:"100%",padding:"14px",background:"none",border:`1px solid ${C.border}`,borderRadius:16,color:C.muted,fontSize:15,cursor:"pointer" }}>Mégse</button>
          </div>
        </div>
      )}
      <div style={{ flex:1,position:"relative",minHeight:0 }}>
        {next && (
          <div style={{ position:"absolute",inset:0,borderRadius:24,overflow:"hidden",transform:"scale(0.95)",opacity:0.7 }}>
            <img src={next.photo_url||`https://i.pravatar.cc/300?u=${next.id}`} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt={next.name} />
            <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 50%)" }} />
          </div>
        )}
        <div onMouseDown={onMouseDown} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          onClick={(e) => {
            if(Math.abs(drag.x)>5) return;
            const rect=e.currentTarget.getBoundingClientRect();
            const x=e.clientX-rect.left;
            const photos = cur.photos||(cur.photo_url?[cur.photo_url]:[]);
            const totalPages = photos.length + 1; // +1 az adatlap
            if(x > rect.width*0.5) setCardPage(p=>Math.min(p+1, totalPages-1));
            else setCardPage(p=>Math.max(p-1,0));
          }}
          style={{ position:"absolute",inset:0,borderRadius:24,overflow:"hidden",background:C.card,cursor:"grab",transform,transition }}>
          {(() => {
            const photos = cur.photos||(cur.photo_url?[cur.photo_url]:[]);
            const totalPages = photos.length;
            return (
              <>
                <div style={{ position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4,zIndex:10 }}>
                  {[...photos, "info"].map((_, p) => <div key={p} style={{ width:p===cardPage?20:6,height:6,borderRadius:3,background:p===cardPage?"#fff":"rgba(255,255,255,0.4)",transition:"width 0.2s" }} />)}
                </div>
                {cardPage < photos.length ? (
                  <img src={photos[cardPage]||`https://i.pravatar.cc/300?u=${cur.id}`} style={{ width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0 }} alt={cur.name} />
                ) : null}
              </>
            );
          })()}
          {cardPage < (cur.photos||(cur.photo_url?[cur.photo_url]:[])).length ? (
            <>
              {(() => { const photos = cur.photos||(cur.photo_url?[cur.photo_url]:[]); return null; })()}
              <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(8,11,16,0.9) 0%,transparent 50%)" }} />
              {cur.distanceKm!=null && <div style={{ position:"absolute",top:14,right:14,background:C.accent,borderRadius:10,padding:"4px 10px",fontSize:12,color:"#fff",fontWeight:700 }}>● {distLabel(cur.distanceKm)}</div>}
              <div style={{ position:"absolute",top:30,left:20,border:"3px solid #3ecf8e",borderRadius:12,padding:"6px 16px",color:"#3ecf8e",fontSize:22,fontWeight:900,opacity:likeOpacity,transform:"rotate(-15deg)" }}>LIKE</div>
              <div style={{ position:"absolute",top:30,right:20,border:"3px solid #ff5c5c",borderRadius:12,padding:"6px 16px",color:"#ff5c5c",fontSize:22,fontWeight:900,opacity:passOpacity,transform:"rotate(15deg)" }}>PASS</div>
              <div style={{ position:"absolute",bottom:0,left:0,right:0,padding:"16px 20px 20px" }}>
                <div style={{ display:"flex",alignItems:"baseline",gap:8,marginBottom:4 }}><span style={{ fontSize:28,fontWeight:900,color:"#fff" }}>{cur.name}</span><span style={{ fontSize:20,color:"rgba(255,255,255,0.5)" }}>{cur.age}</span></div>
                {cur.looking_for ? <div style={{ display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,140,66,0.25)",border:"1px solid rgba(255,140,66,0.5)",borderRadius:20,padding:"4px 11px",marginBottom:8,fontSize:12,color:"#fff",fontWeight:600 }}>{cur.looking_for}</div> : <div style={{ fontSize:10,color:"rgba(255,255,255,0.3)",marginBottom:8 }}>looking_for: {JSON.stringify(cur.looking_for)}</div>}
                <p style={{ color:"rgba(255,255,255,0.7)",fontSize:13,margin:"0 0 10px" }}>{cur.bio}</p>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>{(cur.interests||[]).slice(0,3).map(t => <span key={t} style={{ background:"rgba(255,92,92,0.18)",border:"1px solid rgba(255,92,92,0.3)",borderRadius:20,padding:"4px 10px",fontSize:12,color:"#fff" }}>{t}</span>)}</div>
              </div>
            </>
          ) : (
            <div style={{ width:"100%",height:"100%",background:C.bg,overflowY:"auto",padding:"20px 16px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}><img src={cur.photo_url||`https://i.pravatar.cc/300?u=${cur.id}`} style={{ width:52,height:52,borderRadius:"50%",objectFit:"cover" }} alt={cur.name} /><div><div style={{ fontSize:20,fontWeight:900,color:C.text }}>{cur.name}, {cur.age}</div></div></div>
              <div style={{ marginBottom:10 }}><GhostScoreBadge score={cur.ghost_score} /></div>
              {cur.bio&&<div style={{ background:C.card,borderRadius:14,padding:"13px",border:`1px solid ${C.border}`,marginBottom:10 }}><p style={{ color:C.text,fontSize:13,lineHeight:1.6,margin:0 }}>{cur.bio}</p></div>}
              {(cur.interests||[]).length>0&&<div style={{ background:C.card,borderRadius:14,padding:"13px",border:`1px solid ${C.border}` }}><div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>{cur.interests.map(t=><span key={t} style={{ background:C.accentSoft,border:`1px solid ${C.accent}`,borderRadius:20,padding:"4px 10px",fontSize:12,color:C.accent }}>{t}</span>)}</div></div>}
            </div>
          )}
        </div>
      </div>
      <div style={{ flexShrink:0,paddingTop:10 }}>
        <div style={{ display:"flex",justifyContent:"center",gap:6,marginBottom:10 }}>
          {Array.from({length:slLimit}).map((_,i) => (<div key={i} style={{ width:20,height:4,borderRadius:2,background:i<slLeft?"#4dabf7":C.border }} />))}
          <span style={{ color:C.dim,fontSize:10,marginLeft:4 }}>{slLeft}/{slLimit} Super Like</span>
        </div>
        <div style={{ display:"flex",justifyContent:"center",alignItems:"center",gap:12 }}>
          <button onClick={handleRewind} style={{ width:48,height:48,borderRadius:"50%",background:C.card,border:`1px solid ${C.border}`,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>↩️</button>
          <button onClick={() => {showLabel("PASS");act("pass");}} style={{ width:56,height:56,borderRadius:"50%",background:C.card,border:`1px solid ${C.border}`,fontSize:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted }}>✕</button>
          <button onClick={() => {showLabel("LIKE");act("like");}} style={{ width:70,height:70,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},#ff8c42)`,border:"none",fontSize:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 20px ${C.accentGlow}`,color:"#fff" }}>♥</button>
          <button onClick={() => { if(slLeft<=0){setProWallType("superlike");return;} showLabel("SUPER LIKE"); act("superlike"); }} style={{ width:56,height:56,borderRadius:"50%",background:slLeft>0?"rgba(77,171,247,0.12)":C.card,border:`1px solid ${slLeft>0?"#4dabf7":C.border}`,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>⭐</button>
          <button onClick={() => myCards.length > 0 ? setGiveCardModal(true) : null}
            style={{ width:48,height:48,borderRadius:"50%",background:myCards.length>0?"rgba(255,140,66,0.12)":"rgba(255,255,255,0.04)",border:`1px solid ${myCards.length>0?"rgba(255,140,66,0.4)":C.border}`,cursor:myCards.length>0?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",opacity:myCards.length>0?1:0.3,transition:"all 0.2s" }}>
            <NearMatchCard size={0.28} />
            {myCards.length > 0 && <div style={{ position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:C.orange,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:800 }}>{myCards.length}</div>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MATCHES ────────────────────────────────────────────
function MatchList({ matches, onOpen, isPro, onUpgrade }) {
  const limit = isPro ? 10 : 5;
  const active = matches.filter(m=>m.status!=="expired");
  const pct = active.length/limit;
  const barColor = pct>=1?C.accent:pct>=0.7?C.orange:C.green;
  return (
    <div style={{ flex:1,overflowY:"auto",padding:"14px 20px" }}>
      <div style={{ background:C.card,borderRadius:16,padding:"14px 16px",border:`1px solid ${C.border}`,marginBottom:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:10 }}><span style={{ color:C.text,fontWeight:700 }}>Aktív matchek</span><span style={{ fontWeight:800,color:pct>=1?C.accent:C.text }}>{active.length}/{limit}</span></div>
        <div style={{ height:6,background:C.dim,borderRadius:3,overflow:"hidden",marginBottom:8 }}><div style={{ height:"100%",borderRadius:3,width:`${Math.min(pct*100,100)}%`,background:barColor,transition:"width 0.3s" }} /></div>
        {!isPro&&<button onClick={onUpgrade} style={{ width:"100%",marginTop:8,padding:"10px",background:"linear-gradient(135deg,#ffd43b,#ff8c42)",border:"none",borderRadius:12,color:"#000",fontWeight:700,cursor:"pointer",fontSize:13 }}>⚡ Upgrade Pro-ra</button>}
      </div>
      {active.length===0&&<div style={{ textAlign:"center",padding:"40px 20px",color:C.muted }}>Még nincsenek matcheid 💝</div>}
      {active.map(m => (
        <div key={m.id} onClick={() => onOpen(m)} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer" }}>
          <div style={{ position:"relative" }}>
            <img src={m.other?.photo_url||`https://i.pravatar.cc/300?u=${m.other?.id}`} style={{ width:52,height:52,borderRadius:"50%",objectFit:"cover" }} alt={m.other?.name} />
            {(() => { const diffMin = m.other?.last_seen ? Math.floor((Date.now()-new Date(m.other.last_seen).getTime())/60000) : 999; return diffMin < 5 ? <div style={{ position:"absolute",bottom:1,right:1,width:11,height:11,borderRadius:"50%",background:C.green,border:`2px solid ${C.bg}` }} /> : null; })()}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex",justifyContent:"space-between" }}><span style={{ color:C.text,fontWeight:700 }}>{m.other?.name}</span><span style={{ color:C.dim,fontSize:11 }}>{m.timeLabel}</span></div>
            <div style={{ color:C.dim,fontSize:13,marginTop:2 }}>{m.lastMsg||"Kezdj el beszélgetni! 👋"}</div>
          </div>
          {m.unread&&<div style={{ width:8,height:8,borderRadius:"50%",background:C.accent,flexShrink:0 }} />}
        </div>
      ))}
    </div>
  );
}

// ── CHAT ───────────────────────────────────────────────
function VoicePlayer({ src, isMine }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2,"0")}`;
  };

  const accent = isMine ? "rgba(255,255,255,0.9)" : "#ff5c5c";
  const trackBg = isMine ? "rgba(255,255,255,0.25)" : "rgba(255,92,92,0.2)";
  const fillBg = isMine ? "rgba(255,255,255,0.9)" : "#ff5c5c";

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:200, padding:"2px 0" }}>
      <audio ref={audioRef} src={src} preload="metadata"
        onTimeUpdate={e => { setCurrent(e.target.currentTime); setProgress(e.target.duration ? (e.target.currentTime/e.target.duration)*100 : 0); }}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrent(0); if(audioRef.current) audioRef.current.currentTime=0; }}
      />
      <button onClick={toggle} style={{ width:36,height:36,borderRadius:"50%",background:isMine?"rgba(255,255,255,0.2)":"rgba(255,92,92,0.15)",border:`1px solid ${accent}`,color:accent,fontSize:16,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
        {playing ? "⏸" : "▶"}
      </button>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
        <div style={{ position:"relative", height:4, borderRadius:2, background:trackBg, cursor:"pointer" }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            if (audioRef.current && audioRef.current.duration) {
              audioRef.current.currentTime = pct * audioRef.current.duration;
            }
          }}>
          <div style={{ position:"absolute", left:0, top:0, height:"100%", borderRadius:2, background:fillBg, width:`${progress}%`, transition:"width 0.1s" }} />
          <div style={{ position:"absolute", top:"50%", transform:"translateY(-50%)", width:10, height:10, borderRadius:"50%", background:fillBg, left:`calc(${progress}% - 5px)`, boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:10, color:isMine?"rgba(255,255,255,0.6)":"rgba(240,244,255,0.5)" }}>{fmt(current)}</span>
          <span style={{ fontSize:10, color:isMine?"rgba(255,255,255,0.6)":"rgba(240,244,255,0.5)" }}>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

function ChatView({ match, myId, myVoiceOnly, onBack, onMatchDeleted }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOtherProfile, setShowOtherProfile] = useState(false);
  const [otherProfilePhotoIdx, setOtherProfilePhotoIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Válasszuk a legjobb támogatott formátumot
      const mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4"
        : MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
        : "audio/ogg";
      const ext = mimeType.startsWith("audio/mp4") ? "mp4"
        : mimeType.startsWith("audio/webm") ? "webm" : "ogg";
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (audioChunksRef.current.length === 0) return; // semmi nem lett felvéve
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 1000) return; // túl rövid, eldobjuk
        const fileName = `voice_${Date.now()}.${ext}`;
        const { data, error } = await supabase.storage.from("voices").upload(`${myId}/${fileName}`, blob, { contentType: mimeType, upsert: false });
        if (error) { console.error("Voice upload error:", error); alert("Feltöltési hiba: " + error.message); return; }
        const { data: urlData } = supabase.storage.from("voices").getPublicUrl(`${myId}/${fileName}`);
        const voiceUrl = urlData.publicUrl;
        await supabase.from("messages").insert({ match_id:match.id, sender_id:myId, text:"🎙️ Hangüzenet", voice_url:voiceUrl });
        calcAndSaveGhostScore(myId).catch(() => {});
        if (match.other?.id) {
          await sendPushNotification(match.other.id, "🎙️ Hangüzenet", "Hangüzenetet kaptál", { type:"message", match_id:match.id });
        }
      };
      mr.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (e) { alert("Mikrofon hozzáférés szükséges! (" + e.message + ")"); }
  };

  const stopRecording = () => {
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const REPORT_REASONS = ["Spam vagy reklám","Hamis profil","Nem megfelelő tartalom","Zaklatás","Egyéb"];

  const EMOJI_CATEGORIES = [
    {
      label:"😀", name:"Arckifejezések",
      emojis:["😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","🥰","😘","😗","😙","😚","🙂","🤗","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","😈","👿","👹","👺","💀","☠️","👻","👽","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾"],
    },
    {
      label:"❤️", name:"Szívek & érzelmek",
      emojis:["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✌️","🤞","🤟","🤘","🤙","👌","🤌","🤏","👈","👉","👆","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","🤲","🤝","🙏","💪","🦾","🖖","✍️","💅","🤳"],
    },
    {
      label:"🔥", name:"Népszerű",
      emojis:["🔥","💯","✨","⭐","🌟","💫","⚡","🎉","🎊","🎈","🎁","🏆","🥇","🎯","💎","👑","🌈","🦋","🌸","🌺","🌻","🌹","🌷","🍀","🎶","🎵","🎤","🎸","🎹","🎺","🎻","🥁","🎷","💃","🕺","🎭","🎪","🎨","🖼️","🎬","📸","📷","🎥","🎮","🕹️","🎲","🃏","🎰","🎳"],
    },
    {
      label:"🍕", name:"Étel & ital",
      emojis:["🍕","🍔","🍟","🌭","🍿","🧂","🥓","🥚","🍳","🧇","🥞","🧈","🍞","🥐","🥖","🫓","🥨","🥯","🧀","🥗","🥙","🌮","🌯","🫔","🥪","🥫","🍱","🍘","🍙","🍚","🍛","🍜","🍝","🍠","🍢","🍣","🍤","🍥","🥮","🍡","🥟","🥠","🥡","🦀","🦞","🦐","🦑","🦪","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑","🧄","🧅","🥔","🌽","🥕","🧆","🥜","🫘","🌰","🍵","☕","🫖","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧋","🍾","🧃","🥤","🧉"],
    },
    {
      label:"🐶", name:"Állatok & természet",
      emojis:["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐈","🪶","🌵","🎄","🌲","🌳","🌴","🌱","🌿","☘️","🍀","🎍","🎋","🍃","🍂","🍁","🍄","🌾","💐","🌷","🌹","🥀","🌺","🌸","🌼","🌻","🌞","🌝","🌛","🌜","🌚","🌕","🌙","🌟","⭐","🌠","☁️","⛅","🌤️","🌈","🌂","☔","⚡","❄️","☃️","⛄","🌊","🌀"],
    },
    {
      label:"✈️", name:"Utazás & helyek",
      emojis:["✈️","🚀","🛸","🚁","🛺","🚂","🚃","🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🚋","🚌","🚍","🚎","🚐","🚑","🚒","🚓","🚔","🚕","🚖","🚗","🚘","🚙","🛻","🚚","🚛","🚜","🏎️","🏍️","🛵","🚲","🛴","🛹","🛼","⛽","🛞","🚨","🚥","🚦","🛑","🚧","⚓","🛟","⛵","🚤","🛥️","🛳️","⛴️","🚢","🗺️","🧭","🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏜️","🏝️","🏞️","🏟️","🏛️","🏗️","🛖","🏠","🏡","🏢","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🗼","🗽","⛪","🕌","🛕","🕍","⛩️","🕋","⛲","⛺","🌁","🌃","🏙️","🌄","🌅","🌆","🌇","🌉","🎠","🎡","🎢","🎪"],
    },
    {
      label:"⚽", name:"Sport & aktivitás",
      emojis:["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🎣","🤿","🎽","🎿","🛷","🥌","🎯","🏋️","🤼","🤸","⛹️","🤺","🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🏅","🎖️","🎗️","🎫","🎟️","🎪","🤹","🎭","🎨","🎬","🎤","🎧","🎼","🎵","🎶","🥁","🎷","🎺","🎸","🎹","🎻","🪕","🎲","♟️","🎯","🎳","🎮","🕹️"],
    },
    {
      label:"💼", name:"Tárgyak & szimbólumok",
      emojis:["💌","📩","📨","📧","📥","📤","📦","🏷️","📪","📫","📬","📭","📮","📯","📜","📃","📄","📑","🧾","📊","📈","📉","🗒️","🗓️","📆","📅","🗑️","📁","📂","🗂️","🗃️","🗄️","📋","📌","📍","✂️","🖇️","📎","🖊️","✒️","🖋️","📝","✏️","🔍","🔎","🔏","🔐","🔑","🗝️","🔨","🪓","⚒️","🛠️","🔧","🔩","⚙️","🗜️","⚖️","🦯","🔗","⛓️","🪝","🧲","🪜","💊","💉","🩸","🩹","🩺","🌡️","🔭","🔬","🧬","🧪","🧫","💡","🔦","🕯️","🪔","📱","💻","🖥️","🖨️","⌨️","🖱️","💾","💿","📀","📷","📸","📹","🎥","📽️","📞","☎️","📟","📠","📺","📻","🧭","⏱️","⏲️","⏰","🕰️","⌛","⏳","📡","🔋","🔌","💰","💵","💸","💳","🪙","💹","💎","🔭","🔬"],
    },
  ];

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("messages").select("*").eq("match_id", match.id).order("created_at", { ascending:true });
      setMsgs(data||[]); setLoading(false);
    };
    load();
    const sub = supabase.channel(`messages:${match.id}`)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages", filter:`match_id=eq.${match.id}` }, payload => { setMsgs(m => [...m, payload.new]); }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [match.id]);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), [msgs]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input; setInput("");
    await supabase.from("messages").insert({ match_id:match.id, sender_id:myId, text });
    // Ghost Score frissítése üzenetküldés után (saját score)
    calcAndSaveGhostScore(myId).catch(() => {});
    if (match.other?.id) {
      await sendPushNotification(match.other.id, "💬 Új üzenet", text.length > 60 ? text.slice(0,60)+"…" : text, { type:"message", match_id: match.id });
    }
  };

  const handleDeleteMatch = async () => {
    await supabase.from("messages").delete().eq("match_id", match.id);
    await supabase.from("matches").delete().eq("id", match.id);
    setShowDeleteConfirm(false);
    onMatchDeleted();
  };

  const handleReport = async () => {
    if (!reportReason) return;
    await supabase.from("reports").insert({
      reporter_id: myId,
      reported_id: match.other?.id,
      match_id: match.id,
      reason: reportReason,
      created_at: new Date().toISOString(),
    });
    setReportSent(true);
  };

  const insertEmoji = (emoji) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const timeLabel = (ts) => new Date(ts).toLocaleTimeString("hu", { hour:"2-digit", minute:"2-digit" });

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100%",position:"relative" }}>

      {/* Match törlés megerősítés */}
      {showDeleteConfirm && (
        <div style={{ position:"absolute",inset:0,zIndex:100,background:"rgba(8,11,16,0.95)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end" }}>
          <div style={{ width:"100%",background:C.surface,borderRadius:"28px 28px 0 0",padding:"28px 24px 40px",border:`1px solid ${C.border}` }}>
            <div style={{ textAlign:"center",marginBottom:20 }}>
              <div style={{ fontSize:48,marginBottom:10 }}>💔</div>
              <h3 style={{ color:C.text,fontSize:20,fontWeight:900,margin:"0 0 8px" }}>Match törlése</h3>
              <p style={{ color:C.muted,fontSize:13,margin:0 }}>Biztosan törölni szeretnéd a matchet {match.other?.name}-vel? Az összes üzenet elvész.</p>
            </div>
            <button onClick={handleDeleteMatch} style={{ width:"100%",padding:"16px",background:C.accent,border:"none",borderRadius:16,color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:10 }}>Igen, törlöm</button>
            <button onClick={() => setShowDeleteConfirm(false)} style={{ width:"100%",padding:"14px",background:"none",border:`1px solid ${C.border}`,borderRadius:16,color:C.muted,fontSize:15,cursor:"pointer" }}>Mégse</button>
          </div>
        </div>
      )}

      {/* Jelentés modal */}
      {showReportModal && (
        <div style={{ position:"absolute",inset:0,zIndex:100,background:"rgba(8,11,16,0.95)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end" }}>
          <div style={{ width:"100%",background:C.surface,borderRadius:"28px 28px 0 0",padding:"28px 24px 40px",border:`1px solid ${C.border}` }}>
            {reportSent ? (
              <div style={{ textAlign:"center",padding:"20px 0" }}>
                <div style={{ fontSize:48,marginBottom:16 }}>✅</div>
                <h3 style={{ color:C.text,fontSize:20,fontWeight:900,margin:"0 0 8px" }}>Köszönjük!</h3>
                <p style={{ color:C.muted,fontSize:13,margin:"0 0 24px" }}>A jelentést megkaptuk és kivizsgáljuk.</p>
                <button onClick={() => { setShowReportModal(false); setReportSent(false); setReportReason(""); }} style={{ width:"100%",padding:"14px",background:C.card,border:`1px solid ${C.border}`,borderRadius:16,color:C.text,fontSize:15,cursor:"pointer" }}>Bezárás</button>
              </div>
            ) : (
              <>
                <div style={{ textAlign:"center",marginBottom:20 }}>
                  <div style={{ fontSize:48,marginBottom:10 }}>🚩</div>
                  <h3 style={{ color:C.text,fontSize:20,fontWeight:900,margin:"0 0 8px" }}>Felhasználó jelentése</h3>
                  <p style={{ color:C.muted,fontSize:13,margin:0 }}>{match.other?.name} jelentése</p>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:20 }}>
                  {REPORT_REASONS.map(r => (
                    <button key={r} onClick={() => setReportReason(r)} style={{ padding:"13px 16px",borderRadius:13,border:`1px solid ${reportReason===r?C.accent:C.border}`,background:reportReason===r?C.accentSoft:C.card,color:reportReason===r?C.accent:C.text,cursor:"pointer",textAlign:"left",fontSize:14,fontWeight:reportReason===r?700:400 }}>{r}</button>
                  ))}
                </div>
                <button onClick={handleReport} disabled={!reportReason} style={{ width:"100%",padding:"16px",background:reportReason?C.accent:C.card,border:"none",borderRadius:16,color:"#fff",fontSize:16,fontWeight:700,cursor:reportReason?"pointer":"not-allowed",opacity:reportReason?1:0.5,marginBottom:10 }}>Jelentés küldése</button>
                <button onClick={() => { setShowReportModal(false); setReportReason(""); }} style={{ width:"100%",padding:"14px",background:"none",border:`1px solid ${C.border}`,borderRadius:16,color:C.muted,fontSize:15,cursor:"pointer" }}>Mégse</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Másik fél profil modalja */}
      {showOtherProfile && match.other && (
        <div style={{ position:"absolute",inset:0,zIndex:101,background:"rgba(8,11,16,0.97)",backdropFilter:"blur(8px)",display:"flex",flexDirection:"column" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:`1px solid ${C.border}` }}>
            <button onClick={() => { setShowOtherProfile(false); setOtherProfilePhotoIdx(0); }} style={{ background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:20 }}>←</button>
            <span style={{ color:C.text,fontWeight:700,fontSize:16 }}>{match.other.name}, {match.other.age}</span>
          </div>
          <div style={{ flex:1,overflowY:"auto" }}>
            {/* Fotók */}
            {(() => {
              const photos = match.other.photos||(match.other.photo_url?[match.other.photo_url]:[]);
              return photos.length > 0 ? (
                <div style={{ position:"relative",width:"100%",aspectRatio:"1",background:C.card }}>
                  <img src={photos[otherProfilePhotoIdx]} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt={match.other.name} />
                  {photos.length > 1 && (
                    <>
                      <div style={{ position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4 }}>
                        {photos.map((_,i) => <div key={i} style={{ width:i===otherProfilePhotoIdx?18:5,height:5,borderRadius:3,background:i===otherProfilePhotoIdx?"#fff":"rgba(255,255,255,0.4)",transition:"width 0.2s" }} />)}
                      </div>
                      <button onClick={() => setOtherProfilePhotoIdx(i=>Math.max(0,i-1))} style={{ position:"absolute",left:0,top:0,bottom:0,width:"40%",background:"none",border:"none",cursor:"pointer" }} />
                      <button onClick={() => setOtherProfilePhotoIdx(i=>Math.min(photos.length-1,i+1))} style={{ position:"absolute",right:0,top:0,bottom:0,width:"40%",background:"none",border:"none",cursor:"pointer" }} />
                    </>
                  )}
                </div>
              ) : (
                <div style={{ width:"100%",aspectRatio:"1",background:C.card,display:"flex",alignItems:"center",justifyContent:"center",fontSize:60 }}>👤</div>
              );
            })()}
            <div style={{ padding:"16px 20px",display:"flex",flexDirection:"column",gap:12 }}>
              {match.other.bio && (
                <div style={{ background:C.card,borderRadius:14,padding:"14px",border:`1px solid ${C.border}` }}>
                  <div style={{ color:C.dim,fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:8 }}>Bio</div>
                  <p style={{ color:C.text,fontSize:14,lineHeight:1.6,margin:0 }}>{match.other.bio}</p>
                </div>
              )}
              <GhostScoreBadge score={match.other.ghost_score} />
              {(match.other.interests||[]).length > 0 && (
                <div style={{ background:C.card,borderRadius:14,padding:"14px",border:`1px solid ${C.border}` }}>
                  <div style={{ color:C.dim,fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:10 }}>Érdeklődés</div>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                    {match.other.interests.map(t => <span key={t} style={{ background:C.accentSoft,border:`1px solid ${C.accent}`,borderRadius:20,padding:"5px 11px",fontSize:12,color:C.accent }}>{t}</span>)}
                  </div>
                </div>
              )}
              {(match.other.looking_for||match.other.height||match.other.education) && (
                <div style={{ background:C.card,borderRadius:14,padding:"14px",border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8 }}>
                  {match.other.looking_for && <div style={{ color:C.muted,fontSize:13 }}>💍 {match.other.looking_for}</div>}
                  {match.other.height && <div style={{ color:C.muted,fontSize:13 }}>📏 {match.other.height} cm</div>}
                  {match.other.education && <div style={{ color:C.muted,fontSize:13 }}>🎓 {match.other.education}</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fejléc */}
      <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:`1px solid ${C.border}`,background:C.surface }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:20 }}>←</button>
        <div onClick={() => { setShowOtherProfile(true); setOtherProfilePhotoIdx(0); }} style={{ display:"flex",alignItems:"center",gap:12,flex:1,cursor:"pointer" }}>
          <img src={match.other?.photo_url||`https://i.pravatar.cc/300?u=${match.other?.id}`} style={{ width:38,height:38,borderRadius:"50%",objectFit:"cover" }} alt={match.other?.name} />
          <div style={{ flex:1 }}>
            <div style={{ color:C.text,fontWeight:700 }}>{match.other?.name}</div>
            {(() => {
              const lastSeen = match.other?.last_seen;
              const diffMin = lastSeen ? Math.floor((Date.now()-new Date(lastSeen).getTime())/60000) : null;
              const isOnline = diffMin !== null && diffMin < 5;
              const label = diffMin === null ? "Inaktív" : isOnline ? "Online" : diffMin < 60 ? `Aktív ${diffMin} perce` : diffMin < 1440 ? `Aktív ${Math.floor(diffMin/60)} órája` : "Régen aktív";
              return <div style={{ color: isOnline ? C.green : C.dim, fontSize:11 }}>● {label} · Profil megtekintése</div>;
            })()}
          </div>
        </div>
        <div style={{ position:"relative" }}>
          <button onClick={() => setShowMenu(m=>!m)} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:22,padding:"4px 8px",lineHeight:1 }}>⋮</button>
          {showMenu && (
            <div style={{ position:"absolute",right:0,top:"110%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",zIndex:50,minWidth:180,boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
              <button onClick={() => { setShowMenu(false); setShowReportModal(true); }} style={{ width:"100%",padding:"14px 16px",background:"none",border:"none",borderBottom:`1px solid ${C.border}`,color:C.yellow,cursor:"pointer",textAlign:"left",fontSize:14,display:"flex",alignItems:"center",gap:10 }}>🚩 Felhasználó jelentése</button>
              <button onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }} style={{ width:"100%",padding:"14px 16px",background:"none",border:"none",color:C.accent,cursor:"pointer",textAlign:"left",fontSize:14,display:"flex",alignItems:"center",gap:10 }}>💔 Match törlése</button>
            </div>
          )}
        </div>
      </div>

      {/* Üzenetek */}
      <div style={{ flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:8 }} onClick={() => { setShowMenu(false); setShowEmojiPicker(false); }}>
        {loading && <div style={{ textAlign:"center",paddingTop:20 }}><Spinner /></div>}
        {msgs.map(m => (
          <div key={m.id} style={{ display:"flex",justifyContent:m.sender_id===myId?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"72%",padding:"10px 14px",borderRadius:m.sender_id===myId?"18px 18px 4px 18px":"18px 18px 18px 4px",background:m.sender_id===myId?`linear-gradient(135deg,${C.accent},#ff8c42)`:C.card,color:"#fff",fontSize:14 }}>
              {m.voice_url ? (
                <VoicePlayer src={m.voice_url} isMine={m.sender_id===myId} />
              ) : m.text}
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:4,textAlign:"right" }}>{timeLabel(m.created_at)}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div style={{ borderTop:`1px solid ${C.border}`,background:C.surface,flexShrink:0 }}>
          <div style={{ display:"flex",overflowX:"auto",padding:"8px 12px 0",gap:4,borderBottom:`1px solid ${C.border}` }}>
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button key={i} onClick={() => setEmojiCategory(i)} style={{ flexShrink:0,padding:"6px 10px",borderRadius:10,border:"none",background:emojiCategory===i?C.accentSoft:"none",fontSize:18,cursor:"pointer",opacity:emojiCategory===i?1:0.5 }} title={cat.name}>
                {cat.label}
              </button>
            ))}
          </div>
          <div style={{ display:"flex",flexWrap:"wrap",padding:"8px",maxHeight:180,overflowY:"auto" }}>
            {EMOJI_CATEGORIES[emojiCategory].emojis.map((e, i) => (
              <button key={i} onClick={() => insertEmoji(e)} style={{ background:"none",border:"none",fontSize:24,cursor:"pointer",padding:"4px 5px",borderRadius:8,lineHeight:1 }}>
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input sor */}
      <div style={{ display:"flex",gap:8,padding:"10px 12px",borderTop:`1px solid ${C.border}`,alignItems:"center",background:C.surface,userSelect:"none",WebkitUserSelect:"none" }}>
        {(match.other?.voice_only || myVoiceOnly) ? (
          // HANG ÜZENET MÓD
          <>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, background:C.card, borderRadius:24, padding:"10px 16px", border:`1px solid ${isRecording?"rgba(255,92,92,0.5)":C.border}` }}>
              <div style={{ fontSize:18 }}>🎙️</div>
              {isRecording ? (
                <div style={{ flex:1, display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:C.accent, animation:"pulse 1s infinite" }} />
                  <span style={{ color:C.accent, fontSize:13, fontWeight:600 }}>
                    {Math.floor(recordingTime/60).toString().padStart(2,"0")}:{(recordingTime%60).toString().padStart(2,"0")}
                  </span>
                  <span style={{ color:C.muted, fontSize:12 }}>Felvétel...</span>
                </div>
              ) : (
                <span style={{ color:C.dim, fontSize:13 }}>Ez a személy csak hangüzenetet fogad</span>
              )}
            </div>
            <button
              onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);startRecording();}}
              onPointerUp={e=>{e.preventDefault();stopRecording();}}
              onPointerCancel={e=>{e.preventDefault();stopRecording();}}
              onPointerLeave={e=>{if(isRecording){e.preventDefault();stopRecording();}}}
              onClick={e=>{e.preventDefault();e.stopPropagation();}}
              style={{ width:48,height:48,borderRadius:"50%",background:isRecording?`linear-gradient(135deg,${C.accent},#ff8c42)`:"rgba(255,92,92,0.15)",border:`2px solid ${isRecording?C.accent:"rgba(255,92,92,0.3)"}`,fontSize:22,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",userSelect:"none",WebkitUserSelect:"none",touchAction:"none" }}>
              🎙️
            </button>
          </>
        ) : (
          // NORMÁL MÓD
          <>
            <button onClick={() => setShowEmojiPicker(p => !p)} style={{ width:38,height:38,borderRadius:"50%",background:showEmojiPicker?C.accentSoft:C.card,border:`1px solid ${showEmojiPicker?C.accent:C.border}`,fontSize:20,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
              {showEmojiPicker ? "✕" : "🙂"}
            </button>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} onFocus={() => setShowEmojiPicker(false)} placeholder="Írj üzenetet..." style={{ flex:1,padding:"12px 16px",borderRadius:24,background:C.card,border:`1px solid ${C.border}`,color:C.text,fontSize:14,outline:"none" }} />
            {input.trim() ? (
              <button onClick={send} style={{ width:42,height:42,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},#ff8c42)`,border:"none",color:"#fff",fontSize:18,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>→</button>
            ) : (
              <button
                onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);startRecording();}}
                onPointerUp={e=>{e.preventDefault();stopRecording();}}
                onPointerCancel={e=>{e.preventDefault();stopRecording();}}
                onPointerLeave={e=>{if(isRecording){e.preventDefault();stopRecording();}}}
                onClick={e=>{e.preventDefault();e.stopPropagation();}}
                style={{ width:42,height:42,borderRadius:"50%",background:isRecording?`linear-gradient(135deg,${C.accent},#ff8c42)`:"rgba(255,92,92,0.12)",border:`1px solid ${isRecording?C.accent:"rgba(255,92,92,0.3)"}`,fontSize:20,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",userSelect:"none",WebkitUserSelect:"none",touchAction:"none" }}>
                {isRecording ? "⏹️" : "🎙️"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── PROFIL ─────────────────────────────────────────────
function ProfileScreen({ myProfile, setMyProfile, isPro, boostActive, boostAvailable, onBoost, onBuyBoost, onUpgrade, onSignOut, onDeleteAccount }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [draft, setDraft] = useState({ name: myProfile?.name||"", bio: myProfile?.bio||"", height: myProfile?.height||170, education: myProfile?.education||"", smoking: myProfile?.smoking||"", looking_for: myProfile?.looking_for||"" });

  const save = async () => {
    setSaving(true);
    const { data } = await supabase.from("profiles").update(draft).eq("id", myProfile.id).select().single();
    if (data) setMyProfile(p=>({...p,...data}));
    setSaving(false); setEditing(false);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const currentPhotos = myProfile?.photos || (myProfile?.photo_url ? [myProfile.photo_url] : []);
    if (currentPhotos.length + files.length > 6) { setUploadError("Max 6 kép!"); return; }
    setUploadError(""); setUploading(true);
    try {
      const newUrls = [];
      const { data: { session } } = await supabase.auth.getSession();
      for (let i = 0; i < files.length; i++) {
        const file = files[i]; const ext = file.name.split(".").pop();
        const path = `${myProfile.id}/photo_${Date.now()}_${i}.${ext}`;
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        const url = urlData.publicUrl + "?t=" + Date.now();

        // KEPMODERACIO (Sightengine)
        try {
          // Varunk 1.5 masodpercet hogy a Storage URL elerhetove valjon
          await new Promise(r => setTimeout(r, 1500));
          const modRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderate-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
            body: JSON.stringify({ photo_url: urlData.publicUrl, user_id: myProfile.id, path }),
          });
          const modData = await modRes.json();
          console.log("Moderacio eredmeny:", modData);
          if (!modData.approved) {
            await supabase.storage.from("avatars").remove([path]);
            setUploadError("❌ A kép nem megfelelő tartalom miatt elutasítva!");
            setUploading(false);
            return;
          }
        } catch (modErr) {
          console.warn("Moderacio hiba:", modErr);
        }
        // KEPMODERACIO VEGE

        newUrls.push(url);
      }
      const updatedPhotos = [...currentPhotos, ...newUrls].slice(0, 6);
      const photo_url = updatedPhotos[0];
      const { data } = await supabase.from("profiles").update({ photo_url, photos: updatedPhotos }).eq("id", myProfile.id).select().single();
      if (data) setMyProfile(p=>({...p, photo_url, photos: updatedPhotos}));
    } catch (err) { setUploadError("Hiba: " + err.message); } finally { setUploading(false); }
  };

  const handlePhotoDelete = async (idx) => {
    const currentPhotos = myProfile?.photos || [];
    const updatedPhotos = currentPhotos.filter((_, i) => i !== idx);
    const photo_url = updatedPhotos[0] || null;
    const { data } = await supabase.from("profiles").update({ photo_url, photos: updatedPhotos }).eq("id", myProfile.id).select().single();
    if (data) setMyProfile(p=>({...p, photo_url, photos: updatedPhotos}));
  };

  return (
    <div style={{ flex:1,overflowY:"auto", position:"relative" }}>

      {showDeleteConfirm && (
        <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(8,11,16,0.92)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div style={{ background:C.card, borderRadius:20, padding:28, border:"1px solid rgba(255,92,92,0.3)", maxWidth:340, width:"100%" }}>
            <div style={{ fontSize:32, textAlign:"center", marginBottom:16 }}>⚠️</div>
            <div style={{ color:C.text, fontWeight:700, fontSize:18, textAlign:"center", marginBottom:10 }}>Fiók törlése</div>
            <div style={{ color:C.muted, fontSize:13, textAlign:"center", lineHeight:1.6, marginBottom:24 }}>Ez véglegesen törli a profilodat, matchjeidet, üzeneteidet és minden adatodat. Ez nem vonható vissza.</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex:1, padding:"14px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, color:C.text, fontSize:14, cursor:"pointer", fontWeight:600 }}>Mégsem</button>
              <button onClick={onDeleteAccount} style={{ flex:1, padding:"14px", background:"rgba(255,92,92,0.15)", border:"1px solid rgba(255,92,92,0.4)", borderRadius:14, color:"#ff5c5c", fontSize:14, cursor:"pointer", fontWeight:700 }}>Törlés</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ padding:"16px 20px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1 }}>Fotók ({(myProfile?.photos||[myProfile?.photo_url].filter(Boolean)).length}/6)</span>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <button onClick={onSignOut} style={{ background:"none", border:"none", color:C.dim, cursor:"pointer", fontSize:12 }}>Kilépés</button>
            <button onClick={() => setShowDeleteConfirm(true)} style={{ background:"none", border:"none", color:"rgba(255,92,92,0.5)", cursor:"pointer", fontSize:12 }}>Fiók törlése</button>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:6 }}>
          {(myProfile?.photos||(myProfile?.photo_url?[myProfile.photo_url]:[])).map((url, idx) => (
            <div key={idx} style={{ position:"relative", aspectRatio:"1", borderRadius:12, overflow:"hidden", background:C.card }}>
              <img src={url} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={`Fotó ${idx+1}`} />
              {idx === 0 && <div style={{ position:"absolute", top:4, left:4, background:C.accent, borderRadius:6, padding:"2px 6px", fontSize:10, color:"#fff", fontWeight:700 }}>Fő</div>}
              <button onClick={() => handlePhotoDelete(idx)} style={{ position:"absolute", top:4, right:4, width:22, height:22, borderRadius:"50%", background:"rgba(8,11,16,0.8)", border:"none", color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
            </div>
          ))}
          {(myProfile?.photos||(myProfile?.photo_url?[myProfile.photo_url]:[])).length < 6 && (
            <label style={{ aspectRatio:"1", borderRadius:12, background:C.card, border:`2px dashed ${C.border}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", gap:4 }}>
              {uploading ? <Spinner /> : <><span style={{ fontSize:24 }}>+</span><span style={{ color:C.dim, fontSize:10 }}>Fotó</span></>}
              <input type="file" accept="image/*" multiple style={{ display:"none" }} onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          )}
        </div>
        {uploadError && <div style={{ marginTop:8, color:C.accent, fontSize:12 }}>{uploadError}</div>}
      </div>
      <div style={{ padding:"16px 20px" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
          <div><div style={{ color:C.text,fontWeight:800,fontSize:20 }}>{myProfile?.name}</div><div style={{ color:C.muted,fontSize:13 }}>{myProfile?.is_founder?"🚀 Founder":"NearMatch"}</div></div>
          <button onClick={() => { if(editing) save(); else setEditing(true); }} style={{ background:editing?`linear-gradient(135deg,${C.accent},#ff8c42)`:C.card,border:`1px solid ${editing?C.accent:C.border}`,borderRadius:12,color:editing?"#fff":C.text,padding:"8px 16px",cursor:"pointer",fontWeight:600,fontSize:13 }}>
            {saving?<Spinner />:editing?"✓ Mentés":"✏️ Szerkesztés"}
          </button>
        </div>
        {!editing && boostAvailable && (
          <button onClick={onBoost} style={{ width:"100%",padding:"14px 16px",background:"linear-gradient(135deg,rgba(255,212,59,0.12),rgba(255,140,66,0.12))",border:"1px solid rgba(255,212,59,0.35)",borderRadius:16,cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left",marginBottom:8 }}>
            <div style={{ fontSize:26 }}>⚡</div><div style={{ flex:1 }}><div style={{ color:C.yellow,fontWeight:700,fontSize:14 }}>Kiemelés használata</div><div style={{ color:C.dim,fontSize:12 }}>10 percig előre kerülsz • Heti 1 db ingyen</div></div>
          </button>
        )}
        {!editing && isPro && !boostAvailable && !boostActive && (
          <div style={{ width:"100%",padding:"14px 16px",background:C.card,border:`1px solid ${C.border}`,borderRadius:16,display:"flex",alignItems:"center",gap:12,marginBottom:8,opacity:0.7 }}>
            <div style={{ fontSize:26 }}>⚡</div><div style={{ flex:1 }}><div style={{ color:C.muted,fontWeight:700,fontSize:14 }}>Heti ingyenes kiemelés felhasználva</div><div style={{ color:C.dim,fontSize:12 }}>Jövő héten újra jár • vagy vegyél egyet most</div></div>
          </div>
        )}
        {!editing && !boostActive && (
          <button onClick={onBuyBoost} style={{ width:"100%",padding:"14px 16px",background:"linear-gradient(135deg,rgba(255,140,66,0.12),rgba(255,92,92,0.12))",border:"1px solid rgba(255,140,66,0.35)",borderRadius:16,cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left",marginBottom:8 }}>
            <div style={{ fontSize:26 }}>🚀</div><div style={{ flex:1 }}><div style={{ color:C.orange,fontWeight:700,fontSize:14 }}>Kiemelés vásárlása</div><div style={{ color:C.dim,fontSize:12 }}>10 perc extra kiemelés • 990 Ft</div></div>
            <div style={{ color:C.orange,fontSize:12,fontWeight:700 }}>990 Ft</div>
          </button>
        )}
        {!editing && boostActive && (
          <div style={{ width:"100%",padding:"14px 16px",background:"linear-gradient(135deg,rgba(255,212,59,0.15),rgba(255,140,66,0.15))",border:"1px solid rgba(255,212,59,0.5)",borderRadius:16,display:"flex",alignItems:"center",gap:12,marginBottom:8 }}>
            <div style={{ fontSize:26 }}>⚡</div><div style={{ flex:1 }}><div style={{ color:C.yellow,fontWeight:700,fontSize:14 }}>Kiemelés aktív!</div><div style={{ color:C.dim,fontSize:12 }}>Most előre kerülsz a listákon</div></div>
            <div style={{ width:10,height:10,borderRadius:"50%",background:C.yellow,boxShadow:`0 0 8px ${C.yellow}`,animation:"pulse 1.5s ease-in-out infinite" }} />
          </div>
        )}

        {/* Hang üzenet mód */}
        {!editing && (isPro ? (
          <div onClick={async () => {
            const newVal = !myProfile?.voice_only;
            await supabase.from("profiles").update({ voice_only: newVal }).eq("id", myProfile.id);
            setMyProfile(p => ({ ...p, voice_only: newVal }));
          }} style={{ display:"flex", alignItems:"center", gap:12, background: myProfile?.voice_only ? "rgba(255,140,66,0.1)" : C.card, border: `1px solid ${myProfile?.voice_only ? "rgba(255,140,66,0.4)" : C.border}`, borderRadius:16, padding:"14px 16px", cursor:"pointer", marginBottom:8 }}>
            <div style={{ fontSize:26 }}>🎙️</div>
            <div style={{ flex:1 }}>
              <div style={{ color: myProfile?.voice_only ? "#ff8c42" : C.text, fontWeight:700, fontSize:14 }}>Hang üzenet mód {myProfile?.voice_only ? "BE" : "KI"}</div>
              <div style={{ color:C.dim, fontSize:12 }}>Csak hangüzenettel lehet neked írni</div>
            </div>
            <div style={{ width:44, height:24, borderRadius:12, background: myProfile?.voice_only ? "#ff8c42" : "rgba(240,244,255,0.15)", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
              <div style={{ position:"absolute", top:2, left: myProfile?.voice_only ? 22 : 2, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }} />
            </div>
          </div>
        ) : (
          <div onClick={onUpgrade} style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,212,59,0.05)", border:"1px solid rgba(255,212,59,0.2)", borderRadius:16, padding:"14px 16px", cursor:"pointer", marginBottom:8 }}>
            <div style={{ fontSize:26 }}>🎙️</div>
            <div style={{ flex:1 }}>
              <div style={{ color:C.yellow, fontWeight:700, fontSize:14 }}>Hang üzenet mód <span style={{ fontSize:11, background:"rgba(255,212,59,0.15)", borderRadius:6, padding:"2px 6px" }}>PRO</span></div>
              <div style={{ color:C.dim, fontSize:12 }}>Csak hangüzenettel lehet neked írni</div>
            </div>
            <div style={{ color:C.yellow, fontSize:12, fontWeight:600 }}>Upgrade →</div>
          </div>
        ))}

        {/* Inkognito mód */}
        {!editing && (isPro ? (
          <div onClick={async () => {
            const newVal = !myProfile?.is_incognito;
            await supabase.from("profiles").update({ is_incognito: newVal }).eq("id", myProfile.id);
            setMyProfile(p => ({ ...p, is_incognito: newVal }));
          }} style={{ display:"flex", alignItems:"center", gap:12, background: myProfile?.is_incognito ? "rgba(77,171,247,0.1)" : C.card, border: `1px solid ${myProfile?.is_incognito ? "rgba(77,171,247,0.4)" : C.border}`, borderRadius:16, padding:"14px 16px", cursor:"pointer", marginBottom:16 }}>
            <div style={{ fontSize:26 }}>🕵️</div>
            <div style={{ flex:1 }}>
              <div style={{ color: myProfile?.is_incognito ? "#4dabf7" : C.text, fontWeight:700, fontSize:14 }}>Inkognito mód {myProfile?.is_incognito ? "BE" : "KI"}</div>
              <div style={{ color:C.dim, fontSize:12 }}>Csak akiket likeoltál látnak a Radaron és Swipe-on</div>
            </div>
            <div style={{ width:44, height:24, borderRadius:12, background: myProfile?.is_incognito ? "#4dabf7" : "rgba(240,244,255,0.15)", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
              <div style={{ position:"absolute", top:2, left: myProfile?.is_incognito ? 22 : 2, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }} />
            </div>
          </div>
        ) : (
          <div onClick={onUpgrade} style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,212,59,0.05)", border:"1px solid rgba(255,212,59,0.2)", borderRadius:16, padding:"14px 16px", cursor:"pointer", marginBottom:16 }}>
            <div style={{ fontSize:26 }}>🕵️</div>
            <div style={{ flex:1 }}>
              <div style={{ color:C.yellow, fontWeight:700, fontSize:14 }}>Inkognito mód <span style={{ fontSize:11, background:"rgba(255,212,59,0.15)", borderRadius:6, padding:"2px 6px" }}>PRO</span></div>
              <div style={{ color:C.dim, fontSize:12 }}>Csak akiket likeoltál látnak a Radaron és Swipe-on</div>
            </div>
            <div style={{ color:C.yellow, fontSize:12, fontWeight:600 }}>Upgrade →</div>
          </div>
        ))}
        {editing ? (
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <div><label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6 }}>Név</label><input value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} style={{ width:"100%",padding:"12px 14px",borderRadius:12,background:C.card,border:`1px solid ${C.border}`,color:C.text,fontSize:15,outline:"none" }} /></div>
            <div><label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6 }}>Bio</label><textarea value={draft.bio} onChange={e => {
                  const val = e.target.value;
                  const filtered = val.replace(/(@[\w.]+|instagram\.com\/[\w.]+|ig:\s*[\w.]+|insta:\s*[\w.]+|fb\.com\/[\w.]+|tiktok\.com\/[\w.]+|snapchat:\s*[\w.]+)/gi, "");
                  setDraft(d=>({...d,bio:filtered}));
                }} style={{ width:"100%",padding:"12px 14px",borderRadius:12,background:C.card,border:`1px solid ${C.border}`,color:C.text,fontSize:14,outline:"none",resize:"none",minHeight:80,lineHeight:1.6 }} /></div>
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}><label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1 }}>📏 Magasság</label><span style={{ color:C.accent,fontWeight:700,fontSize:13 }}>{draft.height} cm</span></div>
              <input type="range" min={135} max={230} step={1} value={draft.height} onChange={e=>setDraft(d=>({...d,height:+e.target.value}))} style={{ width:"100%" }} />
            </div>
            <div>
              <label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8 }}>🎓 Végzettség</label>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>{EDU_OPTIONS.map(opt => (<button key={opt} onClick={() => setDraft(d=>({...d,education:opt}))} style={{ padding:"7px 12px",borderRadius:20,fontSize:12,cursor:"pointer",border:`1px solid ${draft.education===opt?C.accent:C.border}`,background:draft.education===opt?C.accentSoft:C.card,color:draft.education===opt?C.accent:C.muted }}>{opt}</button>))}</div>
            </div>
            <div>
              <label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8 }}>🚬 Dohányzás</label>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>{SMOKING_OPTIONS.map(opt => (<button key={opt} onClick={() => setDraft(d=>({...d,smoking:opt}))} style={{ padding:"7px 12px",borderRadius:20,fontSize:12,cursor:"pointer",border:`1px solid ${draft.smoking===opt?C.accent:C.border}`,background:draft.smoking===opt?C.accentSoft:C.card,color:draft.smoking===opt?C.accent:C.muted }}>{opt}</button>))}</div>
            </div>
            <div>
              <label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8 }}>💍 Mit keresel?</label>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>{LOOKING_FOR_OPTIONS.map(x => (<button key={x.l} onClick={() => setDraft(d=>({...d,looking_for:d.looking_for===x.l?"":x.l}))} style={{ padding:"7px 12px",borderRadius:20,fontSize:12,cursor:"pointer",border:`1px solid ${draft.looking_for===x.l?C.accent:C.border}`,background:draft.looking_for===x.l?C.accentSoft:C.card,color:draft.looking_for===x.l?C.accent:C.muted }}>{x.i} {x.l}</button>))}</div>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            <div style={{ background:C.card,borderRadius:14,padding:"14px",border:`1px solid ${C.border}` }}>
              <div style={{ color:C.dim,fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:8 }}>Bio</div>
              <p style={{ color:C.text,fontSize:14,lineHeight:1.6,margin:0 }}>{myProfile?.bio||"Nincs még bio!"}</p>
            </div>
            {!isPro && (
              <button onClick={onUpgrade} style={{ width:"100%",padding:"14px",background:"linear-gradient(135deg,rgba(255,212,59,0.08),rgba(255,140,66,0.08))",border:"1px solid rgba(255,212,59,0.3)",borderRadius:16,cursor:"pointer",display:"flex",alignItems:"center",gap:12 }}>
                <span style={{ fontSize:24 }}>⚡</span>
                <div style={{ flex:1, textAlign:"left" }}><div style={{ color:C.yellow,fontWeight:700 }}>Upgrade Pro-ra</div><div style={{ color:C.dim,fontSize:12 }}>Látod ki lájkolt • Radar like • 10 match</div></div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MATCH OVERLAY ──────────────────────────────────────
function MatchOverlay({ user, onMessage, onClose }) {
  return (
    <div style={{ position:"absolute",inset:0,background:"rgba(8,11,16,0.92)",backdropFilter:"blur(8px)",zIndex:80,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px" }}>
      <div style={{ fontSize:60,marginBottom:16,animation:"pulse 1s infinite" }}>🎉</div>
      <h2 style={{ fontSize:32,fontWeight:900,color:C.text,margin:"0 0 8px",fontFamily:"Georgia,serif" }}>Egymásra találtatok!</h2>
      <p style={{ color:C.muted,marginBottom:24 }}>Te és {user.name} egymásra találtatok!</p>
      <img src={user.photo_url||`https://i.pravatar.cc/300?u=${user.id}`} style={{ width:90,height:90,borderRadius:"50%",objectFit:"cover",border:`3px solid ${C.accent}`,marginBottom:28 }} alt={user.name} />
      <button onClick={onMessage} style={{ width:"100%",padding:"16px",background:`linear-gradient(135deg,${C.accent},#ff8c42)`,border:"none",borderRadius:16,color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:10 }}>💬 Üzenet küldése</button>
      <button onClick={onClose} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:15 }}>Folytatom a böngészést</button>
    </div>
  );
}

// ── APP ────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [appState, setAppState] = useState("loading");
  const [tab, setTab] = useState("radar");
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [swipeUsers, setSwipeUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [matchOverlay, setMatchOverlay] = useState(null);
  const [inAppToast, setInAppToast] = useState(null);
  const toastTimerRef = useRef(null);
  const [nearbyAlert, setNearbyAlert] = useState(null);
  const nearbyAlertTimerRef = useRef(null);
  const lastNearbyCheckRef = useRef({});

  const showInAppToast = (match, text) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setInAppToast({ match, text });
    toastTimerRef.current = setTimeout(() => setInAppToast(null), 4000);
  };
  const [myLocation, setMyLocation] = useState(() => {
    const cached = localStorage.getItem("myLocation");
    return cached ? JSON.parse(cached) : null;
  });
  const [boostActive, setBoostActive] = useState(() => {
    const boostEnd = localStorage.getItem("boostEnd");
    if (boostEnd && Date.now() < parseInt(boostEnd)) return true;
    return false;
  });
  const boostTimerRef = useRef(null);

  useEffect(() => {
    const boostEnd = localStorage.getItem("boostEnd");
    if (boostEnd) {
      const remaining = parseInt(boostEnd) - Date.now();
      if (remaining > 0) {
        boostTimerRef.current = setTimeout(() => { setBoostActive(false); localStorage.removeItem("boostEnd"); }, remaining);
      } else {
        setBoostActive(false);
        localStorage.removeItem("boostEnd");
      }
    }
    return () => { if (boostTimerRef.current) clearTimeout(boostTimerRef.current); };
  }, []);
  const [lastBoostWeek, setLastBoostWeek] = useState(() => { const s = localStorage.getItem("lastBoostWeek"); return s ? parseInt(s) : null; });
  const [newLikesCount, setNewLikesCount] = useState(0);

  const getWeekNumber = () => { const d=new Date(); const oneJan=new Date(d.getFullYear(),0,1); return Math.ceil(((d-oneJan)/86400000+oneJan.getDay()+1)/7); };
  const isPro = myProfile?.is_pro||false;
  const boostAvailable = isPro && lastBoostWeek!==getWeekNumber() && !boostActive;
  console.log("BOOST DEBUG: isPro=", isPro, "is_pro=", myProfile?.is_pro, "lastBoostWeek=", lastBoostWeek, "currentWeek=", getWeekNumber(), "boostActive=", boostActive, "available=", boostAvailable);
  const handleBoost = () => { if(!boostAvailable) return; const w = getWeekNumber(); const end = Date.now() + 10*60*1000; setBoostActive(true); setLastBoostWeek(w); localStorage.setItem("lastBoostWeek", w); localStorage.setItem("boostEnd", end); if(boostTimerRef.current) clearTimeout(boostTimerRef.current); boostTimerRef.current = setTimeout(()=>{ setBoostActive(false); localStorage.removeItem("boostEnd"); }, 10*60*1000); };

  const handleBuyBoost = async () => {
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${s?.access_token}` },
        body: JSON.stringify({ price_id: STRIPE_BOOST_PRICE_ID, success_url: window.location.origin+"?boost=success", cancel_url: window.location.origin+"?boost=cancel", mode: "payment" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) { console.error(err); }
  };

  const handleUpgrade = async () => {
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${s?.access_token}` },
        body: JSON.stringify({ price_id: STRIPE_PRICE_ID, success_url: window.location.origin+"?pro=success", cancel_url: window.location.origin+"?pro=cancel" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pro") === "success") { setMyProfile(p => p ? {...p, is_pro: true} : p); window.history.replaceState({}, "", window.location.pathname); }
    if (params.get("boost") === "success") { const end = Date.now() + 10*60*1000; setBoostActive(true); localStorage.setItem("boostEnd", end); setTimeout(()=>{ setBoostActive(false); localStorage.removeItem("boostEnd"); }, 10*60*1000); window.history.replaceState({}, "", window.location.pathname); }
    if (params.get("reveal") === "success" && session?.user?.id) {
      const cardId = localStorage.getItem(`pendingReveal_${session.user.id}`);
      if (cardId) {
        supabase.from("compliment_cards").update({ revealed: true, revealed_at: new Date().toISOString() }).eq("id", cardId).then(() => {
          localStorage.removeItem(`pendingReveal_${session.user.id}`);
          // Sikeres felfedés után jelezzük a usernek
          localStorage.setItem(`revealJustPurchased_${session.user.id}`, cardId);
        });
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setAppState("auth");
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setMyProfile(null); setAppState("auth"); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) {
      setMyProfile(data);
      setAppState("main");
      registerOneSignalUser(userId);
      loadNewLikesCount(userId);
    } else {
      setAppState("onboarding");
    }
  };

  const loadNewLikesCount = async (userId) => {
    const { data: swipes } = await supabase.from("swipes").select("swiper_id").eq("swiped_id", userId).in("action", ["like","superlike"]);
    const { data: matches } = await supabase.from("matches").select("user1_id, user2_id").or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    const matchedIds = new Set((matches||[]).map(m => m.user1_id===userId ? m.user2_id : m.user1_id));
    // Azokat is kiszűrjük akiket már mi swipe-oltunk
    const { data: mySwipes } = await supabase.from("swipes").select("swiped_id").eq("swiper_id", userId);
    const mySwipedIds = new Set((mySwipes||[]).map(s => s.swiped_id));
    const count = (swipes||[]).filter(s => !matchedIds.has(s.swiper_id) && !mySwipedIds.has(s.swiper_id)).length;
    setNewLikesCount(count);
  };

  useEffect(() => {
    if (appState !== "main") return;
    const updateLocation = async () => {
      try {
        const pos = await new Promise((res,rej) => navigator.geolocation.getCurrentPosition(res,rej,{timeout:8000}));
        const { latitude:lat, longitude:lng } = pos.coords;
        setMyLocation({ lat, lng });
        localStorage.setItem("myLocation", JSON.stringify({ lat, lng }));
        await supabase.from("profiles").update({ lat, lng, last_seen:new Date().toISOString() }).eq("id", session.user.id);

        // "Közel voltunk" ellenőrzés – 1km-en belüli aktív userek
        try {
          const { data: nearby } = await supabase.from("profiles")
            .select("id, name, photo_url, lat, lng, last_seen")
            .neq("id", session.user.id);

          if (nearby) {
            // Már swipe-olt vagy matchelt userek kizárása
            const { data: mySwipes } = await supabase.from("swipes").select("swiped_id").eq("swiper_id", session.user.id);
            const { data: myMatches } = await supabase.from("matches").select("user1_id,user2_id").or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`);
            const swipedIds = new Set((mySwipes||[]).map(s => s.swiped_id));
            const matchedIds = new Set((myMatches||[]).flatMap(m => [m.user1_id, m.user2_id]));

            for (const u of nearby) {
              if (!u.lat || !u.lng) continue;
              if (swipedIds.has(u.id) || matchedIds.has(u.id)) continue;
              // Csak ha aktív az elmúlt 15 percben
              if (!u.last_seen || (Date.now() - new Date(u.last_seen).getTime()) > 15*60*1000) continue;
              const dist = distanceKm(lat, lng, u.lat, u.lng);
              if (dist <= 1) {
                // Csak ha még nem mutattuk meg ezt a usert az elmúlt 30 percben
                const lastShown = lastNearbyCheckRef.current[u.id] || 0;
                if (Date.now() - lastShown < 30*60*1000) continue;
                lastNearbyCheckRef.current[u.id] = Date.now();
                if (nearbyAlertTimerRef.current) clearTimeout(nearbyAlertTimerRef.current);
                setNearbyAlert({ user: u, dist: Math.round(dist * 1000) });
                nearbyAlertTimerRef.current = setTimeout(() => setNearbyAlert(null), 6000);
                break; // Egyszerre csak 1 értesítés
              }
            }
          }
        } catch {}
      } catch {}
    };
    updateLocation();
    const interval = setInterval(updateLocation, 60000);
    return () => clearInterval(interval);
  }, [appState, session]);

  const loadNearby = useCallback(async () => {
    if (!myLocation || !session) return;
    // Inkognito usereket nem töltjük be (hacsak nem likeoltak minket)
    const { data: likedUsSwipes } = await supabase.from("swipes").select("swiper_id").eq("swiped_id", session.user.id).in("action",["like","superlike"]);
    const likedUsIds = new Set((likedUsSwipes||[]).map(s => s.swiper_id));
    const { data } = await supabase.from("profiles").select("*").neq("id", session.user.id);
    if (!data) return;
    const swipeExpiry = new Date(); swipeExpiry.setDate(swipeExpiry.getDate() - 20);
    const { data:swipedData } = await supabase.from("swipes").select("swiped_id").eq("swiper_id", session.user.id).gte("created_at", swipeExpiry.toISOString());
    const swipedIds = new Set((swipedData||[]).map(s=>s.swiped_id));
    const withDist = data.filter(u => {
      if (!u.lat || !u.lng) return false;
      if (swipedIds.has(u.id)) return false;
      if (!u.last_seen || (Date.now()-new Date(u.last_seen).getTime()) >= 15*60*1000) return false;
      // Inkognito: csak azoknak látszik aki likeolta őket
      if (u.is_incognito && !likedUsIds.has(u.id)) return false;
      return true;
    }).map(u => ({ ...u, distanceKm: distanceKm(myLocation.lat, myLocation.lng, u.lat, u.lng) })).filter(u => u.distanceKm < 20).sort((a,b) => a.distanceKm-b.distanceKm);
    setNearbyUsers(withDist);
    const forSwipe = data.filter(u => {
      if (swipedIds.has(u.id)) return false;
      // Inkognito: swipe-nál sem látszik hacsak nem likeolta a usert
      if (u.is_incognito && !likedUsIds.has(u.id)) return false;
      return true;
    }).map(u => ({ ...u, distanceKm: u.lat&&u.lng&&myLocation ? distanceKm(myLocation.lat,myLocation.lng,u.lat,u.lng) : null }));
    setSwipeUsers(boostActive ? [...forSwipe].sort((a,b)=>(a.distanceKm||99)-(b.distanceKm||99)) : forSwipe);
  }, [myLocation, session, boostActive]);

  useEffect(() => { loadNearby(); }, [loadNearby]);

  const loadMatches = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase.from("matches").select("*, user1:profiles!matches_user1_id_fkey(*), user2:profiles!matches_user2_id_fkey(*)").or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`).order("created_at", { ascending:false });
    if (!data) return;
    const withOther = await Promise.all(data.map(async m => {
      const other = m.user1_id===session.user.id ? m.user2 : m.user1;
      const { data:lastMsg } = await supabase.from("messages").select("text,created_at,voice_url").eq("match_id",m.id).order("created_at",{ascending:false}).limit(1).single();
      const timeLabel = lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString("hu",{hour:"2-digit",minute:"2-digit"}) : "";
      const lastMsgAt = lastMsg?.created_at || m.created_at;
      return { ...m, other, lastMsg:lastMsg?.voice_url ? "🎙️ Hangüzenet" : lastMsg?.text, timeLabel, lastMsgAt };
    }));
    // Legújabb üzenet szerint rendezés
    const sorted = [...withOther].sort((a,b) => new Date(b.lastMsgAt) - new Date(a.lastMsgAt));
    setMatches(sorted);
  }, [session]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  useEffect(() => {
    if (!session) return;
    // Üzenetek realtime – sorrend frissítése + in-app értesítés
    const msgSub = supabase.channel("messages_order")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages" }, async (payload) => {
        loadMatches();
        const msg = payload.new;
        // Csak ha nem mi küldtük és nem a chat van nyitva ezzel a matchel
        if (msg.sender_id !== session?.user?.id) {
          // Megkeressük a match partner adatait
          const { data: matchData } = await supabase.from("matches").select("*, user1:profiles!matches_user1_id_fkey(*), user2:profiles!matches_user2_id_fkey(*)").eq("id", msg.match_id).single();
          if (matchData) {
            const other = matchData.user1_id === session?.user?.id ? matchData.user2 : matchData.user1;
            if (other) showInAppToast({ id: msg.match_id, other }, msg.voice_url ? "🎙️ Hangüzenet" : msg.text);
          }
        }
      }).subscribe();

    const sub = supabase.channel("matches_realtime")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"matches" }, async payload => {
        const m = payload.new;
        if (m.user1_id===session.user.id || m.user2_id===session.user.id) {
          const otherId = m.user1_id===session.user.id ? m.user2_id : m.user1_id;
          const { data:other } = await supabase.from("profiles").select("*").eq("id",otherId).single();
          if (other) {
            setMatchOverlay(other);
            await sendPushNotification(otherId, "🎉 Új match!", `${myProfile?.name||"Valaki"} kedvelt téged!`, { type:"match" });
          }
          loadMatches();
          if (session?.user?.id) loadNewLikesCount(session.user.id);
        }
      }).subscribe();
    return () => { supabase.removeChannel(sub); supabase.removeChannel(msgSub); };
  }, [session, loadMatches, myProfile]);

  // ── CHAT NYITÁS (kártya küldőjével, match nélkül is) ──
  const handleOpenChatWith = async (sender) => {
    if (!sender?.id || !session?.user?.id) return;
    // Van már match?
    let m = matches.find(x => x.other?.id === sender.id);
    if (m) { setActiveChat(m); setTab("matches"); return; }

    // Nincs – keressük a DB-ben
    const myId = session.user.id;
    const { data: existing } = await supabase.from("matches").select("*")
      .or(`and(user1_id.eq.${myId},user2_id.eq.${sender.id}),and(user1_id.eq.${sender.id},user2_id.eq.${myId})`)
      .maybeSingle();

    let matchRow = existing;
    if (!matchRow) {
      // Létrehozunk egy matchet
      const { data: created } = await supabase.from("matches")
        .insert({ user1_id: myId, user2_id: sender.id })
        .select("*").single();
      matchRow = created;
    }
    if (matchRow) {
      const matchObj = { ...matchRow, other: sender, unread: false };
      setActiveChat(matchObj);
      setTab("matches");
      loadMatches();
    }
  };

  // ── JAVÍTOTT HANDLESWIPE ────────────────────────────
  const handleSwipe = async (targetId, action) => {
    if (!session?.user?.id) return;

    // 1. Swipe mentése
    const { error } = await supabase.from("swipes").upsert(
      { swiper_id: session.user.id, swiped_id: targetId, action },
      { onConflict: "swiper_id,swiped_id" }
    );

    if (error) {
      console.error("Swipe hiba:", error);
      return;
    }

    // 2. Ha like vagy superlike: nézzük meg, ő is likedelt-e minket?
    if (action === "like" || action === "superlike") {
      const { data: theirSwipe } = await supabase
        .from("swipes")
        .select("action")
        .eq("swiper_id", targetId)
        .eq("swiped_id", session.user.id)
        .in("action", ["like", "superlike"])
        .maybeSingle();

      if (theirSwipe) {
        // 3. Kölcsönös like → match létrehozása (ha még nincs)
        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id")
          .or(
            `and(user1_id.eq.${session.user.id},user2_id.eq.${targetId}),` +
            `and(user1_id.eq.${targetId},user2_id.eq.${session.user.id})`
          )
          .maybeSingle();

        if (!existingMatch) {
          await supabase.from("matches").insert({
            user1_id: session.user.id,
            user2_id: targetId,
          });

          // 4. Match overlay megjelenítése
          const { data: otherProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", targetId)
            .single();

          if (otherProfile) {
            setMatchOverlay(otherProfile);
            await sendPushNotification(
              targetId,
              "🎉 Új match!",
              `${myProfile?.name || "Valaki"} kedvelt téged!`,
              { type: "match" }
            );
          }
        }
      }
    }

    // 5. UI frissítése
    await loadNearby();
    await loadMatches();
    if (session?.user?.id) loadNewLikesCount(session.user.id);
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) return;
    const uid = session.user.id;
    const { data: myMatches } = await supabase.from("matches").select("id").or(`user1_id.eq.${uid},user2_id.eq.${uid}`);
    const matchIds = (myMatches||[]).map(m => m.id);
    if (matchIds.length > 0) await supabase.from("messages").delete().in("match_id", matchIds);
    await supabase.from("matches").delete().or(`user1_id.eq.${uid},user2_id.eq.${uid}`);
    await supabase.from("swipes").delete().eq("swiper_id", uid);
    await supabase.from("reports").delete().eq("reporter_id", uid);
    await supabase.from("profiles").delete().eq("id", uid);
    await supabase.auth.signOut();
  };
  const unreadCount = matches.filter(m=>m.unread).length;
  const newCardsCount = 0; // realtime frissítés később bővíthető

  if (appState==="loading") return <Shell><div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20 }}><div style={{ width:110,height:110,borderRadius:26,overflow:"hidden",flexShrink:0,animation:"pulse 1.8s ease-in-out infinite" }}><img src="/icon-512.png" alt="NearMatch" style={{ width:"115%",height:"115%",objectFit:"cover",display:"block",marginLeft:"-7.5%",marginTop:"-7.5%" }} /></div><Spinner /></div></Shell>;
  if (appState==="auth") return <Shell><AuthScreen /></Shell>;
  if (appState==="onboarding") return <Shell><Onboarding user={session.user} onComplete={p=>{ setMyProfile(p); setAppState("main"); registerOneSignalUser(p.id); }} /></Shell>;

  return (
    <Shell>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",paddingTop:"calc(12px + env(safe-area-inset-top))",borderBottom:`1px solid ${C.border}`,background:C.surface,flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:22,fontWeight:900,background:`linear-gradient(135deg,${C.accent},#ff8c42)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>NearMatch</span>
          {myProfile?.is_founder && <div style={{ background:"linear-gradient(135deg,#a78bfa,#6366f1)",borderRadius:8,padding:"3px 8px",fontSize:10,color:"#fff",fontWeight:700 }}>FOUNDER</div>}
          {isPro && !myProfile?.is_founder && <div style={{ background:"linear-gradient(135deg,#ffd43b,#ff8c42)",borderRadius:8,padding:"3px 8px",fontSize:10,color:"#000",fontWeight:700 }}>PRO</div>}
        </div>
        {!myLocation && <div style={{ color:C.yellow,fontSize:11 }}>📍 GPS szükséges</div>}
      </div>
      <div style={{ flex:1,overflow:"hidden",display:"flex",flexDirection:"column",position:"relative",minHeight:0 }}>
        {matchOverlay && <MatchOverlay user={matchOverlay} onMessage={() => { const m=matches.find(x=>x.other?.id===matchOverlay.id); setMatchOverlay(null); if(m){setActiveChat(m);setTab("matches");} }} onClose={()=>setMatchOverlay(null)} />}
        {activeChat ? (
          <ChatView match={activeChat} myId={session.user.id} myVoiceOnly={myProfile?.voice_only} onBack={()=>setActiveChat(null)} onMatchDeleted={()=>{ setActiveChat(null); loadMatches(); }} />
        ) : (
          <>
            {/* Közel voltunk értesítő */}
          {nearbyAlert && (
            <div style={{ position:"absolute", top:12, left:12, right:12, zIndex:301, background:"linear-gradient(135deg,rgba(15,21,32,0.98),rgba(20,28,43,0.98))", borderRadius:18, padding:"14px 16px", border:"1px solid rgba(255,92,92,0.3)", boxShadow:"0 8px 32px rgba(255,92,92,0.15)", display:"flex", alignItems:"center", gap:12, animation:"slideDown 0.3s ease" }}>
              <div style={{ position:"relative", flexShrink:0 }}>
                <img src={nearbyAlert.user.photo_url||`https://i.pravatar.cc/300?u=${nearbyAlert.user.id}`} style={{ width:46, height:46, borderRadius:"50%", objectFit:"cover", border:"2px solid rgba(255,92,92,0.5)" }} alt="" />
                <div style={{ position:"absolute", bottom:-2, right:-2, width:16, height:16, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9 }}>📍</div>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:C.text, fontWeight:700, fontSize:13 }}>Közel vagytok egymáshoz!</div>
                <div style={{ color:C.accent, fontSize:12, fontWeight:600 }}>{nearbyAlert.user.name} • {nearbyAlert.dist < 100 ? "<100 m" : `~${nearbyAlert.dist} m`} távolságra</div>
                <div style={{ color:C.dim, fontSize:11, marginTop:2 }}>Nézd meg a profilját a Radar nézetben</div>
              </div>
              <button onClick={() => setNearbyAlert(null)} style={{ background:"none", border:"none", color:C.dim, cursor:"pointer", fontSize:18, flexShrink:0 }}>✕</button>
            </div>
          )}

          {/* In-app üzenet értesítés */}
          {inAppToast && (
            <div onClick={() => { setActiveChat(inAppToast.match); setTab("chat"); setInAppToast(null); }}
              style={{ position:"absolute", top:12, left:12, right:12, zIndex:300, background:C.card, borderRadius:18, padding:"12px 14px", border:`1px solid ${C.border}`, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", display:"flex", alignItems:"center", gap:12, cursor:"pointer", animation:"slideDown 0.3s ease" }}>
              <img src={inAppToast.match.other?.photo_url||`https://i.pravatar.cc/300?u=${inAppToast.match.other?.id}`} style={{ width:42, height:42, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} alt="" />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:C.text, fontWeight:700, fontSize:13 }}>{inAppToast.match.other?.name}</div>
                <div style={{ color:C.muted, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{inAppToast.text}</div>
              </div>
              <button onClick={e=>{e.stopPropagation();setInAppToast(null);}} style={{ background:"none", border:"none", color:C.dim, cursor:"pointer", fontSize:18, flexShrink:0 }}>✕</button>
            </div>
          )}

          {tab==="radar" && <RadarScreen myProfile={myProfile} nearbyUsers={nearbyUsers} isPro={isPro} boostActive={boostActive} onUpgrade={handleUpgrade} onSwipe={handleSwipe} />}
            {tab==="swipe" && <SwipeScreen myProfile={myProfile} swipeUsers={swipeUsers} onSwipe={handleSwipe} boostActive={boostActive} isPro={isPro} onUpgrade={handleUpgrade} onOpenChat={handleOpenChatWith} />}
            {tab==="likeok" && <LikeokScreen myId={session.user.id} isPro={isPro} onUpgrade={handleUpgrade} onSwipe={handleSwipe} />}
            {tab==="matches" && <MatchList matches={matches} onOpen={m=>{setActiveChat(m);}} isPro={isPro} onUpgrade={handleUpgrade} />}
            {tab==="profile" && <ProfileScreen myProfile={myProfile} setMyProfile={setMyProfile} isPro={isPro} boostActive={boostActive} boostAvailable={boostAvailable} onBoost={handleBoost} onBuyBoost={handleBuyBoost} onUpgrade={handleUpgrade} onSignOut={handleSignOut} onDeleteAccount={handleDeleteAccount} />}
          </>
        )}
      </div>
      {!activeChat && <BottomNav active={tab} setActive={setTab} unreadCount={unreadCount} newLikesCount={newLikesCount} />}
    </Shell>
  );
}
