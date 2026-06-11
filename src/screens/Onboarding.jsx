import { useState } from "react";
import { supabase } from "../supabase.js";
import { C, INTERESTS_ALL, LOOKING_FOR_OPTIONS } from "../lib/constants.js";
import { calcAge } from "../lib/utils.js";
import Spinner from "../components/Spinner.jsx";

export default function Onboarding({ user, onComplete }) {
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
    const age = calcAge(data.birthdate);
    if (age === null || age < 18) { setSaving(false); return; }
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
    const age = calcAge(data.birthdate);
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
