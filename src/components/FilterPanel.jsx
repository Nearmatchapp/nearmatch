import { C } from "../lib/constants.js";
import SliderTrack from "./SliderTrack.jsx";

// Modul-szintű komponens: korábban a SwipeScreen-en BELÜL volt definiálva,
// így minden renderkor remountolt (B7). A szűrő-állapot és a localStorage
// kezelése a hívónál maradt, ide propként érkezik.
export default function FilterPanel({ filters, setFilters, onClose, onApply, onReset }) {
  return (
    <div style={{ position:"absolute",inset:0,zIndex:95,background:"rgba(8,11,16,0.92)",backdropFilter:"blur(12px)",display:"flex",alignItems:"flex-end" }}>
      <div style={{ width:"100%",background:C.surface,borderRadius:"28px 28px 0 0",padding:"8px 0 0",border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",maxHeight:"88vh",overflowY:"auto",WebkitOverflowScrolling:"touch",touchAction:"pan-y" }}>
        <div style={{ width:36,height:4,borderRadius:2,background:C.border,margin:"0 auto 20px",flexShrink:0 }} />
        <div style={{ padding:"0 20px calc(40px + env(safe-area-inset-bottom))", display:"flex", flexDirection:"column", gap:24 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <span style={{ color:C.text,fontWeight:800,fontSize:18 }}>Szűrők</span>
            <button onClick={onClose} style={{ width:32,height:32,borderRadius:"50%",background:C.card,border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
          </div>

          {/* Kor - két csúszka */}
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ color:C.muted, fontSize:13, fontWeight:600 }}>Kor</span>
              <span style={{ color:C.accent, fontWeight:700, fontSize:13 }}>{filters.minAge} – {filters.maxAge} év</span>
            </div>
            <SliderTrack min={18} max={filters.maxAge - 1} value={filters.minAge} label="Min kor" unit=" év"
              onChange={v => setFilters(f => ({...f, minAge: v}))} />
            <div style={{ marginTop:4 }}>
              <SliderTrack min={filters.minAge + 1} max={80} value={filters.maxAge} label="Max kor" unit=" év"
                onChange={v => setFilters(f => ({...f, maxAge: v}))} />
            </div>
          </div>

          {/* Távolság */}
          <SliderTrack min={1} max={100} value={filters.maxDist} label="Max távolság"
            unit={filters.maxDist < 100 ? " km" : "+ km"}
            onChange={v => setFilters(f => ({...f, maxDist: v}))} />

          {/* Nem */}
          <div>
            <span style={{ color:C.muted, fontSize:13, fontWeight:600, display:"block", marginBottom:10 }}>Keresett nem</span>
            <div style={{ display:"flex", gap:8 }}>
              {["Mindenki","Nő","Férfi"].map(g => (
                <button key={g} onClick={() => setFilters(f=>({...f,gender:g}))}
                  style={{ flex:1,padding:"10px 4px",borderRadius:12,border:`1px solid ${filters.gender===g?C.accent:C.border}`,background:filters.gender===g?C.accentSoft:C.card,color:filters.gender===g?C.accent:C.muted,cursor:"pointer",fontSize:11,fontWeight:700,transition:"all 0.15s" }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Keresett kapcsolat */}
          <div>
            <span style={{ color:C.muted, fontSize:13, fontWeight:600, display:"block", marginBottom:10 }}>Keresett kapcsolat</span>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {[{l:"Bármilyen",i:"✨"},{l:"Komoly kapcsolat",i:"💍"},{l:"Laza ismerkedés",i:"🌊"},{l:"Új barátok",i:"👋"},{l:"Meglátjuk",i:"🤷"}].map(x => (
                <button key={x.l} onClick={() => setFilters(f=>({...f,lookingFor:f.lookingFor===x.l?"":x.l}))}
                  style={{ padding:"8px 12px",borderRadius:20,border:`1px solid ${filters.lookingFor===x.l?C.accent:C.border}`,background:filters.lookingFor===x.l?C.accentSoft:C.card,color:filters.lookingFor===x.l?C.accent:C.muted,cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5 }}>
                  {x.i} {x.l}
                </button>
              ))}
            </div>
          </div>

          {/* Gombok */}
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onReset}
              style={{ flex:1,padding:"14px",borderRadius:14,border:`1px solid ${C.border}`,background:"none",color:C.muted,cursor:"pointer",fontSize:14,fontWeight:600 }}>
              Visszaállít
            </button>
            <button onClick={onApply}
              style={{ flex:2,padding:"14px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${C.accent},#ff8c42)`,color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,boxShadow:`0 4px 16px ${C.accentGlow}` }}>
              Mutat →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
