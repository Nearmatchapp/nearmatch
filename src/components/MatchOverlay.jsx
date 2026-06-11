import { C } from "../lib/constants.js";
import Avatar from "./Avatar.jsx";

export default function MatchOverlay({ user, onMessage, onClose }) {
  return (
    <div style={{ position:"absolute",inset:0,background:"rgba(8,11,16,0.92)",backdropFilter:"blur(8px)",zIndex:80,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px" }}>
      {/* D12/1: belépő animáció a tartalomra */}
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",width:"100%",animation:"popIn 0.3s ease" }}>
      <div style={{ fontSize:60,marginBottom:16,animation:"pulse 1s infinite" }}>🎉</div>
      <h2 style={{ fontSize:32,fontWeight:900,color:C.text,margin:"0 0 8px",fontFamily:"Georgia,serif" }}>Egymásra találtatok!</h2>
      <p style={{ color:C.muted,marginBottom:24 }}>Te és {user.name} egymásra találtatok!</p>
      <Avatar src={user.photo_url} name={user.name} size={90} style={{ border:`3px solid ${C.accent}`, marginBottom:28 }} />
      <button onClick={onMessage} style={{ width:"100%",padding:"16px",background:`linear-gradient(135deg,${C.accent},#ff8c42)`,border:"none",borderRadius:16,color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:10 }}>💬 Üzenet küldése</button>
      <button onClick={onClose} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:15 }}>Folytatom a böngészést</button>
      </div>
    </div>
  );
}
