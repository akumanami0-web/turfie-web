import type { SessionUser } from "./types";

/** The fields that make up a "complete" profile. Name is always set at
    sign-up, so a fresh account starts at 1/4 and fills in from there. */
export const PROFILE_TOTAL = 4;

export function profileSteps(u: Pick<SessionUser, "fullName" | "birthday" | "gender" | "favSport">) {
  let done = 0;
  if (u.fullName && u.fullName.trim()) done++;
  if (u.birthday) done++;
  if (u.gender) done++;
  if (u.favSport) done++;
  return { done, total: PROFILE_TOTAL };
}

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not", label: "Prefer not to say" },
];
