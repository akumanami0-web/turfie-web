import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { setSession, initialsFrom } from "@/lib/auth";
import { appBaseUrl, exchangeCode, type OAuthProvider } from "@/lib/oauth";

async function handle(req: Request, provider: string, code: string | null, state: string | null, appleUserRaw?: string | null) {
  const base = appBaseUrl(req);
  const fail = (e: string) => NextResponse.redirect(`${base}/login?error=${e}`);

  if (provider !== "google" && provider !== "apple") return fail("unknown_provider");
  if (!code) return fail("missing_code");

  // CSRF: state must match the cookie we set at /api/auth/oauth
  const jar = await cookies();
  const expected = jar.get("oauth_state")?.value;
  jar.delete("oauth_state");
  if (!expected || expected !== `${provider}:${state}`) return fail("bad_state");

  let appleUser: { name?: { firstName?: string; lastName?: string } } | undefined;
  if (appleUserRaw) { try { appleUser = JSON.parse(appleUserRaw); } catch {} }

  let profile;
  try {
    profile = await exchangeCode(provider as OAuthProvider, base, code, appleUser);
  } catch {
    return fail("exchange_failed");
  }
  if (!profile.email) return fail("no_email");

  const email = profile.email.toLowerCase();
  // New social sign-ups land on the profile page to set their name + details;
  // returning users go straight to their account.
  const existing = await prisma.user.findUnique({ where: { email } });
  const user = existing ?? await prisma.user.create({
    data: {
      email,
      name: profile.name.split(/\s+/)[0],
      fullName: profile.name,
      initials: initialsFrom(profile.name),
    },
  });
  await setSession(user.id);
  return NextResponse.redirect(`${base}${existing ? "/account" : "/account/edit?welcome=1"}`);
}

// Google uses the GET redirect.
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const { searchParams } = new URL(req.url);
  return handle(req, provider, searchParams.get("code"), searchParams.get("state"));
}

// Apple uses response_mode=form_post → the callback is a POST.
export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const form = await req.formData();
  return handle(req, provider, String(form.get("code") || ""), String(form.get("state") || ""), form.get("user") as string | null);
}
