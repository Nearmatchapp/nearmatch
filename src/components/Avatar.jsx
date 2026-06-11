import { useState } from "react";

// Profilkép monogramos fallbackkel — korábban fotó híján a pravatar.cc
// véletlenszerű idegen arcait mutattuk valós userekként (C5)
export default function Avatar({ src, name, size = 40, style = {}, alt }) {
  const [failed, setFailed] = useState(false);
  const initials = (name || "?").slice(0, 2).toUpperCase();
  const base = { width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, ...style };
  if (src && !failed) {
    return <img src={src} alt={alt ?? name ?? ""} style={base} onError={() => setFailed(true)} />;
  }
  return (
    <div style={{ ...base, background: "linear-gradient(135deg,#ff5c5c,#ff8c42)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: "#fff", userSelect: "none" }}>
      {initials}
    </div>
  );
}
