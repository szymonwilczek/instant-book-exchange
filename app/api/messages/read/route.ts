import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Message from "@/lib/models/Message";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await req.json();

  if (!conversationId) {
    return NextResponse.json(
      { error: "Conversation ID required" },
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

  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: user._id }, // nie oznaczaj wlasnych wiadomosci
      readBy: { $ne: user._id },
    },
    {
      $addToSet: { readBy: user._id },
    }
  );

  // TODO: Emit Socket.io event 'messages-read'

  return NextResponse.json({ message: "Messages marked as read" });
}
