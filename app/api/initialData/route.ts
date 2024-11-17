import { db } from "@/lib/firebase";
import { NextResponse } from "next/server";

export async function GET() {
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

    // Calculate next available business day
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() + 1);
    
    // Skip weekends
    if (today.getDay() === 6) { // Saturday
      today.setDate(today.getDate() + 2);
    } else if (today.getDay() === 0) { // Sunday
      today.setDate(today.getDate() + 1);
    }

    return NextResponse.json({
      meetings,
      firstDate: today.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}