import { useState, useEffect, useRef } from "react";
import { C } from "../lib/constants.js";
import GhostScoreBadge from "./GhostScoreBadge.jsx";

// Teljes képernyős profil-részletező. Eddig 3 helyen (Likeok, Radar, Chat)
// volt szó szerint bemásolva ~55 sorban — itt egyesítve. A pass/like láb
// csak akkor jelenik meg, ha onPass/onLike propot kap.
export default function ProfileDetailModal({ profile, onClose, onPass, onLike, position = "fixed", zIndex = 200 }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const rootRef = useRef(null);
  // A húzást ref-en + közvetlen DOM-transformon kezeljük (nem state-en), így
  // iOS-en is sima és megbízhatóan elsül a touchend. A tengelyt az első
  // érdemi mozdulatnál rögzítjük, hogy a függőleges görgetést ne keverjük
  // össze a visszahúzással.
  const gesture = useRef({ startX:0, startY:0, axis:null, dx:0 });
  useEffect(() => { setPhotoIdx(0); }, [profile?.id]);
  if (!profile) return null;
  const photos = profile.photos || (profile.photo_url ? [profile.photo_url] : []);

  const BACK_THRESHOLD = 90; // ennyi px vízszintes húzás után megy vissza

  const onTouchStart = (e) => {
    const t = e.touches[0];
    gesture.current = { startX:t.clientX, startY:t.clientY, axis:null, dx:0 };
  };
  const onTouchMove = (e) => {
    const g = gesture.current;
    const t = e.touches[0];
    const dx = t.clientX - g.startX;
    const dy = t.clientY - g.startY;
    if (g.axis === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; // még túl pici
      // csak jobbra húzás indít visszalépést, függőleges mozgás = görgetés
      g.axis = (Math.abs(dx) > Math.abs(dy) && dx > 0) ? "back" : "scroll";
    }
    if (g.axis === "back") {
      g.dx = Math.max(0, dx);
      const el = rootRef.current;
      if (el) {
        el.style.transition = "none";
        el.style.transform = `translateX(${g.dx}px)`;
        el.style.opacity = String(Math.max(0.35, 1 - g.dx / 600));
      }
    }
  };
  const onTouchEnd = () => {
    const g = gesture.current;
    const el = rootRef.current;
    if (g.axis === "back" && el) {
      if (g.dx > BACK_THRESHOLD) { onClose(); return; }
      el.style.transition = "transform 0.2s ease, opacity 0.2s ease";
      el.style.transform = "translateX(0)";
      el.style.opacity = "1";
    }
    g.axis = null;
  };

  // A vízszintes safe-area inset elhanyagolható, a felső a lényeg: fixed
  // módban a modal a teljes képernyőt fedi (a notch/állapotsáv alatt is),
  // ezért a vissza gomb fejlécét le kell tolni az elérhető részre.
  const headerPadTop = position === "fixed" ? "calc(14px + env(safe-area-inset-top))" : "14px";

  return (
    <div
      ref={rootRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        position, inset:0, zIndex, background:"rgba(8,11,16,0.97)", backdropFilter:"blur(8px)",
        display:"flex", flexDirection:"column",
        // a vízszintes gesztust a JS kezeli, a böngésző csak függőlegesen görget
        touchAction:"pan-y",
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:`${headerPadTop} 16px 14px`, borderBottom:`1px solid ${C.border}` }}>
        <button onClick={onClose} style={{ background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:20 }}>←</button>
        <span style={{ color:C.text, fontWeight:700, fontSize:16 }}>{profile.name}, {profile.age}</span>
      </div>
      <div style={{ flex:1, overflowY:"auto", touchAction:"pan-y" }}>
        {photos.length > 0 ? (
          <div style={{ position:"relative", width:"100%", aspectRatio:"1", background:C.card }}>
            <img src={photos[photoIdx]} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={profile.name} />
            {photos.length > 1 && (
              <>
                <div style={{ position:"absolute", top:10, left:"50%", transform:"translateX(-50%)", display:"flex", gap:4 }}>
                  {photos.map((_,i) => <div key={i} style={{ width:i===photoIdx?18:5, height:5, borderRadius:3, background:i===photoIdx?"#fff":"rgba(255,255,255,0.4)", transition:"width 0.2s" }} />)}
                </div>
                <button onClick={() => setPhotoIdx(i=>Math.max(0,i-1))} style={{ position:"absolute", left:0, top:0, bottom:0, width:"40%", background:"none", border:"none", cursor:"pointer" }} />
                <button onClick={() => setPhotoIdx(i=>Math.min(photos.length-1,i+1))} style={{ position:"absolute", right:0, top:0, bottom:0, width:"40%", background:"none", border:"none", cursor:"pointer" }} />
              </>
            )}
          </div>
        ) : (
          <div style={{ width:"100%", aspectRatio:"1", background:C.card, display:"flex", alignItems:"center", justifyContent:"center", fontSize:60 }}>👤</div>
        )}
        <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:12 }}>
          {profile.bio && (
            <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}` }}>
              <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Bio</div>
              <p style={{ color:C.text, fontSize:14, lineHeight:1.6, margin:0 }}>{profile.bio}</p>
            </div>
          )}
          <GhostScoreBadge score={profile.ghost_score} />
          {(profile.interests||[]).length > 0 && (
            <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}` }}>
              <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Érdeklődés</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {profile.interests.map(t => <span key={t} style={{ background:C.accentSoft, border:`1px solid ${C.accent}`, borderRadius:20, padding:"5px 11px", fontSize:12, color:C.accent }}>{t}</span>)}
              </div>
            </div>
          )}
          {(profile.looking_for||profile.height||profile.education) && (
            <div style={{ background:C.card, borderRadius:14, padding:"14px", border:`1px solid ${C.border}`, display:"flex", flexDirection:"column", gap:8 }}>
              {profile.looking_for && <div style={{ color:C.muted, fontSize:13 }}>💍 {profile.looking_for}</div>}
              {profile.height && <div style={{ color:C.muted, fontSize:13 }}>📏 {profile.height} cm</div>}
              {profile.education && <div style={{ color:C.muted, fontSize:13 }}>🎓 {profile.education}</div>}
            </div>
          )}
        </div>
      </div>
      {(onPass || onLike) && (
        <div style={{ display:"flex", gap:10, padding:"16px", borderTop:`1px solid ${C.border}` }}>
          <button onClick={onPass} style={{ flex:1, padding:"16px", background:C.card, border:`1px solid ${C.border}`, borderRadius:16, color:C.text, fontSize:22, cursor:"pointer" }}>✕</button>
          <button onClick={onLike} style={{ flex:2, padding:"16px", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, border:"none", borderRadius:16, color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer" }}>❤️ Lájkolom</button>
        </div>
      )}
    </div>
  );
}
