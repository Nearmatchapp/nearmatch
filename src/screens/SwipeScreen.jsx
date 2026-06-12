import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabase.js";
import { C } from "../lib/constants.js";
import { getTodayKey } from "../lib/utils.js";
import { HeartIcon, NearMatchCard, FilterIcon } from "../components/icons.jsx";
import FilterPanel from "../components/FilterPanel.jsx";
import GhostScoreBadge from "../components/GhostScoreBadge.jsx";
import CardsModal from "./CardsModal.jsx";
import Avatar from "../components/Avatar.jsx";

const THRESHOLD = 100;

export default function SwipeScreen({ myProfile, swipeUsers, onSwipe, onUnswipe, boostActive, isPro, onUpgrade, onOpenChat }) {
  const [idx, setIdx] = useState(0);
  const [history, setHistory] = useState([]);
  const [cardPage, setCardPage] = useState(0);
  const [gone, setGone] = useState(false);
  // Drag állapot ref-ekben + rAF-fel közvetlenül a DOM-ra írva (D2):
  // korábban minden pointer-mozdulat setState-elt → teljes screen-render
  // ujjkövetésenként, ettől volt darabos a húzás
  const dragRef = useRef({ x:0, y:0 });
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const rafRef = useRef(null);
  const cardRef = useRef(null);
  const likeRef = useRef(null);
  const passRef = useRef(null);
  // A swipe-olt user pillanatképe a kirepülő animáció idejére — a szülő a
  // listából azonnal eltávolítja, e nélkül a repülő kártya tartalma átváltana
  const [leaving, setLeaving] = useState(null);
  // Szív-burst lájkoláskor (D12/2) — a kulcs az újraindításhoz timestamp
  const [burst, setBurst] = useState(null);
  const [actionLabel, setActionLabel] = useState(null);
  const [proWallType, setProWallType] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [myCards, setMyCards] = useState([]);
  const [giveCardModal, setGiveCardModal] = useState(false);
  const [givingCard, setGivingCard] = useState(false);
  const DEFAULT_FILTERS = { minAge:18, maxAge:60, maxDist:50, gender:"Mindenki", lookingFor:"" };
  const loadSavedFilters = () => {
    try { const s = localStorage.getItem("swipeFilters"); return s ? JSON.parse(s) : DEFAULT_FILTERS; }
    catch { return DEFAULT_FILTERS; }
  };
  const [filters, setFilters] = useState(loadSavedFilters);
  const [activeFilters, setActiveFilters] = useState(loadSavedFilters);
  const startPos = useRef(null);

  const loadMyCards = useCallback(async () => {
    if (!myProfile?.id) return;
    const { data } = await supabase.from("compliment_cards")
      .select("*").eq("sender_id", myProfile.id).eq("is_mine_to_give", true)
      .is("given_to", null);
    setMyCards(data || []);
  }, [myProfile?.id]);

  useEffect(() => { loadMyCards(); }, [loadMyCards]);

  const slLimit = isPro ? 5 : 1;
  const [slUsed, setSlUsed] = useState(0);
  const [slDay, setSlDay] = useState(getTodayKey());
  const slLeft = getTodayKey()!==slDay ? slLimit : Math.max(0, slLimit-slUsed);

  useEffect(() => setIdx(0), [activeFilters]);

  const filteredUsers = swipeUsers.filter(u => {
    if (u.age && (u.age < activeFilters.minAge || u.age > activeFilters.maxAge)) return false;
    if (u.distanceKm != null && u.distanceKm > activeFilters.maxDist) return false;
    if (activeFilters.gender !== "Mindenki" && u.gender && u.gender !== activeFilters.gender) return false;
    if (activeFilters.lookingFor && activeFilters.lookingFor !== "Bármilyen" && u.looking_for && u.looking_for !== activeFilters.lookingFor) return false;
    return true;
  });

  const isFiltered = activeFilters.minAge !== 18 || activeFilters.maxAge !== 60 || activeFilters.maxDist !== 50 || activeFilters.gender !== "Mindenki" || !!activeFilters.lookingFor;

  // Fotólapozó nullázása, amikor másik user kerül a pakli tetejére
  const displayedId = (leaving?.user || (filteredUsers.length ? filteredUsers[idx % filteredUsers.length] : null))?.id;
  useEffect(() => setCardPage(0), [displayedId]);

  const applyFilters = () => { setActiveFilters(filters); localStorage.setItem("swipeFilters", JSON.stringify(filters)); setShowFilters(false); };
  const resetFilters = () => { setFilters(DEFAULT_FILTERS); setActiveFilters(DEFAULT_FILTERS); localStorage.setItem("swipeFilters", JSON.stringify(DEFAULT_FILTERS)); setShowFilters(false); };
  const filterPanel = showFilters && (
    <FilterPanel filters={filters} setFilters={setFilters} onClose={() => setShowFilters(false)} onApply={applyFilters} onReset={resetFilters} />
  );

  if (!filteredUsers.length && !leaving) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", flex:1, flexDirection:"column", gap:16, padding:"0 24px", position:"relative" }}>
      {filterPanel}
      <div style={{ fontSize:50 }}>😕</div>
      <div style={{ fontSize:16, color:C.text }}>Nincs találat</div>
      <div style={{ fontSize:13, color:C.muted, textAlign:"center" }}>{isFiltered ? "Próbálj tágabb szűrőkkel!" : "Próbálj később!"}</div>
      {isFiltered && <button onClick={resetFilters} style={{ padding:"12px 24px",borderRadius:14,border:"none",background:C.accent,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14 }}>Szűrők törlése</button>}
    </div>
  );

  // Animáció alatt a kirepülő kártyát mutatjuk; alatta már az új pakli-első
  const baseCur = filteredUsers.length ? filteredUsers[idx % filteredUsers.length] : null;
  const cur = leaving?.user || baseCur;
  const next = leaving ? baseCur : (filteredUsers.length > 1 ? filteredUsers[(idx+1) % filteredUsers.length] : null);
  const showLabel = (label) => { setActionLabel(label); setTimeout(() => setActionLabel(null), 900); };

  const act = (dir) => {
    if (gone || !cur) return;
    setGone(true);
    setLeaving({ user: cur });
    setHistory(h => [...h.slice(-9), { user: cur }]);
    // Kirepülés közvetlenül a DOM-on: like/superlike jobbra, pass balra
    // (húzásnál a húzás iránya dönt)
    const x = dragRef.current.x;
    const flyRight = x !== 0 ? x > 0 : dir !== "pass";
    const el = cardRef.current;
    if (el) {
      el.style.transition = "transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)";
      el.style.transform = `translateX(${flyRight?600:-600}px) rotate(${flyRight?25:-25}deg)`;
    }
    onSwipe(cur.id, dir);
    if (dir === "like" || dir === "superlike") {
      setBurst(Date.now());
      setTimeout(() => setBurst(null), 750);
    }
    if (dir==="superlike") {
      const today = getTodayKey();
      if (today!==slDay) { setSlDay(today); setSlUsed(1); } else { setSlUsed(u=>u+1); }
    }
    setTimeout(() => {
      // A szülő már kivette a listából — az idx marad, a pakli lép magától
      setCardPage(0);
      dragRef.current = { x:0, y:0 };
      setGone(false);
      setLeaving(null);
    }, 320);
  };

  const handleRewind = () => {
    if (!isPro) { setProWallType("rewind"); return; }
    if (history.length===0) return;
    const prev = history[history.length-1];
    setHistory(h=>h.slice(0,-1));
    // A swipe a DB-ből is törlődik, a user a pakli elejére kerül vissza
    onUnswipe && onUnswipe(prev.user);
    setIdx(0);
    setCardPage(0);
  };

  // A húzás React-render nélkül, közvetlenül a DOM-ra írva fut (D2)
  const applyDrag = () => {
    rafRef.current = null;
    const el = cardRef.current; if (!el) return;
    const { x, y } = dragRef.current;
    el.style.transition = "none";
    el.style.transform = `translateX(${x}px) translateY(${y*0.3}px) rotate(${x/15}deg)`;
    if (likeRef.current) likeRef.current.style.opacity = Math.max(0, x/THRESHOLD);
    if (passRef.current) passRef.current.style.opacity = Math.max(0, -x/THRESHOLD);
  };
  const scheduleDrag = () => { if (rafRef.current == null) rafRef.current = requestAnimationFrame(applyDrag); };
  const resetCardPosition = () => {
    dragRef.current = { x:0, y:0 };
    const el = cardRef.current; if (!el) return;
    el.style.transition = "transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)";
    el.style.transform = "translateX(0px) translateY(0px) rotate(0deg)";
    if (likeRef.current) likeRef.current.style.opacity = 0;
    if (passRef.current) passRef.current.style.opacity = 0;
  };
  const beginDrag = (x, y) => { startPos.current = { x, y }; draggingRef.current = true; movedRef.current = false; };
  const moveDrag = (x, y) => {
    if (!draggingRef.current || !startPos.current) return;
    dragRef.current = { x: x - startPos.current.x, y: y - startPos.current.y };
    if (Math.abs(dragRef.current.x) > 5) movedRef.current = true;
    scheduleDrag();
  };
  const release = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const x = dragRef.current.x;
    startPos.current = null;
    if (x > THRESHOLD) { showLabel("LIKE"); act("like"); }
    else if (x < -THRESHOLD) { showLabel("PASS"); act("pass"); }
    else resetCardPosition();
  };
  const onMouseDown = (e) => beginDrag(e.clientX, e.clientY);
  const onMouseMove = (e) => moveDrag(e.clientX, e.clientY);
  const onMouseUp = () => release();
  const onTouchStart = (e) => { const t=e.touches[0]; beginDrag(t.clientX, t.clientY); };
  const onTouchMove = (e) => { const t=e.touches[0]; moveDrag(t.clientX, t.clientY); };
  const onTouchEnd = () => release();

  const handleGiveCard = async (card) => {
    if (!cur || givingCard) return;
    setGivingCard(true);
    // A kártya szövege marad, csak a nemspecifikus szavakat igazítjuk a célszemélyhez
    let finalText = card.card_text;
    if (cur.gender === "Férfi" || cur.gender === "male") {
      finalText = finalText.replace(/legszebb lány/gi, "legszebb fiú").replace(/legsugárzóbb ember/gi, "legszebb fiú");
    } else if (cur.gender === "Nő" || cur.gender === "female") {
      finalText = finalText.replace(/legszebb fiú/gi, "legszebb lány").replace(/legsugárzóbb ember/gi, "legszebb lány");
    }
    await supabase.from("compliment_cards").insert({
      sender_id: myProfile.id,
      receiver_id: cur.id,
      card_text: finalText,
      category: card.category,
      is_mine_to_give: false,
    });
    await supabase.from("compliment_cards").update({ given_to: cur.id, given_at: new Date().toISOString() }).eq("id", card.id);
    setMyCards(prev => prev.filter(c => c.id !== card.id));
    setGiveCardModal(false);
    setGivingCard(false);
    setActionLabel("🃏 KÁRTYA ELKÜLDVE!");
    setTimeout(() => setActionLabel(null), 1200);
  };

  const distLabel = (km) => km!=null ? (km<1?`${Math.round(km*1000)}m`:`${km.toFixed(1)}km`) : "";

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",padding:"4px 8px 8px",userSelect:"none",position:"relative" }} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      {filterPanel}
      {showCards && <CardsModal myId={myProfile?.id} isPro={isPro} onClose={() => { setShowCards(false); loadMyCards(); }} onUpgrade={onUpgrade} onOpenChat={onOpenChat} />}

      {/* Kártya odaadás modal */}
      {giveCardModal && (() => {
        return (
          <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.88)", display:"flex", flexDirection:"column" }} onClick={e => e.target===e.currentTarget && setGiveCardModal(false)}>
            <div style={{ marginTop:"auto", background:C.surface, borderRadius:"24px 24px 0 0", padding:"20px 16px 40px" }}>
              <div style={{ width:40, height:4, borderRadius:2, background:C.border, margin:"0 auto 20px" }} />
              <div style={{ fontWeight:800, fontSize:17, color:C.text, marginBottom:6 }}>Melyik kártyát adod oda?</div>
              <div style={{ color:C.muted, fontSize:13, marginBottom:20 }}>
                {cur?.name} megkapja, felfedés után látja hogy tőled jött 💌
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {myCards.map(card => (
                  <button key={card.id} onClick={() => handleGiveCard(card)} disabled={givingCard}
                    style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:16, background:C.card, border:`1px solid rgba(255,140,66,0.3)`, cursor:givingCard?"wait":"pointer", textAlign:"left", opacity:givingCard?0.5:1, transition:"opacity 0.2s" }}>
                    <NearMatchCard size={0.55} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, color:C.orange, fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>{card.category}</div>
                      <div style={{ color:C.text, fontSize:13, fontWeight:600, lineHeight:1.4 }}>"{card.card_text}"</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setGiveCardModal(false)} style={{ width:"100%", marginTop:14, padding:"13px", borderRadius:14, border:`1px solid ${C.border}`, background:"none", color:C.muted, fontSize:14, cursor:"pointer" }}>Mégse</button>
            </div>
          </div>
        );
      })()}
      {/* Gombok sor */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexShrink:0 }}>
        <button onClick={() => setShowCards(true)} style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:20,border:`1px solid rgba(255,92,92,0.3)`,background:"rgba(255,92,92,0.08)",color:C.accent,cursor:"pointer",fontSize:13,fontWeight:600 }}>
          <NearMatchCard size={0.28} />
          Kártyák
        </button>
        <button onClick={() => setShowFilters(true)} style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 16px",borderRadius:20,border:`1px solid ${isFiltered?C.accent:C.border}`,background:isFiltered?C.accentSoft:C.card,color:isFiltered?C.accent:C.muted,cursor:"pointer",fontSize:13,fontWeight:600 }}>
          <FilterIcon active={isFiltered} />
          Szűrők {isFiltered && <span style={{ width:6,height:6,borderRadius:"50%",background:C.accent,display:"inline-block" }} />}
        </button>
      </div>
      {proWallType && (
        <div style={{ position:"absolute",inset:0,zIndex:95,background:"rgba(8,11,16,0.92)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end" }}>
          <div style={{ width:"100%",background:C.surface,borderRadius:"28px 28px 0 0",padding:"28px 24px 40px",border:`1px solid ${C.border}` }}>
            <div style={{ textAlign:"center",marginBottom:20 }}><div style={{ fontSize:48,marginBottom:10 }}>{proWallType==="rewind"?"↩️":"⭐"}</div><h3 style={{ color:C.text,fontSize:20,fontWeight:900,margin:"0 0 8px" }}>{proWallType==="rewind"?"Visszatekerés — Pro":"Super Like elfogyott"}</h3></div>
            <button onClick={() => { onUpgrade(); setProWallType(null); }} style={{ width:"100%",padding:"16px",background:"linear-gradient(135deg,#ffd43b,#ff8c42)",border:"none",borderRadius:16,color:"#000",fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:10 }}>⚡ Upgrade Pro-ra</button>
            <button onClick={() => setProWallType(null)} style={{ width:"100%",padding:"14px",background:"none",border:`1px solid ${C.border}`,borderRadius:16,color:C.muted,fontSize:15,cursor:"pointer" }}>Mégse</button>
          </div>
        </div>
      )}
      <div style={{ flex:1,position:"relative",minHeight:0 }}>
        {burst && (
          <div key={burst} style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none", zIndex:30 }}>
            {[...Array(6)].map((_, i) => {
              const ang = (i / 6) * Math.PI * 2 - Math.PI / 2;
              return <span key={i} style={{ position:"absolute", fontSize:26, "--bx": `${Math.round(Math.cos(ang)*90)}px`, "--by": `${Math.round(Math.sin(ang)*90 - 30)}px`, animation:"burstFly 0.7s ease-out forwards" }}>❤️</span>;
            })}
          </div>
        )}
        {next && (
          <div style={{ position:"absolute",inset:0,borderRadius:24,overflow:"hidden",transform:gone?"scale(1)":"scale(0.95)",opacity:gone?1:0.7,transition:"transform 0.32s ease, opacity 0.32s ease" }}>
            {next.photo_url ? (
              <img src={next.photo_url} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt={next.name} />
            ) : (
              <div style={{ width:"100%",height:"100%",background:"linear-gradient(135deg,#1a2340,#0d1525)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:72,fontWeight:900,color:"rgba(255,255,255,0.25)" }}>{(next.name||"?").slice(0,2).toUpperCase()}</div>
            )}
            <div style={{ position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 50%)" }} />
          </div>
        )}
        <div key={cur.id} ref={cardRef} onMouseDown={onMouseDown} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          onClick={(e) => {
            if(movedRef.current) return;
            const rect=e.currentTarget.getBoundingClientRect();
            const x=e.clientX-rect.left;
            const photos = cur.photos||(cur.photo_url?[cur.photo_url]:[]);
            const totalPages = photos.length + 1; // +1 az adatlap
            if(x > rect.width*0.5) setCardPage(p=>Math.min(p+1, totalPages-1));
            else setCardPage(p=>Math.max(p-1,0));
          }}
          style={{ position:"absolute",inset:0,borderRadius:24,overflow:"hidden",background:C.card,cursor:"grab" }}>
          {(() => {
            const photos = cur.photos||(cur.photo_url?[cur.photo_url]:[]);
            const totalPages = photos.length;
            return (
              <>
                <div style={{ position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4,zIndex:10 }}>
                  {[...photos, "info"].map((_, p) => <div key={p} style={{ width:p===cardPage?20:6,height:6,borderRadius:3,background:p===cardPage?"#fff":"rgba(255,255,255,0.4)",transition:"width 0.2s" }} />)}
                </div>
                {cardPage < photos.length ? (
                  <>
                    {/* Háttér: elmosott kitöltés */}
                    <img src={photos[cardPage]} style={{ width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0,filter:"blur(28px) brightness(0.55)",transform:"scale(1.15)" }} alt="" aria-hidden="true" />
                    {/* Előtér: teljes kép, levágás nélkül */}
                    <img src={photos[cardPage]} style={{ width:"100%",height:"100%",objectFit:"contain",position:"absolute",inset:0 }} alt={cur.name} />
                  </>
                ) : null}
              </>
            );
          })()}
          {cardPage < (cur.photos||(cur.photo_url?[cur.photo_url]:[])).length ? (
            <>
              {/* Felső fade */}
              <div style={{ position:"absolute",top:0,left:0,right:0,height:120,background:"linear-gradient(to bottom,rgba(8,11,16,0.55) 0%,transparent 100%)",pointerEvents:"none" }} />
              {/* Alsó fade – a szöveg és gombok olvashatóságához */}
              <div style={{ position:"absolute",bottom:0,left:0,right:0,height:"50%",background:"linear-gradient(to top,rgba(8,11,16,0.92) 0%,rgba(8,11,16,0.7) 30%,rgba(8,11,16,0.3) 60%,transparent 100%)",pointerEvents:"none" }} />
              {cur.distanceKm!=null && <div style={{ position:"absolute",top:14,right:14,background:C.accent,borderRadius:10,padding:"4px 10px",fontSize:12,color:"#fff",fontWeight:700 }}>● {distLabel(cur.distanceKm)}</div>}
              <div ref={likeRef} style={{ position:"absolute",top:30,left:20,border:"3px solid #3ecf8e",borderRadius:12,padding:"6px 16px",color:"#3ecf8e",fontSize:22,fontWeight:900,opacity:0,transform:"rotate(-15deg)" }}>LIKE</div>
              <div ref={passRef} style={{ position:"absolute",top:30,right:20,border:"3px solid #ff5c5c",borderRadius:12,padding:"6px 16px",color:"#ff5c5c",fontSize:22,fontWeight:900,opacity:0,transform:"rotate(15deg)" }}>PASS</div>
              <div style={{ position:"absolute",bottom:0,left:0,right:0,padding:"16px 20px 18px" }}>
                <div style={{ display:"flex",alignItems:"baseline",gap:8,marginBottom:4 }}><span style={{ fontSize:28,fontWeight:900,color:"#fff" }}>{cur.name}</span><span style={{ fontSize:20,color:"rgba(255,255,255,0.6)" }}>{cur.age}</span></div>
                {cur.looking_for && <div style={{ display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,140,66,0.25)",border:"1px solid rgba(255,140,66,0.5)",borderRadius:20,padding:"4px 11px",marginBottom:8,fontSize:12,color:"#fff",fontWeight:600 }}>{cur.looking_for}</div>}
                <p style={{ color:"rgba(255,255,255,0.75)",fontSize:13,margin:"0 0 10px" }}>{cur.bio}</p>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:16 }}>{(cur.interests||[]).slice(0,3).map(t => <span key={t} style={{ background:"rgba(255,92,92,0.18)",border:"1px solid rgba(255,92,92,0.3)",borderRadius:20,padding:"4px 10px",fontSize:12,color:"#fff" }}>{t}</span>)}</div>
                {/* Akció gombok a kártyán */}
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8 }} onMouseDown={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
                  <button onClick={(e)=>{e.stopPropagation();handleRewind();}} style={{ width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.1)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.15)",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>↩️</button>
                  <button onClick={(e)=>{e.stopPropagation();showLabel("PASS");act("pass");}} style={{ width:54,height:54,borderRadius:"50%",background:"rgba(255,255,255,0.1)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.2)",fontSize:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff" }}>✕</button>
                  <button onClick={(e)=>{e.stopPropagation();showLabel("LIKE");act("like");}} style={{ width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},#ff8c42)`,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 20px ${C.accentGlow}` }}><HeartIcon size={30} color="#fff" /></button>
                  <button onClick={(e)=>{e.stopPropagation();if(slLeft<=0){setProWallType("superlike");return;}showLabel("SUPER LIKE");act("superlike");}} style={{ width:54,height:54,borderRadius:"50%",background:slLeft>0?"rgba(77,171,247,0.2)":"rgba(255,255,255,0.1)",backdropFilter:"blur(8px)",border:`1px solid ${slLeft>0?"rgba(77,171,247,0.5)":"rgba(255,255,255,0.15)"}`,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>⭐</button>
                  <button onClick={(e)=>{e.stopPropagation();myCards.length>0?setGiveCardModal(true):null;}} style={{ width:44,height:44,borderRadius:"50%",background:myCards.length>0?"rgba(255,140,66,0.2)":"rgba(255,255,255,0.06)",backdropFilter:"blur(8px)",border:`1px solid ${myCards.length>0?"rgba(255,140,66,0.5)":"rgba(255,255,255,0.12)"}`,cursor:myCards.length>0?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",opacity:myCards.length>0?1:0.4 }}>
                    <NearMatchCard size={0.26} />
                    {myCards.length>0 && <div style={{ position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:C.orange,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:800 }}>{myCards.length}</div>}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ width:"100%",height:"100%",background:C.bg,overflowY:"auto",padding:"20px 16px" }}>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}><Avatar src={cur.photo_url} name={cur.name} size={52} /><div><div style={{ fontSize:20,fontWeight:900,color:C.text }}>{cur.name}, {cur.age}</div></div></div>
              <div style={{ marginBottom:10 }}><GhostScoreBadge score={cur.ghost_score} /></div>
              {cur.bio&&<div style={{ background:C.card,borderRadius:14,padding:"13px",border:`1px solid ${C.border}`,marginBottom:10 }}><p style={{ color:C.text,fontSize:13,lineHeight:1.6,margin:0 }}>{cur.bio}</p></div>}
              {(cur.interests||[]).length>0&&<div style={{ background:C.card,borderRadius:14,padding:"13px",border:`1px solid ${C.border}` }}><div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>{cur.interests.map(t=><span key={t} style={{ background:C.accentSoft,border:`1px solid ${C.accent}`,borderRadius:20,padding:"4px 10px",fontSize:12,color:C.accent }}>{t}</span>)}</div></div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
