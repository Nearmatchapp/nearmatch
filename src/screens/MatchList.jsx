import { C } from "../lib/constants.js";
import Avatar from "../components/Avatar.jsx";

export default function MatchList({ matches, onOpen, isPro, onUpgrade }) {
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
            <Avatar src={m.other?.photo_url} name={m.other?.name} size={52} />
            {(() => { const diffMin = m.other?.last_seen ? Math.floor((Date.now()-new Date(m.other.last_seen).getTime())/60000) : 999; return diffMin < 5 ? <div style={{ position:"absolute",bottom:1,right:1,width:11,height:11,borderRadius:"50%",background:C.green,border:`2px solid ${C.bg}` }} /> : null; })()}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex",justifyContent:"space-between" }}><span style={{ color:C.text,fontWeight:700 }}>{m.other?.name}</span><span style={{ color:C.muted,fontSize:11 }}>{m.timeLabel}</span></div>
            <div style={{ color:C.muted,fontSize:13,marginTop:2 }}>{m.lastMsg||"Kezdj el beszélgetni! 👋"}</div>
          </div>
          {m.unread&&<div style={{ width:8,height:8,borderRadius:"50%",background:C.accent,flexShrink:0 }} />}
        </div>
      ))}
    </div>
  );
}
