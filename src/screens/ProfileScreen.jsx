import { useState } from "react";
import { supabase } from "../supabase.js";
import { C, EDU_OPTIONS, SMOKING_OPTIONS, LOOKING_FOR_OPTIONS } from "../lib/constants.js";
import { sanitizeBio } from "../lib/utils.js";
import Spinner from "../components/Spinner.jsx";
import BoostCountdown from "../components/BoostCountdown.jsx";
import SettingsModal from "../components/SettingsModal.jsx";

export default function ProfileScreen({ myProfile, setMyProfile, email, isPro, boostActive, boostAvailable, onBoost, onBuyBoost, onUpgrade, onSignOut, onDeleteAccount }) {
  const [showSettings, setShowSettings] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [draft, setDraft] = useState({ name: myProfile?.name||"", bio: myProfile?.bio||"", height: myProfile?.height||170, education: myProfile?.education||"", smoking: myProfile?.smoking||"", looking_for: myProfile?.looking_for||"" });

  const save = async () => {
    setSaving(true);
    // Insta/social elérhetőségek kiszűrése mentéskor (nem gépelés közben,
    // hogy a beírás ne tördelődjön szét)
    const payload = { ...draft, bio: sanitizeBio(draft.bio) };
    const { data } = await supabase.from("profiles").update(payload).eq("id", myProfile.id).select().single();
    if (data) setMyProfile(p=>({...p,...data}));
    setSaving(false); setEditing(false);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const currentPhotos = myProfile?.photos || (myProfile?.photo_url ? [myProfile.photo_url] : []);
    if (currentPhotos.length + files.length > 6) { setUploadError("Max 6 kép!"); return; }
    setUploadError(""); setUploading(true);
    try {
      const newUrls = [];
      const { data: { session } } = await supabase.auth.getSession();
      for (let i = 0; i < files.length; i++) {
        const file = files[i]; const ext = file.name.split(".").pop();
        const path = `${myProfile.id}/photo_${Date.now()}_${i}.${ext}`;
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        const url = urlData.publicUrl + "?t=" + Date.now();

        // KEPMODERACIO (Sightengine)
        try {
          // Varunk 1.5 masodpercet hogy a Storage URL elerhetove valjon
          await new Promise(r => setTimeout(r, 1500));
          const modRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderate-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
            body: JSON.stringify({ photo_url: urlData.publicUrl, user_id: myProfile.id, path }),
          });
          const modData = await modRes.json();
          console.log("Moderacio eredmeny:", modData);
          if (!modData.approved) {
            await supabase.storage.from("avatars").remove([path]);
            setUploadError("❌ A kép nem megfelelő tartalom miatt elutasítva!");
            setUploading(false);
            return;
          }
        } catch (modErr) {
          console.warn("Moderacio hiba:", modErr);
        }
        // KEPMODERACIO VEGE

        newUrls.push(url);
      }
      const updatedPhotos = [...currentPhotos, ...newUrls].slice(0, 6);
      const photo_url = updatedPhotos[0];
      const { data } = await supabase.from("profiles").update({ photo_url, photos: updatedPhotos }).eq("id", myProfile.id).select().single();
      if (data) setMyProfile(p=>({...p, photo_url, photos: updatedPhotos}));
    } catch (err) { setUploadError("Hiba: " + err.message); } finally { setUploading(false); }
  };

  const handlePhotoDelete = async (idx) => {
    const currentPhotos = myProfile?.photos || [];
    const updatedPhotos = currentPhotos.filter((_, i) => i !== idx);
    const photo_url = updatedPhotos[0] || null;
    const { data } = await supabase.from("profiles").update({ photo_url, photos: updatedPhotos }).eq("id", myProfile.id).select().single();
    if (data) setMyProfile(p=>({...p, photo_url, photos: updatedPhotos}));
  };

  return (
    <div style={{ flex:1,overflowY:"auto", position:"relative" }}>

      {showSettings && (
        <SettingsModal myProfile={myProfile} setMyProfile={setMyProfile} email={email} isPro={isPro}
          onUpgrade={onUpgrade} onSignOut={onSignOut} onDeleteAccount={onDeleteAccount} onClose={() => setShowSettings(false)} />
      )}
      <div style={{ padding:"16px 20px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1 }}>Fotók ({(myProfile?.photos||[myProfile?.photo_url].filter(Boolean)).length}/6)</span>
          <button onClick={() => setShowSettings(true)} aria-label="Beállítások" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, color:C.text, cursor:"pointer", fontSize:14, padding:"8px 12px", display:"flex", alignItems:"center", gap:6 }}>⚙️ <span style={{ fontSize:13, fontWeight:600 }}>Beállítások</span></button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:6 }}>
          {(myProfile?.photos||(myProfile?.photo_url?[myProfile.photo_url]:[])).map((url, idx) => (
            <div key={idx} style={{ position:"relative", aspectRatio:"1", borderRadius:12, overflow:"hidden", background:C.card }}>
              <img src={url} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={`Fotó ${idx+1}`} />
              {idx === 0 && <div style={{ position:"absolute", top:4, left:4, background:C.accent, borderRadius:6, padding:"2px 6px", fontSize:10, color:"#fff", fontWeight:700 }}>Fő</div>}
              <button onClick={() => handlePhotoDelete(idx)} aria-label={`Fotó ${idx+1} törlése`} style={{ position:"absolute", top:0, right:0, width:40, height:40, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"flex-start", justifyContent:"flex-end", padding:4 }}><span style={{ width:24, height:24, borderRadius:"50%", background:"rgba(8,11,16,0.8)", color:"#fff", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>×</span></button>
            </div>
          ))}
          {(myProfile?.photos||(myProfile?.photo_url?[myProfile.photo_url]:[])).length < 6 && (
            <label style={{ aspectRatio:"1", borderRadius:12, background:C.card, border:`2px dashed ${C.border}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", gap:4 }}>
              {uploading ? <Spinner /> : <><span style={{ fontSize:24 }}>+</span><span style={{ color:C.muted, fontSize:10 }}>Fotó</span></>}
              <input type="file" accept="image/*" multiple style={{ display:"none" }} onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          )}
        </div>
        {uploadError && <div style={{ marginTop:8, color:C.accent, fontSize:12 }}>{uploadError}</div>}
      </div>
      <div style={{ padding:"16px 20px" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
          <div><div style={{ color:C.text,fontWeight:800,fontSize:20 }}>{myProfile?.name}</div><div style={{ color:C.muted,fontSize:13 }}>{myProfile?.is_founder?"🚀 Founder":"NearMatch"}</div></div>
          <button onClick={() => { if(editing) save(); else setEditing(true); }} style={{ background:editing?`linear-gradient(135deg,${C.accent},#ff8c42)`:C.card,border:`1px solid ${editing?C.accent:C.border}`,borderRadius:12,color:editing?"#fff":C.text,padding:"8px 16px",cursor:"pointer",fontWeight:600,fontSize:13 }}>
            {saving?<Spinner />:editing?"✓ Mentés":"✏️ Szerkesztés"}
          </button>
        </div>
        {!editing && boostAvailable && (
          <button onClick={onBoost} style={{ width:"100%",padding:"14px 16px",background:"linear-gradient(135deg,rgba(255,212,59,0.12),rgba(255,140,66,0.12))",border:"1px solid rgba(255,212,59,0.35)",borderRadius:16,cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left",marginBottom:8 }}>
            <div style={{ fontSize:26 }}>⚡</div><div style={{ flex:1 }}><div style={{ color:C.yellow,fontWeight:700,fontSize:14 }}>Kiemelés használata</div><div style={{ color:C.muted,fontSize:12 }}>10 percig előre kerülsz • Heti 1 db ingyen</div></div>
          </button>
        )}
        {!editing && isPro && !boostAvailable && !boostActive && (
          <div style={{ width:"100%",padding:"14px 16px",background:C.card,border:`1px solid ${C.border}`,borderRadius:16,display:"flex",alignItems:"center",gap:12,marginBottom:8,opacity:0.7 }}>
            <div style={{ fontSize:26 }}>⚡</div><div style={{ flex:1 }}><div style={{ color:C.muted,fontWeight:700,fontSize:14 }}>Heti ingyenes kiemelés felhasználva</div><div style={{ color:C.muted,fontSize:12 }}>Jövő héten újra jár • vagy vegyél egyet most</div></div>
          </div>
        )}
        {!editing && !boostActive && (
          <button onClick={onBuyBoost} style={{ width:"100%",padding:"14px 16px",background:"linear-gradient(135deg,rgba(255,140,66,0.12),rgba(255,92,92,0.12))",border:"1px solid rgba(255,140,66,0.35)",borderRadius:16,cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left",marginBottom:8 }}>
            <div style={{ fontSize:26 }}>🚀</div><div style={{ flex:1 }}><div style={{ color:C.orange,fontWeight:700,fontSize:14 }}>Kiemelés vásárlása</div><div style={{ color:C.muted,fontSize:12 }}>10 perc extra kiemelés • 990 Ft</div></div>
            <div style={{ color:C.orange,fontSize:12,fontWeight:700 }}>990 Ft</div>
          </button>
        )}
        {!editing && boostActive && (
          <div style={{ width:"100%",padding:"14px 16px",background:"linear-gradient(135deg,rgba(255,212,59,0.15),rgba(255,140,66,0.15))",border:"1px solid rgba(255,212,59,0.5)",borderRadius:16,display:"flex",alignItems:"center",gap:12,marginBottom:8 }}>
            <div style={{ fontSize:26 }}>⚡</div>
            <div style={{ flex:1 }}>
              <div style={{ color:C.yellow,fontWeight:700,fontSize:14 }}>Kiemelés aktív!</div>
              <div style={{ color:C.muted,fontSize:12 }}>Most előre kerülsz a listákon</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ color:C.yellow,fontWeight:800,fontSize:18,fontVariantNumeric:"tabular-nums" }}><BoostCountdown expiresAt={myProfile?.boost_expires_at} /></div>
              <div style={{ color:C.muted,fontSize:10 }}>hátra</div>
            </div>
          </div>
        )}

        {editing ? (
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <div><label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6 }}>Név</label><input value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} style={{ width:"100%",padding:"12px 14px",borderRadius:12,background:C.card,border:`1px solid ${C.border}`,color:C.text,fontSize:15,outline:"none" }} /></div>
            <div><label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6 }}>Bio</label><textarea value={draft.bio} onChange={e => setDraft(d=>({...d,bio:e.target.value.slice(0,300)}))} style={{ width:"100%",padding:"12px 14px",borderRadius:12,background:C.card,border:`1px solid ${C.border}`,color:C.text,fontSize:14,outline:"none",resize:"none",minHeight:80,lineHeight:1.6 }} />
              <div style={{ color:C.muted,fontSize:11,marginTop:5 }}>Az Instagram-/közösségi elérhetőségek mentéskor automatikusan törlődnek.</div></div>
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}><label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1 }}>📏 Magasság</label><span style={{ color:C.accent,fontWeight:700,fontSize:13 }}>{draft.height} cm</span></div>
              <input type="range" min={135} max={230} step={1} value={draft.height} onChange={e=>setDraft(d=>({...d,height:+e.target.value}))} style={{ width:"100%" }} />
            </div>
            <div>
              <label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8 }}>🎓 Végzettség</label>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>{EDU_OPTIONS.map(opt => (<button key={opt} onClick={() => setDraft(d=>({...d,education:opt}))} style={{ padding:"7px 12px",borderRadius:20,fontSize:12,cursor:"pointer",border:`1px solid ${draft.education===opt?C.accent:C.border}`,background:draft.education===opt?C.accentSoft:C.card,color:draft.education===opt?C.accent:C.muted }}>{opt}</button>))}</div>
            </div>
            <div>
              <label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8 }}>🚬 Dohányzás</label>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>{SMOKING_OPTIONS.map(opt => (<button key={opt} onClick={() => setDraft(d=>({...d,smoking:opt}))} style={{ padding:"7px 12px",borderRadius:20,fontSize:12,cursor:"pointer",border:`1px solid ${draft.smoking===opt?C.accent:C.border}`,background:draft.smoking===opt?C.accentSoft:C.card,color:draft.smoking===opt?C.accent:C.muted }}>{opt}</button>))}</div>
            </div>
            <div>
              <label style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:8 }}>💍 Mit keresel?</label>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>{LOOKING_FOR_OPTIONS.map(x => (<button key={x.l} onClick={() => setDraft(d=>({...d,looking_for:d.looking_for===x.l?"":x.l}))} style={{ padding:"7px 12px",borderRadius:20,fontSize:12,cursor:"pointer",border:`1px solid ${draft.looking_for===x.l?C.accent:C.border}`,background:draft.looking_for===x.l?C.accentSoft:C.card,color:draft.looking_for===x.l?C.accent:C.muted }}>{x.i} {x.l}</button>))}</div>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            <div style={{ background:C.card,borderRadius:14,padding:"14px",border:`1px solid ${C.border}` }}>
              <div style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:8 }}>Bio</div>
              <p style={{ color:C.text,fontSize:14,lineHeight:1.6,margin:0 }}>{myProfile?.bio||"Nincs még bio!"}</p>
            </div>
            {!isPro && (
              <button onClick={onUpgrade} style={{ width:"100%",padding:"14px",background:"linear-gradient(135deg,rgba(255,212,59,0.08),rgba(255,140,66,0.08))",border:"1px solid rgba(255,212,59,0.3)",borderRadius:16,cursor:"pointer",display:"flex",alignItems:"center",gap:12 }}>
                <span style={{ fontSize:24 }}>⚡</span>
                <div style={{ flex:1, textAlign:"left" }}><div style={{ color:C.yellow,fontWeight:700 }}>Upgrade Pro-ra</div><div style={{ color:C.muted,fontSize:12 }}>Látod ki lájkolt • Radar like • 10 match</div></div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
