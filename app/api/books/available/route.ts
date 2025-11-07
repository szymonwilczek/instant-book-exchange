import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import connectToDB from "@/lib/db/connect";
import Book from "@/lib/models/Book";
import User from "@/lib/models/User";

interface BookQuery {
  status: string;
  owner?: { $ne: unknown };
  genres?: { $in: string[] };
  condition?: { $in: string[] };
  $or?: Array<
    | { title: { $regex: string; $options: string } }
    | { author: { $regex: string; $options: string } }
  >;
  createdAt?: { $gte: Date };
}

interface SortOptions {
  [key: string]: 1 | -1;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    await connectToDB();

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "date";
    const genres = searchParams.get("genres")?.split(",").filter(Boolean) || [];
    const conditions =
      searchParams.get("conditions")?.split(",").filter(Boolean) || [];
    const locations =
      searchParams.get("locations")?.split(",").filter(Boolean) || [];
    const dateRange = searchParams.get("dateRange");
    const search = searchParams.get("search") || "";

    const query: BookQuery = { status: "available" };

    // wykluczenie wlasnych ksiazek
    if (session?.user?.email) {
      const currentUser = await User.findOne({ email: session.user.email });
      if (currentUser) {
        query.owner = { $ne: currentUser._id };
      }
    }

    // filtry
    if (genres.length > 0) {
      query.genres = { $in: genres };
    }

    if (conditions.length > 0) {
      query.condition = { $in: conditions };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    if (dateRange) {
      const days = parseInt(dateRange);
      const cutoff = new Date(Date.now() - days * 86400000);
      query.createdAt = { $gte: cutoff };
    }

    const sort: SortOptions =
      sortBy === "popularity" ? { viewCount: -1 } : { createdAt: -1 };

    // wszystkie offeredBooks IDs
    const allUsers = await User.find({}, "offeredBooks");
    const offeredBookIds = allUsers.flatMap((user) => user.offeredBooks);

    const queryWithOffered = {
      ...query,
      _id: { $in: offeredBookIds },
    };

    const allOfferedBooks = await Book.find(queryWithOffered)
      .sort(sort)
      .populate("owner", "username email location profileImage");

    // podzialka na promowane i zwykle
    const now = new Date();
    const promotedBooks = allOfferedBooks.filter(
      (book) => book.promotedUntil && new Date(book.promotedUntil) > now
    );
    const regularBooks = allOfferedBooks.filter(
      (book) => !book.promotedUntil || new Date(book.promotedUntil) <= now
    );

    // Laczenie: promowane zawsze na gorze, potem zwykle (posortowane)
    const sortedBooks = [...promotedBooks, ...regularBooks];

    // paginacja
    const paginatedBooks = sortedBooks.slice((page - 1) * limit, page * limit);

    // filtrowanie po lokalizacji (na paginowanych wynikach)
    let filteredBooks = paginatedBooks;
    if (locations.length > 0) {
      filteredBooks = paginatedBooks.filter((book) => {
        const owner = book.owner as { location?: string };
        return owner && owner.location && locations.includes(owner.location);
      });
    }

    return NextResponse.json({
      books: filteredBooks,
      pagination: {
        total: sortedBooks.length, // total wszystkich oferowanych ksiazek (promowane + zwykle)
        page,
        limit,
        totalPages: Math.ceil(sortedBooks.length / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching available books:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
