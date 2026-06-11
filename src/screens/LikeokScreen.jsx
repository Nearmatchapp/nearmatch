import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { C } from "../lib/constants.js";
import Spinner from "../components/Spinner.jsx";
import { HeartIcon } from "../components/icons.jsx";
import ProfileDetailModal from "../components/ProfileDetailModal.jsx";
import Avatar from "../components/Avatar.jsx";

// Fix paletta a free nézet elmosott rácsához — korábban Math.random()
// minden rendernél új színeket sorsolt, ettől villogott (C9)
const BLUR_GRADIENTS = [
  "linear-gradient(135deg,#3b2a4d,#1d3a5f)",
  "linear-gradient(135deg,#4d2a2a,#5f3a1d)",
  "linear-gradient(135deg,#2a4d3b,#1d5f4a)",
  "linear-gradient(135deg,#2a2f4d,#5f1d4a)",
  "linear-gradient(135deg,#4d452a,#1d2f5f)",
  "linear-gradient(135deg,#43122e,#0f3460)",
];

export default function LikeokScreen({ myId, isPro, onUpgrade, onSwipe }) {
  const [likers, setLikers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [profileModal, setProfileModal] = useState(null);

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

      // Kitiltott lájkolók kizárása (számlálóból és listából is)
      let bannedIds = new Set();
      if (filtered.length > 0) {
        const { data: banned } = await supabase.from("profiles").select("id")
          .in("id", filtered.map(s => s.swiper_id)).eq("is_banned", true);
        bannedIds = new Set((banned||[]).map(b => b.id));
      }
      const visible = filtered.filter(s => !bannedIds.has(s.swiper_id));
      setCount(visible.length);

      if (isPro) {
        const ids = visible.map(s => s.swiper_id);
        if (ids.length > 0) {
          const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids);
          const withAction = (profiles||[]).filter(p => !p.is_banned).map(p => ({
            ...p,
            action: visible.find(s => s.swiper_id === p.id)?.action
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

      {profileModal && (
        <ProfileDetailModal profile={profileModal} onClose={() => setProfileModal(null)}
          onPass={() => handleAction(profileModal.id, "pass")} onLike={() => handleAction(profileModal.id, "like")} />
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
                <div key={i} style={{ aspectRatio:"1", borderRadius:16, background:BLUR_GRADIENTS[i % BLUR_GRADIENTS.length], display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>
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
            <div key={u.id} onClick={() => setProfileModal(u)} style={{ display:"flex", alignItems:"center", gap:12, background:C.card, borderRadius:16, padding:"12px 14px", border:`1px solid ${C.border}`, cursor:"pointer" }}>
              <div style={{ position:"relative" }}>
                <Avatar src={u.photo_url} name={u.name} size={56} />
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
                <button onClick={(e) => { e.stopPropagation(); handleAction(u.id, "like"); }} style={{ width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, border:"none", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><HeartIcon size={18} color="#fff" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
