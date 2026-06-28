import "server-only";
import { createRemoteJWKSet, jwtVerify, decodeJwt, SignJWT, importPKCS8 } from "jose";

export type OAuthProvider = "google" | "apple";

/** Which social providers are configured (controls the login buttons). */
export function oauthEnabled() {
  return {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    apple: !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY),
  };
}

export function appBaseUrl(req: Request) {
  // Explicit override wins — set APP_URL=https://turfie-web.vercel.app to pin
  // the exact redirect URI Google must have on its allow-list.
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  // Otherwise derive the public origin from the proxy headers Vercel sets,
  // falling back to the request URL.
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

export function redirectUri(base: string, provider: OAuthProvider) {
  return `${base}/api/auth/callback/${provider}`;
}

/** Build the provider authorize URL to redirect the user to. */
export function authorizeUrl(provider: OAuthProvider, base: string, state: string) {
  const redirect = redirectUri(base, provider);
  if (provider === "google") {
    const p = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: redirect, response_type: "code",
      scope: "openid email profile", state, access_type: "online", prompt: "select_account",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
  }
  // apple
  const p = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID!, redirect_uri: redirect, response_type: "code",
    scope: "name email", state, response_mode: "form_post",
  });
  return `https://appleid.apple.com/auth/authorize?${p}`;
}

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

async function appleClientSecret() {
  const pkcs8 = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const key = await importPKCS8(pkcs8, "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: process.env.APPLE_KEY_ID })
    .setIssuer(process.env.APPLE_TEAM_ID!)
    .setIssuedAt()
    .setExpirationTime("5m")
    .setAudience("https://appleid.apple.com")
    .setSubject(process.env.APPLE_CLIENT_ID!)
    .sign(key);
}

export type OAuthProfile = { email: string; name: string };

/** Exchange the authorization code for the user's verified email + name. */
export async function exchangeCode(provider: OAuthProvider, base: string, code: string, appleUser?: { name?: { firstName?: string; lastName?: string } }): Promise<OAuthProfile> {
  const redirect = redirectUri(base, provider);

  if (provider === "google") {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirect, grant_type: "authorization_code",
      }),
    });
    if (!res.ok) throw new Error("Google token exchange failed: " + (await res.text()));
    const { id_token } = await res.json();
    const { payload } = await jwtVerify(id_token, GOOGLE_JWKS, { issuer: ["https://accounts.google.com", "accounts.google.com"], audience: process.env.GOOGLE_CLIENT_ID });
    const email = String(payload.email || "");
    const name = String(payload.name || email.split("@")[0] || "Player");
    return { email, name };
  }

  // apple
  const res = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: process.env.APPLE_CLIENT_ID!, client_secret: await appleClientSecret(),
      redirect_uri: redirect, grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error("Apple token exchange failed: " + (await res.text()));
  const { id_token } = await res.json();
  const payload = decodeJwt(id_token); // signed by Apple over TLS token endpoint
  const email = String(payload.email || "");
  const nm = appleUser?.name;
  const name = [nm?.firstName, nm?.lastName].filter(Boolean).join(" ") || email.split("@")[0] || "Player";
  return { email, name };
}
