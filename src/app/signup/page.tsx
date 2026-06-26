import { AuthScreen } from "@/components/screens/AuthScreen";
import { oauthEnabled } from "@/lib/oauth";
export const metadata = { title: "Sign up — Turfie" };
export default function Page() { return <AuthScreen mode="signup" providers={oauthEnabled()} />; }
