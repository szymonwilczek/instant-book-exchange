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

  // rankingi dla wszystkich ownerow
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

  // z priorytetem dla Platinum+
  results.sort((a, b) => {
    const tierPriority = (tier?: string) => {
      if (!tier) return 0;
      if (tier === "legendary") return 6;
      if (tier === "diamond") return 5;
      if (tier === "platinum") return 4;
      if (tier === "gold") return 3;
      if (tier === "silver") return 2;
      if (tier === "bronze") return 1;
      return 0;
    };

    const aTierPriority = tierPriority(a.ownerTier);
    const bTierPriority = tierPriority(b.ownerTier);

    // Platinum+ (tier priority >= 4) ma priorytet
    const aIsPremium = aTierPriority >= 4;
    const bIsPremium = bTierPriority >= 4;

    if (aIsPremium && !bIsPremium) return -1;
    if (!aIsPremium && bIsPremium) return 1;

    // jesli obie sa premium lub obie nie sa -> sortuj po tier
    if (aTierPriority !== bTierPriority) {
      return bTierPriority - aTierPriority;
    }

    // jesli tier identyczny -> sortuj po match score
    if (a.matchScore !== b.matchScore) {
      return b.matchScore - a.matchScore;
    }

    // na koncu po rank (nizszy rank = lepszy)
    return (a.ownerRank || Infinity) - (b.ownerRank || Infinity);
  });

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

  // rankingi zainteresowanych uzytkownikow
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

  // z priorytetem dla Platinum+
  results.sort((a, b) => {
    const tierPriority = (tier?: string) => {
      if (!tier) return 0;
      if (tier === "legendary") return 6;
      if (tier === "diamond") return 5;
      if (tier === "platinum") return 4;
      if (tier === "gold") return 3;
      if (tier === "silver") return 2;
      if (tier === "bronze") return 1;
      return 0;
    };

    const aTierPriority = tierPriority(a.tier);
    const bTierPriority = tierPriority(b.tier);

    if (aTierPriority !== bTierPriority) {
      return bTierPriority - aTierPriority;
    }

    return (a.rank || Infinity) - (b.rank || Infinity);
  });

  return results;
}
