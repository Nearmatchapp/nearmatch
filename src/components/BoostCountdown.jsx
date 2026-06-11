import { useState, useEffect } from "react";
import { boostMillisLeft } from "../lib/utils.js";

// A másodpercenkénti visszaszámláló ebben a komponensben él, így csak ez
// renderelődik újra tick-enként — korábban az App gyökerében volt a state,
// és aktív boost alatt a TELJES app újrarenderelődött másodpercenként (D1).
export default function BoostCountdown({ expiresAt }) {
  const calc = () => Math.max(0, Math.ceil(boostMillisLeft({ boost_expires_at: expiresAt }) / 1000));
  const [left, setLeft] = useState(calc);

  useEffect(() => {
    setLeft(calc());
    const interval = setInterval(() => {
      const l = calc();
      setLeft(l);
      if (l <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return <>{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</>;
}
