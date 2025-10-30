"use client";

import { useState } from "react";

interface BookBase {
  id: string;
  title: string;
  author?: string;
  image?: string;
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

  const handleAddBook = (book: BookBase) => {
    setSelectedBooks([...selectedBooks, book]);
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

  return {
    selectedGenres,
    selectedBooks,
    handleGenreChange,
    handleAddBook,
    handleOnboardingSubmit,
    handleOnboardingSkip,
  };
}