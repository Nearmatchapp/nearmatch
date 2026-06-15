import { useState } from "react";
import { C } from "../lib/constants.js";
import { supabase } from "../supabase.js";
import { registerOneSignalUser } from "../lib/push.js";
import SliderTrack from "./SliderTrack.jsx";

// Beállítások – kizárólag a Profil fülről nyílik (⚙️). Tinder-szerű,
// szekciókba rendezett lista: fiók, felfedezés, adatvédelem, értesítések,
// jogi, fiók-műveletek. A felfedezési szűrőket a localStorage `swipeFilters`
// kulcson keresztül osztja meg a Swipe nézettel (laza csatolás).
const DEFAULT_FILTERS = { minAge:18, maxAge:60, maxDist:50, gender:"Mindenki", lookingFor:"" };
const GENDERS = ["Mindenki","Nő","Férfi"];

function Toggle({ on }) {
  return (
    <div style={{ width:44, height:24, borderRadius:12, background:on?C.accent:"rgba(240,244,255,0.15)", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
      <div style={{ position:"absolute", top:2, left:on?22:2, width:20, height:20, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1, margin:"0 4px 8px" }}>{title}</div>
      <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden" }}>{children}</div>
    </div>
  );
}

function Row({ label, sub, right, onClick, danger }) {
  return (
    <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderTop:`1px solid ${C.border}`, cursor:onClick?"pointer":"default" }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ color:danger?"#ff5c5c":C.text, fontSize:14, fontWeight:600 }}>{label}</div>
        {sub && <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export default function SettingsModal({ myProfile, setMyProfile, email, isPro, onUpgrade, onSignOut, onDeleteAccount, onClose }) {
  const loadFilters = () => {
    try { const s = localStorage.getItem("swipeFilters"); return s ? { ...DEFAULT_FILTERS, ...JSON.parse(s) } : DEFAULT_FILTERS; }
    catch { return DEFAULT_FILTERS; }
  };
  const [filters, setFilters] = useState(loadFilters);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notifPerm, setNotifPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");

  const updateFilters = (patch) => {
    setFilters(prev => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem("swipeFilters", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const setFlag = async (field, value) => {
    setMyProfile(p => ({ ...p, [field]: value }));
    await supabase.from("profiles").update({ [field]: value }).eq("id", myProfile.id);
  };

  const enableNotifications = () => {
    const sync = () => setNotifPerm(typeof Notification !== "undefined" ? Notification.permission : "granted");
    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async (OneSignal) => {
        try { await OneSignal.Notifications.requestPermission(); if (myProfile?.id) registerOneSignalUser(myProfile.id); } catch (e) { console.warn(e); }
        sync();
      });
    } else if (typeof Notification !== "undefined") {
      Notification.requestPermission().then(sync);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:400, background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"calc(14px + env(safe-area-inset-top)) 16px 14px", borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
        <button onClick={onClose} style={{ background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:20 }}>←</button>
        <span style={{ color:C.text, fontWeight:800, fontSize:17 }}>Beállítások</span>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"18px 16px 40px" }}>
        {/* FIÓK */}
        <Section title="Fiók">
          <div style={{ padding:"14px 16px" }}>
            <div style={{ color:C.muted, fontSize:12 }}>Bejelentkezve mint</div>
            <div style={{ color:C.text, fontSize:14, fontWeight:600, marginTop:2, wordBreak:"break-all" }}>{email || "—"}</div>
          </div>
          <Row label="Tagság" sub={myProfile?.is_founder ? "🚀 Founder" : isPro ? "⚡ NearMatch Pro" : "NearMatch Free"}
            right={!isPro ? <span style={{ color:C.yellow, fontSize:13, fontWeight:700 }}>Upgrade →</span> : null}
            onClick={!isPro ? () => { onClose(); onUpgrade(); } : undefined} />
        </Section>

        {/* FELFEDEZÉS */}
        <Section title="Felfedezési beállítások">
          <div style={{ padding:"16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ color:C.muted, fontSize:13, fontWeight:600 }}>Keresett nem</span>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:20 }}>
              {GENDERS.map(g => (
                <button key={g} onClick={() => updateFilters({ gender:g })}
                  style={{ flex:1, padding:"10px 4px", borderRadius:12, border:`1px solid ${filters.gender===g?C.accent:C.border}`, background:filters.gender===g?C.accentSoft:C.surface, color:filters.gender===g?C.accent:C.muted, cursor:"pointer", fontSize:11, fontWeight:700 }}>{g}</button>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ color:C.muted, fontSize:13, fontWeight:600 }}>Kor</span>
              <span style={{ color:C.accent, fontWeight:700, fontSize:13 }}>{filters.minAge} – {filters.maxAge} év</span>
            </div>
            <SliderTrack min={18} max={filters.maxAge - 1} value={filters.minAge} label="Min kor" unit=" év" onChange={v => updateFilters({ minAge:v })} />
            <div style={{ marginTop:4, marginBottom:20 }}>
              <SliderTrack min={filters.minAge + 1} max={80} value={filters.maxAge} label="Max kor" unit=" év" onChange={v => updateFilters({ maxAge:v })} />
            </div>
            <SliderTrack min={1} max={100} value={filters.maxDist} label="Max távolság" unit={filters.maxDist < 100 ? " km" : "+ km"} onChange={v => updateFilters({ maxDist:v })} />
            <div style={{ color:C.muted, fontSize:11, marginTop:12 }}>A módosítások a Swipe nézetben érvényesülnek.</div>
          </div>
        </Section>

        {/* ADATVÉDELEM */}
        <Section title="Adatvédelem">
          <Row label={`Inkognito mód ${myProfile?.is_incognito ? "BE" : "KI"}`} sub="Csak akiket lájkoltál látnak a Radaron és Swipe-on"
            right={isPro ? <Toggle on={!!myProfile?.is_incognito} /> : <span style={{ color:C.yellow, fontSize:12, fontWeight:700 }}>PRO</span>}
            onClick={() => isPro ? setFlag("is_incognito", !myProfile?.is_incognito) : (onClose(), onUpgrade())} />
          <Row label={`Hang üzenet mód ${myProfile?.voice_only ? "BE" : "KI"}`} sub="Csak hangüzenettel lehet neked írni"
            right={isPro ? <Toggle on={!!myProfile?.voice_only} /> : <span style={{ color:C.yellow, fontSize:12, fontWeight:700 }}>PRO</span>}
            onClick={() => isPro ? setFlag("voice_only", !myProfile?.voice_only) : (onClose(), onUpgrade())} />
        </Section>

        {/* ÉRTESÍTÉSEK */}
        <Section title="Értesítések">
          <div style={{ padding:"14px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:C.text, fontSize:14, fontWeight:600 }}>Push értesítések</div>
                <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>
                  {notifPerm === "granted" ? "Az eszközön engedélyezve" : notifPerm === "denied" ? "A böngésző tiltja – engedélyezd az eszköz beállításaiban" : notifPerm === "unsupported" ? "Nem támogatott ezen az eszközön" : "Engedélyezd, hogy értesülj a match-ekről és üzenetekről"}
                </div>
              </div>
              {notifPerm === "granted" ? <span style={{ color:C.green, fontSize:18 }}>✓</span>
                : notifPerm === "default" ? <button onClick={enableNotifications} style={{ background:C.accent, border:"none", borderRadius:10, color:"#fff", fontSize:13, fontWeight:700, padding:"8px 14px", cursor:"pointer" }}>Bekapcsol</button>
                : null}
            </div>
          </div>
          <Row label="Új match-ek" sub="Ha valaki visszalájkol"
            right={<Toggle on={myProfile?.notif_match !== false} />}
            onClick={() => setFlag("notif_match", myProfile?.notif_match === false)} />
          <Row label="Üzenetek" sub="Új üzenet egy match-től"
            right={<Toggle on={myProfile?.notif_message !== false} />}
            onClick={() => setFlag("notif_message", myProfile?.notif_message === false)} />
        </Section>

        {/* JOGI / SÚGÓ */}
        <Section title="Jogi és súgó">
          <Row label="Adatvédelmi tájékoztató" right={<span style={{ color:C.muted }}>↗</span>} onClick={() => window.open("/privacy.html", "_blank")} />
          <Row label="Kapcsolat / segítség" sub="support@nearmatch.io" right={<span style={{ color:C.muted }}>↗</span>} onClick={() => window.open("mailto:support@nearmatch.io", "_blank")} />
        </Section>

        {/* FIÓK MŰVELETEK */}
        <Section title="Fiók műveletek">
          <Row label="Kijelentkezés" onClick={onSignOut} right={<span style={{ color:C.muted }}>→</span>} />
          <Row label="Fiók törlése" danger onClick={() => setShowDeleteConfirm(true)} />
        </Section>

        <div style={{ textAlign:"center", color:C.dim, fontSize:11, marginTop:8 }}>NearMatch</div>
      </div>

      {showDeleteConfirm && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(8,11,16,0.92)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
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
    </div>
  );
}
