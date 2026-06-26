import type { SportId } from "./types";

// ── Brand / company ──
export const COMPANY = {
  legal: "Turfie by Edinguy Pvt Ltd",
  city: "Mumbai, Maharashtra",
  phone: "+91 81800 85722",
  phoneDial: "tel:+918180085722",
  email: "hello@turfie.in",
};

// Map centre — Nalasopara East
export const MAP_CENTER = { lat: 19.4185, lng: 72.8295 };

export const SPORTS: { id: SportId; label: string; sub: string }[] = [
  { id: "football", label: "Football", sub: "5, 7, 9 & 11-a-side" },
  { id: "cricket", label: "Box Cricket", sub: "Indoor nets" },
  { id: "pickleball", label: "Pickleball", sub: "Acrylic courts" },
  { id: "badminton", label: "Badminton", sub: "Wooden / synthetic" },
  { id: "tennis", label: "Tennis", sub: "Hard court" },
];

export const SPORT_LABEL: Record<string, string> = Object.fromEntries(
  SPORTS.map((s) => [s.id, s.label]),
);

export const SPORT_TINT: Record<string, string> = {
  football: "#9fe870",
  cricket: "#c5edab",
  pickleball: "#38c8ff",
  badminton: "#e2f6d5",
  tennis: "#ffc091",
};

export const AVATARS: Record<string, { c: string; t: string }> = {
  AS: { c: "#9fe870", t: "#163300" },
  RS: { c: "#38c8ff", t: "#06303d" },
  AK: { c: "#ffc091", t: "#5a2c00" },
  MJ: { c: "#c5edab", t: "#163300" },
  TN: { c: "#ffd11a", t: "#4a3b1c" },
  DV: { c: "#0e0f0c", t: "#9fe870" },
  PL: { c: "#e2f6d5", t: "#163300" },
  SK: { c: "#9fe870", t: "#163300" },
};

export const PLANS = [
  {
    id: "casual",
    name: "Casual",
    price: 0,
    period: "free forever",
    tag: null as string | null,
    sub: "For players who book now and then.",
    features: ["Browse all turfs near you", "Book & pay in seconds", "Split the cost with your squad", "Free cancellation up to 24h"],
    cta: "Get started",
    tone: "white",
  },
  {
    id: "club",
    name: "Club",
    price: 199,
    period: "per month",
    tag: "Most popular",
    sub: "For regulars and weekly squads.",
    features: ["Everything in Casual", "10% off every booking", "Priority slot access", "Recurring weekly bookings", "Squad management tools"],
    cta: "Start free trial",
    tone: "dark",
  },
  {
    id: "venue",
    name: "Venue",
    price: null as number | null,
    period: "list your turf",
    tag: null as string | null,
    sub: "For turf owners and operators.",
    features: ["Real-time slot calendar", "Online payments & payouts", "Dynamic pricing & offers", "Analytics dashboard", "Zero setup cost"],
    cta: "List your turf",
    tone: "green",
  },
];

export const FEATURES = [
  { icon: "pin", title: "Turfs near you", body: "Live map of every pitch and court across Maharashtra." },
  { icon: "zap", title: "Book in 60 seconds", body: "Pick a slot, pay online and you’re in — no calls, no advance to the manager." },
  { icon: "users", title: "Split with the squad", body: "Share the bill so everyone pays their share. No more chasing for cash." },
  { icon: "shield", title: "Slot held for you", body: "Your slot is locked for 10 minutes at checkout so no one books it from under you." },
];

export const STEPS = [
  { n: "01", title: "Find your turf", body: "Search by sport, area or map. Compare price, surface and ratings." },
  { n: "02", title: "Pick a slot", body: "See live availability. Choose date, time and duration that suits your squad." },
  { n: "03", title: "Pay & play", body: "Pay securely, split with friends, and turn up ready to play." },
];

export const TESTIMONIALS = [
  { who: "Sahil K.", initials: "SK", area: "Nalasopara East", text: "Turfie is how my whole group books football now. Slot locking means we never lose our 9pm slot." },
  { who: "Priya L.", initials: "PL", area: "Vasai West", text: "Booked a pickleball court in under a minute and split the cost with three friends instantly. Brilliant." },
  { who: "Dev V.", initials: "DV", area: "Virar", text: "As a turf owner the calendar and payouts just work. My weekend slots fill themselves now." },
];

export const FAQ = [
  { q: "How does slot locking work?", a: "When you start checkout, your chosen slot is held exclusively for you for 10 minutes. If you complete payment in time it’s confirmed; if not, the hold expires and the slot is released for other players." },
  { q: "Can I split the payment with my squad?", a: "Yes. At checkout, use the split calculator to see exactly what each player owes. You pay the full amount up front and collect everyone’s share however you like — no separate links needed." },
  { q: "What is the cancellation policy?", a: "Cancel more than 24 hours before kick-off for a full refund. Between 24 hours and 4 hours before, you get a 50% refund. Less than 4 hours before kick-off, the booking is non-refundable. Refunds go to your Turfie wallet within 3–5 working days." },
  { q: "How much does rescheduling cost?", a: "Every player gets 5 free reschedules each month. After that it’s ₹50 per reschedule. Your free quota resets on the last day of each month." },
  { q: "How do I find turfs near me?", a: "Allow location access or search your area. Browse shows a live map of every pitch and court across Maharashtra with distance, price and availability." },
  { q: "Which sports can I book?", a: "Football (5, 7, 9 & 11-a-side), box cricket, pickleball, badminton and tennis — with more venues added every week." },
  { q: "How do I list my turf on Turfie?", a: "Tap “List your turf”, add your venue details, surface and slots, and our team onboards you within 24 working hours. Listing is free." },
];

// ── Refund policy ──
// > 24h before kick-off → 100%; 4h–24h → 50%; < 4h → 0.
export function refundQuote(kickoffAt: number | null | undefined): {
  pct: number;
  label: string;
  tone: "positive" | "warning" | "negative";
} {
  if (!kickoffAt) return { pct: 100, label: "Full refund", tone: "positive" };
  const hrs = (kickoffAt - Date.now()) / 3600000;
  if (hrs >= 24) return { pct: 100, label: "Full refund", tone: "positive" };
  if (hrs >= 4) return { pct: 50, label: "50% refund", tone: "warning" };
  return { pct: 0, label: "No refund", tone: "negative" };
}

export const RESCHEDULE_FREE = 5;
export const RESCHEDULE_FEE = 50;
export const LOCK_MINUTES = 10;

// Area options for the home search dropdown.
export const AREAS = [
  { value: "mumbai", label: "Mumbai" },
  { value: "pune", label: "Pune" },
  { value: "nashik", label: "Nashik" },
  { value: "nagpur", label: "Nagpur" },
  { value: "thane", label: "Thane" },
  { value: "nalasopara", label: "Nalasopara" },
  { value: "vasai", label: "Vasai" },
  { value: "virar", label: "Virar" },
];
