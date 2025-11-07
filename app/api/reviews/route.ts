import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Review from "@/lib/models/Review";
import Transaction from "@/lib/models/Transaction";
import User from "@/lib/models/User";
import PointsHistory from "@/lib/models/PointsHistory";

const REVIEW_POINTS = 2;

// pobierz istniejaca opinie dla transakcji
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get("transactionId");

  if (!transactionId) {
    return NextResponse.json(
      { error: "Transaction ID required" },
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

  const reviewer = await User.findOne({ email: userEmail });
  if (!reviewer) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existingReview = await Review.findOne({
    transactionId,
    reviewer: reviewer._id,
  });

  return NextResponse.json(existingReview || null);
}

// stworz lub zaktualizuj opinie
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { transactionId, rating, comment } = await req.json();
  await connectToDB();

  const transaction =
    await Transaction.findById(transactionId).populate("initiator receiver");

  const userEmail = session.user?.email;
  if (!userEmail) {
    return NextResponse.json(
      { error: "User email not found" },
      { status: 401 }
    );
  }

  const reviewer = await User.findOne({ email: userEmail });

  if (!reviewer) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const reviewedUser = transaction.initiator._id.equals(reviewer._id)
    ? transaction.receiver
    : transaction.initiator;

  const existingReview = await Review.findOne({
    transactionId,
    reviewer: reviewer._id,
  });

  let review;
  if (existingReview) {
    // UPDATE
    existingReview.rating = rating;
    existingReview.comment = comment;
    await existingReview.save();
    review = existingReview;
  } else {
    // CREATE
    review = await Review.create({
      transactionId,
      reviewer: reviewer._id,
      reviewedUser: reviewedUser._id,
      rating,
      comment,
    });

    // dodanie puntkow za recenzje
    reviewer.points = (reviewer.points || 0) + REVIEW_POINTS;
    await reviewer.save();

    // zapisanie historii punktow
    await PointsHistory.create({
      user: reviewer._id,
      amount: REVIEW_POINTS,
      type: "earned",
      source: "review",
      description: `Review for ${reviewer.username}`,
      relatedTransaction: transaction._id,
    });
  }

  const reviews = await Review.find({ reviewedUser: reviewedUser._id });
  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  reviewedUser.averageRating = avgRating;
  await reviewedUser.save();

  return NextResponse.json(review);
}
