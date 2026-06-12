import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase.js";
import { C, STRIPE_PRICE_ID, STRIPE_BOOST_PRICE_ID } from "./lib/constants.js";
import { distanceKm, isoWeekKey, boostMillisLeft, applyUnread, isProfileListable } from "./lib/utils.js";
import { registerOneSignalUser, sendPushNotification } from "./lib/push.js";
import Shell from "./components/Shell.jsx";
import Spinner from "./components/Spinner.jsx";
import BottomNav from "./components/BottomNav.jsx";
import MatchOverlay from "./components/MatchOverlay.jsx";
import ResetPasswordScreen from "./screens/ResetPasswordScreen.jsx";
import AuthScreen from "./screens/AuthScreen.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import RadarScreen from "./screens/RadarScreen.jsx";
import SwipeScreen from "./screens/SwipeScreen.jsx";
import LikeokScreen from "./screens/LikeokScreen.jsx";
import MatchList from "./screens/MatchList.jsx";
import ChatView from "./screens/ChatView.jsx";
import ProfileScreen from "./screens/ProfileScreen.jsx";
import Avatar from "./components/Avatar.jsx";
import ToastNotice from "./components/ToastNotice.jsx";



// ── APP ────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [appState, setAppState] = useState("loading");
  const [tab, setTab] = useState("radar");
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [swipeUsers, setSwipeUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [matchOverlay, setMatchOverlay] = useState(null);
  const [inAppToast, setInAppToast] = useState(null);
  const toastTimerRef = useRef(null);
  const [nearbyAlert, setNearbyAlert] = useState(null);
  const nearbyAlertTimerRef = useRef(null);
  const lastNearbyCheckRef = useRef({});

  const showInAppToast = (match, text) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setInAppToast({ match, text });
    toastTimerRef.current = setTimeout(() => setInAppToast(null), 4000);
  };
  const [myLocation, setMyLocation] = useState(() => {
    const cached = localStorage.getItem("myLocation");
    return cached ? JSON.parse(cached) : null;
  });
  const [errorNotice, setErrorNotice] = useState("");

  // GPS-engedély kérése a Radar üres állapotának gombjáról (C4)
  const requestLocation = async () => {
    try {
      const pos = await new Promise((res,rej) => navigator.geolocation.getCurrentPosition(res,rej,{ timeout: 8000 }));
      const { latitude:lat, longitude:lng } = pos.coords;
      setMyLocation({ lat, lng });
      localStorage.setItem("myLocation", JSON.stringify({ lat, lng }));
      if (session?.user?.id) await supabase.from("profiles").update({ lat, lng, last_seen:new Date().toISOString() }).eq("id", session.user.id);
    } catch {
      setErrorNotice("Nem kaptunk helyadatot. Engedélyezd a helymeghatározást a böngésző/telefon beállításaiban, majd próbáld újra.");
    }
  };
  // Boost állapot a profil boost_expires_at mezőjéből (a fizetett boostot a
  // Stripe webhook, a heti ingyeneset a use_weekly_boost RPC állítja be —
  // kliens-oldalon nem hamisítható). Itt csak a be/ki határátmenet él:
  // a másodpercenkénti visszaszámláló a BoostCountdown komponensben fut,
  // így nem rendereli újra az egész appot (D1).
  const [boostActive, setBoostActive] = useState(false);

  useEffect(() => {
    const ms = boostMillisLeft(myProfile);
    setBoostActive(ms > 0);
    if (ms <= 0) return;
    const t = setTimeout(() => setBoostActive(false), ms + 250);
    return () => clearTimeout(t);
  }, [myProfile?.boost_expires_at]);

  const [newLikesCount, setNewLikesCount] = useState(0);

  const isPro = myProfile?.is_pro||false;
  const boostAvailable = isPro && !boostActive && myProfile?.last_boost_week !== isoWeekKey();

  const handleBoost = async () => {
    if (!boostAvailable) return;
    const { data: expiry, error } = await supabase.rpc("use_weekly_boost");
    if (error) { console.error("Boost hiba:", error.message); return; }
    setMyProfile(p => p ? { ...p, boost_active: true, boost_expires_at: expiry, last_boost_week: isoWeekKey() } : p);
  };

  const handleBuyBoost = async () => {
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${s?.access_token}` },
        body: JSON.stringify({ price_id: STRIPE_BOOST_PRICE_ID, success_url: window.location.origin+"?boost=success", cancel_url: window.location.origin+"?boost=cancel", mode: "payment" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) { console.error(err); }
  };

  const handleUpgrade = async () => {
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${s?.access_token}` },
        body: JSON.stringify({ price_id: STRIPE_PRICE_ID, success_url: window.location.origin+"?pro=success", cancel_url: window.location.origin+"?pro=cancel" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pro") === "success") { setMyProfile(p => p ? {...p, is_pro: true} : p); window.history.replaceState({}, "", window.location.pathname); }
    if (params.get("boost") === "success" && session?.user?.id) {
      // A boostot a Stripe webhook aktiválja szerver-oldalon; itt csak
      // frissítjük a profilt, amíg meg nem jelenik (max ~10 mp)
      window.history.replaceState({}, "", window.location.pathname);
      const uid = session.user.id;
      let tries = 0;
      const poll = async () => {
        const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
        if (data) setMyProfile(data);
        if ((!data || boostMillisLeft(data) <= 0) && ++tries < 5) setTimeout(poll, 2000);
      };
      poll();
    }
    if (params.get("reveal") === "success" && session?.user?.id) {
      const cardId = localStorage.getItem(`pendingReveal_${session.user.id}`);
      if (cardId) {
        supabase.from("compliment_cards").update({ revealed: true, revealed_at: new Date().toISOString() }).eq("id", cardId).then(() => {
          localStorage.removeItem(`pendingReveal_${session.user.id}`);
        });
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [session]);

  useEffect(() => {
    // Jelszó-visszaállítás detektálása (query param vagy hash)
    const isRecovery = window.location.search.includes("type=recovery") || window.location.hash.includes("type=recovery");
    if (isRecovery) {
      setAppState("reset-password");
    }
    supabase.auth.getSession().then(({ data:{ session } }) => {
      setSession(session);
      if (isRecovery) { setAppState("reset-password"); return; }
      if (session) loadProfile(session.user.id);
      else setAppState("auth");
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "PASSWORD_RECOVERY") { setAppState("reset-password"); return; }
      if (window.location.search.includes("type=recovery") || window.location.hash.includes("type=recovery")) { setAppState("reset-password"); return; }
      if (session) loadProfile(session.user.id);
      else { setMyProfile(null); setAppState("auth"); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) {
      setMyProfile(data);
      setAppState("main");
      registerOneSignalUser(userId);
      loadNewLikesCount(userId);
    } else {
      setAppState("onboarding");
    }
  };

  const loadNewLikesCount = async (userId) => {
    const { data: swipes } = await supabase.from("swipes").select("swiper_id").eq("swiped_id", userId).in("action", ["like","superlike"]);
    const { data: matches } = await supabase.from("matches").select("user1_id, user2_id").or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    const matchedIds = new Set((matches||[]).map(m => m.user1_id===userId ? m.user2_id : m.user1_id));
    // Azokat is kiszűrjük akiket már mi swipe-oltunk
    const { data: mySwipes } = await supabase.from("swipes").select("swiped_id").eq("swiper_id", userId);
    const mySwipedIds = new Set((mySwipes||[]).map(s => s.swiped_id));
    const candidates = (swipes||[]).filter(s => !matchedIds.has(s.swiper_id) && !mySwipedIds.has(s.swiper_id));
    // Kitiltott lájkolók nem számítanak
    let bannedIds = new Set();
    if (candidates.length > 0) {
      const { data: banned } = await supabase.from("profiles").select("id")
        .in("id", candidates.map(s => s.swiper_id)).eq("is_banned", true);
      bannedIds = new Set((banned||[]).map(b => b.id));
    }
    setNewLikesCount(candidates.filter(s => !bannedIds.has(s.swiper_id)).length);
  };

  useEffect(() => {
    if (appState !== "main") return;
    const updateLocation = async () => {
      try {
        const pos = await new Promise((res,rej) => navigator.geolocation.getCurrentPosition(res,rej,{timeout:8000}));
        const { latitude:lat, longitude:lng } = pos.coords;
        setMyLocation({ lat, lng });
        localStorage.setItem("myLocation", JSON.stringify({ lat, lng }));
        await supabase.from("profiles").update({ lat, lng, last_seen:new Date().toISOString() }).eq("id", session.user.id);

        // "Közel voltunk" ellenőrzés – 1km-en belüli aktív userek
        try {
          const { data: nearby } = await supabase.from("profiles")
            .select("id, name, photo_url, lat, lng, last_seen, is_banned")
            .neq("id", session.user.id)
            .eq("is_banned", false)
            .gte("last_seen", new Date(Date.now() - 15*60*1000).toISOString())
            .not("lat", "is", null)
            .limit(100);

          if (nearby) {
            // Már swipe-olt vagy matchelt userek kizárása
            const { data: mySwipes } = await supabase.from("swipes").select("swiped_id").eq("swiper_id", session.user.id);
            const { data: myMatches } = await supabase.from("matches").select("user1_id,user2_id").or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`);
            const swipedIds = new Set((mySwipes||[]).map(s => s.swiped_id));
            const matchedIds = new Set((myMatches||[]).flatMap(m => [m.user1_id, m.user2_id]));

            for (const u of nearby) {
              if (!u.lat || !u.lng) continue;
              if (swipedIds.has(u.id) || matchedIds.has(u.id)) continue;
              // Csak ha aktív az elmúlt 15 percben
              if (!u.last_seen || (Date.now() - new Date(u.last_seen).getTime()) > 15*60*1000) continue;
              const dist = distanceKm(lat, lng, u.lat, u.lng);
              if (dist <= 1) {
                // Csak ha még nem mutattuk meg ezt a usert az elmúlt 30 percben
                const lastShown = lastNearbyCheckRef.current[u.id] || 0;
                if (Date.now() - lastShown < 30*60*1000) continue;
                lastNearbyCheckRef.current[u.id] = Date.now();
                if (nearbyAlertTimerRef.current) clearTimeout(nearbyAlertTimerRef.current);
                setNearbyAlert({ user: u, dist: Math.round(dist * 1000) });
                nearbyAlertTimerRef.current = setTimeout(() => setNearbyAlert(null), 6000);
                break; // Egyszerre csak 1 értesítés
              }
            }
          }
        } catch {}
      } catch {}
    };
    updateLocation();
    const interval = setInterval(updateLocation, 60000);
    return () => clearInterval(interval);
  }, [appState, session]);

  const loadNearby = useCallback(async () => {
    if (!myLocation || !session) return;
    // Inkognito usereket nem töltjük be (hacsak nem likeoltak minket)
    const { data: likedUsSwipes } = await supabase.from("swipes").select("swiper_id").eq("swiped_id", session.user.id).in("action",["like","superlike"]);
    const likedUsIds = new Set((likedUsSwipes||[]).map(s => s.swiper_id));
    // Szerver-oldali szűkítés (D4): tiltottak kizárva, legutóbb aktívak
    // előre, max 200 sor — eddig a TELJES profiles tábla jött le minden
    // betöltésnél, és minden szűrés kliens-oldalon történt
    const { data } = await supabase.from("profiles").select("*")
      .neq("id", session.user.id)
      .eq("is_banned", false)
      .order("last_seen", { ascending: false, nullsFirst: false })
      .limit(200);
    if (!data) return;
    const swipeExpiry = new Date(); swipeExpiry.setDate(swipeExpiry.getDate() - 20);
    const { data:swipedData } = await supabase.from("swipes").select("swiped_id").eq("swiper_id", session.user.id).gte("created_at", swipeExpiry.toISOString());
    const swipedIds = new Set((swipedData||[]).map(s=>s.swiped_id));
    const listOpts = { swipedIds, likedUsIds };
    const withDist = data.filter(u => {
      if (!u.lat || !u.lng) return false;
      if (!u.last_seen || (Date.now()-new Date(u.last_seen).getTime()) >= 15*60*1000) return false;
      return isProfileListable(u, listOpts);
    }).map(u => ({ ...u, distanceKm: distanceKm(myLocation.lat, myLocation.lng, u.lat, u.lng) })).filter(u => u.distanceKm < 20).sort((a,b) => a.distanceKm-b.distanceKm);
    setNearbyUsers(withDist);
    const forSwipe = data.filter(u => isProfileListable(u, listOpts))
      .map(u => ({ ...u, distanceKm: u.lat&&u.lng&&myLocation ? distanceKm(myLocation.lat,myLocation.lng,u.lat,u.lng) : null }));
    // Ghost Score alapú rendezés: null (új user) = 100-nak számít → elöl, alacsony score → hátul
    const ghostSort = (a, b) => {
      const sa = a.ghost_score ?? 100;
      const sb = b.ghost_score ?? 100;
      return sb - sa;
    };
    // Boostolt userek mindig előre — eddig a boost mások számára láthatatlan volt
    const boostRank = (u) => boostMillisLeft(u) > 0 ? 0 : 1;
    const swipeSorted = boostActive
      ? [...forSwipe].sort((a, b) => {
          const br = boostRank(a) - boostRank(b);
          if (br !== 0) return br;
          const distDiff = (a.distanceKm||99) - (b.distanceKm||99);
          if (distDiff !== 0) return distDiff;
          return (b.ghost_score ?? 100) - (a.ghost_score ?? 100);
        })
      : [...forSwipe].sort((a, b) => {
          const br = boostRank(a) - boostRank(b);
          if (br !== 0) return br;
          return ghostSort(a, b);
        });
    setSwipeUsers(swipeSorted);
  }, [myLocation, session, boostActive]);

  useEffect(() => { loadNearby(); }, [loadNearby]);

  const loadMatches = useCallback(async () => {
    if (!session) return;
    // Az utolsó üzenet beágyazva érkezik (D5) — korábban match-enként külön
    // query futott (N+1), ráadásul minden beérkező üzenetnél újra
    const { data } = await supabase.from("matches")
      .select("*, user1:profiles!matches_user1_id_fkey(*), user2:profiles!matches_user2_id_fkey(*), messages(text,voice_url,created_at)")
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
      .order("created_at", { foreignTable: "messages", ascending: false })
      .limit(1, { foreignTable: "messages" })
      .order("created_at", { ascending: false });
    if (!data) return;
    const withOther = data.map(m => {
      const other = m.user1_id===session.user.id ? m.user2 : m.user1;
      const lastMsg = (m.messages || [])[0];
      const timeLabel = lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString("hu",{hour:"2-digit",minute:"2-digit"}) : "";
      const lastMsgAt = lastMsg?.created_at || m.created_at;
      return { ...m, other, lastMsg:lastMsg?.voice_url ? "🎙️ Hangüzenet" : lastMsg?.text, timeLabel, lastMsgAt };
    });
    // Olvasatlan üzenetek match-enként (egyetlen query az összesre)
    let unreadIds = new Set();
    if (data.length > 0) {
      const { data: unreadRows } = await supabase.from("messages").select("match_id")
        .in("match_id", data.map(m => m.id))
        .eq("is_read", false)
        .neq("sender_id", session.user.id);
      unreadIds = new Set((unreadRows||[]).map(r => r.match_id));
    }
    // Legújabb üzenet szerint rendezés
    const sorted = applyUnread([...withOther].sort((a,b) => new Date(b.lastMsgAt) - new Date(a.lastMsgAt)), unreadIds);
    setMatches(sorted);
  }, [session]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  // Friss tükör a realtime handlereknek (a closure-beli state elavulna)
  const matchesRef = useRef([]);
  useEffect(() => { matchesRef.current = matches; }, [matches]);
  const activeChatRef = useRef(null);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  useEffect(() => {
    if (!session) return;
    // Üzenetek realtime – lokális listafrissítés (nincs teljes refetch) + toast
    const msgSub = supabase.channel("messages_order")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"messages" }, (payload) => {
        const msg = payload.new;
        const isMine = msg.sender_id === session.user.id;
        const chatOpen = activeChatRef.current?.id === msg.match_id;
        const existing = matchesRef.current.find(m => m.id === msg.match_id);
        if (!existing) { loadMatches(); return; }
        setMatches(prev => {
          const m = prev.find(x => x.id === msg.match_id);
          if (!m) return prev;
          const updated = {
            ...m,
            lastMsg: msg.voice_url ? "🎙️ Hangüzenet" : msg.text,
            timeLabel: new Date(msg.created_at).toLocaleTimeString("hu",{hour:"2-digit",minute:"2-digit"}),
            lastMsgAt: msg.created_at,
            // Nyitott chatben érkezőt a ChatView azonnal olvasottra jelöli
            unread: m.unread || (!isMine && !chatOpen),
          };
          return [updated, ...prev.filter(x => x.id !== msg.match_id)];
        });
        // Toast csak idegen üzenetre, és csak ha nem épp az a chat van nyitva (B13)
        if (!isMine && !chatOpen && existing.other) {
          showInAppToast({ id: msg.match_id, other: existing.other }, msg.voice_url ? "🎙️ Hangüzenet" : msg.text);
        }
      }).subscribe();

    const sub = supabase.channel("matches_realtime")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"matches" }, async payload => {
        const m = payload.new;
        if (m.user1_id===session.user.id || m.user2_id===session.user.id) {
          const otherId = m.user1_id===session.user.id ? m.user2_id : m.user1_id;
          const { data:other } = await supabase.from("profiles").select("*").eq("id",otherId).single();
          // A push-t a match létrehozója küldi (handleSwipe) — innen küldve
          // duplán menne ki (B8)
          if (other) setMatchOverlay(other);
          loadMatches();
          if (session?.user?.id) loadNewLikesCount(session.user.id);
        }
      }).subscribe();
    return () => { supabase.removeChannel(sub); supabase.removeChannel(msgSub); };
  }, [session, loadMatches]);

  // ── CHAT NYITÁS (kártya küldőjével, match nélkül is) ──
  const handleOpenChatWith = async (sender) => {
    if (!sender?.id || !session?.user?.id) return;
    // Van már match?
    let m = matches.find(x => x.other?.id === sender.id);
    if (m) { setActiveChat(m); setTab("matches"); return; }

    // Nincs – keressük a DB-ben
    const myId = session.user.id;
    const { data: existing } = await supabase.from("matches").select("*")
      .or(`and(user1_id.eq.${myId},user2_id.eq.${sender.id}),and(user1_id.eq.${sender.id},user2_id.eq.${myId})`)
      .maybeSingle();

    let matchRow = existing;
    if (!matchRow) {
      // Létrehozunk egy matchet
      const { data: created } = await supabase.from("matches")
        .insert({ user1_id: myId, user2_id: sender.id })
        .select("*").single();
      matchRow = created;
    }
    if (matchRow) {
      const matchObj = { ...matchRow, other: sender, unread: false };
      setActiveChat(matchObj);
      setTab("matches");
      loadMatches();
    }
  };

  // ── JAVÍTOTT HANDLESWIPE ────────────────────────────
  const handleSwipe = async (targetId, action) => {
    if (!session?.user?.id) return;

    // Lokális listafrissítés azonnal (D3) — korábban minden swipe után a
    // teljes loadNearby + loadMatches újrafutott (6-10 query swipe-onként)
    setNearbyUsers(prev => prev.filter(u => u.id !== targetId));
    setSwipeUsers(prev => prev.filter(u => u.id !== targetId));

    // 1. Swipe mentése
    const { error } = await supabase.from("swipes").upsert(
      { swiper_id: session.user.id, swiped_id: targetId, action },
      { onConflict: "swiper_id,swiped_id" }
    );

    if (error) {
      console.error("Swipe hiba:", error);
      return;
    }

    // 2. Ha like vagy superlike: nézzük meg, ő is likedelt-e minket?
    if (action === "like" || action === "superlike") {
      const { data: theirSwipe } = await supabase
        .from("swipes")
        .select("action")
        .eq("swiper_id", targetId)
        .eq("swiped_id", session.user.id)
        .in("action", ["like", "superlike"])
        .maybeSingle();

      if (theirSwipe) {
        // 3. Kölcsönös like → match létrehozása (ha még nincs)
        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id")
          .or(
            `and(user1_id.eq.${session.user.id},user2_id.eq.${targetId}),` +
            `and(user1_id.eq.${targetId},user2_id.eq.${session.user.id})`
          )
          .maybeSingle();

        if (!existingMatch) {
          await supabase.from("matches").insert({
            user1_id: session.user.id,
            user2_id: targetId,
          });

          // 4. Match overlay megjelenítése
          const { data: otherProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", targetId)
            .single();

          if (otherProfile) {
            setMatchOverlay(otherProfile);
            await sendPushNotification(
              targetId,
              "🎉 Új match!",
              `${myProfile?.name || "Valaki"} kedvelt téged!`,
              { type: "match" }
            );
          }
        }
      }
    }

    // Match esetén a matches_realtime handler frissíti a match-listát;
    // a Likeok-badge újraszámolása könnyű query-k, nem várunk rá
    loadNewLikesCount(session.user.id);
  };

  // Visszatekerés (Pro): a swipe sort töröljük a DB-ből és a user visszakerül
  // a pakli elejére — korábban csak lokálisan ugrott vissza az index, a swipe
  // a DB-ben maradt, így következő betöltéskor a user mégis eltűnt
  const handleUnswipe = async (user) => {
    if (!session?.user?.id || !user?.id) return;
    await supabase.from("swipes").delete()
      .eq("swiper_id", session.user.id).eq("swiped_id", user.id);
    setSwipeUsers(prev => prev.some(u => u.id === user.id) ? prev : [user, ...prev]);
    if (user.lat && user.lng && myLocation) {
      const d = distanceKm(myLocation.lat, myLocation.lng, user.lat, user.lng);
      if (d < 20) setNearbyUsers(prev => prev.some(u => u.id === user.id) ? prev : [{ ...user, distanceKm: d }, ...prev].sort((a,b) => a.distanceKm-b.distanceKm));
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) return;
    const uid = session.user.id;
    // Feltöltött fájlok törlése a Storage API-n át (a blobok is törlődnek;
    // az RPC a metaadatokat amúgy is takarítja)
    for (const bucket of ["avatars", "voices"]) {
      try {
        const { data: files } = await supabase.storage.from(bucket).list(uid);
        if (files?.length) await supabase.storage.from(bucket).remove(files.map(f => `${uid}/${f.name}`));
      } catch {}
    }
    // Az auth user törlésével minden app-adat kaszkádol (profil, matchek,
    // üzenetek, swipe-ok, jelentések, kártyák, push tokenek). A korábbi
    // táblánkénti kliens-törlés a profilnál némán elhasalt (nincs DELETE policy).
    const { error } = await supabase.rpc("delete_my_account");
    if (error) { setErrorNotice("A fiók törlése nem sikerült: " + error.message); return; }
    await supabase.auth.signOut();
  };
  const unreadCount = matches.filter(m=>m.unread).length;
  const newCardsCount = 0; // realtime frissítés később bővíthető

  if (appState==="loading") return <Shell><div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20 }}><div style={{ width:110,height:110,borderRadius:26,overflow:"hidden",flexShrink:0,animation:"pulse 1.8s ease-in-out infinite" }}><img src="/icon-512.png" alt="NearMatch" style={{ width:"115%",height:"115%",objectFit:"cover",display:"block",marginLeft:"-7.5%",marginTop:"-7.5%" }} /></div><Spinner /></div></Shell>;
  if (appState==="auth") return <Shell><AuthScreen /></Shell>;
  if (appState==="reset-password") return <Shell><ResetPasswordScreen onDone={() => { setAppState("loading"); supabase.auth.getSession().then(({ data:{ session } }) => { if(session) loadProfile(session.user.id); else setAppState("auth"); }); }} /></Shell>;
  if (appState==="onboarding") return <Shell><Onboarding user={session.user} onComplete={p=>{ setMyProfile(p); setAppState("main"); registerOneSignalUser(p.id); }} /></Shell>;

  return (
    <Shell>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",paddingTop:"calc(12px + env(safe-area-inset-top))",borderBottom:`1px solid ${C.border}`,background:C.surface,flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:22,fontWeight:900,background:`linear-gradient(135deg,${C.accent},#ff8c42)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>NearMatch</span>
          {myProfile?.is_founder && <div style={{ background:"linear-gradient(135deg,#a78bfa,#6366f1)",borderRadius:8,padding:"3px 8px",fontSize:10,color:"#fff",fontWeight:700 }}>FOUNDER</div>}
          {isPro && !myProfile?.is_founder && <div style={{ background:"linear-gradient(135deg,#ffd43b,#ff8c42)",borderRadius:8,padding:"3px 8px",fontSize:10,color:"#000",fontWeight:700 }}>PRO</div>}
        </div>
        {!myLocation && <div style={{ color:C.yellow,fontSize:11 }}>📍 GPS szükséges</div>}
      </div>
      <div style={{ flex:1,overflow:"hidden",display:"flex",flexDirection:"column",position:"relative",minHeight:0 }}>
        {errorNotice && <ToastNotice message={errorNotice} onClose={() => setErrorNotice("")} />}
        {matchOverlay && <MatchOverlay user={matchOverlay} onMessage={() => { const m=matches.find(x=>x.other?.id===matchOverlay.id); setMatchOverlay(null); if(m){setActiveChat(m);setTab("matches");} }} onClose={()=>setMatchOverlay(null)} />}
        {activeChat ? (
          <ChatView match={activeChat} myId={session.user.id} myVoiceOnly={myProfile?.voice_only} onBack={()=>setActiveChat(null)} onMatchDeleted={()=>{ setActiveChat(null); loadMatches(); }} onRead={loadMatches} />
        ) : (
          <>
            {/* Közel voltunk értesítő */}
          {nearbyAlert && (
            <div style={{ position:"absolute", top:12, left:12, right:12, zIndex:301, background:"linear-gradient(135deg,rgba(15,21,32,0.98),rgba(20,28,43,0.98))", borderRadius:18, padding:"14px 16px", border:"1px solid rgba(255,92,92,0.3)", boxShadow:"0 8px 32px rgba(255,92,92,0.15)", display:"flex", alignItems:"center", gap:12, animation:"slideDown 0.3s ease" }}>
              <div style={{ position:"relative", flexShrink:0 }}>
                <Avatar src={nearbyAlert.user.photo_url} name={nearbyAlert.user.name} size={46} style={{ border:"2px solid rgba(255,92,92,0.5)" }} />
                <div style={{ position:"absolute", bottom:-2, right:-2, width:16, height:16, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9 }}>📍</div>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:C.text, fontWeight:700, fontSize:13 }}>Közel vagytok egymáshoz!</div>
                <div style={{ color:C.accent, fontSize:12, fontWeight:600 }}>{nearbyAlert.user.name} • {nearbyAlert.dist < 100 ? "<100 m" : `~${nearbyAlert.dist} m`} távolságra</div>
                <div style={{ color:C.muted, fontSize:11, marginTop:2 }}>Nézd meg a profilját a Radar nézetben</div>
              </div>
              <button onClick={() => setNearbyAlert(null)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:18, flexShrink:0 }}>✕</button>
            </div>
          )}

          {/* In-app üzenet értesítés */}
          {inAppToast && (
            <div onClick={() => { setActiveChat(inAppToast.match); setTab("matches"); setInAppToast(null); }}
              style={{ position:"absolute", top:12, left:12, right:12, zIndex:300, background:C.card, borderRadius:18, padding:"12px 14px", border:`1px solid ${C.border}`, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", display:"flex", alignItems:"center", gap:12, cursor:"pointer", animation:"slideDown 0.3s ease" }}>
              <Avatar src={inAppToast.match.other?.photo_url} name={inAppToast.match.other?.name} size={42} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:C.text, fontWeight:700, fontSize:13 }}>{inAppToast.match.other?.name}</div>
                <div style={{ color:C.muted, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{inAppToast.text}</div>
              </div>
              <button onClick={e=>{e.stopPropagation();setInAppToast(null);}} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:18, flexShrink:0 }}>✕</button>
            </div>
          )}

          {tab==="radar" && <RadarScreen myProfile={myProfile} nearbyUsers={nearbyUsers} isPro={isPro} boostActive={boostActive} onUpgrade={handleUpgrade} onSwipe={handleSwipe} hasLocation={!!myLocation} onRequestLocation={requestLocation} />}
            {tab==="swipe" && <SwipeScreen myProfile={myProfile} swipeUsers={swipeUsers} onSwipe={handleSwipe} onUnswipe={handleUnswipe} boostActive={boostActive} isPro={isPro} onUpgrade={handleUpgrade} onOpenChat={handleOpenChatWith} />}
            {tab==="likeok" && <LikeokScreen myId={session.user.id} isPro={isPro} onUpgrade={handleUpgrade} onSwipe={handleSwipe} />}
            {tab==="matches" && <MatchList matches={matches} onOpen={m=>{setActiveChat(m);}} isPro={isPro} onUpgrade={handleUpgrade} />}
            {tab==="profile" && <ProfileScreen myProfile={myProfile} setMyProfile={setMyProfile} isPro={isPro} boostActive={boostActive} boostAvailable={boostAvailable} onBoost={handleBoost} onBuyBoost={handleBuyBoost} onUpgrade={handleUpgrade} onSignOut={handleSignOut} onDeleteAccount={handleDeleteAccount} />}
          </>
        )}
      </div>
      {!activeChat && <BottomNav active={tab} setActive={setTab} unreadCount={unreadCount} newLikesCount={newLikesCount} />}
    </Shell>
  );
}
