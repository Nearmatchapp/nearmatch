import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase.js";
import { C, COMPLIMENT_CARDS, STRIPE_REVEAL_PRICE_ID } from "../lib/constants.js";
import { NearMatchCard } from "../components/icons.jsx";

export default function CardsModal({ myId, isPro, onClose, onUpgrade, onOpenChat }) {
  const [profileModal, setProfileModal] = useState(null);
  const [myCards, setMyCards] = useState([]); // kártyák amiket én kioszthatom
  const [receivedCards, setReceivedCards] = useState([]); // kártyák amiket kaptam
  const [loading, setLoading] = useState(true);
  const [flipping, setFlipping] = useState(null);
  const [buyModal, setBuyModal] = useState(false);

  const canReveal = () => {
    const last = localStorage.getItem(`lastReveal_${myId}`);
    if (!last) return true;
    const diff = (Date.now() - parseInt(last)) / (1000 * 60 * 60 * 24);
    return isPro ? diff >= 1 : diff >= 2;
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    // Kártyák amiket én kioszthatom (is_mine_to_give = true, még nem adtam oda)
    const { data: mine } = await supabase.from("compliment_cards")
      .select("*").eq("sender_id", myId).eq("is_mine_to_give", true)
      .is("given_to", null).order("created_at", { ascending: false });
    setMyCards(mine || []);

    // Kártyák amiket kaptam (valaki nekem adta)
    const { data: recv } = await supabase.from("compliment_cards")
      .select("*, sender:profiles!sender_id(id,name,photo_url)")
      .eq("receiver_id", myId).eq("is_mine_to_give", false)
      .order("created_at", { ascending: false });
    setReceivedCards(recv || []);
    setLoading(false);
  };

  const genLock = useRef(false);

  const generateDailyCards = async () => {
    if (!myId || genLock.current) return;
    genLock.current = true;

    const lastGenKey = `cardsGeneratedAt_${myId}`;
    const lastGen = localStorage.getItem(lastGenKey);
    const now = Date.now();

    // 24 órán belül generált? Akkor skip — semmi DB hívás
    if (lastGen && (now - parseInt(lastGen)) < 24 * 60 * 60 * 1000) {
      genLock.current = false;
      return;
    }

    // DB ellenőrzés: van-e az elmúlt 24 órában generált kártya
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const { data: existing, error: checkError } = await supabase
      .from("compliment_cards")
      .select("id, created_at")
      .eq("sender_id", myId)
      .eq("is_mine_to_give", true)
      .gte("created_at", dayAgo.toISOString());

    if (checkError) { console.error("Card check error:", checkError); genLock.current = false; return; }

    if ((existing||[]).length > 0) {
      const latest = Math.max(...existing.map(c => new Date(c.created_at).getTime()));
      localStorage.setItem(lastGenKey, latest.toString());
      genLock.current = false;
      return;
    }

    // Generálás
    const categories = Object.keys(COMPLIMENT_CARDS.other);
    const shuffledCats = [...categories].sort(() => Math.random() - 0.5).slice(0, 3);
    const cards = shuffledCats.map(cat => {
      const texts = COMPLIMENT_CARDS.other[cat];
      const text = texts[Math.floor(Math.random() * texts.length)];
      return { sender_id: myId, receiver_id: myId, card_text: text, category: cat, is_mine_to_give: true };
    });

    const { error } = await supabase.from("compliment_cards").insert(cards);
    if (!error) {
      // Időbélyeg AZONNAL mentve, mielőtt bármi más történne — ez akadályozza meg az újragenerálást
      localStorage.setItem(lastGenKey, now.toString());
      await loadData();
    } else {
      console.error("Card insert error:", error);
    }
    genLock.current = false;
  };

  useEffect(() => {
    if (myId) generateDailyCards();
  }, [myId]);

  const handleReveal = async (card) => {
    if (card.revealed) return;
    if (!canReveal()) { setBuyModal(card); return; }
    setFlipping(card.id);
    await supabase.from("compliment_cards").update({ revealed: true, revealed_at: new Date().toISOString() }).eq("id", card.id);
    localStorage.setItem(`lastReveal_${myId}`, Date.now().toString());
    setReceivedCards(prev => prev.map(c => c.id === card.id ? { ...c, revealed: true } : c));
    setTimeout(() => setFlipping(null), 600);
  };

  const handleBuyReveal = async (card) => {
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      // Elmentjük melyik kártyát akarjuk felfedni, hogy visszatéréskor tudjuk
      localStorage.setItem(`pendingReveal_${myId}`, card.id);
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${s?.access_token}` },
        body: JSON.stringify({ price_id: STRIPE_REVEAL_PRICE_ID, success_url: window.location.origin+"?reveal=success", cancel_url: window.location.origin+"?reveal=cancel", mode: "payment" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) { console.error(err); }
  };

  const unrevealed = receivedCards.filter(c => !c.revealed).length;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.88)", display:"flex", flexDirection:"column" }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ marginTop:"auto", background:C.surface, borderRadius:"24px 24px 0 0", maxHeight:"88vh", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"12px 16px 0", flexShrink:0 }}>
          <div style={{ width:40, height:4, borderRadius:2, background:C.border, margin:"0 auto 16px" }} />
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ fontWeight:800, fontSize:17, color:C.text }}>🃏 Kártyák</div>
            <button onClick={onClose} style={{ background:"none", border:"none", color:C.dim, cursor:"pointer", fontSize:20, padding:0 }}>✕</button>
          </div>
        </div>

        <div style={{ overflowY:"auto", padding:"0 16px 32px", flex:1 }}>
          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", padding:40 }}>
              <div style={{ width:28, height:28, border:`3px solid ${C.accent}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
            </div>
          ) : (<>
            {/* Saját kiosztható kártyák */}
            {myCards.length > 0 && (<>
              <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>
                Kiosztható kártyáid
                <span style={{ background:C.orange, color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:10, marginLeft:8 }}>{myCards.length} db</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
                {myCards.map(card => (
                  <div key={card.id} style={{ borderRadius:16, border:`1px solid rgba(255,140,66,0.3)`, background:"linear-gradient(135deg,rgba(255,140,66,0.08),rgba(255,92,92,0.05))", padding:"14px 16px", display:"flex", alignItems:"center", gap:14 }}>
                    <NearMatchCard size={0.6} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:10, color:C.orange, fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>{card.category}</div>
                      <div style={{ color:C.text, fontSize:13, fontWeight:600, lineHeight:1.4 }}>"{card.card_text}"</div>
                      <div style={{ color:C.dim, fontSize:11, marginTop:6 }}>Swipelés közben adhatod oda 👆</div>
                    </div>
                  </div>
                ))}
              </div>
            </>)}

            {/* Kapott kártyák */}
            <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>
              Kapott kártyák
              {unrevealed > 0 && <span style={{ background:C.accent, color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:10, marginLeft:8 }}>{unrevealed} új</span>}
            </div>
            {receivedCards.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px" }}>
                <NearMatchCard size={1.2} />
                <div style={{ fontWeight:700, color:C.muted, marginTop:16 }}>Még nincs kapott kártyád</div>
                <div style={{ fontSize:13, color:C.dim, marginTop:6 }}>Amikor valaki swipelés közben neked adja, itt jelenik meg</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {receivedCards.map(card => (
                  <div key={card.id} onClick={() => !card.revealed && handleReveal(card)}
                    style={{ borderRadius:16, border:`1px solid ${card.revealed?"rgba(255,212,59,0.3)":C.border}`, background:card.revealed?"linear-gradient(135deg,rgba(255,212,59,0.07),rgba(255,140,66,0.07))":C.card, cursor:card.revealed?"default":"pointer", opacity:flipping===card.id?0.3:1, transition:"opacity 0.3s" }}>
                    {card.revealed ? (
                      <div style={{ padding:"16px" }}>
                        <div style={{ fontSize:10, color:C.yellow, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>{card.category}</div>
                        <div style={{ fontSize:15, color:C.text, fontWeight:600, marginBottom:14, lineHeight:1.5 }}>"{card.card_text}"</div>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                          <img src={card.sender?.photo_url||`https://i.pravatar.cc/80?u=${card.sender?.id}`} style={{ width:34, height:34, borderRadius:"50%", objectFit:"cover", border:"2px solid rgba(255,212,59,0.4)", cursor:"pointer" }} alt="" onClick={() => setProfileModal(card.sender)} />
                          <div>
                            <div style={{ color:C.text, fontWeight:700, fontSize:13 }}>{card.sender?.name}</div>
                            <div style={{ color:C.dim, fontSize:11 }}>{new Date(card.created_at).toLocaleDateString("hu-HU")}</div>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={() => setProfileModal(card.sender)} style={{ flex:1, padding:"9px", borderRadius:12, border:`1px solid ${C.border}`, background:C.card, color:C.text, fontSize:13, fontWeight:600, cursor:"pointer" }}>👤 Profil</button>
                          <button onClick={() => { onOpenChat && onOpenChat(card.sender); onClose(); }} style={{ flex:1, padding:"9px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>💬 Üzenet</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:14 }}>
                        <NearMatchCard size={0.6} />
                        <div style={{ flex:1 }}>
                          <div style={{ color:C.text, fontWeight:700, fontSize:14 }}>Új kártya érkezett!</div>
                          <div style={{ color:C.dim, fontSize:12, marginTop:3 }}>{new Date(card.created_at).toLocaleDateString("hu-HU")}</div>
                          <div style={{ marginTop:10, display:"inline-flex", alignItems:"center", gap:6, background:C.accentSoft, border:`1px solid rgba(255,92,92,0.3)`, borderRadius:20, padding:"5px 12px" }}>
                            <span style={{ color:C.accent, fontSize:12, fontWeight:700 }}>👆 Koppints a felfedéshez</span>
                          </div>
                          <div style={{ color:C.dim, fontSize:11, marginTop:6 }}>{isPro ? "PRO: napi 1 ingyenes" : "2 naponta 1 ingyenes"}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>)}
        </div>
      </div>

      {buyModal && (
        <div style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(0,0,0,0.9)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }} onClick={e => e.target===e.currentTarget && setBuyModal(false)}>
          <div style={{ background:C.surface, borderRadius:24, padding:28, width:"100%", maxWidth:340, textAlign:"center" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}><NearMatchCard size={1.2} /></div>
            <div style={{ fontWeight:800, fontSize:18, color:C.text, marginBottom:8 }}>Elérted a napi ingyenes felfedést</div>
            <div style={{ color:C.muted, fontSize:13, marginBottom:24 }}>{isPro ? "Holnap újra felfedhetsz egyet ingyen, vagy fedd fel most azonnal." : "Free fiókon 2 naponta jár 1 ingyenes. Fedd fel most azonnal, vagy válts PRO-ra."}</div>
            <button onClick={() => { const card = buyModal; setBuyModal(false); handleBuyReveal(card); }} style={{ width:"100%", padding:"14px", borderRadius:14, border:"none", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer", marginBottom:10 }}>🔓 Felfedés most – 490 Ft</button>
            {!isPro && <button onClick={() => { setBuyModal(false); onUpgrade(); }} style={{ width:"100%", padding:"13px", borderRadius:14, border:`1px solid rgba(255,212,59,0.4)`, background:"rgba(255,212,59,0.08)", color:C.yellow, fontWeight:700, fontSize:14, cursor:"pointer", marginBottom:10 }}>⚡ PRO – napi ingyenes felfedés</button>}
            <button onClick={() => setBuyModal(false)} style={{ width:"100%", padding:"13px", borderRadius:14, border:`1px solid ${C.border}`, background:"none", color:C.muted, fontWeight:600, fontSize:14, cursor:"pointer" }}>Majd később</button>
          </div>
        </div>
      )}

      {profileModal && (
        <div style={{ position:"fixed", inset:0, zIndex:700, background:"rgba(0,0,0,0.92)", display:"flex", flexDirection:"column" }} onClick={e => e.target===e.currentTarget && setProfileModal(null)}>
          <div style={{ marginTop:"auto", background:C.surface, borderRadius:"24px 24px 0 0", padding:"24px 16px 40px", maxHeight:"70vh", overflowY:"auto" }}>
            <div style={{ width:40, height:4, borderRadius:2, background:C.border, margin:"0 auto 20px" }} />
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
              <img src={profileModal.photo_url||`https://i.pravatar.cc/120?u=${profileModal.id}`} style={{ width:70, height:70, borderRadius:"50%", objectFit:"cover", border:`3px solid rgba(255,212,59,0.4)` }} alt="" />
              <div>
                <div style={{ fontSize:22, fontWeight:800, color:C.text }}>{profileModal.name}</div>
                {profileModal.age && <div style={{ color:C.muted, fontSize:14 }}>{profileModal.age} éves</div>}
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setProfileModal(null)} style={{ flex:1, padding:"13px", borderRadius:14, border:`1px solid ${C.border}`, background:C.card, color:C.muted, fontSize:14, cursor:"pointer" }}>Bezárás</button>
              <button onClick={() => { onOpenChat && onOpenChat(profileModal); onClose(); }} style={{ flex:2, padding:"13px", borderRadius:14, border:"none", background:`linear-gradient(135deg,${C.accent},#ff8c42)`, color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer" }}>💬 Üzenet küldése</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
