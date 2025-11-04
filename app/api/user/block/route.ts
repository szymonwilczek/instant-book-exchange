import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import User from "@/lib/models/User";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await req.json();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  await connectToDB();

  const currentUser = await User.findOne({ email: session.user.email });
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // nie mozna zablokowac samego siebie
  if (currentUser._id.toString() === userId) {
    return NextResponse.json(
      { error: "Cannot block yourself" },
      { status: 400 }
    );
  }

  // uzytkownik juz jest zablokowany
  if (currentUser.blockedUsers.some((id) => id.toString() === userId)) {
    return NextResponse.json(
      { error: "User already blocked" },
      { status: 400 }
    );
  }

  // dodaj do listy zablokowanych
  currentUser.blockedUsers.push(new mongoose.Types.ObjectId(userId));
  await currentUser.save();

  return NextResponse.json({ message: "User blocked successfully" });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await req.json();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  await connectToDB();

  const currentUser = await User.findOne({ email: session.user.email });
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // usun z listy zablokowanych
  currentUser.blockedUsers = currentUser.blockedUsers.filter(
    (id) => id.toString() !== userId
  );
  await currentUser.save();

  return NextResponse.json({ message: "User unblocked successfully" });
}
