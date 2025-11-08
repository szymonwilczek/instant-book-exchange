import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Message from "@/lib/models/Message";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { messageId, userId } = await req.json();

    if (!messageId || !userId) {
      return NextResponse.json(
        { error: "Message ID and User ID required" },
        { status: 400 }
      );
    }

    await connectToDB();

    const userEmail = session.user?.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: userEmail });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    await Message.updateOne(
      { _id: messageId },
      {
        $addToSet: { deliveredTo: user._id },
      }
    );

    console.log(`Message ${messageId} marked as delivered to ${userId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in delivered-socket-event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
