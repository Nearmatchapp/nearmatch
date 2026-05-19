import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

const ADMIN_EMAILS = ["admin@nearmatch.app"];

const C = {
  bg: "#080b10",
  surface: "#0f1520",
  card: "#141c2b",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.14)",
  accent: "#ff5c5c",
  accentSoft: "rgba(255,92,92,0.12)",
  accentGlow: "rgba(255,92,92,0.25)",
  orange: "#ff8c42",
  yellow: "#ffd43b",
  green: "#3ecf8e",
  greenSoft: "rgba(62,207,142,0.12)",
  blue: "#4dabf7",
  blueSoft: "rgba(77,171,247,0.12)",
  purple: "#a78bfa",
  purpleSoft: "rgba(167,139,250,0.12)",
  text: "#f0f4ff",
  muted: "rgba(240,244,255,0.55)",
  dim: "rgba(240,244,255,0.2)",
};

const GLOBAL_STYLE = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  input, textarea { font-family: inherit; }
  button { font-family: inherit; }
`;

function Spinner({ size = 28, color = C.accent }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid rgba(255,255,255,0.08)`,
      borderTop: `2px solid ${color}`,
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
      margin: "0 auto",
      flexShrink: 0,
    }} />
  );
}

function Badge({ label, color = C.accent, bg }) {
  return (
    <span style={{
      background: bg || `${color}20`,
      color,
      border: `1px solid ${color}40`,
      borderRadius: 6,
      padding: "2px 8px",
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 0.5,
      whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function Avatar({ src, name, size = 40, opacity = 1 }) {
  const initials = (name || "?").slice(0, 2).toUpperCase();
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", opacity }}
          onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
        />
      ) : null}
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `linear-gradient(135deg, ${C.accent}, ${C.orange})`,
        display: src ? "none" : "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: size * 0.35, fontWeight: 700, color: "#fff",
        opacity,
      }}>{initials}</div>
    </div>
  );
}

function StatCard({ icon, label, value, color = C.text, sub }) {
  return (
    <div style={{
      background: C.card,
      borderRadius: 16,
      padding: "18px 20px",
      border: `1px solid ${C.border}`,
      display: "flex",
      flexDirection: "column",
      gap: 6,
      animation: "fadeIn 0.3s ease",
    }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ color, fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{value ?? "–"}</div>
      <div style={{ color: C.muted, fontSize: 12 }}>{label}</div>
      {sub && <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(8,11,16,0.88)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: C.surface,
          borderRadius: "24px 24px 0 0",
          border: `1px solid ${C.border}`,
          borderBottom: "none",
          padding: "6px 0 0",
          animation: "slideUp 0.25s ease",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: C.border, margin: "0 auto 20px",
        }} />
        <div style={{ overflowY: "auto", padding: "0 20px 40px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STATS TAB
// ─────────────────────────────────────────────
function StatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: totalUsers },
        { count: proUsers },
        { count: totalMatches },
        { count: totalSwipes },
        { count: totalMessages },
        { count: totalReports },
        { count: unresolvedReports },
        { count: activeToday },
        { count: newUsersWeek },
        { count: newMatchesWeek },
        { data: recentUsers },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_pro", true),
        supabase.from("matches").select("*", { count: "exact", head: true }),
        supabase.from("swipes").select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }),
        supabase.from("reports").select("*", { count: "exact", head: true }),
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("resolved", false),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("last_seen", yesterday),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("matches").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("profiles").select("name,created_at,is_pro,is_founder,photo_url,gender,age").order("created_at", { ascending: false }).limit(8),
      ]);

      setStats({
        totalUsers, proUsers, totalMatches, totalSwipes, totalMessages,
        totalReports, unresolvedReports, activeToday,
        newUsersWeek, newMatchesWeek,
        proRate: totalUsers > 0 ? Math.round((proUsers / totalUsers) * 100) : 0,
        recentUsers: recentUsers || [],
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
      <Spinner size={36} />
    </div>
  );

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.3s ease" }}>

      {/* Alert ha van kezeletlen jelentés */}
      {stats.unresolvedReports > 0 && (
        <div style={{
          background: "rgba(255,92,92,0.08)",
          border: `1px solid rgba(255,92,92,0.3)`,
          borderRadius: 14,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{ fontSize: 24 }}>🚩</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: C.accent, fontWeight: 700, fontSize: 14 }}>
              {stats.unresolvedReports} kezeletlen jelentés vár
            </div>
            <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
              Nézd meg a Jelentések fülön
            </div>
          </div>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: C.accent,
            boxShadow: `0 0 8px ${C.accent}`,
            animation: "pulse 2s ease infinite",
          }} />
        </div>
      )}

      {/* Fő statisztikák */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatCard icon="👥" label="Összes felhasználó" value={stats.totalUsers} sub={`+${stats.newUsersWeek} ezen a héten`} />
        <StatCard icon="⚡" label="Pro felhasználók" value={stats.proUsers} color={C.yellow} sub={`${stats.proRate}% konverzió`} />
        <StatCard icon="🟢" label="Aktív ma (24h)" value={stats.activeToday} color={C.green} />
        <StatCard icon="💝" label="Összes match" value={stats.totalMatches} color={C.accent} sub={`+${stats.newMatchesWeek} ezen a héten`} />
        <StatCard icon="👆" label="Összes swipe" value={stats.totalSwipes} />
        <StatCard icon="💬" label="Összes üzenet" value={stats.totalMessages} color={C.blue} />
      </div>

      {/* Legutóbbi regisztrációk */}
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
            Legutóbbi regisztrációk
          </span>
          <span style={{ color: C.dim, fontSize: 11 }}>utolsó 8</span>
        </div>
        {stats.recentUsers.map((u, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            borderBottom: i < stats.recentUsers.length - 1 ? `1px solid ${C.border}` : "none",
          }}>
            <Avatar src={u.photo_url} name={u.name} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: C.text, fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || "–"}</span>
                {u.is_pro && <Badge label="PRO" color={C.yellow} />}
                {u.is_founder && <Badge label="FOUNDER" color={C.purple} />}
              </div>
              <div style={{ color: C.dim, fontSize: 11, marginTop: 1 }}>
                {u.age ? `${u.age} éves • ` : ""}{u.gender || ""} • {new Date(u.created_at).toLocaleString("hu", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// USERS TAB
// ─────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pushModal, setPushModal] = useState(false);
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushSent, setPushSent] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (filter === "pro") q = q.eq("is_pro", true);
    if (filter === "banned") q = q.eq("is_banned", true);
    if (filter === "founder") q = q.eq("is_founder", true);
    const { data } = await q;
    setUsers(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const togglePro = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ is_pro: !selectedUser.is_pro }).eq("id", selectedUser.id);
    setSelectedUser(u => ({ ...u, is_pro: !u.is_pro }));
    await load();
    setSaving(false);
  };

  const toggleFounder = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ is_founder: !selectedUser.is_founder }).eq("id", selectedUser.id);
    setSelectedUser(u => ({ ...u, is_founder: !u.is_founder }));
    await load();
    setSaving(false);
  };

  const toggleBan = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ is_banned: !selectedUser.is_banned }).eq("id", selectedUser.id);
    setSelectedUser(u => ({ ...u, is_banned: !u.is_banned }));
    await load();
    setSaving(false);
  };

  const deleteUser = async () => {
    setSaving(true);
    await supabase.from("profiles").delete().eq("id", selectedUser.id);
    setSelectedUser(null);
    setConfirmDelete(false);
    await load();
    setSaving(false);
  };

  const sendPush = async () => {
    if (!pushTitle || !pushBody) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          title: pushTitle,
          body: pushBody,
          data: { type: "admin" },
        }),
      });
      setPushSent(true);
      setTimeout(() => { setPushModal(false); setPushSent(false); setPushTitle(""); setPushBody(""); }, 1500);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const lastSeenLabel = (ls) => {
    if (!ls) return "Soha";
    const diff = Math.floor((Date.now() - new Date(ls).getTime()) / 60000);
    if (diff < 5) return "● Most online";
    if (diff < 60) return `${diff} perce aktív`;
    if (diff < 1440) return `${Math.floor(diff / 60)} órája aktív`;
    return `${Math.floor(diff / 1440)} napja aktív`;
  };

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* User detail modal */}
      {selectedUser && !confirmDelete && !pushModal && (
        <Modal onClose={() => setSelectedUser(null)}>
          {/* Profil fejléc */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <Avatar src={selectedUser.photo_url} name={selectedUser.name} size={60} opacity={selectedUser.is_banned ? 0.4 : 1} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ color: C.text, fontWeight: 800, fontSize: 18 }}>{selectedUser.name || "–"}</span>
                {selectedUser.is_pro && <Badge label="PRO" color={C.yellow} />}
                {selectedUser.is_founder && <Badge label="FOUNDER" color={C.purple} />}
                {selectedUser.is_banned && <Badge label="TILTOTT" color={C.accent} />}
              </div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>
                {selectedUser.age && `${selectedUser.age} éves • `}
                {selectedUser.gender || ""}
              </div>
            </div>
          </div>

          {/* Info sor */}
          <div style={{ background: C.card, borderRadius: 12, padding: "12px 14px", border: `1px solid ${C.border}`, marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {selectedUser.bio && (
              <div>
                <div style={{ color: C.dim, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Bio</div>
                <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.5 }}>{selectedUser.bio}</div>
              </div>
            )}
            {(selectedUser.interests || []).length > 0 && (
              <div>
                <div style={{ color: C.dim, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Érdeklődés</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {selectedUser.interests.map(t => (
                    <span key={t} style={{ background: C.accentSoft, color: C.accent, border: `1px solid ${C.accent}40`, borderRadius: 20, padding: "3px 9px", fontSize: 11 }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: C.muted, borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4 }}>
              {selectedUser.looking_for && <span>💍 {selectedUser.looking_for}</span>}
              {selectedUser.height && <span>📏 {selectedUser.height} cm</span>}
              {selectedUser.education && <span>🎓 {selectedUser.education}</span>}
            </div>
            <div style={{ fontSize: 11, color: C.dim, borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
              <span>📅 Regisztrált: {new Date(selectedUser.created_at || Date.now()).toLocaleString("hu")}</span>
              <span>👁️ {lastSeenLabel(selectedUser.last_seen)}</span>
            </div>
          </div>

          {/* Akció gombok */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={togglePro}
              disabled={saving}
              style={{
                padding: "13px 16px",
                borderRadius: 12,
                border: `1px solid ${selectedUser.is_pro ? C.accent + "40" : C.yellow + "40"}`,
                background: selectedUser.is_pro ? C.accentSoft : "rgba(255,212,59,0.1)",
                color: selectedUser.is_pro ? C.accent : C.yellow,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {selectedUser.is_pro ? "❌ Pro visszavonása" : "⚡ Pro megadása"}
            </button>

            <button
              onClick={toggleFounder}
              disabled={saving}
              style={{
                padding: "13px 16px",
                borderRadius: 12,
                border: `1px solid ${selectedUser.is_founder ? C.accent + "40" : C.purple + "40"}`,
                background: selectedUser.is_founder ? C.accentSoft : C.purpleSoft,
                color: selectedUser.is_founder ? C.accent : C.purple,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                textAlign: "left",
              }}
            >
              {selectedUser.is_founder ? "❌ Founder visszavonása" : "👑 Founder badge megadása"}
            </button>

            <button
              onClick={() => setPushModal(true)}
              style={{
                padding: "13px 16px",
                borderRadius: 12,
                border: `1px solid ${C.blue}40`,
                background: C.blueSoft,
                color: C.blue,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                textAlign: "left",
              }}
            >
              🔔 Push értesítés küldése
            </button>

            <button
              onClick={toggleBan}
              disabled={saving}
              style={{
                padding: "13px 16px",
                borderRadius: 12,
                border: `1px solid ${C.orange}40`,
                background: "rgba(255,140,66,0.1)",
                color: C.orange,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                textAlign: "left",
              }}
            >
              {selectedUser.is_banned ? "✅ Tiltás feloldása" : "🚫 Felhasználó tiltása"}
            </button>

            <button
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              style={{
                padding: "13px 16px",
                borderRadius: 12,
                border: `1px solid ${C.accent}30`,
                background: C.accentSoft,
                color: C.accent,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                textAlign: "left",
              }}
            >
              🗑️ Profil törlése
            </button>

            <button
              onClick={() => setSelectedUser(null)}
              style={{
                padding: "13px 16px",
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                background: "none",
                color: C.muted,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Mégse
            </button>
          </div>
        </Modal>
      )}

      {/* Törlés megerősítés */}
      {confirmDelete && selectedUser && (
        <Modal onClose={() => setConfirmDelete(false)}>
          <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <div style={{ color: C.text, fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
              Biztosan törlöd?
            </div>
            <div style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>
              <strong style={{ color: C.accent }}>{selectedUser.name}</strong> profilja véglegesen törlődik.<br />Ez nem visszavonható!
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ flex: 1, padding: "14px", borderRadius: 12, border: `1px solid ${C.border}`, background: "none", color: C.muted, cursor: "pointer", fontSize: 14 }}
              >
                Mégse
              </button>
              <button
                onClick={deleteUser}
                disabled={saving}
                style={{ flex: 1, padding: "14px", borderRadius: 12, border: "none", background: C.accent, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
              >
                {saving ? <Spinner size={20} color="#fff" /> : "🗑️ Igen, törlöm"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Push küldés modal */}
      {pushModal && selectedUser && (
        <Modal onClose={() => { setPushModal(false); setPushTitle(""); setPushBody(""); setPushSent(false); }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Push értesítés</div>
            <div style={{ color: C.muted, fontSize: 13 }}>Küldés: <strong style={{ color: C.blue }}>{selectedUser.name}</strong></div>
          </div>

          {pushSent ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ color: C.green, fontWeight: 700 }}>Elküldve!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ color: C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Cím</label>
                <input
                  type="text"
                  value={pushTitle}
                  onChange={e => setPushTitle(e.target.value)}
                  placeholder="pl. 🎉 Különleges ajánlat!"
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 11, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none" }}
                />
              </div>
              <div>
                <label style={{ color: C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Üzenet</label>
                <textarea
                  value={pushBody}
                  onChange={e => setPushBody(e.target.value)}
                  placeholder="Az értesítés szövege..."
                  rows={3}
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 11, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", resize: "none", lineHeight: 1.5 }}
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => { setPushModal(false); setPushTitle(""); setPushBody(""); }}
                  style={{ flex: 1, padding: "13px", borderRadius: 12, border: `1px solid ${C.border}`, background: "none", color: C.muted, cursor: "pointer", fontSize: 14 }}
                >
                  Mégse
                </button>
                <button
                  onClick={sendPush}
                  disabled={saving || !pushTitle || !pushBody}
                  style={{ flex: 1, padding: "13px", borderRadius: 12, border: "none", background: !pushTitle || !pushBody ? C.card : C.blue, color: "#fff", cursor: !pushTitle || !pushBody ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, opacity: !pushTitle || !pushBody ? 0.5 : 1 }}
                >
                  {saving ? <Spinner size={20} color="#fff" /> : "🔔 Küldés"}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Szűrő és kereső */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Keresés névben vagy emailben..."
          style={{ width: "100%", padding: "11px 14px", borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none" }}
        />
        <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
          {[
            { k: "all", l: "Mind" },
            { k: "pro", l: "⚡ Pro" },
            { k: "founder", l: "👑 Founder" },
            { k: "banned", l: "🚫 Tiltott" },
          ].map(f => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              style={{
                padding: "7px 14px",
                borderRadius: 10,
                border: `1px solid ${filter === f.k ? C.accent : C.border}`,
                background: filter === f.k ? C.accentSoft : C.card,
                color: filter === f.k ? C.accent : C.muted,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><Spinner size={36} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div>Nincs találat</div>
          </div>
        ) : (
          filtered.map(u => (
            <div
              key={u.id}
              onClick={() => setSelectedUser(u)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 0",
                borderBottom: `1px solid ${C.border}`,
                cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <div style={{ position: "relative" }}>
                <Avatar src={u.photo_url} name={u.name} size={44} opacity={u.is_banned ? 0.4 : 1} />
                {u.is_banned && (
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>🚫</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ color: C.text, fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || "–"}</span>
                  {u.is_pro && <Badge label="PRO" color={C.yellow} />}
                  {u.is_founder && <Badge label="FOUNDER" color={C.purple} />}
                </div>
                <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>
                  {u.age ? `${u.age} éves • ` : ""}{u.gender || ""} • {new Date(u.created_at || Date.now()).toLocaleDateString("hu")}
                </div>
              </div>
              <span style={{ color: C.dim, fontSize: 20, flexShrink: 0 }}>›</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// REPORTS TAB
// ─────────────────────────────────────────────
function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("open");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reports")
      .select("*, reporter:profiles!reports_reporter_id_fkey(name,photo_url), reported:profiles!reports_reported_id_fkey(name,photo_url,id)")
      .order("created_at", { ascending: false });
    setReports(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resolve = async (id) => {
    await supabase.from("reports").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", id);
    setReports(rs => rs.map(r => r.id === id ? { ...r, resolved: true, resolved_at: new Date().toISOString() } : r));
  };

  const banUser = async (userId, reportId) => {
    await supabase.from("profiles").update({ is_banned: true }).eq("id", userId);
    await resolve(reportId);
  };

  const unresolved = reports.filter(r => !r.resolved);
  const resolved = reports.filter(r => r.resolved);
  const shown = tab === "open" ? unresolved : resolved;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button
          onClick={() => setTab("open")}
          style={{
            flex: 1, padding: "9px", borderRadius: 11,
            border: `1px solid ${tab === "open" ? C.accent : C.border}`,
            background: tab === "open" ? C.accentSoft : C.card,
            color: tab === "open" ? C.accent : C.muted,
            cursor: "pointer", fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          🚩 Kezeletlen
          {unresolved.length > 0 && (
            <span style={{ background: C.accent, color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {unresolved.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("resolved")}
          style={{
            flex: 1, padding: "9px", borderRadius: 11,
            border: `1px solid ${tab === "resolved" ? C.green : C.border}`,
            background: tab === "resolved" ? C.greenSoft : C.card,
            color: tab === "resolved" ? C.green : C.muted,
            cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}
        >
          ✓ Lezárt ({resolved.length})
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><Spinner size={36} /></div>
        ) : shown.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{tab === "open" ? "✅" : "📭"}</div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>
              {tab === "open" ? "Nincs kezeletlen jelentés" : "Még nincs lezárt jelentés"}
            </div>
            {tab === "open" && <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Remek, minden rendben!</div>}
          </div>
        ) : (
          shown.map(r => (
            <div
              key={r.id}
              style={{
                background: C.card,
                borderRadius: 16,
                padding: "16px",
                border: `1px solid ${r.resolved ? C.border : "rgba(255,92,92,0.25)"}`,
                marginBottom: 12,
                animation: "fadeIn 0.3s ease",
                opacity: r.resolved ? 0.65 : 1,
              }}
            >
              {/* Reporter → Reported */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <Avatar src={r.reporter?.photo_url} name={r.reporter?.name} size={32} />
                  <span style={{ color: C.dim, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 }}>jelentő</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.muted, fontSize: 12, marginBottom: 2 }}>
                    <span style={{ color: C.text, fontWeight: 600 }}>{r.reporter?.name || "–"}</span> jelentette:
                  </div>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{r.reported?.name || "–"}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <Avatar src={r.reported?.photo_url} name={r.reported?.name} size={32} />
                  <span style={{ color: C.dim, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 }}>jelentett</span>
                </div>
              </div>

              {/* Ok */}
              <div style={{
                background: "rgba(255,92,92,0.1)",
                borderRadius: 10,
                padding: "8px 12px",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span style={{ color: C.accent, fontSize: 14 }}>🚩</span>
                <span style={{ color: C.accent, fontSize: 13, fontWeight: 600 }}>{r.reason}</span>
              </div>

              {/* Dátum */}
              <div style={{ color: C.dim, fontSize: 11, marginBottom: r.resolved ? 0 : 12 }}>
                {new Date(r.created_at).toLocaleString("hu")}
                {r.resolved && r.resolved_at && ` → Lezárva: ${new Date(r.resolved_at).toLocaleString("hu")}`}
              </div>

              {/* Akció gombok (csak nyitott esetén) */}
              {!r.resolved && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => resolve(r.id)}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      color: C.muted,
                      cursor: "pointer", fontSize: 12, fontWeight: 600,
                    }}
                  >
                    ✓ Megoldva
                  </button>
                  <button
                    onClick={() => banUser(r.reported?.id, r.id)}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 10,
                      border: "none",
                      background: "rgba(255,92,92,0.15)",
                      color: C.accent,
                      cursor: "pointer", fontSize: 12, fontWeight: 700,
                    }}
                  >
                    🚫 Tiltás + lezárás
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MATCHES TAB
// ─────────────────────────────────────────────
function MatchesTab() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgLog, setMsgLog] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("matches")
        .select("*, user1:profiles!matches_user1_id_fkey(name,photo_url,age), user2:profiles!matches_user2_id_fkey(name,photo_url,age)")
        .order("created_at", { ascending: false })
        .limit(100);
      setMatches(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const openMsgLog = async (match) => {
    setMsgLog(match);
    setMsgLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", match.id)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    setMsgLoading(false);
  };

  const deleteMatch = async (id) => {
    await supabase.from("messages").delete().eq("match_id", id);
    await supabase.from("matches").delete().eq("id", id);
    setMatches(m => m.filter(x => x.id !== id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Üzenet log modal */}
      {msgLog && (
        <Modal onClose={() => { setMsgLog(null); setMessages([]); }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Üzenetek</div>
            <div style={{ color: C.muted, fontSize: 13 }}>
              {msgLog.user1?.name} & {msgLog.user2?.name}
            </div>
          </div>
          {msgLoading ? (
            <div style={{ padding: 30, textAlign: "center" }}><Spinner /></div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: C.muted, fontSize: 14 }}>
              Még nincs üzenet ebben a matchben
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {messages.map(m => (
                <div key={m.id}>
                  <div style={{ color: C.dim, fontSize: 10, textAlign: "center", marginBottom: 4 }}>
                    {m.sender_id === msgLog.user1_id ? msgLog.user1?.name : msgLog.user2?.name} • {new Date(m.created_at).toLocaleString("hu")}
                  </div>
                  <div style={{
                    background: m.sender_id === msgLog.user1_id ? C.accentSoft : C.card,
                    border: `1px solid ${m.sender_id === msgLog.user1_id ? C.accent + "30" : C.border}`,
                    borderRadius: 12,
                    padding: "10px 14px",
                    color: C.text,
                    fontSize: 14,
                    lineHeight: 1.5,
                    marginLeft: m.sender_id === msgLog.user1_id ? 0 : "auto",
                    marginRight: m.sender_id === msgLog.user1_id ? "auto" : 0,
                    maxWidth: "85%",
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}><Spinner size={36} /></div>
        ) : matches.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💝</div>
            <div>Még nincsenek matchek</div>
          </div>
        ) : (
          matches.map(m => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                borderBottom: `1px solid ${C.border}`,
                animation: "fadeIn 0.3s ease",
              }}
            >
              {/* Avatar pár */}
              <div style={{ display: "flex", flexShrink: 0 }}>
                <Avatar src={m.user1?.photo_url} name={m.user1?.name} size={36} />
                <div style={{ marginLeft: -10, zIndex: 1 }}>
                  <Avatar src={m.user2?.photo_url} name={m.user2?.name} size={36} />
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: C.text, fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.user1?.name} & {m.user2?.name}
                </div>
                <div style={{ color: C.dim, fontSize: 11, marginTop: 1 }}>
                  {new Date(m.created_at).toLocaleString("hu", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              {/* Akciók */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => openMsgLog(m)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 9,
                    border: `1px solid ${C.blue}40`,
                    background: C.blueSoft,
                    color: C.blue,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  💬 Log
                </button>
                <button
                  onClick={() => { if (window.confirm(`Töröd a matchet: ${m.user1?.name} & ${m.user2?.name}?`)) deleteMatch(m.id); }}
                  style={{
                    padding: "7px 10px",
                    borderRadius: 9,
                    border: `1px solid ${C.accent}30`,
                    background: C.accentSoft,
                    color: C.accent,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN APP
// ─────────────────────────────────────────────
export default function Admin() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("stats");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
        setIsAdmin(true);
      }
      setChecking(false);
    });
  }, []);

  if (checking) return (
    <div style={{ width: "100%", height: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner size={40} />
      <style>{GLOBAL_STYLE}</style>
    </div>
  );

  if (!session || !isAdmin) return (
    <div style={{ width: "100%", height: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ fontSize: 72 }}>🔐</div>
      <div style={{ color: C.text, fontSize: 22, fontWeight: 900 }}>Admin hozzáférés szükséges</div>
      <div style={{ color: C.muted, fontSize: 14, textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
        {!session ? "Nem vagy bejelentkezve a NearMatch fiókodba." : "Az email-cím nincs az admin listában."}
      </div>
      {!session && (
        <a href="/" style={{ marginTop: 8, padding: "12px 24px", background: `linear-gradient(135deg,${C.accent},${C.orange})`, borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
          Bejelentkezés →
        </a>
      )}
      <style>{GLOBAL_STYLE}</style>
    </div>
  );

  const tabs = [
    { id: "stats", icon: "📊", label: "Statisztika" },
    { id: "users", icon: "👥", label: "Userek" },
    { id: "reports", icon: "🚩", label: "Jelentések" },
    { id: "matches", icon: "💝", label: "Matchek" },
  ];

  return (
    <div style={{
      width: "100%",
      maxWidth: 480,
      margin: "0 auto",
      height: "100vh",
      background: C.bg,
      display: "flex",
      flexDirection: "column",
      fontFamily: "system-ui,-apple-system,sans-serif",
      position: "relative",
    }}>
      <style>{GLOBAL_STYLE}</style>

      {/* Header */}
      <div style={{
        padding: "14px 20px",
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div>
          <div style={{
            fontSize: 18, fontWeight: 900,
            background: `linear-gradient(135deg,${C.accent},${C.orange})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: -0.5,
          }}>NearMatch Admin</div>
          <div style={{ color: C.dim, fontSize: 10, marginTop: 1 }}>{session.user.email}</div>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            background: "none",
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            color: C.muted,
            padding: "7px 14px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Kilépés
        </button>
      </div>

      {/* Tab nav */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: "10px 4px",
              background: "none",
              border: "none",
              borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              transition: "border-color 0.2s",
            }}
          >
            <span style={{ fontSize: 16, opacity: tab === t.id ? 1 : 0.3 }}>{t.icon}</span>
            <span style={{ fontSize: 9, color: tab === t.id ? C.accent : C.dim, fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {tab === "stats" && <div style={{ flex: 1, overflowY: "auto" }}><StatsTab /></div>}
        {tab === "users" && <UsersTab />}
        {tab === "reports" && <ReportsTab />}
        {tab === "matches" && <MatchesTab />}
      </div>
    </div>
  );
}
