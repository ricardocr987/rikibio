"use server";

import config from "@/lib/config";
import { generateMeet } from "@/lib/googleMeet";

export async function confirmSession(sessionId: string) {
  try {
    const session = await config.stripe.checkout.sessions.retrieve(sessionId!);
    if (session.status === "complete")
      await generateMeet(session?.metadata?.data || "");
  } catch (error) {
    return null;
  }
}
