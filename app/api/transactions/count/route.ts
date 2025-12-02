import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Transaction from "@/lib/models/Transaction";
import User from "@/lib/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ count: 0 });
    }

    await connectToDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ count: 0 });
    }

    const count = await Transaction.countDocuments({
      receiver: user._id,
      status: "pending",
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error counting pending actions:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
