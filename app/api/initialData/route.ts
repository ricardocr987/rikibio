import { db } from "@/lib/firebase";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // Get current date and timestamp
    const today = new Date();
    const currentTimestamp = today.getTime();

    // Fetch meetings from Firebase
    const snapshot = await db
      .collection("meeting")
      .where("dob", ">=", currentTimestamp)
      .get();

    // Process meetings data
    const meetings: { [date: string]: string[] } = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      const day = new Date(data.dob).toISOString();

      if (!meetings[day]) {
        meetings[day] = [];
      }
      meetings[day].push(...(data.hours || []));
    });

    // Set vacation end date (first available date after vacation) to July 20th
    const vacationEndDate = new Date('2025-07-19');
    vacationEndDate.setHours(0, 0, 0, 0);
    
    // Use the later date between today and vacation end date
    const firstDate = new Date(Math.max(today.getTime(), vacationEndDate.getTime()));
    console.log(firstDate.toISOString());
    firstDate.setHours(0, 0, 0, 0);
    firstDate.setDate(firstDate.getDate() + 1);

    // Skip weekends
    if (firstDate.getDay() === 6) {
      // Saturday
      firstDate.setDate(firstDate.getDate() + 2);
    } else if (firstDate.getDay() === 0) {
      // Sunday
      firstDate.setDate(firstDate.getDate() + 1);
    }

    console.log(firstDate.toISOString());
    return NextResponse.json({
      meetings,
      firstDate: firstDate.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching initial data:", error);
    return NextResponse.json(
      { error: "Failed to fetch initial data" },
      { status: 500 },
    );
  }
}
