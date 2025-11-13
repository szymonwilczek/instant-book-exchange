import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Transaction from "@/lib/models/Transaction";
import User from "@/lib/models/User";

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

    await connectToDB();

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const completedTransactions = await Transaction.find({
      $or: [{ initiator: user._id }, { receiver: user._id }],
      status: "completed",
      completedAt: { $exists: true },
    }).lean();

    if (completedTransactions.length === 0) {
      return NextResponse.json({
        averageDays: 0,
        averageHours: 0,
        count: 0,
      });
    }

    const totalMilliseconds = completedTransactions.reduce((sum, tx) => {
      const createdAt = new Date(tx.createdAt).getTime();
      const completedAt = new Date(tx.completedAt!).getTime();
      return sum + (completedAt - createdAt);
    }, 0);

    const averageMilliseconds =
      totalMilliseconds / completedTransactions.length;
    const averageDays = averageMilliseconds / (1000 * 60 * 60 * 24);
    const averageHours = averageMilliseconds / (1000 * 60 * 60);

    return NextResponse.json({
      averageDays: Number(averageDays.toFixed(1)),
      averageHours: Math.round(averageHours),
      count: completedTransactions.length,
    });
  } catch (error) {
    console.error("Error calculating average exchange time:", error);
    return NextResponse.json(
      { error: "Failed to calculate average time" },
      { status: 500 },
    );
  }
}
