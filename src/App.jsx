import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase.js";

const STRIPE_PRICE_ID = "price_1TY5hhBtOhui3FKbzxznfDa9";

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

const LOOKING_FOR_OPTIONS = [
  { l: "Komoly kapcsolat", i: "💍" },
  { l: "Laza ismerkedés", i: "✨" },
  { l: "Új barátok", i: "👋" },
  { l: "Meglátjuk", i: "🤷" },
];

const EDU_OPTIONS = ["Középiskola","Szakképzés","Főiskola / BA","Egyetem / MA","PhD"];
const SMOKING_OPTIONS = ["Nem dohányzik","Alkalmanként","Rendszeresen","Leszokott"];

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function ghostLabel(score) {
  if (score >= 0.8) return { text: "💬 Aktív üzenetküldő", color: "#3ecf8e" };
  if (score >= 0.6) return { text: "💬 Általában válaszol", color: "#4dabf7" };
  if (score >= 0.4) return { text: "⏳ Lassan válaszol", color: "#ffd43b" };
  return null;
}

function getTodayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }

// ── SHELL ──────────────────────────────────────────────
function Shell({ children }) {
  return (
    <div style={{ width:"100%", maxWidth:390, margin:"0 auto", height:"100vh", maxHeight:844, background:C.bg, display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" }}>
      {children}
      <style>{`* { box-sizing:border-box; -webkit-tap-highlight-color:transparent; } ::-webkit-scrollbar{display:none;} input[type=range]{-webkit-appearance:none;height:3px;background:rgba(240,244,255,0.15);border-radius:2px;outline:none;width:100%;} input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#ff5c5c;cursor:pointer;} @keyframes pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.05);}} @keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
}

function Spinner() {
  return <div style={{ width:40, height:40, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.accent}`, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto" }} />;
}

// ── AUTH SCREEN ────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handle = async () => {
    if (!email || !password) { setError("Töltsd ki az összes mezőt!"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Ellenőrizd az emailed a megerősítéshez!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // onAuth called via useEffect in App
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 28px", background:C.bg }}>
      <div style={{ width:80, height:80, borderRadius:24, background:`linear-gradient(135deg,${C.accent},#ff8c42)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:38, marginBottom:20 }}>📍</div>
      <h1 style={{ fontSize:32, fontWeight:900, color:C.text, fontFamily:"Georgia,serif", margin:"0 0 6px" }}>NearMatch</h1>
      <p style={{ color:C.muted, fontSize:13, margin:"0 0 32px" }}>Közelségen alapuló társkereső</p>

      <div style={{ width:"100%", display:"flex", gap:8, marginBottom:24 }}>
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
  const [data, setData] = useState({ name:"", birthdate:"", gender:"", bio:"", interests:[], showMe:"", lookingFor:"", locationGranted:false });
  const [saving, setSaving] = useState(false);

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

  const finish = async (locationGranted) => {
    setSaving(true);
    let lat = null, lng = null;
    if (locationGranted) {
      try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }));
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {}
    }
    const birthYear = data.birthdate ? new Date(data.birthdate).getFullYear() : null;
    const age = birthYear ? new Date().getFullYear() - birthYear : null;
    const totalUsers = Math.floor(Math.random() * 1800) + 1;
    const isFounder = totalUsers <= 2000;
    const profile = {
      id: user.id,
      name: data.name,
      bio: data.bio,
      age,
      gender: data.gender,
      interests: data.interests,
      looking_for: data.lookingFor,
      is_pro: isFounder,
      is_founder: isFounder,
      lat,
      lng,
      last_seen: new Date().toISOString(),
    };
    const { error } = await supabase.from("profiles").upsert(profile);
    if (!error) onComplete({ ...profile, isFounder });
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
    <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"28px 28px 32px", background:C.bg }}>
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
      <div style={{ display:"flex", flexDirection:"column", height:"100%", background:C.bg }}>
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
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:C.bg }}>
      <Header />
      <div style={{ flex:1, padding:"16px 24px", overflowY:"auto", display:"flex", flexDirection:"column", gap:16 }}>
        <h2 style={{ fontSize:24, fontWeight:900, color:C.text, margin:"8px 0 0" }}>Mutatkozz be</h2>
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}><label style={{ color:C.muted, fontSize:11, letterSpacing:1, textTransform:"uppercase" }}>Bio</label><span style={{ color:C.dim, fontSize:11 }}>{(data.bio||"").length}/300</span></div>
          <textarea value={data.bio||""} onChange={e => setData(d=>({...d,bio:e.target.value.slice(0,300)}))} placeholder="Mesélj magadról..."
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
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:C.bg }}>
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
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:C.bg }}>
      <Header />
      <div style={{ flex:1, overflowY:"auto", padding:"16px 24px 32px" }}>
        <div style={{ textAlign:"center", marginBottom:24, paddingTop:8 }}>
          <div style={{ width:80, height:80, borderRadius:24, margin:"0 auto 16px", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:38 }}>📍</div>
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
function BottomNav({ active, setActive, unreadCount }) {
  const tabs = [
    { id:"radar", icon:"◎", label:"Radar" },
    { id:"swipe", icon:"♥", label:"Swipe" },
    { id:"matches", icon:"💬", label:"Matchek" },
    { id:"profile", icon:"👤", label:"Profil" },
  ];
  return (
    <div style={{ display:"flex", borderTop:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActive(t.id)} style={{ flex:1, padding:"10px 0", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, position:"relative" }}>
          <span style={{ fontSize:20, opacity:active===t.id?1:0.4 }}>{t.icon}</span>
          <span style={{ fontSize:10, color:active===t.id?C.accent:C.dim }}>{t.label}</span>
          {t.id==="matches" && unreadCount>0 && (<div style={{ position:"absolute", top:6, right:"22%", width:14, height:14, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff", fontWeight:700 }}>{unreadCount}</div>)}
        </button>
      ))}
    </div>
  );
}

// ── RADAR ──────────────────────────────────────────────
function RadarScreen({ myProfile, nearbyUsers, isPro, boostActive, onUpgrade }) {
  const canvasRef = useRef(null);
  const [dots, setDots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showProWall, setShowProWall] = useState(false);
  const animRef = useRef(null);
  const angleRef = useRef(0);

  useEffect(() => {
    setDots(nearbyUsers.map((u, i) => ({
      ...u,
      angle: (i / Math.max(nearbyUsers.length, 1)) * Math.PI * 2,
      r: Math.min(0.9, 0.2 + (u.distanceKm / 20) * 0.7),
    })));
  }, [nearbyUsers]);

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
        if (selected?.id===d.id) { ctx.beginPath(); ctx.arc(x,y,12,0,Math.PI*2); ctx.strokeStyle="rgba(255,92,92,0.4)"; ctx.lineWidth=2; ctx.stroke(); }
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
      {showProWall && (
        <div style={{ position:"absolute", inset:0, zIndex:95, background:"rgba(8,11,16,0.92)", backdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end" }}>
          <div style={{ width:"100%", background:C.surface, borderRadius:"28px 28px 0 0", padding:"28px 24px 40px", border:`1px solid ${C.border}` }}>
            <div style={{ textAlign:"center", marginBottom:20 }}><div style={{ fontSize:48, marginBottom:10 }}>🔒</div><h3 style={{ color:C.text, fontSize:20, fontWeight:900, margin:"0 0 8px" }}>Pro funkció</h3><p style={{ color:C.muted, fontSize:13, margin:0 }}>A Radar profil megtekintése csak Pro tagoknak.</p></div>
            <button onClick={() => { onUpgrade(); setShowProWall(false); }} style={{ width:"100%", padding:"16px", background:"linear-gradient(135deg,#ffd43b,#ff8c42)", border:"none", borderRadius:16, color:"#000", fontSize:16, fontWeight:700, cursor:"pointer", marginBottom:10 }}>⚡ Upgrade Pro-ra</button>
            <button onClick={() => setShowProWall(false)} style={{ width:"100%", padding:"14px", background:"none", border:`1px solid ${C.border}`, borderRadius:16, color:C.muted, fontSize:15, cursor:"pointer" }}>Mégse</button>
          </div>
        </div>
      )}
      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"10px 16px", gap:10, overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
        {boostActive && (
          <div style={{ background:"linear-gradient(135deg,rgba(255,212,59,0.12),rgba(255,140,66,0.12))", border:"1px solid rgba(255,212,59,0.4)", borderRadius:13, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>⚡</span>
            <div style={{ flex:1 }}><div style={{ color:C.yellow, fontWeight:700, fontSize:13 }}>Kiemelés aktív — legközelebb elöl</div><div style={{ color:C.dim, fontSize:11 }}>Távolság szerint rendezve</div></div>
            <div style={{ width:8, height:8, borderRadius:"50%", background:C.green, boxShadow:"0 0 6px #3ecf8e" }} />
          </div>
        )}
        <div style={{ position:"relative", display:"flex", justifyContent:"center" }}>
          <canvas ref={canvasRef} width={340} height={340} onClick={handleCanvasClick} style={{ borderRadius:"50%", cursor:"crosshair" }} />
          {selected && (
            <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, minWidth:220 }}>
              {isPro ? (<img src={selected.photo_url||`https://i.pravatar.cc/300?u=${selected.id}`} style={{ width:42, height:42, borderRadius:"50%", objectFit:"cover" }} alt={selected.name} />) : (<div style={{ width:42, height:42, borderRadius:"50%", background:C.card, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🔒</div>)}
              <div style={{ flex:1 }}>
                {isPro ? (<><div style={{ color:C.text, fontWeight:700 }}>{selected.name}, {selected.age}</div><div style={{ color:C.accent, fontSize:12 }}>● {distLabel(selected.distanceKm)}</div></>) : (<><div style={{ color:C.text, fontWeight:700 }}>Ismeretlen profil</div><div style={{ color:C.accent, fontSize:12 }}>● {distLabel(selected.distanceKm)}</div></>)}
              </div>
              <button onClick={() => { if (!isPro) setShowProWall(true); }} style={{ background:isPro?`linear-gradient(135deg,${C.accent},#ff8c42)`:"linear-gradient(135deg,#ffd43b,#ff8c42)", border:"none", borderRadius:10, color:isPro?"#fff":"#000", padding:"8px 12px", cursor:"pointer", fontSize:12, fontWeight:700 }}>{isPro?"Profil":"🔒 Pro"}</button>
            </div>
          )}
        </div>
        {!isPro && (
          <div style={{ background:"rgba(255,212,59,0.08)", border:"1px solid rgba(255,212,59,0.25)", borderRadius:13, padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>🔒</span>
            <div style={{ flex:1 }}><div style={{ color:C.yellow, fontWeight:700, fontSize:13 }}>Profilok rejtve</div><div style={{ color:C.dim, fontSize:11 }}>Pro-val látod ki van közel</div></div>
            <button onClick={onUpgrade} style={{ background:"linear-gradient(135deg,#ffd43b,#ff8c42)", border:"none", borderRadius:10, color:"#000", padding:"8px 12px", cursor:"pointer", fontSize:12, fontWeight:700 }}>Upgrade</button>
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {nearbyUsers.length === 0 && <div style={{ textAlign:"center", padding:"20px", color:C.muted, fontSize:13 }}>Nincs senki a közelben 😕</div>}
          {nearbyUsers.map(u => (
            <div key={u.id} style={{ display:"flex", alignItems:"center", gap:10, background:C.card, borderRadius:13, padding:"10px 14px", border:`1px solid ${C.border}` }}>
              {isPro ? (<img src={u.photo_url||`https://i.pravatar.cc/300?u=${u.id}`} style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover" }} alt={u.name} />) : (<div style={{ width:40, height:40, borderRadius:"50%", background:C.surface, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, border:`1px solid ${C.border}`, flexShrink:0 }}>🔒</div>)}
              <div style={{ flex:1 }}>
                {isPro ? (<><div style={{ color:C.text, fontWeight:600, fontSize:14 }}>{u.name}, {u.age}</div><div style={{ color:C.accent, fontSize:11 }}>● {distLabel(u.distanceKm)}</div></>) : (<><div style={{ color:C.muted, fontWeight:600, fontSize:14 }}>Rejtett profil</div><div style={{ color:C.accent, fontSize:11 }}>● {distLabel(u.distanceKm)}</div></>)}
              </div>
              {!isPro && <button onClick={onUpgrade} style={{ background:"rgba(255,212,59,0.1)", border:"1px solid rgba(255,212,59,0.3)", color:C.yellow, borderRadius:10, padding:"7px 12px", cursor:"pointer", fontSize:12, fontWeight:600 }}>🔒 Pro</button>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── SWIPE ──────────────────────────────────────────────
const THRESHOLD = 100;

function SwipeScreen({ myProfile, swipeUsers, onSwipe, boostActive, isPro, onUpgrade }) {
  const [idx, setIdx] = useState(0);
  const [history, setHistory] = useState([]);
  const [cardPage, setCardPage] = useState(0);
  const [drag, setDrag] = useState({ x:0, y:0, dragging:false });
  const [gone, setGone] = useState(false);
  const [actionLabel, setActionLabel] = useState(null);
  const [proWallType, setProWallType] = useState(null);
  const startPos = useRef(null);

  const slLimit = isPro ? 5 : 1;
  const [slUsed, setSlUsed] = useState(myProfile?.super_like_count||0);
  const [slDay, setSlDay] = useState(myProfile?.super_like_day||getTodayKey());
  const slLeft = getTodayKey()!==slDay ? slLimit : Math.max(0, slLimit-slUsed);

  useEffect(() => setCardPage(0), [idx]);

  if (!swipeUsers.length) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", flex:1, flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:50 }}>😕</div>
      <div style={{ fontSize:16, color:C.text }}>Nincs több profil</div>
      <div style={{ fontSize:13, color:C.muted }}>Próbálj később!</div>
    </div>
  );

  const cur = swipeUsers[idx % swipeUsers.length];
  const next = swipeUsers[(idx+1) % swipeUsers.length];

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

  const transform = gone?`translateX(${drag.x>0?600:-600}px) rotate(${drag.x>0?25:-25}deg)`:`translateX(${drag.x}px) translateY(${drag.y*0.3}px) rotate(${drag.x/15}deg)`;
  const transition = drag.dragging&&!gone?"none":"transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)";
  const likeOpacity = Math.max(0,drag.x/THRESHOLD);
  const passOpacity = Math.max(0,-drag.x/THRESHOLD);
  const superOpacity = actionLabel==="SUPER LIKE"?1:0;
  const distLabel = (km) => km!=null ? (km<1?`${Math.round(km*1000)}m`:`${km.toFixed(1)}km`) : "";

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",padding:"6px 16px 10px",userSelect:"none" }} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      {proWallType && (
        <div style={{ position:"absolute",inset:0,zIndex:95,background:"rgba(8,11,16,0.92)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end" }}>
          <div style={{ width:"100%",background:C.surface,borderRadius:"28px 28px 0 0",padding:"28px 24px 40px",border:`1px solid ${C.border}` }}>
            <div style={{ textAlign:"center",marginBottom:20 }}><div style={{ fontSize:48,marginBottom:10 }}>{proWallType==="rewind"?"↩️":"⭐"}</div><h3 style={{ color:C.text,fontSize:20,fontWeight:900,margin:"0 0 8px" }}>{proWallType==="rewind"?"Visszatekerés — Pro":"Super Like elfogyott"}</h3><p style={{ color:C.muted,fontSize:13,margin:0 }}>{proWallType==="rewind"?"Az előző profil visszahozása csak Pro tagoknak.":"Pro-val napi 5 Super Like jár."}</p></div>
            <button onClick={() => { onUpgrade(); setProWallType(null); }} style={{ width:"100%",padding:"16px",background:"linear-gradient(135deg,#ffd43b,#ff8c42)",border:"none",borderRadius:16,color:"#000",fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:10 }}>⚡ Upgrade Pro-ra</button>
            <button onClick={() => setProWallType(null)} style={{ width:"100%",padding:"14px",background:"none",border:`1px solid ${C.border}`,borderRadius:16,color:C.muted,fontSize:15,cursor:"pointer" }}>Mégse</button>
          </div>
        </div>
      )}
      {boostActive && (
        <div style={{ background:"linear-gradient(135deg,rgba(255,212,59,0.12),rgba(255,140,66,0.12))",border:"1px solid rgba(255,212,59,0.35)",borderRadius:12,padding:"9px 14px",display:"flex",alignItems:"center",gap:8,marginBottom:8,flexShrink:0 }}>
          <span style={{ fontSize:16 }}>⚡</span>
          <div style={{ flex:1,color:C.yellow,fontSize:12,fontWeight:700 }}>Kiemelés aktív — legközelebbiek kerülnek elő</div>
          <div style={{ width:7,height:7,borderRadius:"50%",background:C.green,boxShadow:"0 0 5px #3ecf8e",flexShrink:0 }} />
        </div>
      )}
      <div style={{ flex:1,position:"relative",minHeight:0 }}>
        {next && (
          <div style={{ position:"absolute",inset:0,borderRadius:24,overflow:"hidden",transform:"scale(0.95)",opacity:0.7 }}>
            <img src={next.photo_url||`https://i.pravatar.cc/300?u=${next.id}`} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt={next.name} />
            <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 50%)" }} />
            <div style={{ position:"absolute",bottom:18,left:18 }}><span style={{ fontSize:24,fontWeight:900,color:"#fff" }}>{next.name}</span><span style={{ fontSize:18,color:"rgba(255,255,255,0.5)",marginLeft:8 }}>{next.age}</span></div>
          </div>
        )}
        <div onMouseDown={onMouseDown} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          onClick={(e) => { if(Math.abs(drag.x)>5) return; const rect=e.currentTarget.getBoundingClientRect(); const x=e.clientX-rect.left; if(x>rect.width*0.75) setCardPage(p=>Math.min(p+1,1)); else if(x<rect.width*0.25) setCardPage(p=>Math.max(p-1,0)); }}
          style={{ position:"absolute",inset:0,borderRadius:24,overflow:"hidden",background:C.card,cursor:"grab",transform,transition }}>
          <div style={{ position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4,zIndex:10 }}>
            {[0,1].map(p => <div key={p} style={{ width:p===cardPage?20:6,height:6,borderRadius:3,background:p===cardPage?"#fff":"rgba(255,255,255,0.4)",transition:"width 0.2s" }} />)}
          </div>
          {cardPage===0 ? (
            <>
              <img src={cur.photo_url||`https://i.pravatar.cc/300?u=${cur.id}`} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt={cur.name} />
              <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(8,11,16,0.9) 0%,transparent 50%)" }} />
              {cur.distanceKm!=null && <div style={{ position:"absolute",top:14,right:14,background:C.accent,borderRadius:10,padding:"4px 10px",fontSize:12,color:"#fff",fontWeight:700 }}>● {distLabel(cur.distanceKm)}</div>}
              <div style={{ position:"absolute",top:30,left:20,border:"3px solid #3ecf8e",borderRadius:12,padding:"6px 16px",color:"#3ecf8e",fontSize:22,fontWeight:900,opacity:likeOpacity,transform:"rotate(-15deg)" }}>LIKE</div>
              <div style={{ position:"absolute",top:30,right:20,border:"3px solid #ff5c5c",borderRadius:12,padding:"6px 16px",color:"#ff5c5c",fontSize:22,fontWeight:900,opacity:passOpacity,transform:"rotate(15deg)" }}>PASS</div>
              <div style={{ position:"absolute",top:30,left:"50%",transform:"translateX(-50%) rotate(-5deg)",border:"3px solid #4dabf7",borderRadius:12,padding:"6px 16px",color:"#4dabf7",fontSize:20,fontWeight:900,opacity:superOpacity,whiteSpace:"nowrap",transition:"opacity 0.2s" }}>⭐ SUPER LIKE</div>
              <div style={{ position:"absolute",bottom:0,left:0,right:0,padding:"16px 20px 20px" }}>
                <div style={{ display:"flex",alignItems:"baseline",gap:8,marginBottom:4 }}><span style={{ fontSize:28,fontWeight:900,color:"#fff" }}>{cur.name}</span><span style={{ fontSize:20,color:"rgba(255,255,255,0.5)" }}>{cur.age}</span></div>
                <p style={{ color:"rgba(255,255,255,0.7)",fontSize:13,margin:"0 0 10px" }}>{cur.bio}</p>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>{(cur.interests||[]).slice(0,3).map(t => <span key={t} style={{ background:"rgba(255,92,92,0.18)",border:"1px solid rgba(255,92,92,0.3)",borderRadius:20,padding:"4px 10px",fontSize:12,color:"#fff" }}>{t}</span>)}</div>
              </div>
            </>
          ) : (
            <div style={{ width:"100%",height:"100%",background:C.bg,overflowY:"auto",padding:"20px 16px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}><img src={cur.photo_url||`https://i.pravatar.cc/300?u=${cur.id}`} style={{ width:52,height:52,borderRadius:"50%",objectFit:"cover" }} alt={cur.name} /><div><div style={{ fontSize:20,fontWeight:900,color:C.text }}>{cur.name}, {cur.age}</div>{cur.distanceKm!=null&&<div style={{ color:C.accent,fontSize:12 }}>● {distLabel(cur.distanceKm)}</div>}</div></div>
              {cur.bio&&<div style={{ background:C.card,borderRadius:14,padding:"13px",border:`1px solid ${C.border}`,marginBottom:10 }}><div style={{ color:C.dim,fontSize:10,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>Bio</div><p style={{ color:C.text,fontSize:13,lineHeight:1.6,margin:0 }}>{cur.bio}</p></div>}
              {(cur.interests||[]).length>0&&<div style={{ background:C.card,borderRadius:14,padding:"13px",border:`1px solid ${C.border}`,marginBottom:10 }}><div style={{ color:C.dim,fontSize:10,letterSpacing:1,textTransform:"uppercase",marginBottom:8 }}>Érdeklődés</div><div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>{cur.interests.map(t=><span key={t} style={{ background:C.accentSoft,border:`1px solid ${C.accent}`,borderRadius:20,padding:"4px 10px",fontSize:12,color:C.accent }}>{t}</span>)}</div></div>}
              {cur.looking_for&&<div style={{ background:C.card,borderRadius:14,padding:"13px",border:`1px solid ${C.border}` }}><div style={{ color:C.dim,fontSize:10,letterSpacing:1,textTransform:"uppercase",marginBottom:6 }}>Mit keres</div><div style={{ color:C.text,fontWeight:600 }}>{LOOKING_FOR_OPTIONS.find(x=>x.l===cur.looking_for)?.i} {cur.looking_for}</div></div>}
            </div>
          )}
        </div>
      </div>
      <div style={{ flexShrink:0,paddingTop:10 }}>
        <div style={{ display:"flex",justifyContent:"center",gap:6,marginBottom:10 }}>
          {Array.from({length:slLimit}).map((_,i) => (<div key={i} style={{ width:20,height:4,borderRadius:2,background:i<slLeft?"#4dabf7":C.border,transition:"background 0.3s" }} />))}
          <span style={{ color:C.dim,fontSize:10,marginLeft:4 }}>{slLeft}/{slLimit} Super Like</span>
        </div>
        <div style={{ display:"flex",justifyContent:"center",alignItems:"center",gap:16 }}>
          <button onClick={handleRewind} style={{ width:52,height:52,borderRadius:"50%",background:isPro&&history.length>0?"rgba(255,140,66,0.12)":C.card,border:`1px solid ${isPro&&history.length>0?C.orange:C.border}`,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:history.length===0&&isPro?0.4:1,position:"relative" }}>
            ↩️
            {!isPro&&<div style={{ position:"absolute",top:-3,right:-3,width:14,height:14,borderRadius:"50%",background:C.yellow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#000",fontWeight:900 }}>P</div>}
          </button>
          <button onClick={() => {showLabel("PASS");act("pass");}} style={{ width:60,height:60,borderRadius:"50%",background:C.card,border:`1px solid ${C.border}`,fontSize:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
          <button onClick={() => {showLabel("LIKE");act("like");}} style={{ width:74,height:74,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},#ff8c42)`,border:"none",fontSize:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 20px ${C.accentGlow}` }}>♥</button>
          <button onClick={() => { if(slLeft<=0){setProWallType("superlike");return;} showLabel("SUPER LIKE"); act("superlike"); }}
            style={{ width:60,height:60,borderRadius:"50%",background:slLeft>0?"rgba(77,171,247,0.12)":C.card,border:`1px solid ${slLeft>0?"#4dabf7":C.border}`,fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",position:"relative" }}>
            ⭐
            {slLeft<=0&&!isPro&&<div style={{ position:"absolute",top:-3,right:-3,width:14,height:14,borderRadius:"50%",background:C.yellow,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#000",fontWeight:900 }}>P</div>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MATCHES ────────────────────────────────────────────
function MatchList({ matches, onOpen, isPro, onUpgrade }) {
  const FREE_LIMIT=5, PRO_LIMIT=10;
  const limit = isPro?PRO_LIMIT:FREE_LIMIT;
  const active = matches.filter(m=>m.status!=="expired");
  const expired = matches.filter(m=>m.status==="expired");
  const pct = active.length/limit;
  const barColor = pct>=1?C.accent:pct>=0.7?C.orange:C.green;
  return (
    <div style={{ flex:1,overflowY:"auto",padding:"14px 20px" }}>
      <div style={{ background:C.card,borderRadius:16,padding:"14px 16px",border:`1px solid ${C.border}`,marginBottom:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:10 }}><span style={{ color:C.text,fontWeight:700 }}>Aktív matchek</span><span style={{ fontWeight:800,color:pct>=1?C.accent:C.text }}>{active.length}/{limit}</span></div>
        <div style={{ height:6,background:C.dim,borderRadius:3,overflow:"hidden",marginBottom:8 }}><div style={{ height:"100%",borderRadius:3,width:`${Math.min(pct*100,100)}%`,background:barColor,transition:"width 0.3s" }} /></div>
        {!isPro&&<button onClick={onUpgrade} style={{ width:"100%",marginTop:8,padding:"10px",background:"linear-gradient(135deg,#ffd43b,#ff8c42)",border:"none",borderRadius:12,color:"#000",fontWeight:700,cursor:"pointer",fontSize:13 }}>⚡ Upgrade Pro-ra — 10 match egyszerre</button>}
      </div>
      {active.length===0&&<div style={{ textAlign:"center",padding:"40px 20px",color:C.muted }}>Még nincsenek matcheid 💝</div>}
      {active.map(m => (
        <div key={m.id} onClick={() => onOpen(m)} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer" }}>
          <div style={{ position:"relative" }}>
            <img src={m.other?.photo_url||`https://i.pravatar.cc/300?u=${m.other?.id}`} style={{ width:52,height:52,borderRadius:"50%",objectFit:"cover" }} alt={m.other?.name} />
            <div style={{ position:"absolute",bottom:1,right:1,width:11,height:11,borderRadius:"50%",background:C.green,border:`2px solid ${C.bg}` }} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex",justifyContent:"space-between" }}><span style={{ color:C.text,fontWeight:700 }}>{m.other?.name}</span><span style={{ color:C.dim,fontSize:11 }}>{m.timeLabel}</span></div>
            <div style={{ color:C.dim,fontSize:13,marginTop:2 }}>{m.lastMsg||"Kezdj el beszélgetni! 👋"}</div>
          </div>
          {m.unread&&<div style={{ width:8,height:8,borderRadius:"50%",background:C.accent,flexShrink:0 }} />}
        </div>
      ))}
      {expired.length>0&&(<><div style={{ color:C.dim,fontSize:11,letterSpacing:1.5,textTransform:"uppercase",margin:"16px 0 8px" }}>Lejárt matchek</div>{expired.map(m => (<div key={m.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${C.border}`,opacity:0.6 }}><img src={m.other?.photo_url||`https://i.pravatar.cc/300?u=${m.other?.id}`} style={{ width:52,height:52,borderRadius:"50%",objectFit:"cover",filter:"grayscale(80%)" }} alt={m.other?.name} /><div style={{ flex:1 }}><div style={{ color:C.muted,fontWeight:700 }}>{m.other?.name}</div><div style={{ color:C.dim,fontSize:12 }}>Match lejárt</div></div>{isPro?(<button style={{ background:"linear-gradient(135deg,#ffd43b,#ff8c42)",border:"none",borderRadius:10,color:"#000",padding:"8px 12px",cursor:"pointer",fontSize:12,fontWeight:700 }}>Újraéleszt</button>):(<button onClick={onUpgrade} style={{ background:"rgba(255,212,59,0.1)",border:"1px solid rgba(255,212,59,0.3)",borderRadius:10,color:C.yellow,padding:"8px 12px",cursor:"pointer",fontSize:12 }}>Pro</button>)}</div>))}</>)}
    </div>
  );
}

// ── CHAT ───────────────────────────────────────────────
function ChatView({ match, myId, onBack }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("messages").select("*").eq("match_id", match.id).order("created_at", { ascending:true });
      setMsgs(data||[]);
      setLoading(false);
    };
    load();
    const sub = supabase.channel(`messages:${match.id}`)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages", filter:`match_id=eq.${match.id}` }, payload => {
        setMsgs(m => [...m, payload.new]);
      }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [match.id]);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), [msgs]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input; setInput("");
    await supabase.from("messages").insert({ match_id:match.id, sender_id:myId, text });
  };

  const timeLabel = (ts) => new Date(ts).toLocaleTimeString("hu", { hour:"2-digit", minute:"2-digit" });

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100%" }}>
      <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:`1px solid ${C.border}`,background:C.surface }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:20 }}>←</button>
        <img src={match.other?.photo_url||`https://i.pravatar.cc/300?u=${match.other?.id}`} style={{ width:38,height:38,borderRadius:"50%",objectFit:"cover" }} alt={match.other?.name} />
        <div style={{ flex:1 }}><div style={{ color:C.text,fontWeight:700 }}>{match.other?.name}</div><div style={{ color:C.green,fontSize:11 }}>● Online</div></div>
      </div>
      <div style={{ flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:8 }}>
        {loading && <div style={{ textAlign:"center",paddingTop:20 }}><Spinner /></div>}
        {msgs.map(m => (
          <div key={m.id} style={{ display:"flex",justifyContent:m.sender_id===myId?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"72%",padding:"10px 14px",borderRadius:m.sender_id===myId?"18px 18px 4px 18px":"18px 18px 18px 4px",background:m.sender_id===myId?`linear-gradient(135deg,${C.accent},#ff8c42)`:C.card,color:"#fff",fontSize:14 }}>
              {m.text}
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:4,textAlign:"right" }}>{timeLabel(m.created_at)}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display:"flex",gap:8,padding:"12px 16px",borderTop:`1px solid ${C.border}` }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Írj üzenetet..." style={{ flex:1,padding:"12px 16px",borderRadius:24,background:C.card,border:`1px solid ${C.border}`,color:C.text,fontSize:14,outline:"none" }} />
        <button onClick={send} style={{ width:42,height:42,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},#ff8c42)`,border:"none",color:"#fff",fontSize:18,cursor:"pointer" }}>→</button>
      </div>
    </div>
  );
}

// ── PROFIL ─────────────────────────────────────────────
function ProfileScreen({ myProfile, setMyProfile, isPro, boostActive, boostAvailable, onBoost, onUpgrade, onSignOut }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [draft, setDraft] = useState({
    name: myProfile?.name||"",
    bio: myProfile?.bio||"",
    height: myProfile?.height||170,
    education: myProfile?.education||"",
    smoking: myProfile?.smoking||"",
    looking_for: myProfile?.looking_for||"",
  });

  const save = async () => {
    setSaving(true);
    const { data } = await supabase.from("profiles").update(draft).eq("id", myProfile.id).select().single();
    if (data) setMyProfile(p=>({...p,...data}));
    setSaving(false);
    setEditing(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Max 5MB
    if (file.size > 5 * 1024 * 1024) { setUploadError("Max 5MB!"); return; }
    // Csak kép
    if (!file.type.startsWith("image/")) { setUploadError("Csak képfájl tölthető fel!"); return; }
    setUploadError("");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${myProfile.id}/avatar.${ext}`;
      // Feltöltés Supabase Storage-ba
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      // Publikus URL lekérése
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const photo_url = urlData.publicUrl + "?t=" + Date.now(); // cache bust
      // Profil frissítése
      const { data } = await supabase.from("profiles").update({ photo_url }).eq("id", myProfile.id).select().single();
      if (data) setMyProfile(p=>({...p, photo_url}));
    } catch (err) {
      setUploadError("Hiba: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const SelectRow = ({ label, value, options, onChange }) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8 }}>{label}</label>
      <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
        {options.map(opt => (<button key={opt} onClick={() => onChange(opt)} style={{ padding:"7px 12px",borderRadius:20,fontSize:12,cursor:"pointer",border:`1px solid ${value===opt?C.accent:C.border}`,background:value===opt?C.accentSoft:C.card,color:value===opt?C.accent:C.muted,fontWeight:value===opt?700:400 }}>{opt}</button>))}
      </div>
    </div>
  );

  return (
    <div style={{ flex:1,overflowY:"auto" }}>
      <div style={{ position:"relative",height:200,background:`linear-gradient(135deg,${C.accent},#ff8c42)`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden" }}>
        {myProfile?.photo_url
          ? <img src={myProfile.photo_url} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt="Profil" />
          : <div style={{ textAlign:"center" }}><div style={{ fontSize:60 }}>📷</div><div style={{ color:"rgba(255,255,255,0.7)",fontSize:13 }}>Nincs profilkép</div></div>
        }
        {uploading && (
          <div style={{ position:"absolute",inset:0,background:"rgba(8,11,16,0.7)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12 }}>
            <Spinner />
            <span style={{ color:C.text,fontSize:13 }}>Feltöltés...</span>
          </div>
        )}
        {/* Feltöltés gomb */}
        <label style={{ position:"absolute",bottom:12,right:12,background:"rgba(8,11,16,0.8)",border:`1px solid ${C.border}`,borderRadius:12,padding:"9px 14px",color:C.text,cursor:"pointer",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6 }}>
          📷 {myProfile?.photo_url ? "Csere" : "Feltöltés"}
          <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display:"none" }} onChange={handlePhotoUpload} disabled={uploading} />
        </label>
        <button onClick={onSignOut} style={{ position:"absolute",top:12,left:12,background:"rgba(8,11,16,0.7)",border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 14px",color:C.muted,cursor:"pointer",fontSize:12 }}>Kilépés</button>
        {uploadError && <div style={{ position:"absolute",bottom:52,left:"50%",transform:"translateX(-50%)",background:"rgba(255,92,92,0.9)",borderRadius:10,padding:"6px 14px",color:"#fff",fontSize:12,whiteSpace:"nowrap" }}>{uploadError}</div>}
      </div>
      <div style={{ padding:"16px 20px" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
          <div><div style={{ color:C.text,fontWeight:800,fontSize:20 }}>{myProfile?.name}</div><div style={{ color:C.muted,fontSize:13 }}>{myProfile?.is_founder?"🚀 Founder":"NearMatch felhasználó"}</div></div>
          <button onClick={() => { if(editing) save(); else setEditing(true); }} style={{ background:editing?`linear-gradient(135deg,${C.accent},#ff8c42)`:C.card,border:`1px solid ${editing?C.accent:C.border}`,borderRadius:12,color:editing?"#fff":C.text,padding:"8px 16px",cursor:"pointer",fontWeight:600,fontSize:13 }}>
            {saving?<Spinner />:editing?"✓ Mentés":"✏️ Szerkesztés"}
          </button>
        </div>

        {/* Boost kártya */}
        {!editing && (
          <div style={{ marginBottom:16 }}>
            {boostActive ? (
              <div style={{ background:"linear-gradient(135deg,rgba(255,212,59,0.15),rgba(255,140,66,0.15))",border:"1px solid rgba(255,212,59,0.4)",borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ fontSize:28 }}>⚡</div>
                <div style={{ flex:1 }}><div style={{ color:C.yellow,fontWeight:800,fontSize:15 }}>Kiemelés aktív!</div><div style={{ color:C.muted,fontSize:12,marginTop:2 }}>30 percig előre kerülsz a közeliek között</div></div>
                <div style={{ width:10,height:10,borderRadius:"50%",background:C.green,boxShadow:"0 0 8px #3ecf8e" }} />
              </div>
            ) : isPro && boostAvailable ? (
              <button onClick={onBoost} style={{ width:"100%",padding:"14px 16px",background:"linear-gradient(135deg,rgba(255,212,59,0.12),rgba(255,140,66,0.12))",border:"1px solid rgba(255,212,59,0.35)",borderRadius:16,cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left" }}>
                <div style={{ fontSize:26 }}>⚡</div>
                <div style={{ flex:1 }}><div style={{ color:C.yellow,fontWeight:700,fontSize:14 }}>Kiemelés használata</div><div style={{ color:C.dim,fontSize:12,marginTop:2 }}>Profilod előre kerül — 30 percig • Heti 1 db</div></div>
                <div style={{ background:"linear-gradient(135deg,#ffd43b,#ff8c42)",borderRadius:10,padding:"6px 12px",color:"#000",fontSize:12,fontWeight:700 }}>Aktiválás</div>
              </button>
            ) : isPro && !boostAvailable ? (
              <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,opacity:0.6 }}>
                <div style={{ fontSize:26 }}>⚡</div>
                <div style={{ flex:1 }}><div style={{ color:C.text,fontWeight:700,fontSize:14 }}>Kiemelés elhasználva</div><div style={{ color:C.dim,fontSize:12,marginTop:2 }}>Jövő héten újra elérhető</div></div>
                <div style={{ background:C.surface,borderRadius:10,padding:"6px 12px",color:C.dim,fontSize:12 }}>🔄 +7 nap</div>
              </div>
            ) : (
              <button onClick={onUpgrade} style={{ width:"100%",padding:"14px 16px",background:C.card,border:`1px solid ${C.border}`,borderRadius:16,cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left" }}>
                <div style={{ fontSize:26 }}>⚡</div>
                <div style={{ flex:1 }}><div style={{ color:C.muted,fontWeight:700,fontSize:14 }}>Kiemelés — Pro funkció</div><div style={{ color:C.dim,fontSize:12,marginTop:2 }}>Kerülj előre • Heti 1 db</div></div>
                <div style={{ background:"rgba(255,212,59,0.1)",border:"1px solid rgba(255,212,59,0.3)",borderRadius:10,padding:"6px 12px",color:C.yellow,fontSize:12,fontWeight:700 }}>Pro</div>
              </button>
            )}
          </div>
        )}

        {editing ? (
          <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
            <div style={{ marginBottom:12 }}>
              <label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6 }}>Név</label>
              <input value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} style={{ width:"100%",padding:"12px 14px",borderRadius:12,background:C.card,border:`1px solid ${C.border}`,color:C.text,fontSize:15,outline:"none" }} />
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6 }}>Bio</label>
              <textarea value={draft.bio} onChange={e=>setDraft(d=>({...d,bio:e.target.value}))} style={{ width:"100%",padding:"12px 14px",borderRadius:12,background:C.card,border:`1px solid ${C.border}`,color:C.text,fontSize:14,outline:"none",resize:"none",minHeight:80,lineHeight:1.6 }} />
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                <label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1 }}>📏 Magasság</label>
                <span style={{ color:C.accent,fontWeight:700,fontSize:13 }}>{draft.height} cm</span>
              </div>
              <input type="range" min={135} max={230} step={1} value={draft.height} onChange={e=>setDraft(d=>({...d,height:+e.target.value}))} style={{ width:"100%" }} />
              <div style={{ display:"flex",justifyContent:"space-between",marginTop:4 }}><span style={{ color:C.dim,fontSize:10 }}>135 cm</span><span style={{ color:C.dim,fontSize:10 }}>230 cm</span></div>
            </div>
            <SelectRow label="🎓 Végzettség" value={draft.education} options={EDU_OPTIONS} onChange={v=>setDraft(d=>({...d,education:v}))} />
            <SelectRow label="🚬 Dohányzás" value={draft.smoking} options={SMOKING_OPTIONS} onChange={v=>setDraft(d=>({...d,smoking:v}))} />
            <div style={{ marginBottom:12 }}>
              <label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8 }}>💍 Mit keresel?</label>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                {LOOKING_FOR_OPTIONS.map(x => (<button key={x.l} onClick={() => setDraft(d=>({...d,looking_for:x.l}))} style={{ padding:"12px 10px",borderRadius:12,border:`1px solid ${draft.looking_for===x.l?C.accent:C.border}`,background:draft.looking_for===x.l?C.accentSoft:C.card,color:draft.looking_for===x.l?C.accent:C.text,cursor:"pointer",textAlign:"center" }}><div style={{ fontSize:18,marginBottom:3 }}>{x.i}</div><div style={{ fontSize:12,fontWeight:600 }}>{x.l}</div></button>))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            <div style={{ background:C.card,borderRadius:14,padding:"14px",border:`1px solid ${C.border}` }}><div style={{ color:C.dim,fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:8 }}>Bio</div><p style={{ color:C.text,fontSize:14,lineHeight:1.6,margin:0 }}>{myProfile?.bio||"Nincs még bio — szerkeszd a profilt!"}</p></div>
            {(myProfile?.height||myProfile?.education||myProfile?.smoking) && (
              <div style={{ background:C.card,borderRadius:14,padding:"14px",border:`1px solid ${C.border}` }}>
                <div style={{ color:C.dim,fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:10 }}>Részletek</div>
                {[["📏 Magasság",myProfile?.height?`${myProfile.height} cm`:null],["🎓 Végzettség",myProfile?.education],["🚬 Dohányzás",myProfile?.smoking]].map(([k,v]) => v?(<div key={k} style={{ display:"flex",justifyContent:"space-between",color:C.text,fontSize:13,paddingBottom:8 }}><span style={{ color:C.muted }}>{k}</span><span style={{ fontWeight:600 }}>{v}</span></div>):null)}
              </div>
            )}
            {myProfile?.looking_for&&<div style={{ background:C.card,borderRadius:14,padding:"14px",border:`1px solid ${C.border}` }}><div style={{ color:C.dim,fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:6 }}>Mit keres</div><div style={{ color:C.text,fontWeight:600,fontSize:14 }}>{LOOKING_FOR_OPTIONS.find(x=>x.l===myProfile.looking_for)?.i} {myProfile.looking_for}</div></div>}
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
  const [appState, setAppState] = useState("loading"); // loading | auth | onboarding | main
  const [tab, setTab] = useState("radar");
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [swipeUsers, setSwipeUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [matchOverlay, setMatchOverlay] = useState(null);
  const [myLocation, setMyLocation] = useState(null);

  // Boost
  const [boostActive, setBoostActive] = useState(false);
  const [lastBoostWeek, setLastBoostWeek] = useState(null);
  const getWeekNumber = () => { const d=new Date(); const oneJan=new Date(d.getFullYear(),0,1); return Math.ceil(((d-oneJan)/86400000+oneJan.getDay()+1)/7); };
  const boostAvailable = myProfile?.is_pro && lastBoostWeek!==getWeekNumber() && !boostActive;
  const handleBoost = () => { if(!boostAvailable) return; setBoostActive(true); setLastBoostWeek(getWeekNumber()); setTimeout(()=>setBoostActive(false), 30*60*1000); };

  const isPro = myProfile?.is_pro||false;

  const handleUpgrade = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            price_id: STRIPE_PRICE_ID,
            success_url: window.location.origin + "?pro=success",
            cancel_url: window.location.origin + "?pro=cancel",
          }),
        }
      );
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Stripe hiba:", err);
    }
  };

  // Pro success visszairányítás kezelése
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pro") === "success") {
      setMyProfile(p => p ? {...p, is_pro: true} : p);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Auth listener
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
    if (data) { setMyProfile(data); setAppState("main"); }
    else setAppState("onboarding");
  };

  // GPS frissítés
  useEffect(() => {
    if (appState !== "main") return;
    const updateLocation = async () => {
      try {
        const pos = await new Promise((res,rej) => navigator.geolocation.getCurrentPosition(res,rej,{timeout:8000}));
        const { latitude:lat, longitude:lng } = pos.coords;
        setMyLocation({ lat, lng });
        await supabase.from("profiles").update({ lat, lng, last_seen:new Date().toISOString() }).eq("id", session.user.id);
      } catch {}
    };
    updateLocation();
    const interval = setInterval(updateLocation, 60000);
    return () => clearInterval(interval);
  }, [appState, session]);

  // Közeli userek betöltése
  const loadNearby = useCallback(async () => {
    if (!myLocation || !session) return;
    const { data } = await supabase.from("profiles").select("*").neq("id", session.user.id);
    if (!data) return;
    const withDist = data
      .filter(u => u.lat && u.lng)
      .map(u => ({ ...u, distanceKm: distanceKm(myLocation.lat, myLocation.lng, u.lat, u.lng) }))
      .filter(u => u.distanceKm < 20)
      .sort((a,b) => boostActive ? a.distanceKm-b.distanceKm : a.distanceKm-b.distanceKm);
    setNearbyUsers(withDist);

    // Swipe userek — akiket még nem swipeltünk
    const { data:swipedData } = await supabase.from("swipes").select("swiped_id").eq("swiper_id", session.user.id);
    const swipedIds = new Set((swipedData||[]).map(s=>s.swiped_id));
    const forSwipe = data.map(u => ({
      ...u,
      distanceKm: u.lat&&u.lng&&myLocation ? distanceKm(myLocation.lat,myLocation.lng,u.lat,u.lng) : null
    })).filter(u => !swipedIds.has(u.id));
    setSwipeUsers(boostActive ? [...forSwipe].sort((a,b)=>(a.distanceKm||99)-(b.distanceKm||99)) : forSwipe);
  }, [myLocation, session, boostActive]);

  useEffect(() => { loadNearby(); }, [loadNearby]);

  // Matchek betöltése
  const loadMatches = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase.from("matches").select("*, user1:profiles!matches_user1_id_fkey(*), user2:profiles!matches_user2_id_fkey(*)").or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`).order("created_at", { ascending:false });
    if (!data) return;

    const withOther = await Promise.all(data.map(async m => {
      const other = m.user1_id===session.user.id ? m.user2 : m.user1;
      const { data:lastMsg } = await supabase.from("messages").select("text,created_at").eq("match_id",m.id).order("created_at",{ascending:false}).limit(1).single();
      const timeLabel = lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString("hu",{hour:"2-digit",minute:"2-digit"}) : "";
      return { ...m, other, lastMsg:lastMsg?.text, timeLabel };
    }));
    setMatches(withOther);
  }, [session]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  // Realtime match figyelés
  useEffect(() => {
    if (!session) return;
    const sub = supabase.channel("matches_realtime")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"matches" }, async payload => {
        const m = payload.new;
        if (m.user1_id===session.user.id || m.user2_id===session.user.id) {
          const otherId = m.user1_id===session.user.id ? m.user2_id : m.user1_id;
          const { data:other } = await supabase.from("profiles").select("*").eq("id",otherId).single();
          if (other) setMatchOverlay(other);
          loadMatches();
        }
      }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [session, loadMatches]);

  const handleSwipe = async (targetId, action) => {
    await supabase.from("swipes").upsert({ swiper_id:session.user.id, swiped_id:targetId, action });
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  const unreadCount = matches.filter(m=>m.unread).length;

  if (appState==="loading") return <Shell><div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20 }}><div style={{ fontSize:48 }}>📍</div><Spinner /></div></Shell>;
  if (appState==="auth") return <Shell><AuthScreen onAuth={()=>{}} /></Shell>;
  if (appState==="onboarding") return <Shell><Onboarding user={session.user} onComplete={p=>{ setMyProfile(p); setAppState("main"); }} /></Shell>;

  return (
    <Shell>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${C.border}`,background:C.surface,flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:22,fontWeight:900,background:`linear-gradient(135deg,${C.accent},#ff8c42)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>NearMatch</span>
          {myProfile?.is_founder && <div style={{ background:"linear-gradient(135deg,#a78bfa,#6366f1)",borderRadius:8,padding:"3px 8px",fontSize:10,color:"#fff",fontWeight:700 }}>FOUNDER</div>}
          {isPro && !myProfile?.is_founder && <div style={{ background:"linear-gradient(135deg,#ffd43b,#ff8c42)",borderRadius:8,padding:"3px 8px",fontSize:10,color:"#000",fontWeight:700 }}>PRO</div>}
        </div>
        {!myLocation && <div style={{ color:C.yellow,fontSize:11 }}>📍 GPS szükséges</div>}
      </div>

      <div style={{ flex:1,overflow:"auto",display:"flex",flexDirection:"column",position:"relative" }}>
        {matchOverlay && <MatchOverlay user={matchOverlay} onMessage={() => { const m=matches.find(x=>x.other?.id===matchOverlay.id); setMatchOverlay(null); if(m){setActiveChat(m);setTab("matches");} }} onClose={()=>setMatchOverlay(null)} />}
        {activeChat ? (
          <ChatView match={activeChat} myId={session.user.id} onBack={()=>setActiveChat(null)} />
        ) : (
          <>
            {tab==="radar" && <RadarScreen myProfile={myProfile} nearbyUsers={nearbyUsers} isPro={isPro} boostActive={boostActive} onUpgrade={handleUpgrade} />}
            {tab==="swipe" && <SwipeScreen myProfile={myProfile} swipeUsers={swipeUsers} onSwipe={handleSwipe} boostActive={boostActive} isPro={isPro} onUpgrade={handleUpgrade} />}
            {tab==="matches" && <MatchList matches={matches} onOpen={m=>{setActiveChat(m);}} isPro={isPro} onUpgrade={handleUpgrade} />}
            {tab==="profile" && <ProfileScreen myProfile={myProfile} setMyProfile={setMyProfile} isPro={isPro} boostActive={boostActive} boostAvailable={boostAvailable} onBoost={handleBoost} onUpgrade={handleUpgrade} onSignOut={handleSignOut} />}
          </>
        )}
      </div>
      {!activeChat && <BottomNav active={tab} setActive={setTab} unreadCount={unreadCount} />}
    </Shell>
  );
}
