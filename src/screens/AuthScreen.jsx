import { useState } from "react";
import { supabase } from "../supabase.js";
import { C } from "../lib/constants.js";
import Spinner from "../components/Spinner.jsx";

export default function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handle = async () => {
    if (!email || !password) { setError("Töltsd ki az összes mezőt!"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Ellenőrizd az emailed!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (e) {
      setError(e.message);
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) { setError("Add meg az email címed a jelszó visszaállításához!"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/?type=recovery`,
      });
      if (error) throw error;
      setSuccess("Elküldtük a jelszó-visszaállító linket az emailedre! 📧");
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 28px" }}>
      <div style={{ width:80, height:80, borderRadius:24, marginBottom:20, overflow:"hidden", flexShrink:0, alignSelf:"center", background:"#141c2b" }}>
        <img src="/icon-512.png" alt="NearMatch" style={{ width:"115%", height:"115%", objectFit:"cover", display:"block", marginLeft:"-7.5%", marginTop:"-7.5%" }} />
      </div>
      <h1 style={{ fontSize:32, fontWeight:900, color:C.text, fontFamily:"Georgia,serif", margin:"0 0 6px" }}>NearMatch</h1>
      <p style={{ color:C.muted, fontSize:13, margin:"0 0 28px" }}>Sosem volt még ilyen közel a következő randid.</p>

      {/* Google gomb */}
      <button onClick={handleGoogle} disabled={googleLoading}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"14px 16px", borderRadius:14, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontSize:15, fontWeight:600, cursor:googleLoading?"not-allowed":"pointer", marginBottom:16, opacity:googleLoading?0.7:1 }}>
        {googleLoading ? <Spinner /> : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Folytatás Google-lel
          </>
        )}
      </button>

      {/* Elválasztó */}
      <div style={{ width:"100%", display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <div style={{ flex:1, height:1, background:C.border }} />
        <span style={{ color:C.dim, fontSize:12 }}>vagy</span>
        <div style={{ flex:1, height:1, background:C.border }} />
      </div>

      {/* Email/jelszó tab */}
      <div style={{ width:"100%", display:"flex", gap:8, marginBottom:20 }}>
        {["login","register"].map(m => (
          <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
            style={{ flex:1, padding:"10px", borderRadius:12, border:`1px solid ${mode===m?C.accent:C.border}`, background:mode===m?C.accentSoft:C.card, color:mode===m?C.accent:C.muted, fontWeight:700, cursor:"pointer", fontSize:14 }}>
            {m === "login" ? "Bejelentkezés" : "Regisztráció"}
          </button>
        ))}
      </div>
      <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:12 }}>
        <input type="email" placeholder="Email cím" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width:"100%", padding:"14px 16px", borderRadius:13, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontSize:15, outline:"none" }} />
        <input type="password" placeholder="Jelszó" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key==="Enter" && handle()}
          style={{ width:"100%", padding:"14px 16px", borderRadius:13, background:C.card, border:`1px solid ${C.border}`, color:C.text, fontSize:15, outline:"none" }} />
        {error && <div style={{ background:"rgba(255,92,92,0.1)", border:`1px solid ${C.accent}`, borderRadius:10, padding:"10px 14px", color:C.accent, fontSize:13 }}>{error}</div>}
        {success && <div style={{ background:"rgba(62,207,142,0.1)", border:`1px solid ${C.green}`, borderRadius:10, padding:"10px 14px", color:C.green, fontSize:13 }}>{success}</div>}
        <button onClick={handle} disabled={loading}
          style={{ width:"100%", padding:"16px", background:loading?C.card:`linear-gradient(135deg,${C.accent},#ff8c42)`, border:"none", borderRadius:16, color:"#fff", fontSize:16, fontWeight:700, cursor:loading?"not-allowed":"pointer", marginTop:4 }}>
          {loading ? <Spinner /> : mode === "login" ? "Bejelentkezés →" : "Regisztráció →"}
        </button>
        {mode === "login" && (
          <button onClick={handleResetPassword} disabled={loading}
            style={{ background:"none", border:"none", color:C.muted, fontSize:13, cursor:"pointer", marginTop:4, textDecoration:"underline" }}>
            Elfelejtetted a jelszavad?
          </button>
        )}
      </div>
    </div>
  );
}
