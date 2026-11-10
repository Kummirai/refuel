import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OAuthCompletePage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("kapuka://oauth-complete?error=sign_in_failed");
  }

  const { token } = await auth.api.generateOneTimeToken({
    headers: requestHeaders,
  });

  redirect(`kapuka://oauth-complete?token=${encodeURIComponent(token)}`);
}
