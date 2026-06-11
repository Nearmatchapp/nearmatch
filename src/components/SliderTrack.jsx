import { C } from "../lib/constants.js";

// Modul-szintű komponens: korábban a SwipeScreen-en BELÜL volt definiálva,
// így minden renderkor új komponenstípus jött létre → a React unmount/
// remountolta a DOM-ot, a csúszka húzás közben megszakadt (B7).
export default function SliderTrack({ min, max, value, onChange, label, unit="" }) {
    const pct = Math.round(((value - min) / (max - min)) * 100);
    return (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
          <span style={{ color:C.muted, fontSize:13 }}>{label}</span>
          <span style={{ color:C.accent, fontWeight:700, fontSize:13 }}>{value}{unit}</span>
        </div>
        <div style={{ position:"relative", height:36, display:"flex", alignItems:"center" }}>
          {/* Track háttér */}
          <div style={{ position:"absolute", left:0, right:0, height:4, borderRadius:2, background:"rgba(255,255,255,0.1)" }} />
          {/* Aktív sáv */}
          <div style={{ position:"absolute", left:0, width:`${pct}%`, height:4, borderRadius:2, background:`linear-gradient(90deg,${C.accent},#ff8c42)` }} />
          <input
            type="range" min={min} max={max} value={value} step={1}
            onChange={e => onChange(+e.target.value)}
            style={{
              position:"absolute", left:0, right:0, width:"100%",
              appearance:"none", WebkitAppearance:"none",
              background:"transparent", outline:"none", cursor:"pointer", margin:0, padding:0,
            }}
          />
        </div>
        <style>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 26px; height: 26px;
            border-radius: 50%;
            background: #fff;
            border: 3px solid ${C.accent};
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(255,92,92,0.4);
          }
          input[type=range]::-moz-range-thumb {
            width: 26px; height: 26px;
            border-radius: 50%;
            background: #fff;
            border: 3px solid ${C.accent};
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(255,92,92,0.4);
          }
          input[type=range]::-webkit-slider-runnable-track { background: transparent; }
          input[type=range]::-moz-range-track { background: transparent; }
        `}</style>
      </div>
    );
}
