import "server-only";

import { db } from "@/lib/firebase";

export type Meetings = {
  [date: string]: string[];
};

export type Availability = {
  meetings: Meetings;
  firstDate: string;
};

// Shared by the landing page (called directly, no HTTP round trip to itself)
// and /api/initialData.
export async function getAvailability(): Promise<Availability> {
  const snapshot = await db
    .collection("meeting")
    .where("dob", ">=", Date.now())
    .get();

  const meetings: Meetings = {};
  snapshot.forEach((doc) => {
    const data = doc.data();
    const day = new Date(data.dob).toISOString();
    if (!meetings[day]) {
      meetings[day] = [];
    }
    meetings[day].push(...(data.hours || []));
  });

  // First available date is tomorrow, or the next business day
  const firstDate = new Date();
  firstDate.setHours(0, 0, 0, 0);
  firstDate.setDate(firstDate.getDate() + 1);
  if (firstDate.getDay() === 6) {
    firstDate.setDate(firstDate.getDate() + 2);
  } else if (firstDate.getDay() === 0) {
    firstDate.setDate(firstDate.getDate() + 1);
  }

  return { meetings, firstDate: firstDate.toISOString() };
}
