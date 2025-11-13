import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { getMatchingOffers } from "@/lib/matching";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 401 },
      );
    }

    const matches = await getMatchingOffers(userEmail);

    return NextResponse.json({
      count: matches.length,
      matches,
    });
  } catch (error) {
    console.error("Error fetching wishlist matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 },
    );
  }
}
