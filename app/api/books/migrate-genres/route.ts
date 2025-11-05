import { NextResponse } from "next/server";
import connectToDB from "@/lib/db/connect";
import Book from "@/lib/models/Book";

interface GoogleBookItem {
  volumeInfo: {
    categories?: string[];
  };
}

export async function POST() {
  try {
    await connectToDB();

    const booksToUpdate = await Book.find({
      $or: [{ genres: { $exists: false } }, { genres: { $size: 0 } }],
    });

    console.log(`Found ${booksToUpdate.length} books to update`);

    let updated = 0;
    let failed = 0;
    let noIsbn = 0;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Books API key not configured" },
        { status: 500 }
      );
    }

    for (const book of booksToUpdate) {
      try {
        if (book.isbn) {
          const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}&key=${apiKey}`
          );
          const data = await response.json();

          if (data.items && data.items.length > 0) {
            const googleBook = data.items[0] as GoogleBookItem;
            const categories = googleBook.volumeInfo.categories || [];

            if (categories.length > 0) {
              book.genres = categories;
              await book.save();
              updated++;
              console.log(`Updated ${book.title} with genres:`, categories);
            } else {
              console.log(`No categories found for ${book.title}`);
            }
          } else {
            console.log(`No Google Books result for ISBN: ${book.isbn}`);
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          noIsbn++;
          const searchQuery = `${book.title} ${book.author}`;
          const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&key=${apiKey}&maxResults=1`
          );
          const data = await response.json();

          if (data.items && data.items.length > 0) {
            const googleBook = data.items[0] as GoogleBookItem;
            const categories = googleBook.volumeInfo.categories || [];

            if (categories.length > 0) {
              book.genres = categories;
              await book.save();
              updated++;
              console.log(
                `Updated ${book.title} (no ISBN) with genres:`,
                categories
              );
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to update ${book.title}:`, error);
        failed++;
      }
    }

    return NextResponse.json({
      message: "Migration completed",
      stats: {
        total: booksToUpdate.length,
        updated,
        failed,
        noIsbn,
        skipped: booksToUpdate.length - updated - failed,
      },
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
