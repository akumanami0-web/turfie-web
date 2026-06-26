import React from "react";

/* Lucide-compatible icon set (2px stroke, rounded caps) ported from the design export. */
export const ICON_PATHS: Record<string, React.ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.4-3.4" /></>,
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 6a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4-5.6" /></>,
  trophy: <><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" /><path d="M12 14v3M8.5 21h7M9.5 21l.5-2.5h4l.5 2.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  bell: <><path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" /><path d="M10.5 20a2 2 0 0 0 3 0" /></>,
  bookmark: <><path d="M6 4h12v16l-6-4-6 4z" /></>,
  calendar: <><rect x="3" y="4.5" width="18" height="16.5" rx="3" /><path d="M16 2.5v4M8 2.5v4M3 10h18" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></>,
  pin: <><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  star: <path d="M12 2.5l2.9 6 6.6.6-5 4.4 1.5 6.5L12 16.8 6.5 20l1.5-6.5-5-4.4 6.6-.6z" fill="currentColor" stroke="none" />,
  starLine: <path d="M12 2.5l2.9 6 6.6.6-5 4.4 1.5 6.5L12 16.8 6.5 20l1.5-6.5-5-4.4 6.6-.6z" />,
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  heartFill: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" fill="currentColor" stroke="none" />,
  arrowRight: <><path d="M5 12h14" /><path d="m13 5 7 7-7 7" /></>,
  arrowLeft: <><path d="M19 12H5" /><path d="m11 5-7 7 7 7" /></>,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 5-5" /></>,
  x: <><path d="M6 6l12 12M18 6 6 18" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  filter: <><path d="M3 5h18M6 12h12M10 19h4" /></>,
  sliders: <><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4" /><circle cx="16" cy="6" r="2" /><circle cx="8" cy="12" r="2" /><circle cx="14" cy="18" r="2" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10.5" rx="3" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></>,
  phone: <><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3.3 4M6.3 7.8A18 18 0 0 0 2 12s3.5 7 10 7a10.6 10.6 0 0 0 3.7-.7" /><path d="M9.5 10.5a3 3 0 0 0 4 4" /></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="3" /><path d="M2.5 9.5h19" /></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18M16 14h2" /></>,
  share: <><circle cx="6" cy="12" r="2.5" /><circle cx="17" cy="6" r="2.5" /><circle cx="17" cy="18" r="2.5" /><path d="m8.2 10.8 6.6-3.6M8.2 13.2l6.6 3.6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></>,
  logout: <><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="m15 8 4 4-4 4M19 12H9" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" /><path d="m9.5 12 2 2 3.5-3.5" /></>,
  zap: <path d="M13 2 4 13h6l-1 9 9-11h-6z" fill="currentColor" stroke="none" />,
  ticket: <><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" /><path d="M15 6v12" strokeDasharray="2 3" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" /></>,
  navigation: <path d="M12 3 5 20l7-4 7 4z" />,
  flame: <><path d="M12 3c2 3 .5 4.5 2 6.5 1-1 1.5-2 1.5-3 2 2 3 4 3 6.5a6.5 6.5 0 0 1-13 0C5.5 9 9 7.5 9 4.5c1 .5 2 1.5 3 1.5z" /></>,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2.5" /><path d="M5 16H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1" /></>,
  refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>,
  message: <><path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /></>,
  apple: <><path d="M16 3c0 1.5-1.2 3-2.8 3 0-1.5 1.3-3 2.8-3z" fill="currentColor" stroke="none" /><path d="M19 16.5c-.6 1.7-2 3.8-3.4 3.8-1 0-1.4-.6-2.6-.6s-1.7.6-2.6.6c-1.6 0-3.2-2.5-3.8-4.3C5.5 13 6.6 9.5 9.3 9.5c1.1 0 1.9.7 2.7.7s1.4-.7 2.8-.7c1 0 2.1.5 2.8 1.5-2.4 1.4-2 4.6-.6 5.5z" /></>,
  google: <path d="M21 12.2c0-.7-.06-1.2-.2-1.8H12v3.4h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.2 2.7-6.9z M12 21c2.4 0 4.5-.8 6-2.2l-3.1-2.4a5.4 5.4 0 0 1-8-2.8H3.7v2.5A9 9 0 0 0 12 21z M5.9 13.6a5.4 5.4 0 0 1 0-3.4V7.7H3.7a9 9 0 0 0 0 8.1z M12 6.6c1.3 0 2.5.5 3.5 1.4l2.6-2.6A9 9 0 0 0 3.7 7.7l2.2 2.5A5.4 5.4 0 0 1 12 6.6z" fill="currentColor" stroke="none" />,
};

export function Icon({
  name,
  size = 22,
  stroke = 2,
  color = "currentColor",
  style = {},
}: {
  name: string;
  size?: number;
  stroke?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

/* ── Sport glyphs ── */
const SPORT_MARKS: Record<string, React.ReactNode> = {
  badminton: <><path d="M14 4c2.5 1 4.5 3.5 5 6.5L9.5 20.5a3.5 3.5 0 0 1-5-5z" /><path d="M5 16.5 7.5 19M14 4l-2 3M16 5l-1.5 3.5M18 7l-2.5 2.5M19.5 10l-3 1" /></>,
  football: <><circle cx="12" cy="12" r="9" /><path d="m12 7 3 2.2-1.1 3.5h-3.8L9 9.2z" /><path d="M12 7V3.2M15 9.2l3.4-1.6M13.9 12.7l2.4 3M10.1 12.7l-2.4 3M9 9.2 5.6 7.6" /></>,
  tennis: <><circle cx="12" cy="12" r="9" /><path d="M5 5.5c3 2.5 3 10.5 0 13M19 5.5c-3 2.5-3 10.5 0 13" /></>,
  pickleball: <><circle cx="9.5" cy="9.5" r="6" /><path d="m14 14 5.5 5.5" /><circle cx="9.5" cy="9.5" r="1" /><circle cx="11.5" cy="7.5" r="1" /><circle cx="7.5" cy="11.5" r="1" /></>,
};

/** Sport glyph with a bat-and-ball mark for cricket (added during chat iterations). */
export function SportGlyph({
  sport,
  size = 22,
  color = "currentColor",
  stroke = 2,
}: {
  sport: string;
  size?: number;
  color?: string;
  stroke?: number;
}) {
  if (sport === "cricket") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
        <path d="M14 7 L7.5 15" strokeWidth={Math.max(stroke, 3.2)} />
        <path d="M15 6 L18 3" />
        <circle cx="6.5" cy="17.5" r="1.9" fill={color} stroke="none" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
      {SPORT_MARKS[sport] || SPORT_MARKS.badminton}
    </svg>
  );
}
