import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, initialsFrom } from "@/lib/auth";

const GENDERS = ["male", "female", "other", "prefer_not"];

/** Update the signed-in user's editable profile fields. Phone is immutable
    (it's the account identity); everything else here can be changed. */
export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });

  // Email is intentionally NOT editable here — it changes only via the
  // phone-gated, OTP-verified /api/profile/email route.
  const birthday = body.birthday ? String(body.birthday) : null; // yyyy-mm-dd
  const genderRaw = body.gender ? String(body.gender) : null;
  const gender = genderRaw && GENDERS.includes(genderRaw) ? genderRaw : null;
  const favSport = body.favSport ? String(body.favSport) : null;

  await prisma.user.update({
    where: { id: session.id },
    data: {
      name: name.split(/\s+/)[0],
      fullName: name,
      initials: initialsFrom(name),
      birthday,
      gender,
      favSport,
    },
  });

  return NextResponse.json({ user: await getSessionUser() });
}
