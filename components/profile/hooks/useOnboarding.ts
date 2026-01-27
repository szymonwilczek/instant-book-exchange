"use client";

import { useState } from "react";
import { SearchBook } from "@/components/profile/onboarding-book-search";

interface BookBase {
  id: string;
  title: string;
  author?: string;
  image?: string;
  isbn?: string;
  createdAt: string;
}

interface UserData {
  hasCompletedOnboarding?: boolean;
}

export function useOnboarding(userData: UserData | null, onUpdate: () => void) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<BookBase[]>([]);

  const handleGenreChange = (genre: string, checked: boolean) => {
    if (checked) {
      setSelectedGenres([...selectedGenres, genre]);
    } else {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    }
  };

  const handleAddBook = (book: SearchBook) => {
    setSelectedBooks([
      ...selectedBooks,
      {
        id: book.id,
        title: book.title,
        author: book.author,
        image: book.image,
        isbn: book.isbn,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleOnboardingSubmit = async () => {
    await fetch("/api/user/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        genres: selectedGenres,
        books: selectedBooks.map((b) => ({
          title: b.title,
          author: b.author,
          image: b.image,
          isbn: b.isbn,
        })),
      }),
    });
    onUpdate();
  };

  const handleOnboardingSkip = async () => {
    await fetch("/api/user/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genres: [], books: [] }),
    });
    onUpdate();
  };

  const handleRemoveBook = (bookId: string) => {
    setSelectedBooks(selectedBooks.filter((book) => book.id !== bookId));
  };

  return {
    selectedGenres,
    selectedBooks,
    handleGenreChange,
    handleAddBook,
    handleRemoveBook,
    handleOnboardingSubmit,
    handleOnboardingSkip,
  };
}

