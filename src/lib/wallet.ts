import "server-only";
import { SignJWT, importPKCS8 } from "jose";

// Google Wallet "Save" link. Requires a Google Wallet API issuer + a service
// account (Console → Google Wallet API). When those env vars aren't set the
// caller returns a friendly "not configured" message instead.
export function googleWalletConfigured() {
  return !!(process.env.GOOGLE_WALLET_ISSUER_ID && process.env.GOOGLE_WALLET_SA_EMAIL && process.env.GOOGLE_WALLET_SA_KEY);
}

export function appleWalletConfigured() {
  // Apple Wallet (.pkpass) needs a paid Apple Developer account + a Pass Type
  // ID certificate. Wired the same way once those are available.
  return !!(process.env.APPLE_PASS_CERT && process.env.APPLE_PASS_KEY && process.env.APPLE_PASS_TYPE_ID);
}

type TicketInfo = {
  id: string; turfName: string; area: string; dateLabel: string; time: string;
  unit: string; field: string; token: string; appUrl: string;
};

/** Build a signed "Save to Google Wallet" URL for a booking. */
export async function googleSaveUrl(t: TicketInfo): Promise<string> {
  const issuer = process.env.GOOGLE_WALLET_ISSUER_ID!;
  const email = process.env.GOOGLE_WALLET_SA_EMAIL!;
  const pkcs8 = process.env.GOOGLE_WALLET_SA_KEY!.replace(/\\n/g, "\n");
  const classId = `${issuer}.turfie_ticket`;
  const objectId = `${issuer}.${t.id.replace(/[^\w.-]/g, "_")}`;

  const genericClass = { id: classId };
  const genericObject = {
    id: objectId,
    classId,
    state: "ACTIVE",
    cardTitle: { defaultValue: { language: "en", value: "Turfie" } },
    header: { defaultValue: { language: "en", value: t.turfName } },
    subheader: { defaultValue: { language: "en", value: `${t.area}` } },
    hexBackgroundColor: "#9fe870",
    textModulesData: [
      { id: "when", header: "When", body: `${t.dateLabel} · ${t.time}` },
      { id: "where", header: t.unit, body: `${t.unit} ${t.field}` },
    ],
    barcode: { type: "QR_CODE", value: t.token, alternateText: t.id },
  };

  const claims = {
    iss: email,
    aud: "google",
    typ: "savetowallet",
    origins: [t.appUrl],
    payload: { genericClasses: [genericClass], genericObjects: [genericObject] },
  };

  const key = await importPKCS8(pkcs8, "RS256");
  const jwt = await new SignJWT(claims).setProtectedHeader({ alg: "RS256", typ: "JWT" }).setIssuedAt().sign(key);
  return `https://pay.google.com/gp/v/save/${jwt}`;
}
