import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import { C } from "../lib/constants.js";
import { sendPushNotification } from "../lib/push.js";
import { calcAndSaveGhostScore } from "../lib/ghostScore.js";
import { EMOJI_CATEGORIES, REPORT_REASONS } from "../lib/emoji.js";
import Spinner from "../components/Spinner.jsx";
import ProfileDetailModal from "../components/ProfileDetailModal.jsx";
import VoicePlayer from "../components/VoicePlayer.jsx";
import Avatar from "../components/Avatar.jsx";
import ToastNotice from "../components/ToastNotice.jsx";

export default function ChatView({ match, myId, myVoiceOnly, onBack, onMatchDeleted, onRead }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOtherProfile, setShowOtherProfile] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [errorNotice, setErrorNotice] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Jobbra-húzós visszalépés (mint a profil-modalban): ref + közvetlen
  // DOM-transform, hogy iOS-en is megbízható legyen. Nyitott felugró
  // ablaknál (menü/emoji/jelentés/törlés/profil) nem indul el.
  const rootRef = useRef(null);
  const backDrag = useRef({ startX:0, startY:0, axis:null, dx:0 });
  const overlayOpen = () => showMenu || showEmojiPicker || showReportModal || showDeleteConfirm || showOtherProfile;
  const onBackTouchStart = (e) => {
    if (overlayOpen()) { backDrag.current.axis = "scroll"; return; }
    const t = e.touches[0];
    backDrag.current = { startX:t.clientX, startY:t.clientY, axis:null, dx:0 };
  };
  const onBackTouchMove = (e) => {
    const g = backDrag.current;
    if (g.axis === "scroll") return;
    const t = e.touches[0];
    const dx = t.clientX - g.startX, dy = t.clientY - g.startY;
    if (g.axis === null) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      g.axis = (Math.abs(dx) > Math.abs(dy) && dx > 0) ? "back" : "scroll";
    }
    if (g.axis === "back") {
      g.dx = Math.max(0, dx);
      const el = rootRef.current;
      if (el) { el.style.transition="none"; el.style.transform=`translateX(${g.dx}px)`; el.style.opacity=String(Math.max(0.4, 1 - g.dx/600)); }
    }
  };
  const onBackTouchEnd = () => {
    const g = backDrag.current;
    const el = rootRef.current;
    if (g.axis === "back" && el) {
      if (g.dx > 90) { onBack(); return; }
      el.style.transition="transform 0.2s ease, opacity 0.2s ease";
      el.style.transform="translateX(0)";
      el.style.opacity="1";
    }
    g.axis = null;
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Válasszuk a legjobb támogatott formátumot
      const mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4"
        : MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
        : "audio/ogg";
      const ext = mimeType.startsWith("audio/mp4") ? "mp4"
        : mimeType.startsWith("audio/webm") ? "webm" : "ogg";
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (audioChunksRef.current.length === 0) return; // semmi nem lett felvéve
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 1000) return; // túl rövid, eldobjuk
        // Pending buborék feltöltés közben (C11) — eddig semmi visszajelzés
        // nem volt, az üzenet "valamikor" felbukkant
        const temp = { id: `tmp-voice-${Date.now()}`, match_id: match.id, sender_id: myId, text: "🎙️ Hangüzenet (feltöltés...)", created_at: new Date().toISOString(), pending: true };
        setMsgs(m => [...m, temp]);
        const fileName = `voice_${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("voices").upload(`${myId}/${fileName}`, blob, { contentType: mimeType, upsert: false });
        if (error) {
          console.error("Voice upload error:", error);
          setMsgs(m => m.filter(x => x.id !== temp.id));
          setErrorNotice("A hangüzenet feltöltése nem sikerült: " + error.message);
          return;
        }
        const { data: urlData } = supabase.storage.from("voices").getPublicUrl(`${myId}/${fileName}`);
        const voiceUrl = urlData.publicUrl;
        const { data: row, error: insErr } = await supabase.from("messages")
          .insert({ match_id:match.id, sender_id:myId, text:"🎙️ Hangüzenet", voice_url:voiceUrl }).select().single();
        if (insErr || !row) {
          setMsgs(m => m.filter(x => x.id !== temp.id));
          setErrorNotice("A hangüzenet küldése nem sikerült.");
          return;
        }
        setMsgs(m => {
          const replaced = m.map(x => x.id === temp.id ? row : x);
          return replaced.filter((x, i) => replaced.findIndex(y => y.id === x.id) === i);
        });
        calcAndSaveGhostScore(myId).catch(() => {});
        if (match.other?.id) {
          await sendPushNotification(match.other.id, "🎙️ Hangüzenet", "Hangüzenetet kaptál", { type:"message", match_id:match.id });
        }
      };
      mr.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (e) { setErrorNotice("Mikrofon-hozzáférés szükséges a hangüzenethez. Engedélyezd a böngésző beállításaiban!"); }
  };

  const stopRecording = () => {
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // A nekem küldött üzenetek olvasottra jelölése (B6) — a badge ebből számolódik
    const markRead = async () => {
      const { error } = await supabase.from("messages").update({ is_read: true })
        .eq("match_id", match.id).neq("sender_id", myId).eq("is_read", false);
      if (!error) onRead && onRead();
    };
    const load = async () => {
      const { data } = await supabase.from("messages").select("*").eq("match_id", match.id).order("created_at", { ascending:true });
      setMsgs(data||[]); setLoading(false);
      markRead();
    };
    load();
    const sub = supabase.channel(`messages:${match.id}`)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages", filter:`match_id=eq.${match.id}` }, payload => {
        // Dedup: a saját üzenet optimistán már a listában van (D6)
        setMsgs(m => m.some(x => x.id === payload.new.id) ? m : [...m, payload.new]);
        // Nyitott chatben az érkező üzenet azonnal olvasott
        if (payload.new.sender_id !== myId) markRead();
      }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [match.id, myId]);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    // Optimista megjelenítés: az üzenet azonnal látszik, nem a realtime
    // visszhangra várva (D6); hibánál visszavonjuk és visszaadjuk a szöveget
    const temp = { id: `tmp-${Date.now()}`, match_id: match.id, sender_id: myId, text, created_at: new Date().toISOString(), pending: true };
    setMsgs(m => [...m, temp]);
    const { data, error } = await supabase.from("messages")
      .insert({ match_id: match.id, sender_id: myId, text }).select().single();
    if (error) {
      setMsgs(m => m.filter(x => x.id !== temp.id));
      setInput(text);
      return;
    }
    setMsgs(m => {
      // temp → valódi sor; ha a realtime közben már beszúrta, a duplikátum kiesik
      const replaced = m.map(x => x.id === temp.id ? data : x);
      return replaced.filter((x, i) => replaced.findIndex(y => y.id === x.id) === i);
    });
    // Ghost Score frissítése üzenetküldés után (saját score)
    calcAndSaveGhostScore(myId).catch(() => {});
    if (match.other?.id) {
      await sendPushNotification(match.other.id, "💬 Új üzenet", text.length > 60 ? text.slice(0,60)+"…" : text, { type:"message", match_id: match.id });
    }
  };

  const handleDeleteMatch = async () => {
    // Az üzenetek a match törlésével kaszkádolnak (messages_match_id_fkey ON DELETE CASCADE)
    await supabase.from("matches").delete().eq("id", match.id);
    setShowDeleteConfirm(false);
    onMatchDeleted();
  };

  const handleReport = async () => {
    if (!reportReason) return;
    await supabase.from("reports").insert({
      reporter_id: myId,
      reported_id: match.other?.id,
      match_id: match.id,
      reason: reportReason,
      created_at: new Date().toISOString(),
    });
    setReportSent(true);
  };

  const insertEmoji = (emoji) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const timeLabel = (ts) => new Date(ts).toLocaleTimeString("hu", { hour:"2-digit", minute:"2-digit" });

  return (
    <div ref={rootRef} onTouchStart={onBackTouchStart} onTouchMove={onBackTouchMove} onTouchEnd={onBackTouchEnd}
      style={{ display:"flex",flexDirection:"column",height:"100%",position:"relative",touchAction:"pan-y pinch-zoom" }}>
      {errorNotice && <ToastNotice message={errorNotice} onClose={() => setErrorNotice("")} />}

      {/* Match törlés megerősítés */}
      {showDeleteConfirm && (
        <div style={{ position:"absolute",inset:0,zIndex:100,background:"rgba(8,11,16,0.95)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end" }}>
          <div style={{ width:"100%",background:C.surface,borderRadius:"28px 28px 0 0",padding:"28px 24px 40px",border:`1px solid ${C.border}` }}>
            <div style={{ textAlign:"center",marginBottom:20 }}>
              <div style={{ fontSize:48,marginBottom:10 }}>💔</div>
              <h3 style={{ color:C.text,fontSize:20,fontWeight:900,margin:"0 0 8px" }}>Match törlése</h3>
              <p style={{ color:C.muted,fontSize:13,margin:0 }}>Biztosan törölni szeretnéd a matchet {match.other?.name}-vel? Az összes üzenet elvész.</p>
            </div>
            <button onClick={handleDeleteMatch} style={{ width:"100%",padding:"16px",background:C.accent,border:"none",borderRadius:16,color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:10 }}>Igen, törlöm</button>
            <button onClick={() => setShowDeleteConfirm(false)} style={{ width:"100%",padding:"14px",background:"none",border:`1px solid ${C.border}`,borderRadius:16,color:C.muted,fontSize:15,cursor:"pointer" }}>Mégse</button>
          </div>
        </div>
      )}

      {/* Jelentés modal */}
      {showReportModal && (
        <div style={{ position:"absolute",inset:0,zIndex:100,background:"rgba(8,11,16,0.95)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end" }}>
          <div style={{ width:"100%",background:C.surface,borderRadius:"28px 28px 0 0",padding:"28px 24px 40px",border:`1px solid ${C.border}` }}>
            {reportSent ? (
              <div style={{ textAlign:"center",padding:"20px 0" }}>
                <div style={{ fontSize:48,marginBottom:16 }}>✅</div>
                <h3 style={{ color:C.text,fontSize:20,fontWeight:900,margin:"0 0 8px" }}>Köszönjük!</h3>
                <p style={{ color:C.muted,fontSize:13,margin:"0 0 24px" }}>A jelentést megkaptuk és kivizsgáljuk.</p>
                <button onClick={() => { setShowReportModal(false); setReportSent(false); setReportReason(""); }} style={{ width:"100%",padding:"14px",background:C.card,border:`1px solid ${C.border}`,borderRadius:16,color:C.text,fontSize:15,cursor:"pointer" }}>Bezárás</button>
              </div>
            ) : (
              <>
                <div style={{ textAlign:"center",marginBottom:20 }}>
                  <div style={{ fontSize:48,marginBottom:10 }}>🚩</div>
                  <h3 style={{ color:C.text,fontSize:20,fontWeight:900,margin:"0 0 8px" }}>Felhasználó jelentése</h3>
                  <p style={{ color:C.muted,fontSize:13,margin:0 }}>{match.other?.name} jelentése</p>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:20 }}>
                  {REPORT_REASONS.map(r => (
                    <button key={r} onClick={() => setReportReason(r)} style={{ padding:"13px 16px",borderRadius:13,border:`1px solid ${reportReason===r?C.accent:C.border}`,background:reportReason===r?C.accentSoft:C.card,color:reportReason===r?C.accent:C.text,cursor:"pointer",textAlign:"left",fontSize:14,fontWeight:reportReason===r?700:400 }}>{r}</button>
                  ))}
                </div>
                <button onClick={handleReport} disabled={!reportReason} style={{ width:"100%",padding:"16px",background:reportReason?C.accent:C.card,border:"none",borderRadius:16,color:"#fff",fontSize:16,fontWeight:700,cursor:reportReason?"pointer":"not-allowed",opacity:reportReason?1:0.5,marginBottom:10 }}>Jelentés küldése</button>
                <button onClick={() => { setShowReportModal(false); setReportReason(""); }} style={{ width:"100%",padding:"14px",background:"none",border:`1px solid ${C.border}`,borderRadius:16,color:C.muted,fontSize:15,cursor:"pointer" }}>Mégse</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Másik fél profil modalja */}
      {showOtherProfile && match.other && (
        <ProfileDetailModal profile={match.other} position="absolute" zIndex={101} onClose={() => setShowOtherProfile(false)} />
      )}

      {/* Fejléc */}
      <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:`1px solid ${C.border}`,background:C.surface }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:20 }}>←</button>
        <div onClick={() => setShowOtherProfile(true)} style={{ display:"flex",alignItems:"center",gap:12,flex:1,cursor:"pointer" }}>
          <Avatar src={match.other?.photo_url} name={match.other?.name} size={38} />
          <div style={{ flex:1 }}>
            <div style={{ color:C.text,fontWeight:700 }}>{match.other?.name}</div>
            {(() => {
              const lastSeen = match.other?.last_seen;
              const diffMin = lastSeen ? Math.floor((Date.now()-new Date(lastSeen).getTime())/60000) : null;
              const isOnline = diffMin !== null && diffMin < 5;
              const label = diffMin === null ? "Inaktív" : isOnline ? "Online" : diffMin < 60 ? `Aktív ${diffMin} perce` : diffMin < 1440 ? `Aktív ${Math.floor(diffMin/60)} órája` : "Régen aktív";
              return <div style={{ color: isOnline ? C.green : C.dim, fontSize:11 }}>● {label} · Profil megtekintése</div>;
            })()}
          </div>
        </div>
        <div style={{ position:"relative" }}>
          <button onClick={() => setShowMenu(m=>!m)} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:22,padding:"4px 8px",lineHeight:1 }}>⋮</button>
          {showMenu && (
            <div style={{ position:"absolute",right:0,top:"110%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",zIndex:50,minWidth:180,boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
              <button onClick={() => { setShowMenu(false); setShowReportModal(true); }} style={{ width:"100%",padding:"14px 16px",background:"none",border:"none",borderBottom:`1px solid ${C.border}`,color:C.yellow,cursor:"pointer",textAlign:"left",fontSize:14,display:"flex",alignItems:"center",gap:10 }}>🚩 Felhasználó jelentése</button>
              <button onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }} style={{ width:"100%",padding:"14px 16px",background:"none",border:"none",color:C.accent,cursor:"pointer",textAlign:"left",fontSize:14,display:"flex",alignItems:"center",gap:10 }}>💔 Match törlése</button>
            </div>
          )}
        </div>
      </div>

      {/* Üzenetek */}
      <div style={{ flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:8 }} onClick={() => { setShowMenu(false); setShowEmojiPicker(false); }}>
        {loading && <div style={{ textAlign:"center",paddingTop:20 }}><Spinner /></div>}
        {msgs.map(m => (
          <div key={m.id} style={{ display:"flex",justifyContent:m.sender_id===myId?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"72%",padding:"10px 14px",borderRadius:m.sender_id===myId?"18px 18px 4px 18px":"18px 18px 18px 4px",background:m.sender_id===myId?`linear-gradient(135deg,${C.accent},#ff8c42)`:C.card,color:"#fff",fontSize:14,opacity:m.pending?0.6:1,transition:"opacity 0.2s" }}>
              {m.voice_url ? (
                <VoicePlayer src={m.voice_url} isMine={m.sender_id===myId} />
              ) : m.text}
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:4,textAlign:"right" }}>{timeLabel(m.created_at)}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div style={{ borderTop:`1px solid ${C.border}`,background:C.surface,flexShrink:0 }}>
          <div style={{ display:"flex",overflowX:"auto",padding:"8px 12px 0",gap:4,borderBottom:`1px solid ${C.border}` }}>
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button key={i} onClick={() => setEmojiCategory(i)} style={{ flexShrink:0,padding:"6px 10px",borderRadius:10,border:"none",background:emojiCategory===i?C.accentSoft:"none",fontSize:18,cursor:"pointer",opacity:emojiCategory===i?1:0.5 }} title={cat.name}>
                {cat.label}
              </button>
            ))}
          </div>
          <div style={{ display:"flex",flexWrap:"wrap",padding:"8px",maxHeight:180,overflowY:"auto" }}>
            {EMOJI_CATEGORIES[emojiCategory].emojis.map((e, i) => (
              <button key={i} onClick={() => insertEmoji(e)} style={{ background:"none",border:"none",fontSize:24,cursor:"pointer",padding:"4px 5px",borderRadius:8,lineHeight:1 }}>
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input sor */}
      <div style={{ display:"flex",gap:8,padding:"10px 12px",borderTop:`1px solid ${C.border}`,alignItems:"center",background:C.surface,userSelect:"none",WebkitUserSelect:"none" }}>
        {(match.other?.voice_only || myVoiceOnly) ? (
          // HANG ÜZENET MÓD
          <>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, background:C.card, borderRadius:24, padding:"10px 16px", border:`1px solid ${isRecording?"rgba(255,92,92,0.5)":C.border}` }}>
              <div style={{ fontSize:18 }}>🎙️</div>
              {isRecording ? (
                <div style={{ flex:1, display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:C.accent, animation:"pulse 1s infinite" }} />
                  <span style={{ color:C.accent, fontSize:13, fontWeight:600 }}>
                    {Math.floor(recordingTime/60).toString().padStart(2,"0")}:{(recordingTime%60).toString().padStart(2,"0")}
                  </span>
                  <span style={{ color:C.muted, fontSize:12 }}>Felvétel...</span>
                </div>
              ) : (
                <span style={{ color:C.muted, fontSize:13 }}>Ez a személy csak hangüzenetet fogad</span>
              )}
            </div>
            <button
              onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);startRecording();}}
              onPointerUp={e=>{e.preventDefault();stopRecording();}}
              onPointerCancel={e=>{e.preventDefault();stopRecording();}}
              onPointerLeave={e=>{if(isRecording){e.preventDefault();stopRecording();}}}
              onClick={e=>{e.preventDefault();e.stopPropagation();}}
              style={{ width:48,height:48,borderRadius:"50%",background:isRecording?`linear-gradient(135deg,${C.accent},#ff8c42)`:"rgba(255,92,92,0.15)",border:`2px solid ${isRecording?C.accent:"rgba(255,92,92,0.3)"}`,fontSize:22,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",userSelect:"none",WebkitUserSelect:"none",touchAction:"none" }}>
              🎙️
            </button>
          </>
        ) : (
          // NORMÁL MÓD
          <>
            <button onClick={() => setShowEmojiPicker(p => !p)} style={{ width:38,height:38,borderRadius:"50%",background:showEmojiPicker?C.accentSoft:C.card,border:`1px solid ${showEmojiPicker?C.accent:C.border}`,fontSize:20,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
              {showEmojiPicker ? "✕" : "🙂"}
            </button>
            <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} onFocus={() => setShowEmojiPicker(false)} placeholder="Írj üzenetet..." style={{ flex:1,padding:"12px 16px",borderRadius:24,background:C.card,border:`1px solid ${C.border}`,color:C.text,fontSize:14,outline:"none" }} />
            {input.trim() ? (
              <button onClick={send} style={{ width:42,height:42,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},#ff8c42)`,border:"none",color:"#fff",fontSize:18,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>→</button>
            ) : (
              <button
                onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);startRecording();}}
                onPointerUp={e=>{e.preventDefault();stopRecording();}}
                onPointerCancel={e=>{e.preventDefault();stopRecording();}}
                onPointerLeave={e=>{if(isRecording){e.preventDefault();stopRecording();}}}
                onClick={e=>{e.preventDefault();e.stopPropagation();}}
                style={{ width:42,height:42,borderRadius:"50%",background:isRecording?`linear-gradient(135deg,${C.accent},#ff8c42)`:"rgba(255,92,92,0.12)",border:`1px solid ${isRecording?C.accent:"rgba(255,92,92,0.3)"}`,fontSize:20,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",userSelect:"none",WebkitUserSelect:"none",touchAction:"none" }}>
                {isRecording ? "⏹️" : "🎙️"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
