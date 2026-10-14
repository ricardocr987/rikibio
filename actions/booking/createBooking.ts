"use server";

import { generateMeet } from "@/lib/googleMeet";

// Payment (Stripe/Solana) is on hold for now — see actions/stripe and
// actions/solana, both left intact but unused. This calls the same
// generateMeet() pipeline (Firestore doc + Google Calendar event + Resend
// email notification) those two used to call only after payment confirmed;
// booking is free until payment comes back.
export async function createBooking(data: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await generateMeet(data);
    return { ok: true };
  } catch (error: any) {
    console.error("createBooking failed:", error);
    return { ok: false, error: error.message || "Booking failed." };
  }
}
