export type SportId = "football" | "cricket" | "pickleball" | "badminton" | "tennis";

export type Turf = {
  id: string;
  name: string;
  kind: string;
  sports: SportId[];
  primary: SportId;
  area: string;
  pin: string;
  distLabel: string;
  lat: number;
  lng: number;
  rating: number;
  reviews: number;
  price: number;
  surface: string;
  formats: string[];
  open24: boolean;
  openLabel: string;
  openH: number;
  closeH: number;
  fieldCount: number;
  unit: string;
  blurb: string;
  amenities: string[];
  spotsLeft: number;
  popular: boolean;
};

export type Review = {
  who: string;
  initials: string;
  rating: number;
  whenLbl: string;
  text: string;
};

export type BookingStatus = "upcoming" | "completed" | "cancelled";

export type Booking = {
  id: string;
  turfId: string;
  field: string;
  unit: string;
  dateKey: string | null;
  dateLabel: string;
  time: string;
  startHour: number | null;
  duration: string;
  durationHrs: number;
  players: string;
  status: BookingStatus;
  price: number;
  sport: string;
  split: boolean;
  kickoffAt: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  refundMethod?: string | null;
  refundPct?: number | null;
  refundAmount?: number | null;
  cancelledAt?: number | null;
  checkedInAt?: number | null;
};

export type SessionUser = {
  id: string;
  name: string;
  fullName: string;
  email: string;
  phone: string | null;
  initials: string;
  city: string;
  level: string;
  role: string;
  birthday: string | null;
  gender: string | null;
  favSport: string | null;
  photoUrl: string | null;
  phoneVerified: boolean;
};
