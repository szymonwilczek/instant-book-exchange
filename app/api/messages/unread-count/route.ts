import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import User from "@/lib/models/User";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const conversations = await Conversation.find({
      participants: user._id,
      deletedBy: { $ne: user._id },
    }).select("_id");

    const conversationIds = conversations.map((c) => c._id);

    const count = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: user._id },
      readBy: { $ne: user._id },
    });

    const response = NextResponse.json({ count });

    // cache headers
    response.headers.set(
      "Cache-Control",
      "private, max-age=10, stale-while-revalidate=30",
    );
    response.headers.set("CDN-Cache-Control", "private, max-age=10");
    response.headers.set("Vercel-CDN-Cache-Control", "private, max-age=10");

    return response;
  } catch (error) {
    console.error("Error counting unread messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
