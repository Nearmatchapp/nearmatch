import { useState, useEffect } from "react";
import { C } from "../lib/constants.js";
import GhostScoreBadge from "./GhostScoreBadge.jsx";

// Teljes képernyős profil-részletező. Eddig 3 helyen (Likeok, Radar, Chat)
// volt szó szerint bemásolva ~55 sorban — itt egyesítve. A pass/like láb
// csak akkor jelenik meg, ha onPass/onLike propot kap.
export default function ProfileDetailModal({ profile, onClose, onPass, onLike, position = "fixed", zIndex = 200 }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  useEffect(() => { setPhotoIdx(0); }, [profile?.id]);
  if (!profile) return null;
  const photos = profile.photos || (profile.photo_url ? [profile.photo_url] : []);

  return (
    <div style={{ position, inset:0, zIndex, background:"rgba(8,11,16,0.97)", backdropFilter:"blur(8px)", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:`1px solid ${C.border}` }}>
        <button onClick={onClose} style={{ background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:20 }}>←</button>
        <span style={{ color:C.text, fontWeight:700, fontSize:16 }}>{profile.name}, {profile.age}</span>
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
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
