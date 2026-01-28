import Book from "./models/Book";
import User, { IUser } from "./models/User";
import UserRanking, { IUserRanking } from "./models/UserRanking";
import connectToDB from "./db/connect";
import mongoose from "mongoose";

interface WishlistBook {
  _id: mongoose.Types.ObjectId;
  title: string;
  author?: string;
  imageUrl?: string;
  condition: string;
  status: string;
}

interface BookDocument {
  _id: mongoose.Types.ObjectId;
  title: string;
  author?: string;
  imageUrl?: string;
  condition: string;
  status: string;
  ownerNote?: string;
  description?: string;
  viewCount?: number;
  promotedUntil?: Date;
  owner: {
    _id: mongoose.Types.ObjectId;
    username: string;
    email: string;
    location?: string;
    profileImage?: string;
  };
}

interface MatchResult {
  offeredBook: {
    _id: string;
    title: string;
    author?: string;
    imageUrl?: string;
    condition: string;
    status: string;
    ownerNote?: string;
    description?: string;
    viewCount?: number;
    promotedUntil?: string;
  };
  owner: {
    _id: string;
    username: string;
    email: string;
    location?: string;
    profileImage?: string;
  };
  matchScore: number;
  ownerTier?: string;
  ownerRank?: number;
  matchType: string;
}

const TIER_PRIORITY: Record<string, number> = {
  legendary: 6,
  diamond: 5,
  platinum: 4,
  gold: 3,
  silver: 2,
  bronze: 1,
};

const getTierPriority = (tier?: string) => TIER_PRIORITY[tier || ""] || 0;

interface SortableMatch {
  matchScore?: number;
  tier?: string;
  ownerTier?: string;
  rank?: number;
  ownerRank?: number;
}

function compareMatches(a: SortableMatch, b: SortableMatch) {
  const aTier = a.tier || a.ownerTier;
  const bTier = b.tier || b.ownerTier;

  const aPriority = getTierPriority(aTier);
  const bPriority = getTierPriority(bTier);

  const aIsPremium = aPriority >= 4;
  const bIsPremium = bPriority >= 4;

  if (aIsPremium && !bIsPremium) return -1;
  if (!aIsPremium && bIsPremium) return 1;

  if (aPriority !== bPriority) {
    return bPriority - aPriority;
  }

  const aScore = a.matchScore || 0;
  const bScore = b.matchScore || 0;

  if (aScore !== bScore) {
    return bScore - aScore;
  }

  const aRank = a.rank || a.ownerRank || Infinity;
  const bRank = b.rank || b.ownerRank || Infinity;

  return aRank - bRank;
}

export async function getMatchingOffers(
  userEmail: string,
): Promise<MatchResult[]> {
  await connectToDB();

  const user = (await User.findOne({ email: userEmail })
    .populate("wishlist")
    .lean()) as IUser | null;

  if (!user || !user.wishlist || user.wishlist.length === 0) {
    return [];
  }

  const wishlistBooks = user.wishlist as unknown as WishlistBook[];
  const wishlistTitles = wishlistBooks.map((book) =>
    book.title.toLowerCase().trim(),
  );

  const matchingBooks = (await Book.find({
    title: { $in: wishlistTitles.map((t) => new RegExp(`^${t}$`, "i")) },
    owner: { $ne: user._id },
    status: "available",
  })
    .populate("owner", "username email location profileImage")
    .lean()) as BookDocument[];

  if (matchingBooks.length === 0) {
    return [];
  }

  // rank for all owners
  const ownerIds = matchingBooks.map((book) => book.owner._id);
  const rankings = (await UserRanking.find({
    userId: { $in: ownerIds },
  }).lean()) as IUserRanking[];

  const results: MatchResult[] = matchingBooks.map((book) => {
    const owner = book.owner;

    const ranking = rankings.find(
      (r) => r.userId.toString() === owner._id.toString(),
    );

    const bookTitleLower = book.title.toLowerCase().trim();
    const exactMatch = wishlistTitles.find((wt) => wt === bookTitleLower);
    const matchScore = exactMatch ? 100 : 80;

    return {
      offeredBook: {
        _id: book._id.toString(),
        title: book.title,
        author: book.author,
        imageUrl: book.imageUrl,
        condition: book.condition,
        status: book.status,
        ownerNote: book.ownerNote,
        description: book.description,
        viewCount: book.viewCount || 0,
        promotedUntil: book.promotedUntil
          ? new Date(book.promotedUntil).toISOString()
          : undefined,
      },
      owner: {
        _id: owner._id.toString(),
        username: owner.username,
        email: owner.email,
        location: owner.location,
        profileImage: owner.profileImage,
      },
      matchScore,
      ownerTier: ranking?.tier,
      ownerRank: ranking?.rank,
      matchType: "wishlist",
    };
  });

  // Priority sort
  results.sort(compareMatches);

  return results.slice(0, 10);
}

interface InterestedUser {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  location?: string;
  profileImage?: string;
}

export async function findInterestedUsers(bookId: string) {
  await connectToDB();

  const book = await Book.findById(bookId).lean();
  if (!book) return [];

  const interestedUsers = (await User.find({
    wishlist: bookId,
  })
    .select("username email location profileImage")
    .lean()) as InterestedUser[];

  // rankings of interested users
  const userIds = interestedUsers.map((u) => u._id);
  const rankings = (await UserRanking.find({
    userId: { $in: userIds },
  }).lean()) as IUserRanking[];

  const results = interestedUsers.map((user) => {
    const ranking = rankings.find(
      (r) => r.userId.toString() === user._id.toString(),
    );

    return {
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        location: user.location,
        profileImage: user.profileImage,
      },
      tier: ranking?.tier,
      rank: ranking?.rank,
    };
  });

  // priority sort
  results.sort(compareMatches);

  return results;
}
