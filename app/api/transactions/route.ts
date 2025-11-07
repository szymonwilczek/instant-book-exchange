import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Transaction from "@/lib/models/Transaction";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { offeredBookId, wishedBookId, receiverEmail } = await req.json();
  await connectToDB();

  const userEmail = session.user?.email;
  if (!userEmail) {
    return NextResponse.json(
      { error: "User email not found" },
      { status: 401 }
    );
  }

  const initiator = await User.findOne({ email: userEmail });
  const receiver = await User.findOne({ email: receiverEmail });
  if (!initiator || !receiver)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const transaction = await Transaction.create({
    initiator: initiator._id,
    receiver: receiver._id,
    offeredBook: offeredBookId,
    wishedBook: wishedBookId,
  });

  return NextResponse.json({ transactionId: transaction._id });
}
