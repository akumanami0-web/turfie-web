import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { oauthEnabled, appBaseUrl, authorizeUrl, type OAuthProvider } from "@/lib/oauth";

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (provider !== "google" && provider !== "apple") {
    return NextResponse.redirect(`${appBaseUrl(req)}/login?error=unknown_provider`);
  }
  const enabled = oauthEnabled();
  if (!enabled[provider as OAuthProvider]) {
    return NextResponse.redirect(`${appBaseUrl(req)}/login?error=provider_not_configured`);
  }
  const state = crypto.randomUUID();
  const jar = await cookies();
  jar.set("oauth_state", `${provider}:${state}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  return NextResponse.redirect(authorizeUrl(provider as OAuthProvider, appBaseUrl(req), state));
}
