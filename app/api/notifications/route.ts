import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";
import type { Types } from "mongoose";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const unreadOnly = searchParams.get("unreadOnly") === "true";

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

  const query: { user: Types.ObjectId; read?: boolean } = { user: user._id };
  if (unreadOnly) {
    query.read = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);

  const unreadCount = await Notification.countDocuments({
    user: user._id,
    read: false,
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, type, data } = await req.json();

  if (!userId || !type || !data) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  await connectToDB();

  const notification = await Notification.create({
    user: userId,
    type,
    data,
    read: false,
  });

  // TODO: Emit Socket.io event 'new-notification' do odpowiedniego uzytkownika

  return NextResponse.json({ notification });
}
