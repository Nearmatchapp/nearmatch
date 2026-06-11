import { useState, useEffect, useRef } from "react";
import { C } from "../lib/constants.js";
import { HeartIcon } from "../components/icons.jsx";
import ProfileDetailModal from "../components/ProfileDetailModal.jsx";

function SatelliteMapView({ myProfile, visibleUsers, isPro, onSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const addMarkers = (L, map) => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    visibleUsers.forEach(u => {
      if (!u.lat || !u.lng) return;
      const name = isPro ? (u.name || "?") : "???";
      const color = isPro ? "#3ecf8e" : "#ffd43b";
      const icon = L.divIcon({
        className: "",
        html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer"><div style="background:rgba(8,11,16,0.85);border:1px solid ${color};border-radius:8px;padding:2px 7px;font-size:11px;font-weight:700;color:${color};white-space:nowrap;margin-bottom:3px">${name}</div><div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 5px ${color}"></div></div>`,
        iconSize: [60,32], iconAnchor: [30,32]
      });
      const marker = L.marker([u.lat, u.lng], { icon }).addTo(map);
      marker.on("click", () => onSelect(u));
      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (!mapRef.current) return;
    const lat = myProfile?.lat || 47.497;
    const lng = myProfile?.lng || 19.040;

    const initMap = (L) => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
      const map = L.map(mapRef.current, { zoomControl:false, attributionControl:false }).setView([lat, lng], 15);
      mapInstanceRef.current = map;
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom:19 }).addTo(map);
      const myIcon = L.divIcon({ className:"", html:`<div style="width:14px;height:14px;border-radius:50%;background:#ff5c5c;border:2px solid #fff;box-shadow:0 0 6px rgba(255,92,92,0.8)"></div>`, iconSize:[14,14], iconAnchor:[7,7] });
      L.marker([lat, lng], { icon: myIcon }).addTo(map);
      addMarkers(L, map);
    };

    if (window.L) { initMap(window.L); }
    else {
      if (!document.querySelector("link[href*=leaflet]")) {
        const link = document.createElement("link"); link.rel="stylesheet"; link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
      }
      if (!document.querySelector("script[src*=leaflet]")) {
        const script = document.createElement("script"); script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload=()=>initMap(window.L); document.head.appendChild(script);
      } else {
        const wait = setInterval(() => { if(window.L){ clearInterval(wait); initMap(window.L); } }, 100);
      }
    }
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [myProfile?.lat, myProfile?.lng]);

  useEffect(() => {
    if (window.L && mapInstanceRef.current) addMarkers(window.L, mapInstanceRef.current);
  }, [visibleUsers, isPro]);

  return (
    <div style={{ width:300, height:300, borderRadius:16, overflow:"hidden", position:"relative", flexShrink:0 }}>
      <div ref={mapRef} style={{ width:"100%", height:"100%", borderRadius:16 }} />
      <div style={{ position:"absolute", top:8, left:8, zIndex:1000, background:"rgba(8,11,16,0.8)", borderRadius:8, padding:"4px 8px", color:"#f0f4ff", fontSize:11, pointerEvents:"none" }}>🛰️ Műholdas</div>
    </div>
  );
}

export default function RadarScreen({ myProfile, nearbyUsers, isPro, boostActive, onUpgrade, onSwipe }) {
  const canvasRef = useRef(null);
  const [dots, setDots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showProWall, setShowProWall] = useState(false);
  const [satelliteMode, setSatelliteMode] = useState(false);
  const [localSwipedIds, setLocalSwipedIds] = useState(new Set());
  const [profileModal, setProfileModal] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ minAge:18, maxAge:60, maxDist:20 });
  const [activeFilters, setActiveFilters] = useState({ minAge:18, maxAge:60, maxDist:20 });
  const animRef = useRef(null);
  const angleRef = useRef(0);

  const filteredNearby = nearbyUsers.filter(u => {
    if (u.age && (u.age < activeFilters.minAge || u.age > activeFilters.maxAge)) return false;
    if (u.distanceKm != null && u.distanceKm > activeFilters.maxDist) return false;
    return true;
  });

  const visibleUsers = filteredNearby.filter(u => !localSwipedIds.has(u.id));
  const isFiltered = activeFilters.minAge !== 18 || activeFilters.maxAge !== 60 || activeFilters.maxDist !== 20;

  const handleRadarSwipe = async (userId, action) => {
    setLocalSwipedIds(prev => new Set([...prev, userId]));
    setSelected(null);
    setProfileModal(null);
    await onSwipe(userId, action);
  };

  const openProfile = (u) => setProfileModal(u);

  useEffect(() => {
    setDots(visibleUsers.map((u, i) => ({ ...u, angle: (i / Math.max(visibleUsers.length, 1)) * Math.PI * 2, r: Math.min(0.9, 0.2 + (u.distanceKm / 20) * 0.7) })));
  }, [visibleUsers.length]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); const size = canvas.width; const cx = size/2, cy = size/2;
    const draw = () => {
      ctx.clearRect(0,0,size,size);
      [0.3,0.55,0.8].forEach(r => { ctx.beginPath(); ctx.arc(cx,cy,r*(size/2),0,Math.PI*2); ctx.strokeStyle="rgba(255,92,92,0.12)"; ctx.lineWidth=1; ctx.stroke(); });
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(angleRef.current);
      const grad = ctx.createLinearGradient(0,-size/2,0,0); grad.addColorStop(0,"rgba(255,92,92,0)"); grad.addColorStop(1,"rgba(255,92,92,0.18)");
      ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,size/2,-Math.PI/2,-Math.PI/2+Math.PI*0.4); ctx.closePath(); ctx.fillStyle=grad; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(cx,cy,6,0,Math.PI*2); ctx.fillStyle=C.accent; ctx.fill();
      dots.forEach(d => {
        const x = cx+Math.cos(d.angle)*d.r*(size/2-20); const y = cy+Math.sin(d.angle)*d.r*(size/2-20);
        ctx.beginPath(); ctx.arc(x,y,selected?.id===d.id?8:5,0,Math.PI*2); ctx.fillStyle=selected?.id===d.id?C.accent:"rgba(255,92,92,0.7)"; ctx.fill();
      });
      angleRef.current += 0.015; animRef.current = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(animRef.current);
  }, [dots, selected]);

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect();
    const x = (e.clientX-rect.left)*(canvas.width/rect.width); const y = (e.clientY-rect.top)*(canvas.height/rect.height);
    const size = canvas.width; const cx=size/2, cy=size/2; let found=null;
    dots.forEach(d => { const dx=cx+Math.cos(d.angle)*d.r*(size/2-20); const dy=cy+Math.sin(d.angle)*d.r*(size/2-20); if(Math.hypot(x-dx,y-dy)<20) found=d; });
    setSelected(found);
  };

  const distLabel = (km) => km < 1 ? `${Math.round(km*1000)}m` : `${km.toFixed(1)}km`;

  return (
    <>
      {profileModal && (
        <ProfileDetailModal profile={profileModal} position="absolute" zIndex={96} onClose={() => setProfileModal(null)}
          onPass={() => handleRadarSwipe(profileModal.id, "pass")} onLike={() => handleRadarSwipe(profileModal.id, "like")} />
      )}
      {showProWall && (
        <div style={{ position:"absolute", inset:0, zIndex:95, background:"rgba(8,11,16,0.92)", backdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end" }}>
          <div style={{ width:"100%", background:C.surface, borderRadius:"28px 28px 0 0", padding:"28px 24px 40px", border:`1px solid ${C.border}` }}>
            <div style={{ textAlign:"center", marginBottom:20 }}><div style={{ fontSize:48, marginBottom:10 }}>🔒</div><h3 style={{ color:C.text, fontSize:20, fontWeight:900, margin:"0 0 8px" }}>Pro funkció</h3><p style={{ color:C.muted, fontSize:13, margin:0 }}>A Radar like küldése csak Pro tagoknak érhető el.</p></div>
            <button onClick={() => { onUpgrade(); setShowProWall(false); }} style={{ width:"100%", padding:"16px", background:"linear-gradient(135deg,#ffd43b,#ff8c42)", border:"none", borderRadius:16, color:"#000", fontSize:16, fontWeight:700, cursor:"pointer", marginBottom:10 }}>⚡ Upgrade Pro-ra</button>
            <button onClick={() => setShowProWall(false)} style={{ width:"100%", padding:"14px", background:"none", border:`1px solid ${C.border}`, borderRadius:16, color:C.muted, fontSize:15, cursor:"pointer" }}>Mégse</button>
          </div>
        </div>
      )}
      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"10px 16px", gap:10, overflowY:"scroll", WebkitOverflowScrolling:"touch", minHeight:0 }}>
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          <button onClick={() => setSatelliteMode(m => !m)} style={{ flex:1, padding:"10px 14px", borderRadius:12, border:`1px solid ${satelliteMode?"#4dabf7":C.border}`, background:satelliteMode?"rgba(77,171,247,0.12)":C.card, color:satelliteMode?"#4dabf7":C.muted, cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            🛰️ {satelliteMode?"Műholdas":"Radar"} nézet
          </button>
          <button onClick={() => setShowFilters(f => !f)} style={{ padding:"10px 14px", borderRadius:12, border:`1px solid ${isFiltered?C.accent:C.border}`, background:isFiltered?C.accentSoft:C.card, color:isFiltered?C.accent:C.muted, cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isFiltered?C.accent:C.muted} strokeWidth="2.2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="9" cy="6" r="2.5" fill={isFiltered?C.accent:"#0f1520"} stroke={isFiltered?C.accent:C.muted}/><circle cx="15" cy="12" r="2.5" fill={isFiltered?C.accent:"#0f1520"} stroke={isFiltered?C.accent:C.muted}/><circle cx="9" cy="18" r="2.5" fill={isFiltered?C.accent:"#0f1520"} stroke={isFiltered?C.accent:C.muted}/></svg>
            {isFiltered && <span style={{ width:6,height:6,borderRadius:"50%",background:C.accent }} />}
          </button>
        </div>
        {/* Radar szűrő panel */}
        {showFilters && (
          <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, padding:"16px", display:"flex", flexDirection:"column", gap:20, flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ color:C.text, fontWeight:700, fontSize:14 }}>Szűrők</span>
              {isFiltered && <button onClick={() => { const d={minAge:18,maxAge:60,maxDist:20}; setFilters(d); setActiveFilters(d); }} style={{ background:"none", border:"none", color:C.accent, cursor:"pointer", fontSize:12, fontWeight:600 }}>Visszaállít</button>}
            </div>
            {/* Kor */}
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ color:C.muted, fontSize:12, fontWeight:600 }}>Kor</span>
                <span style={{ color:C.accent, fontWeight:700, fontSize:12 }}>{filters.minAge} – {filters.maxAge} év</span>
              </div>
              {[
                { label:"Min", min:18, max:filters.maxAge-1, val:filters.minAge, key:"minAge" },
                { label:"Max", min:filters.minAge+1, max:80, val:filters.maxAge, key:"maxAge" },
              ].map(s => {
                const pct = Math.round(((s.val - s.min) / (s.max - s.min)) * 100);
                return (
                  <div key={s.key} style={{ position:"relative", height:32, display:"flex", alignItems:"center", marginBottom:4 }}>
                    <div style={{ position:"absolute", left:0, right:0, height:3, borderRadius:2, background:"rgba(255,255,255,0.08)" }} />
                    <div style={{ position:"absolute", left:0, width:`${pct}%`, height:3, borderRadius:2, background:`linear-gradient(90deg,${C.accent},#ff8c42)` }} />
                    <input type="range" min={s.min} max={s.max} value={s.val} step={1}
                      onChange={e => { const v={...filters,[s.key]:+e.target.value}; setFilters(v); setActiveFilters(v); }}
                      style={{ position:"absolute",left:0,right:0,width:"100%",appearance:"none",WebkitAppearance:"none",background:"transparent",outline:"none",cursor:"pointer",margin:0,padding:0 }} />
                  </div>
                );
              })}
            </div>
            {/* Távolság */}
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ color:C.muted, fontSize:12, fontWeight:600 }}>Max távolság</span>
                <span style={{ color:C.accent, fontWeight:700, fontSize:12 }}>{filters.maxDist} km</span>
              </div>
              <div style={{ position:"relative", height:32, display:"flex", alignItems:"center" }}>
                <div style={{ position:"absolute", left:0, right:0, height:3, borderRadius:2, background:"rgba(255,255,255,0.08)" }} />
                <div style={{ position:"absolute", left:0, width:`${Math.round(((filters.maxDist-1)/19)*100)}%`, height:3, borderRadius:2, background:`linear-gradient(90deg,${C.accent},#ff8c42)` }} />
                <input type="range" min={1} max={20} value={filters.maxDist} step={1}
                  onChange={e => { const v={...filters,maxDist:+e.target.value}; setFilters(v); setActiveFilters(v); }}
                  style={{ position:"absolute",left:0,right:0,width:"100%",appearance:"none",WebkitAppearance:"none",background:"transparent",outline:"none",cursor:"pointer",margin:0,padding:0 }} />
              </div>
            </div>
          </div>
        )}
        {boostActive && (
          <div style={{ background:"linear-gradient(135deg,rgba(255,212,59,0.12),rgba(255,140,66,0.12))", border:"1px solid rgba(255,212,59,0.4)", borderRadius:13, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>⚡</span>
            <div style={{ flex:1 }}><div style={{ color:C.yellow, fontWeight:700, fontSize:13 }}>Kiemelés aktív</div></div>
            <div style={{ width:8, height:8, borderRadius:"50%", background:C.green, boxShadow:"0 0 6px #3ecf8e" }} />
          </div>
        )}
        <div style={{ position:"relative", display:"flex", justifyContent:"center" }}>
          {satelliteMode ? (
            <SatelliteMapView myProfile={myProfile} visibleUsers={visibleUsers} isPro={isPro} onSelect={setSelected} />
          ) : (
            <canvas ref={canvasRef} width={300} height={300} onClick={handleCanvasClick} style={{ borderRadius:"50%", cursor:"crosshair", width:300, height:300, flexShrink:0 }} />
          )}
          {selected && (
            <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", background:C.surface, borderRadius:14, border:`1px solid ${C.border}`, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, minWidth:230 }}>
              {isPro ? (<img src={selected.photo_url||`https://i.pravatar.cc/300?u=${selected.id}`} style={{ width:42, height:42, borderRadius:"50%", objectFit:"cover" }} alt={selected.name} />) : (<div style={{ width:42, height:42, borderRadius:"50%", background:C.card, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🔒</div>)}
              <div style={{ flex:1 }}>
                {isPro ? (<><div style={{ color:C.text, fontWeight:700 }}>{selected.name}, {selected.age}</div><div style={{ color:C.accent, fontSize:12 }}>● {distLabel(selected.distanceKm)}</div></>) : (<><div style={{ color:C.text, fontWeight:700 }}>Ismeretlen profil</div><div style={{ color:C.accent, fontSize:12 }}>● {distLabel(selected.distanceKm)}</div></>)}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={() => { if(!isPro){setShowProWall(true);return;} handleRadarSwipe(selected.id,"pass"); }} style={{ width:34, height:34, borderRadius:"50%", background:C.card, border:`1px solid ${C.border}`, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                <button onClick={() => { if(!isPro){setShowProWall(true);return;} handleRadarSwipe(selected.id,"like"); }} style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, border:"none", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}><HeartIcon size={16} color="#fff" /></button>
              </div>
            </div>
          )}
        </div>
        {!isPro && (
          <div style={{ background:"rgba(255,212,59,0.08)", border:"1px solid rgba(255,212,59,0.25)", borderRadius:13, padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>🔒</span>
            <div style={{ flex:1 }}><div style={{ color:C.yellow, fontWeight:700, fontSize:13 }}>Profilok rejtve</div><div style={{ color:C.dim, fontSize:11 }}>Pro-val látod ki van közel és likeolhatsz</div></div>
            <button onClick={onUpgrade} style={{ background:"linear-gradient(135deg,#ffd43b,#ff8c42)", border:"none", borderRadius:10, color:"#000", padding:"8px 12px", cursor:"pointer", fontSize:12, fontWeight:700 }}>Upgrade</button>
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {visibleUsers.length === 0 && <div style={{ textAlign:"center", padding:"20px", color:C.muted, fontSize:13 }}>Nincs senki a közelben 😕</div>}
          {visibleUsers.map(u => (
            <div key={u.id} onClick={() => isPro && openProfile(u)} style={{ display:"flex", alignItems:"center", gap:10, background:C.card, borderRadius:13, padding:"10px 14px", border:`1px solid ${C.border}`, cursor:isPro?"pointer":"default" }}>
              {isPro ? (<img src={u.photo_url||`https://i.pravatar.cc/300?u=${u.id}`} style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover" }} alt={u.name} />) : (<div style={{ width:40, height:40, borderRadius:"50%", background:C.surface, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, border:`1px solid ${C.border}`, flexShrink:0 }}>🔒</div>)}
              <div style={{ flex:1 }}>
                {isPro ? (<><div style={{ color:C.text, fontWeight:600, fontSize:14 }}>{u.name}, {u.age}</div><div style={{ color:C.accent, fontSize:11 }}>● {distLabel(u.distanceKm)}</div></>) : (<><div style={{ color:C.muted, fontWeight:600, fontSize:14 }}>Rejtett profil</div><div style={{ color:C.accent, fontSize:11 }}>● {distLabel(u.distanceKm)}</div></>)}
              </div>
              {isPro ? (
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={(e) => { e.stopPropagation(); handleRadarSwipe(u.id,"pass"); }} style={{ width:44, height:44, borderRadius:"50%", background:C.surface, border:`1px solid ${C.border}`, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
                  <button onClick={(e) => { e.stopPropagation(); handleRadarSwipe(u.id,"like"); }} style={{ width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, border:"none", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", flexShrink:0 }}><HeartIcon size={16} color="#fff" /></button>
                </div>
              ) : (
                <button onClick={onUpgrade} style={{ background:"rgba(255,212,59,0.1)", border:"1px solid rgba(255,212,59,0.3)", color:C.yellow, borderRadius:10, padding:"7px 12px", cursor:"pointer", fontSize:12, fontWeight:600 }}>🔒 Pro</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

