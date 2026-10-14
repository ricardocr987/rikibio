import { getAvailability } from "@/lib/availability";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getAvailability());
  } catch (error) {
    console.error("Error fetching initial data:", error);
    return NextResponse.json(
      { error: "Failed to fetch initial data" },
      { status: 500 },
    );
  }
}
