import { useState, useRef } from "react";

export default function VoicePlayer({ src, isMine }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2,"0")}`;
  };

  const accent = isMine ? "rgba(255,255,255,0.9)" : "#ff5c5c";
  const trackBg = isMine ? "rgba(255,255,255,0.25)" : "rgba(255,92,92,0.2)";
  const fillBg = isMine ? "rgba(255,255,255,0.9)" : "#ff5c5c";

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:200, padding:"2px 0" }}>
      <audio ref={audioRef} src={src} preload="metadata"
        onTimeUpdate={e => { setCurrent(e.target.currentTime); setProgress(e.target.duration ? (e.target.currentTime/e.target.duration)*100 : 0); }}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrent(0); if(audioRef.current) audioRef.current.currentTime=0; }}
      />
      <button onClick={toggle} style={{ width:36,height:36,borderRadius:"50%",background:isMine?"rgba(255,255,255,0.2)":"rgba(255,92,92,0.15)",border:`1px solid ${accent}`,color:accent,fontSize:16,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
        {playing ? "⏸" : "▶"}
      </button>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
        <div style={{ position:"relative", height:4, borderRadius:2, background:trackBg, cursor:"pointer" }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            if (audioRef.current && audioRef.current.duration) {
              audioRef.current.currentTime = pct * audioRef.current.duration;
            }
          }}>
          <div style={{ position:"absolute", left:0, top:0, height:"100%", borderRadius:2, background:fillBg, width:`${progress}%`, transition:"width 0.1s" }} />
          <div style={{ position:"absolute", top:"50%", transform:"translateY(-50%)", width:10, height:10, borderRadius:"50%", background:fillBg, left:`calc(${progress}% - 5px)`, boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:10, color:isMine?"rgba(255,255,255,0.6)":"rgba(240,244,255,0.5)" }}>{fmt(current)}</span>
          <span style={{ fontSize:10, color:isMine?"rgba(255,255,255,0.6)":"rgba(240,244,255,0.5)" }}>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}
