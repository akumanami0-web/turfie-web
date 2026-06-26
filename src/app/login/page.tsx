import { AuthScreen } from "@/components/screens/AuthScreen";
import { oauthEnabled } from "@/lib/oauth";
export const metadata = { title: "Log in — Turfie" };
export default function Page() { return <AuthScreen mode="login" providers={oauthEnabled()} />; }
