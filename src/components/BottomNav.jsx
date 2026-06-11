import { C } from "../lib/constants.js";

export default function BottomNav({ active, setActive, unreadCount, newLikesCount }) {
  const tabs = [
    { id:"radar", icon:"◎", label:"Radar" },
    { id:"swipe", icon:"❤️", label:"Swipe" },
    { id:"likeok", icon:"🔥", label:"Likeok" },
    { id:"matches", icon:"💬", label:"Matchek" },
    { id:"profile", icon:"👤", label:"Profil" },
  ];
  return (
    <div style={{ display:"flex", borderTop:`1px solid ${C.border}`, background:C.surface, flexShrink:0, paddingBottom:"env(safe-area-inset-bottom)" }}>
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
