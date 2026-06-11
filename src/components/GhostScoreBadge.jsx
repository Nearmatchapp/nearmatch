import { getGhostLabel } from "../lib/utils.js";

// score prop-ot kap közvetlenül a profile objektumból
export default function GhostScoreBadge({ score }) {
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
