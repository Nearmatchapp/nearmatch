import { useEffect } from "react";
import { C } from "../lib/constants.js";

// Egységes hibajelző a natív alert() helyett (C8) — a meglévő toast-minta
// stílusában, automatikus eltűnéssel
export default function ToastNotice({ message, onClose, duration = 4000 }) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);
  if (!message) return null;
  return (
    <div style={{ position:"absolute", top:12, left:12, right:12, zIndex:400, background:C.card, borderRadius:16, padding:"12px 14px", border:"1px solid rgba(255,92,92,0.4)", boxShadow:"0 8px 32px rgba(0,0,0,0.4)", display:"flex", alignItems:"center", gap:10, animation:"slideDown 0.3s ease" }}>
      <span style={{ fontSize:18, flexShrink:0 }}>⚠️</span>
      <div style={{ flex:1, color:C.text, fontSize:13, lineHeight:1.5 }}>{message}</div>
      <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:18, flexShrink:0, padding:6 }}>✕</button>
    </div>
  );
}
