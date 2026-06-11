import { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { C } from "../lib/constants.js";
import Spinner from "../components/Spinner.jsx";

export default function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      // 1. Van már session?
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { setSessionReady(true); return; }

      // 2. Token a hash-ből (Supabase recovery formátum: #access_token=...&refresh_token=...&type=recovery)
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!error) { setSessionReady(true); return; }
      }

      // 3. Token query paramból (PKCE flow: ?code=...)
      const queryParams = new URLSearchParams(window.location.search);
      const code = queryParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) { setSessionReady(true); return; }
      }
    };
    checkSession();

    // Időtúllépés: ha 6 mp után sincs session, jelezzük
    const timeout = setTimeout(() => {
      setSessionReady(prev => {
        if (!prev) setError("A visszaállító link lejárt vagy érvénytelen. Kérj újat a bejelentkezésnél.");
        return prev;
      });
    }, 6000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")) {
        setSessionReady(true);
      }
    });
    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const handleReset = async () => {
    if (!password || password.length < 6) { setError("A jelszó legalább 6 karakter legyen!"); return; }
    if (password !== password2) { setError("A két jelszó nem egyezik!"); return; }
    setLoading(true); setError("");
    try {
      // Biztosítsuk hogy van session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("A visszaállító link lejárt vagy érvénytelen. Kérj újat a bejelentkezésnél.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess("Jelszó megváltoztatva! Bejelentkezés...");
      setTimeout(() => { window.history.replaceState({}, "", window.location.pathname); onDone(); }, 1500);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 28px" }}>
      <div style={{ width:80, height:80, borderRadius:24, marginBottom:20, overflow:"hidden", background:"#141c2b" }}>
        <img src="/icon-512.png" alt="NearMatch" style={{ width:"115%", height:"115%", objectFit:"cover", display:"block", marginLeft:"-7.5%", marginTop:"-7.5%" }} />
      </div>
      <h1 style={{ fontSize:26, fontWeight:900, color:C.text, fontFamily:"Georgia,serif", margin:"0 0 6px" }}>Új jelszó</h1>
      <p style={{ color:C.muted, fontSize:13, margin:"0 0 28px", textAlign:"center" }}>Add meg az új jelszavad</p>
      <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:12 }}>
        <input type="password" placeholder="Új jelszó" value={password} onChange={e => setPassword(e.target.value)}
          style={{ width:"100%", padding:"14px 16px", borderRadius:13, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontSize:15, outline:"none" }} />
        <input type="password" placeholder="Új jelszó újra" value={password2} onChange={e => setPassword2(e.target.value)}
          onKeyDown={e => e.key==="Enter" && handleReset()}
          style={{ width:"100%", padding:"14px 16px", borderRadius:13, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontSize:15, outline:"none" }} />
        {error && <div style={{ background:"rgba(255,92,92,0.1)", border:`1px solid ${C.accent}`, borderRadius:10, padding:"10px 14px", color:C.accent, fontSize:13 }}>{error}</div>}
        {success && <div style={{ background:"rgba(62,207,142,0.1)", border:`1px solid ${C.green}`, borderRadius:10, padding:"10px 14px", color:C.green, fontSize:13 }}>{success}</div>}
        {!sessionReady && !error && <div style={{ background:"rgba(255,212,59,0.1)", border:`1px solid ${C.yellow}`, borderRadius:10, padding:"10px 14px", color:C.yellow, fontSize:13 }}>⏳ Link ellenőrzése...</div>}
        <button onClick={handleReset} disabled={loading||!sessionReady}
          style={{ width:"100%", padding:"16px", background:(loading||!sessionReady)?C.card:`linear-gradient(135deg,${C.accent},#ff8c42)`, border:"none", borderRadius:16, color:"#fff", fontSize:16, fontWeight:700, cursor:(loading||!sessionReady)?"not-allowed":"pointer", opacity:(loading||!sessionReady)?0.5:1 }}>
          {loading ? <Spinner /> : "Jelszó mentése →"}
        </button>
      </div>
    </div>
  );
}
