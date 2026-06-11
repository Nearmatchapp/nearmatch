import { useRef } from "react";
import { C } from "../lib/constants.js";

export function HeartIcon({ size = 24, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  );
}

export function NearMatchCard({ size = 1 }) {
  const uid = useRef(`nm_${Math.random().toString(36).slice(2)}`).current;
  const w = 80 * size, h = 110 * size;
  return (
    <svg width={w} height={h} viewBox="0 0 80 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`cardBg_${uid}`} x1="0" y1="0" x2="80" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1a2340" />
          <stop offset="100%" stopColor="#0d1525" />
        </linearGradient>
        <linearGradient id={`accentGrad_${uid}`} x1="24" y1="41" x2="56" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff5c5c" />
          <stop offset="100%" stopColor="#ff8c42" />
        </linearGradient>
      </defs>
      <rect width="80" height="110" rx="10" fill={`url(#cardBg_${uid})`} />
      <rect x="0.5" y="0.5" width="79" height="109" rx="9.5" stroke="rgba(255,92,92,0.3)" strokeWidth="1" />
      <rect x="5" y="5" width="70" height="100" rx="7" stroke="rgba(255,92,92,0.12)" strokeWidth="0.5" />
      <text x="9" y="17" fontSize="7" fontWeight="800" fill="#ff5c5c" fontFamily="Arial,sans-serif">NM</text>
      <text x="71" y="100" fontSize="7" fontWeight="800" fill="#ff5c5c" fontFamily="Arial,sans-serif" textAnchor="end">NM</text>
      <path d="M40 70 C40 70 24 59 24 49 C24 43 28.5 39 34 39 C37 39 39.5 40.5 40 42 C40.5 40.5 43 39 46 39 C51.5 39 56 43 56 49 C56 59 40 70 40 70Z" fill={`url(#accentGrad_${uid})`} />
      <text x="40" y="86" fontSize="5.5" fontWeight="700" fill="rgba(255,255,255,0.35)" fontFamily="Arial,sans-serif" textAnchor="middle" letterSpacing="1.5">NEARMATCH</text>
    </svg>
  );
}

export function FilterIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? C.accent : C.muted} strokeWidth="2.2" strokeLinecap="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="9" cy="6" r="2.5" fill={active ? C.accent : C.surface} stroke={active ? C.accent : C.muted} />
      <circle cx="15" cy="12" r="2.5" fill={active ? C.accent : C.surface} stroke={active ? C.accent : C.muted} />
      <circle cx="9" cy="18" r="2.5" fill={active ? C.accent : C.surface} stroke={active ? C.accent : C.muted} />
    </svg>
  );
}
